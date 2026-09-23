// ============================================================
// Pagination helpers — parse & clamp admin list query params so a
// malformed request can never cause an unbounded or huge query.
// ============================================================

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/**
 * Parse `page` and `limit` from query params. Non-numeric, zero, or negative
 * values fall back to defaults. `limit` is clamped to MAX_LIMIT.
 */
export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): Pagination {
  let page = typeof query.page === 'string' ? parseInt(query.page, 10) : NaN;
  let limit = typeof query.limit === 'string' ? parseInt(query.limit, 10) : NaN;

  if (!Number.isFinite(page) || page < 1) page = 1;
  if (!Number.isFinite(limit) || limit < 1) limit = DEFAULT_LIMIT;
  limit = Math.min(limit, MAX_LIMIT);

  return { page, limit, skip: (page - 1) * limit };
}