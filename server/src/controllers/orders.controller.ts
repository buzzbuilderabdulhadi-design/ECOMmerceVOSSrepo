import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';
import { computeTotals, fromCents, itemsSubtotalCents } from '../utils/pricing';
import { getCouponOrThrow, normalizeCouponCode } from '../services/coupon.service';
import {
  isManualPaymentMethod,
  normalizePaymentMethod,
  PaymentMethodValue,
  PAYMENT_STATUS,
} from '../constants/order';
import { getPaymentProvider } from '../services/payment/providers';
import { setOrderPaymentCancelled } from '../services/payment/payment-state.service';

const generateOrderNumber = () => `ZG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

interface StockReservation {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingAddressId, notes, couponCode, paymentMethod, idempotencyKey } = req.body;
    const userId = req.user!.userId;

    let method: PaymentMethodValue;
    try {
      method = normalizePaymentMethod(paymentMethod || 'card');
    } catch {
      throw ApiError.badRequest('Unsupported payment method.');
    }

    // Never create an order that cannot actually be paid: an unconfigured
    // provider must fail here, server-side, not at charge time.
    const provider = getPaymentProvider(method);
    if (!provider.isConfigured()) {
      throw ApiError.badRequest('This payment method is not available right now.');
    }

    // Manual methods settle offline: the payment is AWAITING_VERIFICATION
    // until an admin confirms it. Online methods start PENDING.
    const manualPayment = isManualPaymentMethod(method);
    const initialPaymentStatus = manualPayment
      ? PAYMENT_STATUS.AWAITING_VERIFICATION
      : PAYMENT_STATUS.PENDING;

    // Validate the shipping address belongs to the requesting user before use.
    if (shippingAddressId) {
      if (!isValidObjectId(shippingAddressId)) {
        throw ApiError.badRequest('Invalid shipping address ID');
      }
      const address = await prisma.address.findFirst({
        where: { id: shippingAddressId, userId },
        select: { id: true },
      });
      if (!address) throw ApiError.badRequest('Invalid shipping address');
    }

    // Idempotency: re-submitting the same checkout (same key) returns the
    // order already created instead of charging/creating twice.
    if (idempotencyKey) {
      const existing = await prisma.order.findFirst({
        where: { userId, idempotencyKey },
        include: { items: true, shippingAddress: true },
      });
      if (existing) {
        sendSuccess(res, existing, 'Order already placed');
        return;
      }
    }

    const cart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    // Prices, names and totals are ALWAYS recomputed server-side from the DB.
    const lineItems = cart.items.map((item) => ({
      item,
      unitPrice: item.variant?.priceOverride ?? item.product.salePrice ?? item.product.regularPrice,
    }));

    for (const { item } of lineItems) {
      // An item that went inactive (product/variant retired) or out of stock
      // since the cart was loaded must never reach an order.
      const productActive = !!item.product?.isActive;
      const variantActive = item.variant ? !!item.variant.isActive : true;
      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      if (!productActive || !variantActive || availableStock < 1) {
        throw ApiError.badRequest(`${item.product.name} is currently unavailable and cannot be ordered.`);
      }
      if (item.quantity > availableStock) {
        throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
      }
    }

    const subtotalCents = itemsSubtotalCents(
      lineItems.map(({ item, unitPrice }) => ({ unitPrice, quantity: item.quantity }))
    );

    // The cart is the authoritative place a coupon was applied; only an
    // explicit body value may override it. This keeps preview totals and the
    // created order consistent even if a client omits the coupon.
    const effectiveCouponCode = normalizeCouponCode(couponCode ?? cart.couponCode ?? null);

    // Coupon validated server-side. An invalid/expired coupon fails the
    // request (fail-safe) rather than silently charging full price.
    const { coupon, discountCents } = await getCouponOrThrow(effectiveCouponCode, subtotalCents);
    const totals = computeTotals({
      subtotal: fromCents(subtotalCents),
      discount: fromCents(discountCents),
    });

    const orderItems: any[] = lineItems.map(({ item, unitPrice }) => ({
      productId: item.productId,
      variantId: item.variantId,
      productSnapshot: { name: item.product.name, slug: item.product.slug, sku: item.product.sku, images: item.product.images, price: unitPrice },
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
    }));

    const reservations: StockReservation[] = [];
    let couponReservedId: string | null = null;

    const releaseReservations = async () => {
      for (const reservation of [...reservations].reverse()) {
        try {
          await prisma.product.update({
            where: { id: reservation.productId },
            data: { stock: { increment: reservation.quantity } },
          });
          if (reservation.variantId) {
            await prisma.productVariant.update({
              where: { id: reservation.variantId },
              data: { stock: { increment: reservation.quantity } },
            });
          }
        } catch {
          // Best-effort compensation; nothing else we can safely do here.
        }
      }
      if (couponReservedId) {
        await prisma.coupon
          .update({ where: { id: couponReservedId }, data: { usedCount: { decrement: 1 } } })
          .catch(() => {});
      }
    };

    try {
      // Reserve the coupon atomically so concurrent checkouts cannot oversell
      // a limited-use code. Prisma + MongoDB has no interactive transactions,
      // so we use conditional updates and manually compensate on failure.
      if (coupon) {
        const guard: any = { id: coupon.id, isActive: true };
        if (coupon.maxUses) guard.usedCount = { lt: coupon.maxUses };
        if (coupon.expiresAt) guard.expiresAt = { gt: new Date() };
        const reserved = await prisma.coupon.updateMany({ where: guard, data: { usedCount: { increment: 1 } } });
        if (reserved.count === 0) {
          throw ApiError.badRequest('This coupon is no longer valid or has reached its usage limit');
        }
        couponReservedId = coupon.id;
      }

      // Reserve stock with atomic conditional updates so concurrent orders can
      // never both succeed against the same units.
      for (const { item } of lineItems) {
        if (item.variantId) {
          const variantReserved = await prisma.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variantReserved.count === 0) {
            throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
          }
          const productReserved = await prisma.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (productReserved.count === 0) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
            throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
          }
        } else {
          const productReserved = await prisma.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (productReserved.count === 0) {
            throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
          }
        }
        reservations.push({ productId: item.productId, variantId: item.variantId ?? null, quantity: item.quantity });
      }

      const orderNumber = generateOrderNumber();
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          subtotal: totals.subtotal,
          shippingCost: totals.shipping,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
          shippingAddressId,
          notes,
          couponCode: coupon?.code ?? null,
          paymentMethod: method,
          paymentStatus: initialPaymentStatus,
          paymentReference: manualPayment ? orderNumber : null,
          status: 'PENDING',
          idempotencyKey: idempotencyKey ?? null,
          items: { create: orderItems },
        },
        include: { items: true, shippingAddress: true },
      });

      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      // The coupon was consumed by this order; clear it from the emptied cart
      // so the next checkout starts clean instead of silently re-applying it.
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null, discountAmount: null },
      });
      sendCreated(res, order, 'Order created successfully');
    } catch (error) {
      await releaseReservations();
      throw error;
    }
  } catch (error) { next(error); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where: { userId: req.user!.userId }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { items: { include: { product: { select: { name: true, slug: true, images: true } } } } } }),
      prisma.order.count({ where: { userId: req.user!.userId } }),
    ]);
    sendPaginated(res, orders, { page, limit, total });
  } catch (error) { next(error); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user!.userId },
      include: { items: { include: { product: true, variant: true } }, shippingAddress: true },
    });
    if (!order) throw ApiError.notFound('Order not found');
    sendSuccess(res, order);
  } catch (error) { next(error); }
};

export const cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findFirst({ where: { id, userId: req.user!.userId } });
    if (!order) throw ApiError.notFound('Order not found or cannot be cancelled');

    // Cancellation must never conflict with money state: a paid/refunded order
    // or one whose payment is currently processing cannot be cancelled here.
    // Manual orders awaiting verification may be cancelled before settlement.
    const paymentStatus = order.paymentStatus;
    const cancellable =
      order.status === 'PENDING' &&
      (paymentStatus === PAYMENT_STATUS.PENDING ||
        paymentStatus === PAYMENT_STATUS.FAILED ||
        paymentStatus === PAYMENT_STATUS.AWAITING_VERIFICATION);

    if (!cancellable) {
      throw ApiError.badRequest('This order cannot be cancelled while it is being paid or already completed.');
    }

    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    await setOrderPaymentCancelled(id);
    sendSuccess(res, updated, 'Order cancelled');
  } catch (error) { next(error); }
};
