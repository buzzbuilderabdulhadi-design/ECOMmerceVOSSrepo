// ============================================================
// Stripe PaymentIntent reconciliation
//
// The single place where an observed Stripe PaymentIntent is compared against
// the local order and the order's payment state is moved (idempotently) to
// match reality. Both the webhook (authoritative async signal) and the
// customer "verify my payment" endpoint (post-redirect / refresh) funnel
// through here, so the two can never disagree or double-apply side effects.
//
// Guarantees:
//  - A succeeded intent is only accepted when its amount AND currency match the
//    server-authoritative order total. A mismatch never marks the order paid.
//  - The transition itself is a guarded conditional update (see
//    payment-state.service), so a duplicate webhook is a no-op.
//  - Only the choke point setOrderPaid() fires customer notifications/email.
// ============================================================

import prisma from '../../config/db';
import config from '../../config';
import logger from '../../utils/logger';
import { toCents } from '../../utils/pricing';
import { PAYMENT_STATUS } from '../../constants/order';
import {
  setOrderPaid,
  setOrderPaymentFailed,
  updatePaymentStatus,
} from './payment-state.service';

export type ReconcileOutcome =
  | 'paid'
  | 'failed'
  | 'processing'
  | 'amount_mismatch'
  | 'no_order'
  | 'unchanged';

export interface ReconcileResult {
  outcome: ReconcileOutcome;
  orderId: string | null;
  paymentStatus?: string;
}

/**
 * Reconcile a PaymentIntent snapshot (from a webhook event or a live retrieve)
 * against the order that owns it.
 */
export async function reconcileStripePaymentIntent(intent: {
  id: string;
  status: string;
  amount: number;
  currency: string;
}): Promise<ReconcileResult> {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: intent.id },
    select: { id: true, total: true, paymentStatus: true },
  });

  if (!order) return { outcome: 'no_order', orderId: null };

  if (intent.status === 'succeeded') {
    const expectedCents = toCents(order.total);
    const currencyMatches =
      !intent.currency || intent.currency.toLowerCase() === config.currency.toLowerCase();

    if (intent.amount !== expectedCents || !currencyMatches) {
      logger.error('Stripe PaymentIntent amount/currency mismatch; refusing to mark paid', {
        paymentIntentId: intent.id,
        orderId: order.id,
        expectedCents,
        gotCents: intent.amount,
        expectedCurrency: config.currency,
        gotCurrency: intent.currency,
      });
      await setOrderPaymentFailed(order.id);
      return { outcome: 'amount_mismatch', orderId: order.id, paymentStatus: PAYMENT_STATUS.FAILED };
    }

    const moved = await setOrderPaid(order.id);
    return {
      outcome: moved ? 'paid' : 'unchanged',
      orderId: order.id,
      paymentStatus: PAYMENT_STATUS.PAID,
    };
  }

  if (intent.status === 'canceled') {
    const moved = await setOrderPaymentFailed(order.id);
    return {
      outcome: moved ? 'failed' : 'unchanged',
      orderId: order.id,
      paymentStatus: moved ? PAYMENT_STATUS.FAILED : order.paymentStatus,
    };
  }

  if (intent.status === 'processing') {
    await updatePaymentStatus(
      order.id,
      [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.FAILED],
      PAYMENT_STATUS.PROCESSING
    );
    return { outcome: 'processing', orderId: order.id, paymentStatus: PAYMENT_STATUS.PROCESSING };
  }

  // requires_payment_method / requires_confirmation / requires_action — the
  // customer has not finished. Never advance or fail on these.
  return { outcome: 'unchanged', orderId: order.id, paymentStatus: order.paymentStatus };
}
