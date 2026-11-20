import crypto from 'crypto';
import { CookieOptions, Response } from 'express';
import config from '../config';

export const ACCESS_COOKIE = 'voss_access_token';
export const REFRESH_COOKIE = 'voss_refresh_token';
export const CSRF_COOKIE = 'voss_csrf';
export const AUTH_MARKER_COOKIE = 'voss_auth';
export const OAUTH_STATE_COOKIE = 'voss_oauth_state';

const isProduction = config.env === 'production';

const baseCookie: CookieOptions = {
  path: '/',
  sameSite: config.cookie.sameSite,
  secure: config.cookie.secure,
  ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
};

function maxAgeFromToken(token: string): number {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      exp?: number;
    };
    if (!payload.exp) return 0;
    return Math.max(0, payload.exp * 1000 - Date.now());
  } catch {
    return 0;
  }
}

function createCsrfToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

const OAUTH_STATE_MAX_AGE = 10 * 60 * 1000;

export function setOAuthStateCookie(res: Response, state: string): void {
  res.cookie(OAUTH_STATE_COOKIE, state, {
    ...baseCookie,
    httpOnly: true,
    maxAge: OAUTH_STATE_MAX_AGE,
  });
}

export function clearOAuthStateCookie(res: Response): void {
  res.clearCookie(OAUTH_STATE_COOKIE, baseCookie);
}

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): string {
  const csrfToken = createCsrfToken();

  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookie,
    httpOnly: true,
    maxAge: maxAgeFromToken(accessToken),
  });

  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookie,
    httpOnly: true,
    maxAge: maxAgeFromToken(refreshToken),
  });

  // Double-submit CSRF token. It must be readable by the SPA so axios can echo
  // it in the X-CSRF-Token header, but it is useless without the HttpOnly
  // session cookies themselves.
  res.cookie(CSRF_COOKIE, csrfToken, {
    ...baseCookie,
    httpOnly: false,
    maxAge: maxAgeFromToken(refreshToken),
  });

  // Non-sensitive marker used only to scope guest cart requests and to let the
  // Next.js proxy distinguish a signed-in browser without reading the
  // HttpOnly access token.
  res.cookie(AUTH_MARKER_COOKIE, '1', {
    ...baseCookie,
    httpOnly: false,
    maxAge: maxAgeFromToken(refreshToken),
  });

  return csrfToken;
}

export function clearAuthCookies(res: Response): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE, AUTH_MARKER_COOKIE]) {
    res.clearCookie(name, baseCookie);
  }
}

/**
 * Ensures a CSRF cookie exists for an already-authenticated browser (for
 * example after the access-token cookie survived but the CSRF cookie was
 * pruned). Returns the token so callers can expose it if needed.
 */
export function ensureCsrfCookie(req: { cookies?: Record<string, string> }, res: Response): string {
  const refreshMaxAge = maxAgeFromToken(req.cookies?.[REFRESH_COOKIE] || '');
  // Keep the observable marker in step with the HttpOnly session so the
  // storefront can scope guest cart requests correctly after a reload.
  res.cookie(AUTH_MARKER_COOKIE, '1', {
    ...baseCookie,
    httpOnly: false,
    maxAge: refreshMaxAge || 60 * 60 * 1000,
  });

  const existing = req.cookies?.[CSRF_COOKIE];
  if (existing) return existing;
  const token = createCsrfToken();
  res.cookie(CSRF_COOKIE, token, {
    ...baseCookie,
    httpOnly: false,
    maxAge: refreshMaxAge || 60 * 60 * 1000,
  });
  return token;
}

export function isCookieAuth(req: {
  headers: { authorization?: string };
  cookies?: Record<string, string>;
}): boolean {
  return (
    (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) &&
    Boolean(req.cookies?.[ACCESS_COOKIE])
  );
}

export { isProduction };
