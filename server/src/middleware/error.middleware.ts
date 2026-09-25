import { Request, Response, NextFunction } from 'express';
import config from '../config';
import { ApiError } from '../utils/apiError';

// ============================================================
// Global Error Handler Middleware
// ============================================================

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log error in development
  if (config.env === 'development') {
    console.error('❌ Error:', err);
  }

  // Handle known ApiError
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
      ...(config.env === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle Prisma errors
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

    res.status(statusCode).json({
      success: false,
      error: message,
      code: prismaErr.code,
      ...(config.env === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle Prisma validation errors
  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      success: false,
      error: 'Invalid data provided.',
      ...(config.env === 'development' && {
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

  // Default 500 error
  res.status(500).json({
    success: false,
    error:
      config.env === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    ...(config.env === 'development' && { stack: err.stack }),
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

