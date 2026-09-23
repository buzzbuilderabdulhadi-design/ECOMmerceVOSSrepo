import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  capturePayPalOrderSchema,
  createPaymentIntentSchema,
  createPayPalOrderSchema,
} from '../validation/checkout.validation';
import {
  capturePayPalOrderForCheckout,
  createOrderPaymentIntent,
  createPayPalOrderForCheckout,
  getCheckoutMethods,
  previewCheckout,
} from '../controllers/checkout.controller';

const router = Router();

router.use(authenticate);

router.get('/methods', getCheckoutMethods);
router.get('/preview', previewCheckout);
router.post('/payment-intent', validate(createPaymentIntentSchema), createOrderPaymentIntent);
router.post('/paypal/create', validate(createPayPalOrderSchema), createPayPalOrderForCheckout);
router.post('/paypal/capture', validate(capturePayPalOrderSchema), capturePayPalOrderForCheckout);

export default router;