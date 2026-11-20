const DEV_FALLBACK_TARGET = 'http://localhost:5000';

let cachedTarget: string | null = null;

/**
 * Resolve the backend origin used by the same-origin API proxy and by server
 * components. This value is read only from server-side code: it must never be
 * prefixed with NEXT_PUBLIC_ or imported into a client component.
 */
export function getApiProxyTarget(): string {
  if (cachedTarget) return cachedTarget;

  const configured = (process.env.API_PROXY_TARGET || '').trim();
  if (!configured && process.env.NODE_ENV === 'production') {
    throw new Error('API_PROXY_TARGET must be set in production');
  }
  const raw = configured || DEV_FALLBACK_TARGET;
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error('API_PROXY_TARGET must be an absolute http(s) URL');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('API_PROXY_TARGET must use the http or https scheme');
  }
  if (parsed.username || parsed.password) {
    throw new Error('API_PROXY_TARGET must not contain credentials');
  }
  if (parsed.search || parsed.hash) {
    throw new Error('API_PROXY_TARGET must not contain a query string or fragment');
  }

  const pathname = parsed.pathname.replace(/\/+$/, '');
  cachedTarget = `${parsed.protocol}//${parsed.host}${pathname}`;
  return cachedTarget;
}

/** Clear the cached target. Intended for tests and local configuration changes. */
export function resetApiProxyTarget(): void {
  cachedTarget = null;
}
