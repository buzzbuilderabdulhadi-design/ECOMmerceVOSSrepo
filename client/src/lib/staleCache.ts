// Minimal stale-while-revalidate cache for admin panel GETs.
//
// Navigating between admin pages re-runs fetch-on-mount for every list, so
// every section flashes its loading skeleton even when you just left it. This
// cache returns the previously fetched value for the same request immediately
// (and re-fetches in the background), so revisits render instantly. Mutations
// (adminCacheClear) drop all entries so the next visit always shows fresh data.
const TTL_MS = 30_000;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function adminCacheGet<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return Promise.resolve(hit.value as T);
  }
  return fetcher().then((value) => {
    store.set(key, { value, expiresAt: Date.now() + TTL_MS });
    return value;
  });
}

export function adminCacheClear(): void {
  store.clear();
}