// ============================================================
// Pricing display help — mirrors the SERVER-authoritative rules in
// server/src/utils/pricing.ts. These values are for display only; the server
// recomputes everything and the client must never be trusted for money.
// ============================================================

export const TAX_RATE = 0.08;
export const SHIPPING_COST = 15;
export const FREE_SHIPPING_THRESHOLD = 200;

export interface DisplayTotals {
  subtotal: number;
  discount: number;
  netSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export function computeTotals(subtotal: number, discount: number): DisplayTotals {
  const subtotalSafe = Math.max(0, Number.isFinite(subtotal) ? subtotal : 0);
  const discountSafe = Math.min(Math.max(0, Number.isFinite(discount) ? discount : 0), subtotalSafe);
  const netSubtotal = subtotalSafe - discountSafe;
  const shipping = netSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const tax = Math.round(netSubtotal * TAX_RATE * 100) / 100;
  const total = Math.round((netSubtotal + shipping + tax) * 100) / 100;
  return { subtotal: subtotalSafe, discount: discountSafe, netSubtotal, shipping, tax, total };
}