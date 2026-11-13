// ============================================================
// Payment Providers — concrete implementations + registry
//
//   STRIPE         online card payment (PaymentIntent + webhook)
//   PAYPAL         online hosted approval + server capture (Orders v2)
//   BANK_TRANSFER  manual/offline, admin verified
//   PAYONEER       manual/external, admin verified (see below)
//
// Payoneer does publish a "Payoneer Checkout" ecommerce API (embedded SDK +
// hosted page + POST /lists payment session, originally the Optile platform),
// but it is gated: early-access signups, requires a US/HK legal entity and
// ~USD 20k+/mo webstore volume, and in several jurisdictions the processing
// is performed by Stripe. That product is not available to this store and no
// checkout credentials are configured, so Payoneer is implemented as a clearly
// separated manual/external method: the customer pays out-of-band via their
// Payoneer account and an admin verifies settlement. No fake "success" is ever
// produced automatically.
// ============================================================

import prisma from '../../config/db';
import {
  getManualPaymentInstructions,
  isBankTransferConfigured,
  isPaypalConfigured,
  isPayoneerConfigured,
  isStripeConfigured,
} from '../../config';
import {
  PAYMENT_METHOD,
  PaymentMethodValue,
} from '../../constants/order';
import { PAYMENT_STATUS } from '../../constants/order';
import { ApiError } from '../../utils/apiError';
import logger from '../../utils/logger';
import { createPaymentIntentForOrder } from '../stripe.service';
import {
  capturePayPalOrder,
  createPayPalOrder,
  getPayPalOrder,
} from './paypal.service';
import { setOrderPaid, setOrderPaymentFailed } from './payment-state.service';
import {
  CreatePaymentParams,
  CreatePaymentResult,
  PaymentProvider,
} from './types';

// ============================================================
// Stripe
// ============================================================

export const stripeProvider: PaymentProvider = {
  id: PAYMENT_METHOD.STRIPE,
  isConfigured: isStripeConfigured,
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    if (!isStripeConfigured()) {
      throw ApiError.badRequest('Card payments are not available right now.');
    }

    const paymentIntent = await createPaymentIntentForOrder({
      orderId: params.orderId,
      orderNumber: params.orderNumber,
      totalCents: params.totalCents,
      currency: params.currency,
      customerUserId: params.userId,
      idempotencyKey: params.idempotencyKey,
    });

    // Guarded: never overwrite a PAID order with PROCESSING if payment settled
    // between loading the order and creating the intent.
    const updated = await prisma.order.updateMany({
      where: {
        id: params.orderId,
        paymentStatus: {
          in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.FAILED],
        },
      },
      data: {
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.clientSecret,
        paymentStatus: PAYMENT_STATUS.PROCESSING,
      },
    });

    if (updated.count === 0) {
      const current = await prisma.order.findUnique({
        where: { id: params.orderId },
        select: { paymentStatus: true },
      });
      if (current?.paymentStatus === PAYMENT_STATUS.PAID) {
        throw ApiError.badRequest('This order has already been paid.');
      }
    }

    return {
      provider: PAYMENT_METHOD.STRIPE,
      kind: 'online',
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.clientSecret,
      amountCents: paymentIntent.amountCents,
      currency: paymentIntent.currency,
    };
  },
};

// ============================================================
// PayPal
// ============================================================

export const paypalProvider: PaymentProvider = {
  id: PAYMENT_METHOD.PAYPAL,
  isConfigured: isPaypalConfigured,
  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    if (!isPaypalConfigured()) {
      throw ApiError.badRequest('PayPal is not available right now.');
    }

    const paypalOrder = await createPayPalOrder({
      referenceId: params.orderNumber,
      amountCents: params.totalCents,
      currency: params.currency,
      returnUrl: params.returnUrl!,
      cancelUrl: params.cancelUrl!,
    });

    if (!paypalOrder.approveUrl) {
      throw ApiError.internal('PayPal did not return an approval link.');
    }

    await prisma.order.update({
      where: { id: params.orderId },
      data: { paypalOrderId: paypalOrder.id },
    });

    return {
      provider: PAYMENT_METHOD.PAYPAL,
      kind: 'online',
      paypalOrderId: paypalOrder.id,
      approvalUrl: paypalOrder.approveUrl,
    };
  },
};

export interface PayPalCaptureResult {
  id: string;
  status: string;
  captureId: string | null;
  amountCents: number;
  currency: string;
}

/**
 * Capture an approved PayPal order and verify amount + currency against the
 * server-authoritative order total before touching local state.
 */
export async function capturePayPalPayment(params: {
  orderId: string;
  orderNumber: string;
  paypalOrderId: string;
  expectedTotalCents: number;
  expectedCurrency: string;
}): Promise<PayPalCaptureResult> {
  const order = await prisma.order.findFirst({
    where: { id: params.orderId, paypalOrderId: params.paypalOrderId },
    select: {
      id: true,
      paymentStatus: true,
      paypalOrderId: true,
      paypalCaptureId: true,
    },
  });
  if (!order) throw ApiError.badRequest('PayPal order does not match this order.');

  // Already settled — respond idempotently.
  if (order.paymentStatus === PAYMENT_STATUS.PAID && order.paypalCaptureId) {
    return {
      id: order.id,
      status: 'COMPLETED',
      captureId: order.paypalCaptureId,
      amountCents: params.expectedTotalCents,
      currency: params.expectedCurrency,
    };
  }

  const { orderStatus, capture } = await capturePayPalOrder(params.paypalOrderId);

  // When the order was already captured (race), fetch it to learn the amount.
  let captureId: string | null = capture?.id ?? null;
  let amountCents = capture?.amountCents ?? 0;
  let currency = capture?.currency ?? '';
  let captureStatus = capture?.status ?? '';

  if (!capture) {
    const current = await getPayPalOrder(params.paypalOrderId);
    captureId = current.captureId ?? null;
    amountCents = current.amountCents;
    currency = current.currency;
    captureStatus = current.status;
  }

  const settled = captureStatus === 'COMPLETED' || orderStatus === 'COMPLETED';
  if (!settled || !captureId) {
    await setOrderPaymentFailed(params.orderId);
    throw ApiError.badRequest(
      'PayPal could not capture this payment. Please try again or use another method.'
    );
  }

  if (currency && currency !== params.expectedCurrency.toLowerCase()) {
    await setOrderPaymentFailed(params.orderId);
    throw ApiError.badRequest('PayPal settled this payment in a different currency.');
  }

  if (amountCents !== params.expectedTotalCents) {
    logger.warn(
      `PayPal capture amount mismatch. Expected ${params.expectedTotalCents}, got ${amountCents}.`
    );
    await setOrderPaymentFailed(params.orderId);
    throw ApiError.conflict(
      'PayPal captured a different amount than the order total.'
    );
  }

  await setOrderPaid(params.orderId, { captureId });

  return {
    id: params.orderId,
    status: 'COMPLETED',
    captureId,
    amountCents,
    currency,
  };
}

// ============================================================
// Manual providers (Bank Transfer, Payoneer)
// ============================================================

function createManualProvider(
  id: typeof PAYMENT_METHOD.BANK_TRANSFER | typeof PAYMENT_METHOD.PAYONEER,
  isConfigured: () => boolean
): PaymentProvider {
  return {
    id,
    isConfigured,
    async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
      if (!isConfigured()) {
        throw ApiError.badRequest('This payment method is not available right now.');
      }
      return {
        provider: id,
        kind: 'manual',
        reference: params.orderNumber,
        instructions: getManualPaymentInstructions(id),
      };
    },
  };
}

export const bankTransferProvider = createManualProvider(
  PAYMENT_METHOD.BANK_TRANSFER,
  isBankTransferConfigured
);

export const payoneerProvider = createManualProvider(
  PAYMENT_METHOD.PAYONEER,
  isPayoneerConfigured
);

// ============================================================
// Registry
// ============================================================

const providers: Record<PaymentMethodValue, PaymentProvider> = {
  [PAYMENT_METHOD.STRIPE]: stripeProvider,
  [PAYMENT_METHOD.PAYPAL]: paypalProvider,
  [PAYMENT_METHOD.BANK_TRANSFER]: bankTransferProvider,
  [PAYMENT_METHOD.PAYONEER]: payoneerProvider,
};

export function getPaymentProvider(method: PaymentMethodValue): PaymentProvider {
  const provider = providers[method];
  if (!provider) throw ApiError.badRequest('Unsupported payment method.');
  return provider;
}

/**
 * The list of configured (usable) payment methods, in display order. Serves
 * GET /checkout/methods. Contains no credentials — only booleans and public
 * display instructions.
 */
export function getConfiguredPaymentMethods(): Array<{
  id: PaymentMethodValue;
  kind: 'online' | 'manual';
  enabled: boolean;
  label: string;
  description: string;
  instructions: string[];
}> {
  const rows = [
    {
      id: PAYMENT_METHOD.STRIPE as PaymentMethodValue,
      kind: 'online' as const,
      enabled: isStripeConfigured(),
      label: 'Card (Stripe)',
      description: 'Pay securely with your credit or debit card.',
      instructions: [] as string[],
    },
    {
      id: PAYMENT_METHOD.PAYPAL as PaymentMethodValue,
      kind: 'online' as const,
      enabled: isPaypalConfigured(),
      label: 'PayPal',
      description: 'Check out securely with your PayPal account.',
      instructions: [] as string[],
    },
    {
      id: PAYMENT_METHOD.BANK_TRANSFER as PaymentMethodValue,
      kind: 'manual' as const,
      enabled: isBankTransferConfigured(),
      label: 'Direct Bank Transfer',
      description: 'Place your order now, transfer the amount, then we verify the payment once received.',
      instructions: getManualPaymentInstructions(PAYMENT_METHOD.BANK_TRANSFER),
    },
    {
      id: PAYMENT_METHOD.PAYONEER as PaymentMethodValue,
      kind: 'manual' as const,
      enabled: isPayoneerConfigured(),
      label: 'Payoneer',
      description: 'Place your order now, pay externally via Payoneer, then we verify the payment once received.',
      instructions: getManualPaymentInstructions(PAYMENT_METHOD.PAYONEER),
    },
  ];

  return rows;
}