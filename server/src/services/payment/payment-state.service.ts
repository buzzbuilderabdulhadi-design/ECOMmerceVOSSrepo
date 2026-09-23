// ============================================================
// Payment State Service — guarded, idempotent payment transitions
//
// Transitioning an order's payment status is a money-critical side effect, so
// every write is an atomic conditional update: the state only moves if the
// current state is in the allowed source set. This is the sole choke point
// that non-browser, server-verified flows (provider captures, webhooks, admin
// verification) use to move an order toward PAID.
// ============================================================

import prisma from '../../config/db';
import {
  PAYMENT_STATUS,
  PaymentStatusValue,
} from '../../constants/order';

export function updatePaymentStatus(
  orderId: string,
  allowedFrom: PaymentStatusValue[],
  to: PaymentStatusValue
): Promise<boolean> {
  return prisma.order
    .updateMany({
      where: { id: orderId, paymentStatus: { in: allowedFrom } },
      data: { paymentStatus: to },
    })
    .then((result) => result.count > 0);
}

/** Order is paid only via a verified provider flow or admin verification. */
export function setOrderPaid(
  orderId: string,
  data: {
    captureId?: string;
    verifiedBy?: string;
    verifiedAt?: Date;
  } = {}
): Promise<boolean> {
  const patch: any = { paymentStatus: PAYMENT_STATUS.PAID };
  if (data.captureId) patch.paypalCaptureId = data.captureId;
  if (data.verifiedBy) {
    patch.paymentVerifiedBy = data.verifiedBy;
    patch.paymentVerifiedAt = data.verifiedAt ?? new Date();
  }
  return prisma.order
    .updateMany({
      where: {
        id: orderId,
        paymentStatus: {
          in: [
            PAYMENT_STATUS.PENDING,
            PAYMENT_STATUS.PROCESSING,
            PAYMENT_STATUS.AWAITING_VERIFICATION,
            PAYMENT_STATUS.FAILED,
          ],
        },
      },
      data: patch,
    })
    .then((result) => result.count > 0);
}

export function setOrderPaymentFailed(orderId: string): Promise<boolean> {
  return updatePaymentStatus(
    orderId,
    [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.AWAITING_VERIFICATION],
    PAYMENT_STATUS.FAILED
  );
}

export function setOrderPaymentCancelled(orderId: string): Promise<boolean> {
  return updatePaymentStatus(
    orderId,
    [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PROCESSING, PAYMENT_STATUS.AWAITING_VERIFICATION, PAYMENT_STATUS.FAILED],
    PAYMENT_STATUS.CANCELLED
  );
}

export function setOrderPaymentAwaitingVerification(orderId: string): Promise<boolean> {
  return updatePaymentStatus(orderId, [PAYMENT_STATUS.PENDING], PAYMENT_STATUS.AWAITING_VERIFICATION);
}