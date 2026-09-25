import { z } from 'zod';

// ============================================================
// Review Validation Schemas (customer-created reviews)
// ============================================================

const objectId = (label = 'id') =>
  z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format. Expected a valid ObjectId.`);

const image = z.string().url('Must be a valid URL').max(500);

export const createReviewSchema = z.object({
  body: z.object({
    productId: objectId('product id'),
    rating: z.number().int('Rating must be a whole number').min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    title: z.string().max(200).optional(),
    text: z.string().max(2000).optional(),
    images: z.array(image).max(5).optional(),
  }),
});

export const updateOwnReviewSchema = z.object({
  params: z.object({ id: objectId('review id') }),
  body: z
    .object({
      rating: z.number().int().min(1).max(5).optional(),
      title: z.string().max(200).optional(),
      text: z.string().max(2000).optional(),
      images: z.array(image).max(5).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const reviewIdParam = z.object({
  params: z.object({ id: objectId('review id') }),
});