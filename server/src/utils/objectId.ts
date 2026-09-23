import { ApiError } from '../utils/apiError';

// ============================================================
// MongoDB ObjectId validation.
// ============================================================

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(value: string): boolean {
  return typeof value === 'string' && OBJECT_ID_RE.test(value);
}

/** Throw a controlled 400 immediately (used by route guards). */
export function assertObjectId(value: string, label = 'id'): void {
  if (!isValidObjectId(value)) {
    throw ApiError.badRequest(`Invalid ${label} format.`);
  }
}