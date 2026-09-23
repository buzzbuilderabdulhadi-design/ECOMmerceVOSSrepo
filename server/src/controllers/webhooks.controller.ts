// ============================================================
// Stripe Webhook Controller
//
// Signature verification, idempotent payment-state transitions and never
// trusting browser claims. The raw request body is verified with Stripe's
// webhook secret before anything else.
// ============================================================

import { Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../config/db';
import config from '../config';
import logger from '../utils/logger';
import { getStripe } from '../services/stripe.service';
import {
  isPaymentEventProcessed,
  markPaymentEventProcessed,
} from '../services/payment/payment-event.service';
import {
  canTransitionPayment,
  PAYMENT_STATUS,
  PaymentStatusValue,
} from '../constants/order';

function loadStripeEventHandler(): Stripe {
  return getStripe();
}

/**
 * Transition an order's payment status with a precondition so a duplicated
 * event delivery can never produce a second side effect.
 */
async function transitionPayment(
  paymentIntentId: string,
  next: PaymentStatusValue
): Promise<'updated' | 'already' | 'not_found' | 'invalid'> {
  const order = await prisma.order.findUnique({
    where: { stripePaymentIntentId: paymentIntentId },
    select: { id: true, paymentStatus: true },
  });
  if (!order) return 'not_found';

  const current = order.paymentStatus as PaymentStatusValue;
  if (current === next) return 'already';
  if (!canTransitionPayment(current, next)) return 'invalid';

  await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: current },
    data: { paymentStatus: next },
  });
  return 'updated';
}

export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!config.stripe.webhookSecret) {
    logger.error('Stripe webhook received but STRIPE_WEBHOOK_SECRET is not configured');
    res.status(503).json({ success: false, error: 'Webhook not configured' });
    return;
  }
  if (!signature) {
    res.status(400).json({ success: false, error: 'Missing Stripe signature' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = loadStripeEventHandler();
    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      signature,
      config.stripe.webhookSecret
    );
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', { error: String(error) });
    res.status(400).json({ success: false, error: 'Invalid signature' });
    return;
  }

  try {
    // Duplicate delivery protection across restarts: the same Stripe event id
    // is processed at most once. The state-machine precondition below is a
    // second, race-proof layer.
    if (await isPaymentEventProcessed('STRIPE', event.id)) {
      res.status(200).json({ success: true, received: true });
      return;
    }

    let result: 'updated' | 'already' | 'not_found' | 'invalid' = 'not_found';

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        result = await transitionPayment(pi.id, PAYMENT_STATUS.PAID);
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        result = await transitionPayment(pi.id, PAYMENT_STATUS.FAILED);
        break;
      }
      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent;
        result = await transitionPayment(pi.id, PAYMENT_STATUS.FAILED);
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const piId = typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : charge.payment_intent?.id;
        if (!piId) {
          res.status(200).json({ success: true, received: true });
          return;
        }
        result = await transitionPayment(piId, PAYMENT_STATUS.REFUNDED);
        break;
      }
      default:
        // Events outside the implemented PaymentIntent flow are acknowledged
        // so Stripe stops retrying; nothing to do.
        res.status(200).json({ success: true, received: true });
        return;
    }

    if (result === 'not_found') {
      logger.warn(`Stripe event ${event.type} referenced an unknown PaymentIntent`);
    } else if (result === 'invalid') {
      logger.warn(`Stripe event ${event.type} attempted an impossible payment transition`);
    }

    await markPaymentEventProcessed('STRIPE', event.id);

    // Acknowledge duplicates (already) the same as fresh updates: Stripe will
    // stop retrying and no side effect is duplicated.
    res.status(200).json({ success: true, received: true });
  } catch (error) {
    logger.error('Stripe webhook processing failed', { error: String(error) });
    res.status(500).json({ success: false, error: 'Webhook processing failed' });
  }
};