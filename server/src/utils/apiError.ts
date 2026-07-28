// ============================================================
// API Error Class — Structured Error Handling
// ============================================================

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // ============================================================
  // Factory Methods for Common HTTP Errors
  // ============================================================

  static badRequest(message: string, code?: string): ApiError {
    return new ApiError(400, message, code || 'BAD_REQUEST');
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, 'CONFLICT');
  }

  static validationError(message: string): ApiError {
    return new ApiError(422, message, 'VALIDATION_ERROR');
  }

  static tooMany(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, message, 'TOO_MANY_REQUESTS');
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(500, message, 'INTERNAL_ERROR', false);
  }

  // ============================================================
  // Serialize error for API response
  // ============================================================

  toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
    };
  }
}

