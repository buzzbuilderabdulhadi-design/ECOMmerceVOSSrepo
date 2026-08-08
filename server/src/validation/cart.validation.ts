import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string({ required_error: 'Product ID is required' }).min(1, 'Product ID is required'),
    variantId: z.string().optional(),
    quantity: z.number().int().positive('Quantity must be positive').max(99, 'Quantity cannot exceed 99').default(1),
  }),
});

export const updateCartItemSchema = z.object({
  params: z.object({
    itemId: z.string({ required_error: 'Item ID is required' }).min(1, 'Item ID is required'),
  }),
  body: z.object({
    quantity: z.number({ required_error: 'Quantity is required' }).int().positive('Quantity must be positive').max(99, 'Quantity cannot exceed 99'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.string({ required_error: 'Item ID is required' }).min(1, 'Item ID is required'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string({ required_error: 'Coupon code is required' }).min(1, 'Coupon code is required').max(50),
  }),
});
