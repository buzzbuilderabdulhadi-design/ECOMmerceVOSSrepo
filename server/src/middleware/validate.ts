import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Replace the incoming payloads with the parsed (whitelisted) results.
      // This is the single enforcement point that strips unknown keys BEFORE
      // a controller ever sees them, so a raw body spread can never mass-assign
      // fields that a route's schema did not explicitly allow.
      req.body = parsed.body ?? req.body;
      req.query = (parsed.query ?? req.query) as Request['query'];
      req.params = (parsed.params ?? req.params) as Request['params'];
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
        return;
      }
      next(error);
    }
  };
