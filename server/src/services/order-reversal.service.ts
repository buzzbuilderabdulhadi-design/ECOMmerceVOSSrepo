import prisma from '../config/db';

/**
 * Reverts stock reservations and coupon consumption made at order creation.
 *
 * Order creation deducts stock (per product and per variant) and increments
 * the coupon's usedCount. Whenever an order is cancelled (user or admin) or
 * deleted (admin), those side effects must be reversed, otherwise stock leaks
 * out of circulation and limited-use coupons burn forever.
 *
 * Callers MUST guard on order state (only reverse when moving FROM a live
 * status), so repeat calls on the same order stay idempotent.
 */
export const reverseOrderReservations = async (orderId: string): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) return;

  // Restock: a cancelled order's units go back to the shelf.
  for (const item of order.items) {
    if (item.variantId) {
      await prisma.productVariant
        .update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
        .catch(() => {});
    }
    if (item.productId) {
      await prisma.product
        .update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
        .catch(() => {});
    }
  }

  // Release the coupon consumption if one was applied.
  if (order.couponCode) {
    await prisma.coupon
      .updateMany({
        where: { code: order.couponCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      })
      .catch(() => {});
  }
};