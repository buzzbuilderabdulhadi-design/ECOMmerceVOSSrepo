import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';
import { isAllowedOrigin } from '../utils/urlSafety';
import { getCouponOrThrow, normalizeCouponCode } from '../services/coupon.service';
import {
  computeTotals,
  fromCents,
  itemsSubtotalCents,
  toCents,
} from '../utils/pricing';
import {
  normalizePaymentMethod,
  PAYMENT_METHOD,
  PAYMENT_RETRYABLE,
  PAYMENT_STATUS,
} from '../constants/order';
import config from '../config';
import {
  capturePayPalPayment,
  getConfiguredPaymentMethods,
  getPaymentProvider,
} from '../services/payment/providers';
import { getPayPalOrder } from '../services/payment/paypal.service';
import { retrievePaymentIntent } from '../services/stripe.service';
import { reconcileStripePaymentIntent } from '../services/payment/stripe-reconcile.service';
import { setOrderPaid } from '../services/payment/payment-state.service';
import logger from '../utils/logger';

const cartItemSelect = {
  items: {
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, sku: true,
          regularPrice: true, salePrice: true, discountPercent: true,
          images: true, stock: true, isActive: true,
        },
      },
      variant: {
        select: {
          id: true, color: true, colorHex: true, size: true,
          stock: true, priceOverride: true, sku: true, isActive: true,
        },
      },
    },
  },
};

function firstImage(images: unknown): string {
  if (Array.isArray(images) && images.length > 0) {
    const first = images[0];
    if (typeof first === 'string') return first;
    if (first && typeof (first as { url?: string }).url === 'string') {
      return (first as { url: string }).url;
    }
  }
  return '';
}

function unitPriceFor(
  variant: { priceOverride: number | null } | null | undefined,
  product?: { salePrice: number | null; regularPrice: number }
): number {
  return variant?.priceOverride ?? product?.salePrice ?? product?.regularPrice ?? 0;
}

// ============================================================
// GET /checkout/methods — which payment methods are usable
// ============================================================

export const getCheckoutMethods = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const methods = getConfiguredPaymentMethods();
    sendSuccess(res, {
      methods,
      currency: config.currency.toLowerCase(),
    });
  } catch (error) { next(error); }
};

// ============================================================
// GET /checkout/preview — authoritative checkout totals
// ============================================================

export const previewCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await prisma.cart.findFirst({
      where: { userId: req.user!.userId },
      include: cartItemSelect,
    });

    if (!cart || cart.items.length === 0) {
      sendSuccess(res, {
        items: [],
        totals: computeTotals({ subtotal: 0, discount: 0 }),
        couponCode: null,
        couponApplied: false,
        currency: config.currency.toLowerCase(),
      });
      return;
    }

    const itemRows = cart.items.map((item) => {
      const unitPrice = unitPriceFor(item.variant, item.product);
      return {
        productId: item.productId,
        variantId: item.variantId,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.variant?.sku ?? item.product.sku,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        color: item.variant?.color,
        size: item.variant?.size,
        colorHex: item.variant?.colorHex,
        stock: item.variant?.stock ?? item.product.stock,
        image: firstImage(item.product.images),
      };
    });

    const subtotalCents = itemsSubtotalCents(
      cart.items.map((item) => ({ unitPrice: unitPriceFor(item.variant, item.product), quantity: item.quantity }))
    );

    let couponCode: string | null = normalizeCouponCode(cart.couponCode);
    let discountCents = 0;
    let couponApplied = false;
    let couponWarning: string | undefined;

    const evaluation = await getCouponOrThrow(couponCode, subtotalCents);
    if (couponCode && (!evaluation.coupon || evaluation.discountCents === 0)) {
      couponWarning = 'The coupon on this cart is no longer valid and was not applied.';
      couponCode = null;
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null, discountAmount: null },
      }).catch(() => {});
    } else if (evaluation.coupon) {
      couponCode = evaluation.code;
      discountCents = evaluation.discountCents;
      couponApplied = true;
    }

    const totals = computeTotals({ subtotal: fromCents(subtotalCents), discount: fromCents(discountCents) });

    sendSuccess(res, {
      items: itemRows,
      totals,
      couponCode,
      couponApplied,
      couponWarning,
      currency: config.currency.toLowerCase(),
    });
  } catch (error) { next(error); }
};

// ============================================================
// Helpers
// ============================================================

/**
 * Load an owned order and assert it can still be paid. Used by every payment
 * initiation endpoint so a cancelled/paid/awaiting-verification order can
 * never be charged through another pipeline.
 */
async function loadPayableOrder(orderId: string, userId: string) {
  if (!isValidObjectId(orderId)) throw ApiError.badRequest('Invalid order ID');

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId },
    select: {
      id: true, orderNumber: true, total: true, paymentStatus: true,
      status: true, paymentMethod: true,
      stripePaymentIntentId: true, stripeClientSecret: true,
      paypalOrderId: true,
    },
  });
  if (!order) throw ApiError.notFound('Order not found');

  if (order.status === 'CANCELLED') {
    throw ApiError.badRequest('This order was cancelled and cannot be paid.');
  }
  if (!PAYMENT_RETRYABLE.has(order.paymentStatus as (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS])) {
    throw ApiError.badRequest('This order is not in a payable state.');
  }
  return order;
}

/**
 * Only allow redirects back to an origin we own. The customer controls these
 * URLs, so without this check PayPal could be asked to send the approval back
 * to an attacker-controlled site.
 */
function assertAllowedReturnUrl(value: string, label: string): void {
  if (!isAllowedOrigin(value, config.cors.allowedOrigins)) {
    throw ApiError.badRequest(`${label} must point to this store.`);
  }
}

/**
 * Best-effort Stripe retrieve. A transient failure must not break checkout, so
 * we fall back to creating a fresh intent and let Stripe idempotency protect
 * against duplicates.
 */
async function retrievePaymentIntentSafe(id: string) {
  try {
    return await retrievePaymentIntent(id);
  } catch (error) {
    logger.warn('Unable to retrieve Stripe PaymentIntent; creating a new one', {
      paymentIntentId: id,
      error: String(error),
    });
    return null;
  }
}

// ============================================================
// POST /checkout/payment-intent — create PaymentIntent for an order (Stripe)
// ============================================================

export const createOrderPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.body;
    const order = await loadPayableOrder(orderId, req.user!.userId);

    if (normalizePaymentMethod(order.paymentMethod ?? 'card') !== PAYMENT_METHOD.STRIPE) {
      throw ApiError.badRequest('This order does not use card payment.');
    }

    // Resuming is the whole idempotency story: a stored PaymentIntent is
    // re-read from Stripe (never trusted blindly), and the same intent is
    // handed back so the browser can only ever confirm one charge.
    let idempotencyKey = `zg_order_${order.id}`;

    if (order.stripePaymentIntentId) {
      const existing = await retrievePaymentIntentSafe(order.stripePaymentIntentId);

      if (existing) {
        if (existing.status === 'succeeded') {
          // Already charged: reconcile the order and report PAID rather than
          // handing out a secret that could charge a second time.
          const outcome = await reconcileStripePaymentIntent({
            id: existing.id,
            status: existing.status,
            amount: existing.amountCents,
            currency: existing.currency,
          });
          sendSuccess(res, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentIntentId: existing.id,
            clientSecret: null,
            amountCents: existing.amountCents,
            currency: existing.currency,
            paymentStatus: outcome.paymentStatus ?? PAYMENT_STATUS.PAID,
          });
          return;
        }

        if (existing.status !== 'canceled' && existing.clientSecret) {
          sendSuccess(res, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            paymentIntentId: existing.id,
            clientSecret: existing.clientSecret,
            amountCents: existing.amountCents,
            currency: existing.currency,
            paymentStatus: order.paymentStatus,
          });
          return;
        }

        // The previous intent was cancelled. A new one is genuinely required,
        // so key it off the dead intent id — the default key would replay the
        // cancelled intent for 24h.
        idempotencyKey = `zg_order_${order.id}_retry_${existing.id}`;
        await prisma.order.updateMany({
          where: { id: order.id, stripePaymentIntentId: existing.id },
          data: { stripePaymentIntentId: null, stripeClientSecret: null },
        });
      }
    }

    const result = await getPaymentProvider(PAYMENT_METHOD.STRIPE).createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: req.user!.userId,
      totalCents: toCents(order.total),
      currency: config.currency,
      idempotencyKey,
    });

    if (result.kind !== 'online' || result.provider !== PAYMENT_METHOD.STRIPE) {
      throw ApiError.internal('Unexpected payment provider result.');
    }

    sendSuccess(res, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
      amountCents: result.amountCents,
      currency: result.currency,
      paymentStatus: result.provider === PAYMENT_METHOD.STRIPE ? PAYMENT_STATUS.PROCESSING : order.paymentStatus,
    });
  } catch (error) { next(error); }
};

// ============================================================
// GET /checkout/orders/:orderId/payment — authoritative payment status
//
// The browser is never trusted to declare success. After a redirect (or on
// refresh) the client calls this, which re-reads the provider state and
// reconciles the order before returning the status.
// ============================================================

export const getOrderPaymentStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderId = String(req.params.orderId);
    if (!isValidObjectId(orderId)) throw ApiError.badRequest('Invalid order ID');

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
      select: {
        id: true, orderNumber: true, total: true, status: true,
        paymentStatus: true, paymentMethod: true,
        stripePaymentIntentId: true, paypalOrderId: true,
      },
    });
    if (!order) throw ApiError.notFound('Order not found');

    const method = order.paymentMethod ? normalizePaymentMethod(order.paymentMethod) : null;
    let paymentStatus: string = order.paymentStatus;

    if (method === PAYMENT_METHOD.STRIPE && order.stripePaymentIntentId) {
      const intent = await retrievePaymentIntentSafe(order.stripePaymentIntentId);
      if (intent) {
        const outcome = await reconcileStripePaymentIntent({
          id: intent.id,
          status: intent.status,
          amount: intent.amountCents,
          currency: intent.currency,
        });
        if (outcome.paymentStatus) paymentStatus = outcome.paymentStatus;
      }
    } else if (
      method === PAYMENT_METHOD.PAYPAL &&
      order.paypalOrderId &&
      order.paymentStatus !== PAYMENT_STATUS.PAID
    ) {
      // PayPal approval redirects back to us before the capture webhook may
      // arrive; reconcile against PayPal so the UI never shows a false pending.
      try {
        const view = await getPayPalOrder(order.paypalOrderId);
        if (view.status === 'COMPLETED' && view.captureId) {
          const cents = toCents(order.total);
          const currencyOk =
            !view.currency || view.currency.toLowerCase() === config.currency.toLowerCase();
          if (view.amountCents === cents && currencyOk) {
            await setOrderPaid(order.id, { captureId: view.captureId });
            paymentStatus = PAYMENT_STATUS.PAID;
          }
        }
      } catch (error) {
        logger.warn('Unable to reconcile PayPal order status', {
          paypalOrderId: order.paypalOrderId,
          error: String(error),
        });
      }
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: order.id },
      select: { paymentStatus: true, status: true },
    });

    sendSuccess(res, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: config.currency.toLowerCase(),
      paymentMethod: method,
      paymentStatus: refreshed?.paymentStatus ?? paymentStatus,
      status: refreshed?.status ?? order.status,
    });
  } catch (error) { next(error); }
};

// ============================================================
// POST /checkout/paypal/create — start a PayPal order for an order
// ============================================================

export const createPayPalOrderForCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, returnUrl, cancelUrl } = req.body;
    const order = await loadPayableOrder(orderId, req.user!.userId);

    if (normalizePaymentMethod(order.paymentMethod ?? 'card') !== PAYMENT_METHOD.PAYPAL) {
      throw ApiError.badRequest('This order does not use PayPal payment.');
    }
    if (!returnUrl || !cancelUrl) {
      throw ApiError.badRequest('Return and cancel URLs are required for PayPal.');
    }
    assertAllowedReturnUrl(returnUrl, 'Return URL');
    assertAllowedReturnUrl(cancelUrl, 'Cancel URL');

    // Idempotent: resuming an in-progress PayPal order instead of creating a
    // second one. Verifies against PayPal so stale/expired approvals fail.
    if (order.paypalOrderId) {
      const existing = await getPayPalOrder(order.paypalOrderId);
      if (existing.status === 'COMPLETED' || existing.captureId) {
        sendSuccess(res, { orderId: order.id, paypalOrderId: order.paypalOrderId, alreadyCaptured: true });
        return;
      }
      if (existing.status === 'APPROVED') {
        throw ApiError.badRequest('This payment was already approved. Please complete it from your checkout.');
      }
      if (existing.approveUrl) {
        sendSuccess(res, { orderId: order.id, paypalOrderId: order.paypalOrderId, approvalUrl: existing.approveUrl });
        return;
      }
    }

    const result = await getPaymentProvider(PAYMENT_METHOD.PAYPAL).createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: req.user!.userId,
      totalCents: toCents(order.total),
      currency: config.currency,
      returnUrl,
      cancelUrl,
    });

    if (result.kind !== 'online' || result.provider !== PAYMENT_METHOD.PAYPAL) {
      throw ApiError.internal('Unexpected payment provider result.');
    }

    sendSuccess(res, {
      orderId: order.id,
      paypalOrderId: result.paypalOrderId,
      approvalUrl: result.approvalUrl,
    });
  } catch (error) { next(error); }
};

// ============================================================
// POST /checkout/paypal/capture — server-verified capture after approval
// ============================================================

export const capturePayPalOrderForCheckout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    if (!isValidObjectId(orderId)) throw ApiError.badRequest('Invalid order ID');
    if (!paypalOrderId || typeof paypalOrderId !== 'string') {
      throw ApiError.badRequest('Missing PayPal order ID.');
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId },
      select: {
        id: true, orderNumber: true, total: true, paymentStatus: true,
        status: true, paymentMethod: true, paypalOrderId: true,
      },
    });
    if (!order) throw ApiError.notFound('Order not found');
    if (normalizePaymentMethod(order.paymentMethod ?? 'card') !== PAYMENT_METHOD.PAYPAL) {
      throw ApiError.badRequest('This order does not use PayPal payment.');
    }
    if (!order.paypalOrderId) {
      throw ApiError.badRequest('No PayPal payment was started for this order.');
    }
    if (order.paypalOrderId !== paypalOrderId) {
      throw ApiError.badRequest('This PayPal order does not belong to this order.');
    }

    // Idempotent success for an already-settled order.
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      sendSuccess(res, { orderId: order.id, status: 'PAID' });
      return;
    }
    if (order.status === 'CANCELLED') {
      throw ApiError.badRequest('This order was cancelled.');
    }

    const result = await capturePayPalPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      paypalOrderId: order.paypalOrderId,
      expectedTotalCents: toCents(order.total),
      expectedCurrency: config.currency,
    });

    sendSuccess(res, {
      orderId: order.id,
      status: 'PAID',
      captureId: result.captureId,
    });
  } catch (error) { next(error); }
};