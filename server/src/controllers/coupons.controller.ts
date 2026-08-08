import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const validateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, subtotal } = req.body;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    if (!coupon.isActive) throw ApiError.badRequest('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw ApiError.badRequest('Coupon usage limit reached');
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) throw ApiError.badRequest(`Minimum order amount of $${coupon.minOrderAmount} required`);
    const discount = coupon.type === 'PERCENTAGE' ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity) : coupon.value;
    sendSuccess(res, { ...coupon, discount });
  } catch (error) { next(error); }
};
