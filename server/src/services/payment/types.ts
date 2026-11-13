// ============================================================
// Payment Provider Abstraction
//
// Every supported payment method implements this interface so the checkout &
// order controllers can orchestrate payments without "if" chains per provider.
//
// Security invariants (enforced by the controllers, not here):
//  - Amounts are ALWAYS the server-authoritative order total, never a browser
//    value. Providers receive cents and convert internally.
//  - No provider secret/credential is ever returned to the client. Online
//    methods return short-lived client secrets / approval URLs; manual
//    methods return display-only instructions.
//  - Only verified provider events or the admin verification action may mark
//    an order PAID.
// ============================================================

import {
  PAYMENT_METHOD,
  PaymentMethodValue,
} from '../../constants/order';

export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  userId: string;
  totalCents: number;
  currency: string;
  /** Absolute URLs used by PayPal-style hosted approvals. */
  returnUrl?: string;
  cancelUrl?: string;
  /**
   * Provider idempotency key override. Only used when a stored intent was
   * cancelled and a genuinely new one must be created for the same order.
   */
  idempotencyKey?: string;
}

export type CreatePaymentResult =
  | {
      provider: typeof PAYMENT_METHOD.STRIPE;
      kind: 'online';
      paymentIntentId: string;
      clientSecret: string;
      amountCents: number;
      currency: string;
    }
  | {
      provider: typeof PAYMENT_METHOD.PAYPAL;
      kind: 'online';
      paypalOrderId: string;
      approvalUrl: string;
    }
  | {
      provider: typeof PAYMENT_METHOD.BANK_TRANSFER | typeof PAYMENT_METHOD.PAYONEER;
      kind: 'manual';
      /** Reference the customer must include with the transfer/payment. */
      reference: string;
      /** Display-only instructions. */
      instructions: string[];
    };

export interface PaymentProvider {
  id: PaymentMethodValue;
  isConfigured(): boolean;
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
}