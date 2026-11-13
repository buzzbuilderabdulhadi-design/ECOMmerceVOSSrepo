import { Request, Response, NextFunction } from 'express';

// ============================================================
// Request shape guards — cheap, server-side limits that stop
// trivial resource-exhaustion before any handler runs:
//   * absurdly long URLs (414)
//   * query strings with too many parameters (400)
//   * oversized individual query values (400) — these otherwise turn
//     into huge cache keys, regex-ish `contains` filters and log noise
//
// Limits are far above anything a legitimate shopper or admin page sends.
// ============================================================

const MAX_URL_LENGTH = 2048;
const MAX_QUERY_PARAMS = 40;
const MAX_QUERY_VALUE_LENGTH = 300;

export function requestGuards(req: Request, res: Response, next: NextFunction): void {
  if (req.originalUrl.length > MAX_URL_LENGTH) {
    res.status(414).json({
      success: false,
      error: 'Request URL is too long.',
      code: 'URI_TOO_LONG',
    });
    return;
  }

  const entries = Object.entries(req.query as Record<string, unknown>);
  if (entries.length > MAX_QUERY_PARAMS) {
    res.status(400).json({
      success: false,
      error: 'Too many query parameters.',
      code: 'BAD_REQUEST',
    });
    return;
  }

  for (const [, value] of entries) {
    const values = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (typeof item === 'string' && item.length > MAX_QUERY_VALUE_LENGTH) {
        res.status(400).json({
          success: false,
          error: 'A query parameter is too long.',
          code: 'BAD_REQUEST',
        });
        return;
      }
    }
  }

  next();
}

// ============================================================
// Cache control for sensitive API responses.
//
// Account, cart, checkout, order and admin payloads are per-user and must
// never land in a shared cache or the browser's back/forward cache.
// Public catalog reads (products, categories) stay cacheable.
// ============================================================

const SENSITIVE_PREFIXES = [
  '/api/v1/auth',
  '/api/v1/cart',
  '/api/v1/wishlist',
  '/api/v1/orders',
  '/api/v1/checkout',
  '/api/v1/users',
  '/api/v1/addresses',
  '/api/v1/admin',
  '/api/v1/contact',
  '/api/v1/reviews',
  '/api/v1/questions',
  '/api/v1/coupons',
];

export function sensitiveNoStore(req: Request, res: Response, next: NextFunction): void {
  const path = req.originalUrl.split('?')[0];
  if (SENSITIVE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Pragma', 'no-cache');
  }
  next();
}
