// ============================================================
// Order & Payment State Machine
//
// Payment status lifecycle (authoritative):
//   PENDING    -> process begins            -> PROCESSING
//   PROCESSING -> payment verified by webhook/provider capture -> PAID
//   PROCESSING -> payment failed/cancelled          -> FAILED
//   PENDING    -> manual order placed (bank/Payoneer) -> AWAITING_VERIFICATION
//   AWAITING_VERIFICATION -> admin confirms transfer/receipt -> PAID
//   AWAITING_VERIFICATION -> admin rejects / customer cancels -> FAILED / CANCELLED
//   PAID       -> refund confirmed by provider       -> REFUNDED
//
// A status may only move forward through an allowed transition. Only a
// verified provider event (webhook signature or server-verified capture) or
// the admin verification action can mark an order PAID — never a bare browser
// claim. Repeated deliveries of the same event are no-ops.
// ============================================================

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
} as const;

export type OrderStatusValue = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  AWAITING_VERIFICATION: 'AWAITING_VERIFICATION',
  REFUNDED: 'REFUNDED',
} as const;

export type PaymentStatusValue = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_METHOD = {
  STRIPE: 'STRIPE',
  PAYPAL: 'PAYPAL',
  BANK_TRANSFER: 'BANK_TRANSFER',
  PAYONEER: 'PAYONEER',
} as const;

export type PaymentMethodValue = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

/**
 * Normalize a payment method value to its canonical form. The legacy 'card'
 * value written by early Orders maps to Stripe.
 */
export function normalizePaymentMethod(method: string): PaymentMethodValue {
  const normalized = method.trim().toUpperCase();
  if (normalized === 'CARD') return PAYMENT_METHOD.STRIPE;
  if (normalized === PAYMENT_METHOD.STRIPE) return PAYMENT_METHOD.STRIPE;
  if (normalized === PAYMENT_METHOD.PAYPAL) return PAYMENT_METHOD.PAYPAL;
  if (normalized === PAYMENT_METHOD.BANK_TRANSFER) return PAYMENT_METHOD.BANK_TRANSFER;
  if (normalized === PAYMENT_METHOD.PAYONEER) return PAYMENT_METHOD.PAYONEER;
  throw new Error(`Unknown payment method: ${method}`);
}

/**
 * A manual (offline) payment method never performs an online card/gateway
 * charge. Payment is settled externally and verified by an admin.
 */
export function isManualPaymentMethod(method: string): boolean {
  const normalized = normalizePaymentMethod(method);
  return normalized === PAYMENT_METHOD.BANK_TRANSFER || normalized === PAYMENT_METHOD.PAYONEER;
}

/**
 * Payment statuses that still allow the customer to (re)attempt a payment.
 * AWAITING_VERIFICATION is excluded on purpose: it is a manual-payment order
 * awaiting admin confirmation and must never be re-charged online.
 */
export const PAYMENT_RETRYABLE = new Set<PaymentStatusValue>([
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PROCESSING,
  PAYMENT_STATUS.FAILED,
]);

export const PAYMENT_TERMINAL = new Set<PaymentStatusValue>([
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.REFUNDED,
  PAYMENT_STATUS.CANCELLED,
]);

const PAYMENT_TRANSITIONS: Record<PaymentStatusValue, Set<PaymentStatusValue>> = {
  [PAYMENT_STATUS.PENDING]: new Set([
    PAYMENT_STATUS.PROCESSING,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.CANCELLED,
    PAYMENT_STATUS.AWAITING_VERIFICATION,
  ]),
  [PAYMENT_STATUS.PROCESSING]: new Set([
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED,
  ]),
  [PAYMENT_STATUS.PAID]: new Set([PAYMENT_STATUS.REFUNDED]),
  [PAYMENT_STATUS.FAILED]: new Set([
    PAYMENT_STATUS.PROCESSING,
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.CANCELLED,
  ]),
  [PAYMENT_STATUS.AWAITING_VERIFICATION]: new Set([
    PAYMENT_STATUS.PAID,
    PAYMENT_STATUS.FAILED,
    PAYMENT_STATUS.CANCELLED,
  ]),
  [PAYMENT_STATUS.CANCELLED]: new Set(),
  [PAYMENT_STATUS.REFUNDED]: new Set(),
};

export function canTransitionPayment(from: PaymentStatusValue, to: PaymentStatusValue): boolean {
  return PAYMENT_TRANSITIONS[from] !== undefined && PAYMENT_TRANSITIONS[from].has(to);
}

/**
 * Fulfillment (order status) state machine. The admin UI can only move an
 * order along these forward transitions; anything else is rejected 400.
 * CANCELLED is enforced to be terminal.
 */
const ORDER_TRANSITIONS: Record<OrderStatusValue, Set<OrderStatusValue>> = {
  [ORDER_STATUS.PENDING]: new Set([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
  ]),
  [ORDER_STATUS.CONFIRMED]: new Set([
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.CANCELLED,
  ]),
  [ORDER_STATUS.PROCESSING]: new Set([
    ORDER_STATUS.SHIPPED,
    ORDER_STATUS.CANCELLED,
  ]),
  [ORDER_STATUS.SHIPPED]: new Set([
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.RETURNED,
  ]),
  [ORDER_STATUS.DELIVERED]: new Set([]),
  [ORDER_STATUS.CANCELLED]: new Set([]),
  [ORDER_STATUS.RETURNED]: new Set([]),
};

export function canTransitionOrder(from: OrderStatusValue, to: OrderStatusValue): boolean {
  return ORDER_TRANSITIONS[from] !== undefined && ORDER_TRANSITIONS[from].has(to);
}

/**
 * An order may be cancelled so long as payment is not terminal (paid/refunded)
 * — a paid order must be refunded, never silently cancelled.
 */
export function isOrderCancellable(paymentStatus: PaymentStatusValue): boolean {
  return !PAYMENT_TERMINAL.has(paymentStatus);
}