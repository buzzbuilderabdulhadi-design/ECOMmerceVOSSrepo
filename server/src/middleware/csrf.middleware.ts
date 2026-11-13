import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import config from '../config';
import {
  ACCESS_COOKIE,
  CSRF_COOKIE,
  REFRESH_COOKIE,
  isCookieAuth,
} from '../utils/authCookies';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

// Provider webhooks authenticate with signatures instead of cookies; health is
// read-only and must not be affected by browser-origin policy.
const EXEMPT_PREFIXES = [
  '/api/health',
  '/api/v1/webhooks/',
];

// Auth entry points cannot require the double-submit token because the browser
// does not have one yet. When a browser supplies Origin/Referer it is still
// validated against the allowlist; missing headers are tolerated so CLI,
// mobile and server-to-server clients can authenticate.
const AUTH_ENTRY_PREFIXES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/google',
];

function pathMatches(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path === prefix || path.startsWith(prefix));
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function normalizeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host}`.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Browsers send Origin on state-changing requests; some proxies and older
 * clients only send Referer. Either is enough to establish the request origin.
 */
function requestOrigin(req: Request): string | null {
  const origin = req.header('origin');
  if (origin) return normalizeOrigin(origin);
  const referer = req.header('referer');
  if (referer) return normalizeOrigin(referer);
  return null;
}

function hasBearerAuth(req: Request): boolean {
  const authorization = req.header('authorization');
  return typeof authorization === 'string' && authorization.startsWith('Bearer ');
}

function rejectOrigin(res: Response, code: string, error: string): void {
  res.status(403).json({ success: false, error, code });
}

/**
 * CSRF protection for cookie-authenticated state-changing requests.
 *
 * Two independent layers:
 *  1. Origin/Referer must match the configured browser allowlist. This blocks
 *     cross-site form/fetch attacks even when a double-submit token leaks or a
 *     proxy strips it.
 *  2. Cookie-authenticated mutations must echo the non-HttpOnly double-submit
 *     token in `X-CSRF-Token`.
 *
 * Bearer-token requests are not cookie-authenticated and are therefore not
 * vulnerable to CSRF. They may omit Origin; if they send one it must still be
 * an allowed origin.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  if (SAFE_METHODS.has(req.method)) {
    next();
    return;
  }

  const path = req.originalUrl.split('?')[0];
  if (pathMatches(path, EXEMPT_PREFIXES)) {
    next();
    return;
  }

  const authEntry = pathMatches(path, AUTH_ENTRY_PREFIXES);
  const cookieAuth =
    isCookieAuth(req) || Boolean(req.cookies?.[REFRESH_COOKIE]);
  const bearerAuth = hasBearerAuth(req);
  const origin = requestOrigin(req);
  // Anonymous public endpoints have no ambient credentials to abuse, so an
  // arbitrary Origin must not turn them into a 403 (non-browser callers may
  // send one). Origin checks apply whenever cookies, a bearer credential or an
  // auth entry point is involved.
  const originCheckApplies = cookieAuth || bearerAuth || authEntry;

  if (
    originCheckApplies &&
    origin &&
    !config.cors.allowedOrigins.includes(origin)
  ) {
    rejectOrigin(
      res,
      'CSRF_ORIGIN_INVALID',
      'Request origin is not allowed. Please refresh the page and try again.'
    );
    return;
  }

  // Cookie-backed mutations must come from a browser context we can identify.
  // Auth entry points are the exception for non-browser login/register flows.
  if (!origin && cookieAuth && !bearerAuth && !authEntry) {
    rejectOrigin(
      res,
      'CSRF_ORIGIN_MISSING',
      'Missing Origin or Referer header. Please refresh the page and try again.'
    );
    return;
  }

  if (authEntry) {
    next();
    return;
  }

  if (!isCookieAuth(req)) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE];
  const headerToken = req.header('x-csrf-token');

  if (
    !req.cookies?.[ACCESS_COOKIE] ||
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !constantTimeEqual(cookieToken, headerToken)
  ) {
    res.status(403).json({
      success: false,
      error: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID',
    });
    return;
  }

  next();
}
