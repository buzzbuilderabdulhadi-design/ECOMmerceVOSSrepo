// ============================================================
// Authoritative Money Calculation
//
// The server is the single source of truth for every monetary
// value a customer pays. All checkout totals, order creation and
// payment amounts must flow through this module so that different
// code paths cannot silently diverge.
//
// Business rules (single authoritative source):
//  - Item price precedence: variant.priceOverride ?? salePrice ?? regularPrice
//  - Free shipping threshold: 200.00 (on net merchandise subtotal, after coupon)
//  - Shipping cost when below threshold: 15.00
//  - Tax rate: 8% applied to the net merchandise subtotal (after coupon),
//    shipping is NOT taxed.
//  - A coupon can never push the payable amount below zero; discounts are
//    clamped to the merchandise subtotal.
// ============================================================

export const TAX_RATE = 0.08;
export const SHIPPING_COST = 15;
export const FREE_SHIPPING_THRESHOLD = 200;

export const CURRENCY = 'usd';

export interface MerchandiseItem {
  unitPrice: number;
  quantity: number;
}

export interface CouponInput {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  maxDiscount?: number | null;
}

export interface TotalsInput {
  subtotal: number;
  discount: number;
}

export interface TotalsInCents {
  subtotalCents: number;
  discountCents: number;
  netSubtotalCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}

export interface Totals extends TotalsInCents {
  subtotal: number;
  discount: number;
  netSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

function assertFiniteMoney(value: number, label: string): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid monetary value for ${label}: ${value}`);
  }
}

export function toCents(dollars: number): number {
  assertFiniteMoney(dollars, 'amount');
  return Math.round(dollars * 100);
}

export function fromCents(cents: number): number {
  assertFiniteMoney(cents, 'cents');
  return Math.round(cents) / 100;
}

export function itemsSubtotalCents(items: MerchandiseItem[]): number {
  let total = 0;
  for (const item of items) {
    assertFiniteMoney(item.unitPrice, 'unit price');
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(`Invalid quantity: ${item.quantity}`);
    }
    total += toCents(item.unitPrice) * item.quantity;
  }
  return total;
}

export function itemsSubtotal(items: MerchandiseItem[]): number {
  return fromCents(itemsSubtotalCents(items));
}

/**
 * Compute the coupon discount in cents. The discount can never exceed the
 * eligible merchandise subtotal, so the payable amount can never go negative.
 */
export function discountCentsFor(
  subtotalCents: number,
  coupon: CouponInput | null
): number {
  if (!coupon) return 0;
  assertFiniteMoney(subtotalCents, 'subtotal');
  if (coupon.value < 0 || !Number.isFinite(coupon.value)) {
    return 0;
  }
  let raw: number;
  if (coupon.type === 'PERCENTAGE') {
    raw = (subtotalCents * coupon.value) / 100;
    if (coupon.maxDiscount != null && coupon.maxDiscount > 0) {
      raw = Math.min(raw, toCents(coupon.maxDiscount));
    }
  } else {
    raw = toCents(coupon.value);
  }
  return Math.min(Math.max(Math.round(raw), 0), subtotalCents);
}

export function computeTotalsCents(input: TotalsInput): TotalsInCents {
  assertFiniteMoney(input.subtotal, 'subtotal');
  assertFiniteMoney(input.discount, 'discount');

  const subtotalCents = toCents(input.subtotal);
  const discountCents = Math.min(toCents(input.discount), subtotalCents);
  const netSubtotalCents = subtotalCents - discountCents;

  const shippingCents = netSubtotalCents >= toCents(FREE_SHIPPING_THRESHOLD) ? 0 : toCents(SHIPPING_COST);
  const taxCents = Math.round(netSubtotalCents * TAX_RATE);
  const totalCents = netSubtotalCents + shippingCents + taxCents;

  return { subtotalCents, discountCents, netSubtotalCents, shippingCents, taxCents, totalCents };
}

export function computeTotals(input: TotalsInput): Totals {
  const c = computeTotalsCents(input);
  return {
    ...c,
    subtotal: fromCents(c.subtotalCents),
    discount: fromCents(c.discountCents),
    netSubtotal: fromCents(c.netSubtotalCents),
    shipping: fromCents(c.shippingCents),
    tax: fromCents(c.taxCents),
    total: fromCents(c.totalCents),
  };
}