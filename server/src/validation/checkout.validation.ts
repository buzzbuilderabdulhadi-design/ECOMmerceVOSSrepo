import { z } from 'zod';

export const createPaymentIntentSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).min(1, 'Order ID is required').max(100),
  }),
});

export const createPayPalOrderSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).min(1).max(100),
    returnUrl: z
      .string({ required_error: 'Return URL is required' })
      .url('Return URL must be a valid URL')
      .max(2000),
    cancelUrl: z
      .string({ required_error: 'Cancel URL is required' })
      .url('Cancel URL must be a valid URL')
      .max(2000),
  }),
});

export const capturePayPalOrderSchema = z.object({
  body: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).min(1).max(100),
    paypalOrderId: z
      .string({ required_error: 'PayPal order ID is required' })
      .min(1, 'PayPal order ID is required')
      .max(100),
  }),
});

export const orderPaymentStatusSchema = z.object({
  params: z.object({
    orderId: z.string({ required_error: 'Order ID is required' }).min(1).max(100),
  }),
});