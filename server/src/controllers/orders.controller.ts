import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';

const generateOrderNumber = () => `ZG-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

interface StockReservation {
  productId: string;
  variantId: string | null;
  quantity: number;
}

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingAddressId, notes, couponCode, paymentMethod } = req.body;

    // Validate the shipping address belongs to the requesting user before use.
    if (shippingAddressId) {
      if (!isValidObjectId(shippingAddressId)) {
        throw ApiError.badRequest('Invalid shipping address ID');
      }
      const address = await prisma.address.findFirst({
        where: { id: shippingAddressId, userId: req.user!.userId },
        select: { id: true },
      });
      if (!address) throw ApiError.badRequest('Invalid shipping address');
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    // Prices, names and totals are always recomputed server-side from the DB.
    let subtotal = 0;
    const orderItems: any[] = [];
    for (const item of cart.items) {
      const availableStock = item.variant ? item.variant.stock : item.product.stock;
      if (item.quantity > availableStock) {
        throw ApiError.badRequest(`Insufficient stock for ${item.product.name}`);
      }
      const price = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.regularPrice;
      subtotal += price * item.quantity;
      orderItems.push({
        productId: item.productId,
        variantId: item.variantId,
        productSnapshot: { name: item.product.name, slug: item.product.slug, sku: item.product.sku, images: item.product.images, price },
        quantity: item.quantity,
        unitPrice: price,
        totalPrice: price * item.quantity,
      });
    }

    // Reserve the coupon atomically. Prisma + MongoDB does not support
    // interactive transactions, so we use conditional updates and manually
    // compensate (release) everything if a later step fails.
    let discount = 0;
    let couponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (
        coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.maxUses || coupon.usedCount < coupon.maxUses) &&
        (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)
      ) {
        const guard: any = { id: coupon.id, isActive: true };
        if (coupon.maxUses) guard.usedCount = { lt: coupon.maxUses };
        const reserved = await prisma.coupon.updateMany({ where: guard, data: { usedCount: { increment: 1 } } });
        if (reserved.count === 1) {
          couponId = coupon.id;
          appliedCouponCode = coupon.code;
          discount = coupon.type === 'PERCENTAGE'
            ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity)
            : coupon.value;
        }
      }
    }

    const reservations: StockReservation[] = [];

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
      if (couponId) {
        await prisma.coupon
          .update({ where: { id: couponId }, data: { usedCount: { decrement: 1 } } })
          .catch(() => {});
      }
    };

    try {
      // Reserve stock with atomic conditional updates so concurrent orders can
      // never both succeed against the same units.
      for (const item of cart.items) {
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

      const shippingCost = subtotal >= 150 ? 0 : 15;
      const tax = subtotal * 0.08;
      const total = subtotal + shippingCost + tax - discount;

      const order = await prisma.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: req.user!.userId,
          subtotal,
          shippingCost,
          tax,
          discount,
          total,
          shippingAddressId,
          notes,
          couponCode: appliedCouponCode,
          paymentMethod,
          items: { create: orderItems },
        },
        include: { items: true, shippingAddress: true },
      });

      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
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
    const order = await prisma.order.findFirst({ where: { id, userId: req.user!.userId, status: 'PENDING' } });
    if (!order) throw ApiError.notFound('Order not found or cannot be cancelled');
    const updated = await prisma.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    sendSuccess(res, updated, 'Order cancelled');
  } catch (error) { next(error); }
};
