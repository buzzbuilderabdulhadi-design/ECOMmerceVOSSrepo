import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { normalizeCouponCode } from '../services/coupon.service';
import { fromCents, toCents } from '../utils/pricing';

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body;

    const normalized = normalizeCouponCode(code);
    if (!normalized) throw ApiError.badRequest('Coupon code is required');

    if (subtotal == null || typeof subtotal !== 'number' || !Number.isFinite(subtotal) || subtotal < 0) {
      throw ApiError.badRequest('A valid order subtotal is required');
    }

    const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    if (!coupon.isActive) throw ApiError.badRequest('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw ApiError.badRequest('Coupon usage limit reached');
    if (coupon.minOrderAmount && toCents(subtotal) < toCents(coupon.minOrderAmount)) {
      throw ApiError.badRequest(`Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required`);
    }

    const subtotalCents = toCents(subtotal);
    const discountCents =
      coupon.type === 'PERCENTAGE'
        ? Math.min((subtotalCents * coupon.value) / 100, coupon.maxDiscount != null ? toCents(coupon.maxDiscount) : subtotalCents)
        : toCents(coupon.value);

    // Never leak internal fields (usedCount, maxUses, admin flags). Return only
    // what the customer legitimately needs to see.
    sendSuccess(res, {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: fromCents(Math.min(Math.max(Math.round(discountCents), 0), subtotalCents)),
      minOrderAmount: coupon.minOrderAmount ?? null,
      expiresAt: coupon.expiresAt ?? null,
    });
  } catch (error) { next(error); }
};
