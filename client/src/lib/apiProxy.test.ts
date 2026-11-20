// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildUpstreamUrl,
  forwardApiRequest,
  forwardableRequestHeaders,
  proxyError,
  proxyResponseHeaders,
  sanitizeSegments,
} from './apiProxy.server';
import { getApiProxyTarget, resetApiProxyTarget } from './apiProxyTarget.server';

const originalTarget = process.env.API_PROXY_TARGET;

beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test');
  process.env.API_PROXY_TARGET = 'https://api.example.test';
  resetApiProxyTarget();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  if (originalTarget === undefined) delete process.env.API_PROXY_TARGET;
  else process.env.API_PROXY_TARGET = originalTarget;
  resetApiProxyTarget();
});

describe('getApiProxyTarget', () => {
  it('uses the server-only variable and strips trailing slashes', () => {
    process.env.API_PROXY_TARGET = 'https://api.example.test/';
    resetApiProxyTarget();
    expect(getApiProxyTarget()).toBe('https://api.example.test');
  });

  it('requires an explicit target in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    delete process.env.API_PROXY_TARGET;
    resetApiProxyTarget();
    expect(() => getApiProxyTarget()).toThrow('API_PROXY_TARGET must be set in production');
  });

  it('rejects targets with credentials, queries or unsupported schemes', () => {
    for (const invalid of [
      'ftp://api.example.test',
      'https://user:pass@api.example.test',
      'https://api.example.test?x=1',
      'not-a-url',
    ]) {
      process.env.API_PROXY_TARGET = invalid;
      resetApiProxyTarget();
      expect(() => getApiProxyTarget()).toThrow();
    }
  });
});

describe('forwardableRequestHeaders', () => {
  it('keeps session and CSRF headers and drops hop-by-hop/platform headers', () => {
    const input = new Headers({
      cookie: 'voss_access_token=abc; voss_csrf=xyz',
      origin: 'https://voss-two.vercel.app',
      referer: 'https://voss-two.vercel.app/checkout',
      authorization: 'Bearer token',
      'x-csrf-token': 'xyz',
      'x-session-id': 'guest-1',
      'content-type': 'application/json',
      host: 'voss-two.vercel.app',
      connection: 'keep-alive',
      'content-length': '10',
      'x-forwarded-for': '1.2.3.4',
      'x-vercel-deployment-url': 'secret',
    });
    const result = forwardableRequestHeaders(input);
    expect(result.get('cookie')).toBe('voss_access_token=abc; voss_csrf=xyz');
    expect(result.get('origin')).toBe('https://voss-two.vercel.app');
    expect(result.get('referer')).toBe('https://voss-two.vercel.app/checkout');
    expect(result.get('authorization')).toBe('Bearer token');
    expect(result.get('x-csrf-token')).toBe('xyz');
    expect(result.get('x-session-id')).toBe('guest-1');
    expect(result.get('content-type')).toBe('application/json');
    expect(result.has('host')).toBe(false);
    expect(result.has('connection')).toBe(false);
    expect(result.has('content-length')).toBe(false);
    expect(result.has('x-forwarded-for')).toBe(false);
    expect(result.has('x-vercel-deployment-url')).toBe(false);
  });
});

describe('proxyResponseHeaders', () => {
  it('preserves every Set-Cookie and never allows caching', () => {
    const upstream = new Headers();
    upstream.append('set-cookie', 'voss_access_token=a; HttpOnly; Secure; Path=/');
    upstream.append('set-cookie', 'voss_refresh_token=b; HttpOnly; Secure; Path=/');
    upstream.append('set-cookie', 'voss_csrf=c; Secure; Path=/');
    upstream.set('content-type', 'application/json');
    upstream.set('content-length', '123');
    upstream.set('content-encoding', 'gzip');
    upstream.set('location', 'https://api.example.test/api/v1/cart');

    const result = proxyResponseHeaders(upstream, 'https://api.example.test');
    expect(result.getSetCookie()).toEqual([
      'voss_access_token=a; HttpOnly; Secure; Path=/',
      'voss_refresh_token=b; HttpOnly; Secure; Path=/',
      'voss_csrf=c; Secure; Path=/',
    ]);
    expect(result.get('content-type')).toBe('application/json');
    expect(result.has('content-length')).toBe(false);
    expect(result.has('content-encoding')).toBe(false);
    expect(result.get('location')).toBe('/api/v1/cart');
    expect(result.get('cache-control')).toContain('no-store');
    expect(result.get('vary')).toContain('Cookie');
  });

  it('leaves external redirect targets untouched', () => {
    const upstream = new Headers({ location: 'https://accounts.google.com/o/oauth2/auth' });
    const result = proxyResponseHeaders(upstream, 'https://api.example.test');
    expect(result.get('location')).toBe('https://accounts.google.com/o/oauth2/auth');
  });
});

describe('sanitizeSegments and buildUpstreamUrl', () => {
  it('re-encodes valid segments and preserves the query string', () => {
    expect(sanitizeSegments(['products', 'blue jacket'])).toEqual(['products', 'blue%20jacket']);
    expect(
      buildUpstreamUrl('https://api.example.test', '/api/v1', ['products', 'abc'], '?limit=3')
    ).toBe('https://api.example.test/api/v1/products/abc?limit=3');
  });

  it('rejects missing, traversal and separator segments', () => {
    expect(sanitizeSegments([])).toBeNull();
    expect(sanitizeSegments(['..'])).toBeNull();
    expect(sanitizeSegments(['products', '.'])).toBeNull();
    expect(sanitizeSegments(['%2e%2e'])).toBeNull();
    expect(sanitizeSegments(['a%2Fb'])).toBeNull();
    expect(sanitizeSegments(['a\\b'])).toBeNull();
  });
});

describe('forwardApiRequest', () => {
  it('forwards method, body, credentials and query to the backend', async () => {
    const upstream = new Response(JSON.stringify({ success: true, data: { ok: true } }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
    upstream.headers.append('set-cookie', 'voss_access_token=a; HttpOnly');
    upstream.headers.append('set-cookie', 'voss_refresh_token=b; HttpOnly');
    const fetchMock = vi.fn().mockResolvedValue(upstream);
    vi.stubGlobal('fetch', fetchMock);

    const request = new Request(
      'https://voss-two.vercel.app/api/v1/cart?x=1',
      {
        method: 'POST',
        headers: {
          cookie: 'voss_csrf=abc',
          origin: 'https://voss-two.vercel.app',
          'x-csrf-token': 'abc',
          'x-session-id': 'guest-1',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ productId: 'p1' }),
      }
    );

    const response = await forwardApiRequest(request, ['cart'], '/api/v1');
    expect(response.status).toBe(201);
    expect(response.headers.getSetCookie()).toHaveLength(2);
    expect(response.headers.get('cache-control')).toContain('no-store');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.test/api/v1/cart?x=1');
    expect(init.method).toBe('POST');
    expect((init.headers as Headers).get('cookie')).toBe('voss_csrf=abc');
    expect((init.headers as Headers).get('origin')).toBe('https://voss-two.vercel.app');
    expect((init.headers as Headers).get('x-csrf-token')).toBe('abc');
    expect((init.headers as Headers).get('x-session-id')).toBe('guest-1');
  });

  it('returns a safe 502 when the backend is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED api.example.test')));
    const request = new Request('https://voss-two.vercel.app/api/v1/products');
    const response = await forwardApiRequest(request, ['products'], '/api/v1');
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.error).toBe('API is temporarily unavailable');
    expect(JSON.stringify(body)).not.toContain('api.example.test');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('rejects traversal paths before making an upstream request', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const request = new Request('https://voss-two.vercel.app/api/v1/products');
    const response = await forwardApiRequest(request, ['..'], '/api/v1');
    expect(response.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns a safe response for a generic error', () => {
    const response = proxyError(500, 'Internal error');
    expect(response.status).toBe(500);
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
});
