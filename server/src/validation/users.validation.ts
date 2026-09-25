import { z } from 'zod';

// ============================================================
// Customer Profile Validation Schemas
// ============================================================

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      phone: z.string().max(30).optional(),
      avatar: z.union([z.string().url().max(500), z.literal('')]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});