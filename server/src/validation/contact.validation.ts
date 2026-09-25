import { z } from 'zod';

// ============================================================
// Contact Form Validation
//
// `_website` is a honeypot field: bots that auto-fill every input
// will populate it and the submission is dropped silently.
// ============================================================

export const contactSchema = z.object({
  body: z
    .object({
      firstName: z.string().min(1, 'First name is required').max(100),
      lastName: z.string().min(1, 'Last name is required').max(100),
      email: z.string().email('Enter a valid email address').max(254),
      subject: z.string().min(1, 'Subject is required').max(200),
      message: z.string().min(1, 'Message is required').max(3000),
      // Honeypot — must be empty for humans.
      _website: z.string().max(0).optional().default(''),
    })
    .superRefine((data, ctx) => {
      if (data._website) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['_website'], message: 'Invalid submission' });
      }
    }),
});