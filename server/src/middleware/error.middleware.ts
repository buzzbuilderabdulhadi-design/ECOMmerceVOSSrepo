import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { ApiError } from '../utils/apiError';
import logger from '../utils/logger';

// ============================================================
// Global Error Handler Middleware
//
// Safety rules enforced here:
//   * Production clients only ever see safe, generic messages. Stack traces,
//     raw error messages and internal identifiers are dev-only.
//   * Prisma/DB, JWT, Multer and Zod errors are mapped to precise, safe
//     status codes instead of being passed through as 500s.
//   * Body-parser failures (bad JSON / oversized bodies) map to 400/413.
//   * Server-side logging keeps the useful detail WITHOUT passwords,
//     tokens, or payment data (the request body is never logged).
// ============================================================

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = config.env === 'development';

  // --- Known application error ------------------------------------
  if (err instanceof ApiError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', {
        status: err.statusCode,
        code: err.code,
        method: req.method,
        path: req.originalUrl.split('?')[0],
      });
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // --- Body-parser: oversized body → 413, malformed JSON → 400 -------
  const bodyErr = err as unknown as {
    type?: string;
    status?: number;
    message?: string;
  };
  if (bodyErr.type === 'entity.too.large') {
    logger.warn('Request body too large', { method: req.method, path: req.originalUrl.split('?')[0] });
    res.status(413).json({
      success: false,
      error: 'Request body is too large. Please reduce the payload and try again.',
      code: 'PAYLOAD_TOO_LARGE',
    });
    return;
  }
  if (bodyErr.type === 'entity.parse.failed' || bodyErr.type === 'entity.verify.failed') {
    logger.warn('Malformed request body', {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      ip: req.ip,
    });
    res.status(400).json({
      success: false,
      error: 'Malformed request body.',
      code: 'BAD_JSON',
    });
    return;
  }

  // --- Prisma/MongoDB errors -----------------------------------------
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    let message = 'Database error';
    let statusCode = 400;

    switch (prismaErr.code) {
      case 'P2002':
        message = 'A record with this value already exists.';
        statusCode = 409;
        break;
      case 'P2025':
        message = 'Record not found.';
        statusCode = 404;
        break;
      case 'P2003':
        message = 'Referenced record does not exist.';
        statusCode = 400;
        break;
      case 'P2014':
        message = 'Invalid database constraint.';
        statusCode = 400;
        break;
      case 'P2023':
        // MongoDB ObjectId-scoped error raised when an id is not a valid
        // ObjectId. Return a controlled 400 instead of leaking an internal
        // database error. Validating ObjectId up-front is preferred.
        message = 'Invalid record identifier.';
        statusCode = 400;
        break;
      default:
        message = 'An unexpected database error occurred.';
        statusCode = 500;
    }

    if (statusCode >= 500) {
      logger.error('Database error', { code: prismaErr.code, method: req.method, path: req.originalUrl.split('?')[0] });
    }
    res.status(statusCode).json({
      success: false,
      error: message,
      code: prismaErr.code,
      ...(isDev && { stack: err.stack }),
    });
    return;
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      error: 'Invalid data provided.',
      ...(isDev && {
        details: err.message,
        stack: err.stack,
      }),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: 'Invalid token.',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: 'Token has expired.',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    const multerErr = err as any;
    let message = 'File upload error';

    switch (multerErr.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File is too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files uploaded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected file field.';
        break;
      default:
        message = multerErr.message || 'File upload failed.';
    }

    res.status(400).json({
      success: false,
      error: message,
    });
    return;
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    const zodErr = err as any;
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: zodErr.errors?.map((e: any) => ({
        field: e.path?.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // --- Default 500 --------------------------------------------------
  logger.error('Unhandled error', {
    name: err.name || 'Error',
    message: err.message,
    method: req.method,
    path: req.originalUrl.split('?')[0],
    ...(isDev && { stack: err.stack }),
  });

  res.status(500).json({
    success: false,
    error: isDev ? err.message || 'Internal server error' : 'Internal server error',
    ...(isDev && { stack: err.stack }),
  });
};

// ============================================================
// 404 Not Found Handler
// ============================================================

export const notFoundHandler = (
  _req: Request,
  res: Response
): void => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
};