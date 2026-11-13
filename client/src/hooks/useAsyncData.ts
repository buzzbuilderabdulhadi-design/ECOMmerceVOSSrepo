'use client';

import { useCallback, useEffect, useState } from 'react';

interface AsyncDataOptions<T> {
  fetcher: () => Promise<T>;
  onError?: (error: unknown) => void;
  /**
   * Caller-supplied cache key. The fetch re-runs when any of these change,
   * independent of the `fetcher`/`onError` identities, so an inline arrow
   * passed on every render does not trigger a refetch.
   */
  deps?: unknown[];
}

export function useAsyncData<T>({ fetcher, onError, deps = [] }: AsyncDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetcher());
    } catch (err) {
      setError(err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onError]);

  useEffect(() => {
    // Deferred to a microtask so the initial fetch does not synchronously
    // setState during the effect body (same pattern as the page-level loaders).
    void Promise.resolve().then(reload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps]);

  return { data, loading, error, reload };
}
