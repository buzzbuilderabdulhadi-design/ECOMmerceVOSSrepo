const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedData<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface ServerFetchResult<T> {
  data: T | null;
  ok: boolean;
  notFound: boolean;
}

interface ApiPayload<T> {
  success?: boolean;
  data?: T;
  pagination?: PaginationMeta;
}

interface RawResponse<T> {
  status: number;
  payload: ApiPayload<T>;
}

const DEFAULT_TIMEOUT_MS = 5000;
const NETWORK_FAILURE: RawResponse<never> = { status: 0, payload: {} };

async function request<T>(
  path: string,
  revalidate: number
): Promise<RawResponse<T>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_BASE_URL}${path}`, {
        next: { revalidate },
        signal: controller.signal,
      });
      const payload = (await res.json().catch(() => ({}))) as ApiPayload<T>;
      return { status: res.status, payload };
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return NETWORK_FAILURE;
  }
}

/**
 * Server-side GET for endpoints that return a single `data` payload.
 * Returns null on any failure so server components can degrade gracefully
 * (matching the previous client-side behaviour where a failed fetch surfaced
 * an error/empty state rather than throwing during render).
 */
export async function serverGet<T>(
  path: string,
  revalidate = 60
): Promise<T | null> {
  const { status, payload } = await request<T>(path, revalidate);
  if (status < 200 || status >= 300) return null;
  return payload.data ?? null;
}

/**
 * Server-side GET for paginated list endpoints. Always returns pagination
 * metadata so the client island can render counts even for an empty page;
 * returns null only when the request itself failed.
 */
export async function serverGetPaginated<T>(
  path: string,
  revalidate = 60
): Promise<PaginatedData<T> | null> {
  const { status, payload } = await request<T[]>(path, revalidate);
  if (status < 200 || status >= 300) return null;
  return {
    data: Array.isArray(payload.data) ? payload.data : [],
    pagination: payload.pagination ?? {
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 1,
    },
  };
}

/**
 * Like serverGet but distinguishes a 404 (used for "not found" states) from
 * transient failures (used for retry surfaces) without throwing during render.
 */
export async function serverGetWithStatus<T>(
  path: string,
  revalidate = 60
): Promise<ServerFetchResult<T>> {
  const { status, payload } = await request<T>(path, revalidate);
  if (status >= 200 && status < 300) {
    return { data: payload.data ?? null, ok: true, notFound: false };
  }
  return { data: null, ok: false, notFound: status === 404 };
}

export { API_BASE_URL };