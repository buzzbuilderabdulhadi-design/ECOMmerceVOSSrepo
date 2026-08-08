import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const generateOrderNumber = () => `VOSS-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shippingAddressId, notes, couponCode, paymentMethod } = req.body;
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: { items: { include: { product: true, variant: true } } },
    });
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    let subtotal = 0;
    const orderItems: any[] = [];
    for (const item of cart.items) {
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

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
      if (coupon && coupon.isActive && (!coupon.expiresAt || coupon.expiresAt > new Date()) && (!coupon.maxUses || coupon.usedCount < coupon.maxUses)) {
        if (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount) {
          discount = coupon.type === 'PERCENTAGE' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity) : coupon.value;
          await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
        }
      }
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
        couponCode,
        paymentMethod,
        items: { create: orderItems },
      },
      include: { items: true, shippingAddress: true },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    sendCreated(res, order, 'Order created successfully');
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
