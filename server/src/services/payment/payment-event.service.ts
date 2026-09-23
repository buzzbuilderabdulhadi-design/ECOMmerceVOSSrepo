// ============================================================
// Payment Event Idempotency Service
//
// Provider webhooks can deliver the same event repeatedly (retries, at-least-
// once semantics). The (provider, eventId) pair is unique in the database so
// processing is recorded atomically and a duplicated delivery is a no-op.
// ============================================================

import prisma from '../../config/db';

export async function isPaymentEventProcessed(
  provider: string,
  eventId: string
): Promise<boolean> {
  const existing = await prisma.paymentEvent.findUnique({
    where: { provider_eventId: { provider, eventId } },
    select: { id: true },
  });
  return Boolean(existing);
}

/**
 * Record a processed event. Called only after the event has been fully acted
 * on (or is known to require no action) so a later duplicate is skipped.
 */
export async function markPaymentEventProcessed(
  provider: string,
  eventId: string,
  orderId?: string | null,
  payload?: unknown
): Promise<void> {
  try {
    await prisma.paymentEvent.create({
      data: {
        provider,
        eventId,
        orderId: orderId ?? null,
        payload: payload !== undefined ? (payload as object) : null,
      },
    });
  } catch (error: any) {
    // P2002 = duplicate key race between two deliveries of the same event.
    // That's the exact scenario we defend against, so swallow it.
    if (error?.code !== 'P2002') throw error;
  }
}