import { z } from 'zod';

export const createOrderSchema = z.object({
  body: z.object({
    shippingAddressId: z.string().max(100).optional(),
    notes: z.string().max(500).optional(),
    couponCode: z.string().max(50).optional(),
    paymentMethod: z.string().max(50).optional(),
  }),
});
