// ============================================================
// Coupon Service — server-side coupon validation & discount math
//
// Coupon codes are normalized to uppercase; validation fully server-side.
// A provided-but-invalid coupon fails the request (fail-safe) so a customer is
// never silently charged full price after seeing a discounted amount.
// ============================================================

import prisma from '../config/db';
import { ApiError } from '../utils/apiError';
import { discountCentsFor, toCents } from '../utils/pricing';
import type { Coupon } from '@prisma/client';

export interface CouponEvaluation {
  code: string | null;
  coupon: Coupon | null;
  discountCents: number;
}

export function normalizeCouponCode(code?: string | null): string | null {
  if (typeof code !== 'string') return null;
  const normalized = code.trim().toUpperCase();
  return normalized || null;
}

/**
 * Load a coupon and enforce every business rule, throwing a controlled
 * 4xx error when the provided code is not acceptable. When no code is given a
 * zero discount is returned (no coupon applied).
 */
export async function getCouponOrThrow(
  codeInput: string | null | undefined,
  subtotalCents: number
): Promise<CouponEvaluation> {
  const code = normalizeCouponCode(codeInput);
  if (!code) return { code: null, coupon: null, discountCents: 0 };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) throw ApiError.badRequest('Invalid coupon code');
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer available');
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    throw ApiError.badRequest('This coupon has expired');
  }
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw ApiError.badRequest('This coupon has reached its usage limit');
  }
  if (coupon.minOrderAmount != null && subtotalCents < toCents(coupon.minOrderAmount)) {
    throw ApiError.badRequest(`Minimum order amount of $${coupon.minOrderAmount.toFixed(2)} required`);
  }

  return {
    code,
    coupon,
    discountCents: discountCentsFor(subtotalCents, {
      type: coupon.type as 'PERCENTAGE' | 'FIXED',
      value: coupon.value,
      maxDiscount: coupon.maxDiscount,
    }),
  };
}