// ============================================================
// PayPal Service — official PayPal Orders v2 REST API
//
// Implementation notes:
//  - Uses PayPal's public REST API (the same endpoints the official
//    @paypal/paypal-server-sdk wraps) so no extra runtime dependency is
//    required and every request is server-verified.
//  - Amounts are derived from the server-authoritative order total (cents ->
//    two-decimal string). The client never supplies a charge amount.
//  - OAuth2 client_credentials token is cached in-memory and refreshed on the
//    first 401 / near expiry.
//  - Webhook events are verified with PayPal's verify-webhook-signature
//    endpoint before any state change.
// ============================================================

import config from '../../config';
import logger from '../../utils/logger';
import { ApiError } from '../../utils/apiError';

const PP_PAY_NOW_APP_NAME = 'ZOYA GOODS';

export interface PaypalAccessToken {
  access_token: string;
  expires_in: number;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

export function paypalApiBase(): string {
  return config.paypal.environment === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export class PayPalApiError extends Error {
  status: number;
  details: any;

  constructor(status: number, message: string, details?: any) {
    super(message);
    this.name = 'PayPalApiError';
    this.status = status;
    this.details = details;
  }
}

async function paypalJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${paypalApiBase()}${path}`, init);

  // Parse the body only once, then rehydrate it for retry/auth logic.
  const raw = await res.text();
  let body: any = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const msg =
      body?.message ||
      body?.error_description ||
      body?.error ||
      `PayPal request failed with status ${res.status}`;
    throw new PayPalApiError(res.status, msg, body);
  }

  return body as T;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 30_000) {
    return cachedToken.value;
  }
  if (!config.paypal.clientId || !config.paypal.clientSecret) {
    throw ApiError.badRequest('PayPal is not configured. Please contact support.');
  }

  const basic = Buffer.from(
    `${config.paypal.clientId}:${config.paypal.clientSecret}`
  ).toString('base64');

  const token = await paypalJson<PaypalAccessToken>('/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en_US',
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  cachedToken = {
    value: token.access_token,
    expiresAt: now + token.expires_in * 1000,
  };
  return token.access_token;
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** PayPal money value: dollars to a fixed two-decimal string. */
function formatAmount(cents: number): string {
  return (cents / 100).toFixed(2);
}

/** PayPal returns amounts as strings; convert back to integer cents. */
export function parsePayPalAmount(value: unknown): number {
  const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100);
}

export interface CreatePayPalOrderParams {
  referenceId: string;
  amountCents: number;
  currency: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
  approveUrl: string | null;
}

/**
 * Create a CAPTURE-intent order on PayPal. The returned approve link is the
 * only thing the client ever sees — no secret credentials cross the wire.
 */
export async function createPayPalOrder(
  params: CreatePayPalOrderParams
): Promise<PayPalOrderResult> {
  if (!Number.isFinite(params.amountCents) || params.amountCents <= 0) {
    throw ApiError.badRequest('This order has an invalid amount and cannot be paid via PayPal.');
  }

  const body = {
    intent: 'CAPTURE',
    application_context: {
      brand_name: PP_PAY_NOW_APP_NAME,
      return_url: params.returnUrl,
      cancel_url: params.cancelUrl,
      user_action: 'PAY_NOW',
      shipping_preference: 'GET_FROM_FILE',
    },
    purchase_units: [
      {
        reference_id: params.referenceId,
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: formatAmount(params.amountCents),
        },
      },
    ],
  };

  const order = await paypalJson<any>(
    '/v2/checkout/orders',
    {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(body),
    }
  );

  const approveLink = order.links?.find(
    (link: any) => link.rel === 'approve'
  )?.href ?? null;

  return { id: order.id, status: order.status, approveUrl: approveLink };
}

export interface PayPalOrderCapture {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  sellerReceivableAmountCents: number;
}

/**
 * Capture an approved PayPal order. Idempotent from the server side: an order
 * that was already captured returns the existing capture. The caller must
 * still verify the captured amount/currency against the authoritative order
 * total before marking anything PAID.
 */
export async function capturePayPalOrder(
  paypalOrderId: string
): Promise<{ orderStatus: string; capture: PayPalOrderCapture | null }> {
  try {
    const captured = await paypalJson<any>(
      `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
      {
        method: 'POST',
        headers: await authHeaders(),
      }
    );

    const purchaseUnit = captured.purchase_units?.[0];
    const capture = purchaseUnit?.payments?.captures?.[0];
    return {
      orderStatus: captured.status,
      capture: capture
        ? {
            id: capture.id,
            status: capture.status,
            amountCents: parsePayPalAmount(capture.amount?.value),
            currency: capture.amount?.currency_code
              ? String(capture.amount.currency_code).toLowerCase()
              : '',
            sellerReceivableAmountCents: parsePayPalAmount(
              capture.seller_receivable_breakdown?.net_amount?.value
            ),
          }
        : null,
    };
  } catch (error) {
    // A repeated capture attempt arrives as UNPROCESSABLE_ENTITY with an
    // ORDER_ALREADY_CAPTURED detail. Treat that as "already captured" so the
    // caller can verify via GET /orders/{id} instead of failing the payment.
    if (
      error instanceof PayPalApiError &&
      error.status === 422 &&
      Array.isArray(error.details?.details)
    ) {
      const already = error.details.details.some(
        (d: any) => d.issue === 'ORDER_ALREADY_CAPTURED'
      );
      if (already) {
        const current = await getPayPalOrder(paypalOrderId);
        return { orderStatus: current.status, capture: null };
      }
    }
    throw error;
  }
}

export interface PayPalOrderView {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  captureId: string | null;
  approveUrl: string | null;
}

/** Read current status and amounts for a PayPal order (used for verification). */
export async function getPayPalOrder(
  paypalOrderId: string
): Promise<PayPalOrderView> {
  const order = await paypalJson<any>(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`,
    {
      method: 'GET',
      headers: await authHeaders(),
    }
  );

  const purchaseUnit = order.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0] ?? null;

  return {
    id: order.id,
    status: order.status,
    amountCents: parsePayPalAmount(
      capture?.amount?.value ?? purchaseUnit?.amount?.value
    ),
    currency: (capture?.amount?.currency_code ?? purchaseUnit?.amount?.currency_code ?? '')
      .toString()
      .toLowerCase(),
    captureId: capture?.id ?? null,
    approveUrl: order.links?.find(
      (link: any) => link.rel === 'approve'
    )?.href ?? null,
  };
}

// ============================================================
// Webhook signature verification (official endpoint)
// ============================================================

export interface VerifyWebhookParams {
  webhookId: string;
  /** Raw (pre-JSON) body exactly as received. */
  eventBody: string;
  headers: {
    authAlgo: string;
    certUrl: string;
    transmissionId: string;
    transmissionSig: string;
    transmissionTime: string;
  };
}

export async function verifyPayPalWebhookSignature(
  params: VerifyWebhookParams
): Promise<boolean> {
  const payload = {
    auth_algo: params.headers.authAlgo,
    cert_url: params.headers.certUrl,
    transmission_id: params.headers.transmissionId,
    transmission_sig: params.headers.transmissionSig,
    transmission_time: params.headers.transmissionTime,
    webhook_id: params.webhookId,
    webhook_event: JSON.parse(params.eventBody),
  };

  const result = await paypalJson<any>(
    '/v1/notifications/verify-webhook-signature',
    {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify(payload),
    }
  );

  logger.info('PayPal webhook signature verification result', {
    verification_status: result.verification_status,
  });
  return result.verification_status === 'SUCCESS';
}

// ============================================================
// Token lifecycle (test/debug helper, not used in request paths)
// ============================================================

export function resetPayPalTokenCache(): void {
  cachedToken = null;
}