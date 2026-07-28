import { Response } from 'express';

// ============================================================
// Standard API Response Helpers
// ============================================================

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

interface ApiPaginatedResponse<T = unknown> extends ApiSuccessResponse<T> {
  pagination: PaginationMeta;
}

// ============================================================
// Send success response
// ============================================================

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };

  res.status(statusCode).json(response);
}

// ============================================================
// Send created response (201)
// ============================================================

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = 'Resource created successfully'
): void {
  sendSuccess(res, data, message, 201);
}

// ============================================================
// Send paginated response
// ============================================================

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: {
    page: number;
    limit: number;
    total: number;
  }
): void {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const response: ApiPaginatedResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };

  res.status(200).json(response);
}

// ============================================================
// Send no content response (204)
// ============================================================

export function sendNoContent(res: Response): void {
  res.status(204).send();
}

// ============================================================
// Send message-only response
// ============================================================

export function sendMessage(
  res: Response,
  message: string,
  statusCode: number = 200
): void {
  res.status(statusCode).json({
    success: true,
    message,
  });
}

