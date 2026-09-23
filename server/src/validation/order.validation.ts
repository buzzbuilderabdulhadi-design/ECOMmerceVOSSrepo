import { z } from 'zod';

// 'card' is the legacy value written by early orders; it maps to STRIPE.
const paymentMethod = z.enum(['STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'PAYONEER', 'card'], {
  errorMap: () => ({ message: 'Unsupported payment method.' }),
});

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
    couponCode: z.string().max(50).optional(),
    paymentMethod: paymentMethod.optional(),
    idempotencyKey: z.string().max(100).optional(),
  }),
});
