// ============================================================
// PayPal Webhook Controller
//
// Signature verification (via PayPal's verify-webhook-signature endpoint),
// event idempotency and amount checks before any state change. Only a
// verified PAYMENT.CAPTURE.COMPLETED event — never a browser claim — can move
// a PayPal order to PAID.
// ============================================================

import { Request, Response } from 'express';
import prisma from '../config/db';
import config from '../config';
import logger from '../utils/logger';
import {
  parsePayPalAmount,
  verifyPayPalWebhookSignature,
} from '../services/payment/paypal.service';
import {
  isPaymentEventProcessed,
  markPaymentEventProcessed,
} from '../services/payment/payment-event.service';
import { setOrderPaid, setOrderPaymentFailed } from '../services/payment/payment-state.service';

const PROVIDER = 'PAYPAL';

export const paypalWebhook = async (req: Request, res: Response): Promise<void> => {
  if (!config.paypal.webhookId) {
    logger.error('PayPal webhook received but PAYPAL_WEBHOOK_ID is not configured');
    res.status(503).json({ success: false, error: 'Webhook not configured' });
    return;
  }

  const transmissionId = req.headers['paypal-transmission-id'] as string | undefined;
  const transmissionTime = req.headers['paypal-transmission-time'] as string | undefined;
  const certUrl = req.headers['paypal-cert-url'] as string | undefined;
  const authAlgo = req.headers['paypal-auth-algo'] as string | undefined;
  const transmissionSig = req.headers['paypal-transmission-sig'] as string | undefined;

  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    res.status(400).json({ success: false, error: 'Missing PayPal signature headers' });
    return;
  }

  // Verify the signature with PayPal before trusting anything in the body.
  const rawBody = (req.body as Buffer).toString('utf8');
  let verified = false;
  try {
    verified = await verifyPayPalWebhookSignature({
      webhookId: config.paypal.webhookId,
      eventBody: rawBody,
      headers: {
        authAlgo,
        certUrl,
        transmissionId,
        transmissionSig,
        transmissionTime,
      },
    });
  } catch (error) {
    logger.error('PayPal webhook signature verification failed', { error: String(error) });
    res.status(400).json({ success: false, error: 'Invalid signature' });
    return;
  }

  if (!verified) {
    res.status(400).json({ success: false, error: 'Invalid signature' });
    return;
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    res.status(400).json({ success: false, error: 'Invalid JSON' });
    return;
  }

  try {
    const eventId = String(event.id || '');
    if (await isPaymentEventProcessed(PROVIDER, eventId)) {
      res.status(200).json({ success: true, received: true });
      return;
    }

    // PayPal orders are located via their PayPal order id.
    const resource = event.resource ?? {};
    const paypalOrderId =
      resource.id && event.event_type === 'CHECKOUT.ORDER.APPROVED'
        ? String(resource.id)
        : String(resource.supplementary_data?.related_ids?.order_id || '');

    const order = paypalOrderId
      ? await prisma.order.findUnique({
          where: { paypalOrderId },
          select: { id: true, total: true, paymentStatus: true },
        })
      : null;

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      if (!paypalOrderId || !order) {
        logger.warn('PayPal capture completed for an unknown order', { eventId, paypalOrderId });
        await markPaymentEventProcessed(PROVIDER, eventId, null, event);
        res.status(200).json({ success: true, received: true });
        return;
      }

      const eventCents = parsePayPalAmount(resource.amount?.value);
      const eventCurrency = String(resource.amount?.currency_code || '').toLowerCase();
      const expectedCents = Math.round(order.total * 100);

      if (eventCents !== expectedCents || (eventCurrency && eventCurrency !== config.currency.toLowerCase())) {
        logger.error(
          'PayPal capture webhook amount/currency mismatch; keeping payment unpaid',
          { eventId, orderId: order.id, eventCents, expectedCents, eventCurrency, expectedCurrency: config.currency }
        );
        await setOrderPaymentFailed(order.id);
        await markPaymentEventProcessed(PROVIDER, eventId, order.id, event);
        res.status(200).json({ success: true, received: true });
        return;
      }

      await setOrderPaid(order.id, { captureId: String(resource.id || '') });
      await markPaymentEventProcessed(PROVIDER, eventId, order.id, event);
      logger.info('PayPal payment marked paid via webhook', { eventId, orderId: order.id });
      res.status(200).json({ success: true, received: true });
      return;
    }

    // Other PayPal events (e.g. CHECKOUT.ORDER.APPROVED) carry no money
    // movement and are acknowledged so PayPal stops retrying.
    await markPaymentEventProcessed(PROVIDER, eventId, order?.id ?? null, event);
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    logger.error('PayPal webhook processing failed', { error: String(error) });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};