// ============================================================
// Stripe Service — server-only payment orchestration
//
// Stripe secret keys must never leave the server. The client only ever
// receives a short-lived PaymentIntent client_secret. The charge amount is
// always derived from the server-authoritative order totals — never from a
// value sent by the browser.
// ============================================================

import Stripe from 'stripe';
import config from '../config';
import { toCents } from '../utils/pricing';
import { ApiError } from '../utils/apiError';

let stripeClient: Stripe | null = null;

/**
 * Lazily create the Stripe client. Throws a controlled error when payments
 * are not configured rather than silently failing at charge time.
 */
export function getStripe(): Stripe {
  if (!config.stripe.secretKey) {
    throw ApiError.internal('Payments are not configured. Please contact support.');
  }
  if (!stripeClient) {
    // The SDK's default API version is used so deployed pin versions always
    // match the installed SDK.
    stripeClient = new Stripe(config.stripe.secretKey);
  }
  return stripeClient;
}

export interface CreatePaymentIntentParams {
  orderId: string;
  orderNumber: string;
  totalCents: number;
  currency?: string;
  customerUserId?: string;
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  status: string;
}

/**
 * Create (or resume) a PaymentIntent whose amount is the authoritative order
 * total. Idempotency at the Stripe level is driven by the order id so repeated
 * calls for the same order can never create a second charge.
 */
export async function createPaymentIntentForOrder(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
  const stripe = getStripe();
  const currency = (params.currency || config.currency).toLowerCase().trim();
  const amountCents = Math.round(params.totalCents);

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    throw ApiError.internal('Unable to create a payment for an invalid amount.');
  }

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount: amountCents,
      currency,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        ...(params.customerUserId ? { customerUserId: params.customerUserId } : {}),
      },
      automatic_payment_methods: { enabled: true },
    },
    { idempotencyKey: `zg_order_${params.orderId}` }
  );

  if (!paymentIntent.client_secret) {
    throw ApiError.internal('Payment could not be initialized.');
  }

  return {
    id: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
    status: paymentIntent.status,
  };
}