import { z } from 'zod';

// ============================================================
// Product Question Validation Schemas
// ============================================================

export const createQuestionSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id format'),
    question: z.string().min(5, 'Question must be at least 5 characters').max(1000, 'Question must be 1000 characters or less'),
  }),
});

export const questionIdParam = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question id format'),
  }),
});

export const answerQuestionSchema = z.object({
  body: z.object({
    answer: z.string().trim().min(1, 'Answer cannot be empty').max(2000, 'Answer must be 2000 characters or less'),
  }),
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid question id format'),
  }),
});