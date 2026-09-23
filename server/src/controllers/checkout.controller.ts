import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';
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

    // Idempotent: resume the existing PaymentIntent instead of charging twice.
    if (order.stripePaymentIntentId && order.stripeClientSecret) {
      sendSuccess(res, {
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentIntentId: order.stripePaymentIntentId,
        clientSecret: order.stripeClientSecret,
        amountCents: toCents(order.total),
        currency: config.currency.toLowerCase(),
        paymentStatus: order.paymentStatus,
      });
      return;
    }

    const result = await getPaymentProvider(PAYMENT_METHOD.STRIPE).createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: req.user!.userId,
      totalCents: toCents(order.total),
      currency: config.currency,
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