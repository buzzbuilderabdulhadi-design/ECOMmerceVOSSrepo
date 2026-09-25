import { z } from 'zod';

// ============================================================
// Address Validation Schemas
//
// The client (checkout + dashboard addresses) sends schema-native field
// names (line1/line2/state/zip). Parsed body is used in the controller —
// never the raw request body — so a client cannot inject `userId`,
// `_id`, or any other column via mass assignment.
// ============================================================

const baseFields = {
  label: z.string().min(1, 'Label is required').max(50, 'Label must be 50 characters or less'),
  fullName: z.string().min(1, 'Full name is required').max(100, 'Full name must be 100 characters or less'),
  phone: z.string().min(1, 'Phone is required').max(30, 'Phone must be 30 characters or less'),
  line1: z.string().min(1, 'Address is required').max(200, 'Address must be 200 characters or less'),
  line2: z.string().max(200, 'Address line 2 must be 200 characters or less').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City must be 100 characters or less'),
  state: z.string().min(1, 'State/Region is required').max(100, 'State must be 100 characters or less'),
  zip: z.string().min(1, 'Postal code is required').max(20, 'Postal code must be 20 characters or less'),
  country: z.string().min(1, 'Country is required').max(100, 'Country must be 100 characters or less'),
  isDefault: z.boolean().optional(),
};

export const createAddressSchema = z.object({
  body: z.object(baseFields),
});

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address id format'),
  }),
  body: z
    .object({
      ...baseFields,
      // All fields optional on update, but at least one must change.
    })
    .partial()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const addressIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid address id format'),
  }),
});