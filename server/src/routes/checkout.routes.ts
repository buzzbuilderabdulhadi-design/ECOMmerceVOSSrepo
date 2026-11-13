import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { checkoutReadLimiter, paymentActionLimiter } from '../middleware/rateLimit.middleware';
import {
  capturePayPalOrderSchema,
  createPaymentIntentSchema,
  createPayPalOrderSchema,
  orderPaymentStatusSchema,
} from '../validation/checkout.validation';
import {
  capturePayPalOrderForCheckout,
  createOrderPaymentIntent,
  createPayPalOrderForCheckout,
  getCheckoutMethods,
  getOrderPaymentStatus,
  previewCheckout,
} from '../controllers/checkout.controller';

const router = Router();

router.use(authenticate);

router.get('/methods', checkoutReadLimiter, getCheckoutMethods);
router.get('/preview', checkoutReadLimiter, previewCheckout);
router.get('/orders/:orderId/payment', checkoutReadLimiter, validate(orderPaymentStatusSchema), getOrderPaymentStatus);
router.post('/payment-intent', paymentActionLimiter, validate(createPaymentIntentSchema), createOrderPaymentIntent);
router.post('/paypal/create', paymentActionLimiter, validate(createPayPalOrderSchema), createPayPalOrderForCheckout);
router.post('/paypal/capture', paymentActionLimiter, validate(capturePayPalOrderSchema), capturePayPalOrderForCheckout);

export default router;