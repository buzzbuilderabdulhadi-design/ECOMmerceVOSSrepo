import { API_BASE_PATH, UPLOADS_BASE_PATH } from './apiPaths';
import { getApiProxyTarget } from './apiProxyTarget.server';

export const PROXY_TIMEOUT_MS = 20_000;

const EXCLUDED_REQUEST_HEADERS = new Set([
  'host',
  'connection',
  'content-length',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'te',
  'trailer',
  'proxy-authorization',
  'proxy-authenticate',
  'expect',
]);

const EXCLUDED_RESPONSE_HEADERS = new Set([
  'connection',
  'content-length',
  'content-encoding',
  'transfer-encoding',
  'keep-alive',
  'upgrade',
  'te',
  'trailer',
  'proxy-authenticate',
  'proxy-authorization',
  'set-cookie',
  'cache-control',
  'pragma',
  'expires',
  'etag',
  'last-modified',
]);

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

/** Strip hop-by-hop and platform-internal headers from an inbound request. */
export function forwardableRequestHeaders(source: Headers): Headers {
  const result = new Headers();
  source.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (EXCLUDED_REQUEST_HEADERS.has(lower)) return;
    if (lower.startsWith('x-forwarded-')) return;
    if (lower.startsWith('x-vercel-') || lower === 'vercel') return;
    if (lower.startsWith('cf-')) return;
    result.set(name, value);
  });
  return result;
}

/**
 * Copy upstream response headers, preserving every Set-Cookie value separately
 * so refresh-token rotation and all four session cookies survive the proxy.
 */
export function proxyResponseHeaders(source: Headers, targetOrigin: string): Headers {
  const result = new Headers();
  source.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (EXCLUDED_RESPONSE_HEADERS.has(lower)) return;
    result.set(name, value);
  });

  const cookies = (source as HeadersWithSetCookie).getSetCookie?.() ?? [];
  for (const cookie of cookies) {
    if (cookie) result.append('set-cookie', cookie);
  }

  const location = result.get('location');
  if (location) {
    try {
      const redirect = new URL(location, targetOrigin);
      if (redirect.origin === targetOrigin) {
        result.set('location', `${redirect.pathname}${redirect.search}${redirect.hash}`);
      }
    } catch {
      result.delete('location');
    }
  }

  result.set('cache-control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  result.set('pragma', 'no-cache');
  result.set('vary', 'Cookie, Origin, Referer, Authorization, x-csrf-token, x-session-id');
  return result;
}

/** Reject traversal attempts and re-encode path segments before forwarding. */
export function sanitizeSegments(segments: string[] | undefined): string[] | null {
  if (!segments || segments.length === 0) return null;
  const safe: string[] = [];
  for (const raw of segments) {
    let segment = raw;
    try {
      segment = decodeURIComponent(raw);
    } catch {
      return null;
    }
    if (
      !segment ||
      segment === '.' ||
      segment === '..' ||
      segment.includes('/') ||
      segment.includes('\\') ||
      segment.includes('\0')
    ) {
      return null;
    }
    safe.push(encodeURIComponent(segment));
  }
  return safe;
}

export function proxyError(status: number, error: string): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      pragma: 'no-cache',
    },
  });
}

export function buildUpstreamUrl(
  target: string,
  prefix: string,
  segments: string[],
  search: string
): string {
  const base = `${target}${prefix}/${segments.join('/')}`;
  return search ? `${base}${search}` : base;
}

/**
 * Forwards one same-origin API request to the configured backend. The backend
 * host is always read from a server-only environment variable; no part of the
 * incoming URL can choose it, so this cannot be used as an open proxy.
 */
export async function forwardApiRequest(
  request: Request,
  segments: string[] | undefined,
  prefix: string = API_BASE_PATH
): Promise<Response> {
  const safeSegments = sanitizeSegments(segments);
  if (!safeSegments) return proxyError(400, 'Invalid API path');

  let target: string;
  try {
    target = getApiProxyTarget();
  } catch {
    return proxyError(503, 'API is not configured');
  }

  let targetOrigin: string;
  let upstreamUrl: string;
  try {
    targetOrigin = new URL(target).origin;
    upstreamUrl = buildUpstreamUrl(target, prefix, safeSegments, new URL(request.url).search);
  } catch {
    return proxyError(503, 'API is not configured');
  }

  const headers = forwardableRequestHeaders(request.headers);
  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS';

  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
  };
  if (hasBody && request.body) {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    const upstream = await fetch(upstreamUrl, init);
    const body = upstream.status === 204 || upstream.status === 304 ? null : upstream.body;
    return new Response(body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: proxyResponseHeaders(upstream.headers, targetOrigin),
    });
  } catch {
    return proxyError(502, 'API is temporarily unavailable');
  }
}

export const UPLOADS_PREFIX = UPLOADS_BASE_PATH;
