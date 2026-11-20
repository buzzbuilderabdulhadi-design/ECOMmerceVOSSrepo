import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

// ============================================================
// Axios Instance Configuration
// ============================================================

import { API_BASE_PATH } from '@/lib/apiPaths';

// All browser API traffic stays on this site's origin. The Next.js route
// handler at /api/v1 forwards it server-side to the configured backend.
const API_BASE_URL = API_BASE_PATH;

export { API_BASE_URL };

const SESSION_STORAGE_KEY = 'zoya_session_id';
const AUTH_MARKER_COOKIE = 'voss_auth';
const CSRF_COOKIE = 'voss_csrf';

// Endpoints whose 401/403 is a business/auth error — NEVER an expired-session
// signal. Triggering the refresh queue for these re-submits the failed request
// after a rotation and burns a refresh-token rotation for nothing.
const NO_REFRESH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/password',
  '/auth/google',
];

export function shouldSkipRefresh(url: string): boolean {
  return NO_REFRESH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function hasAuthMarker(): boolean {
  return readCookie(AUTH_MARKER_COOKIE) === '1';
}

/**
 * A persistent, anonymous session identifier used to scope guest carts on the
 * server. It is stored in localStorage so a guest's cart survives page
 * reloads and is later merged into their account cart on login.
 */
export function getClientSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionId) {
    sessionId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `zg-session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Returns the existing guest session id WITHOUT creating one. Used to detect
 * whether a real guest session (and therefore a guest cart to merge) exists.
 */
export function peekClientSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export function removeClientSessionId(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  // Browser sessions live in HttpOnly cookies set by the API. Credentials must
  // be sent on both same-site and cross-site deployments.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Request Interceptor — Guest Session ID + CSRF token
// ============================================================

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const authenticated = hasAuthMarker();

      // Double-submit CSRF token for cookie-authenticated mutations.
      if (
        config.headers &&
        config.method &&
        !['get', 'head', 'options'].includes(config.method.toLowerCase())
      ) {
        const csrfToken = readCookie(CSRF_COOKIE);
        if (csrfToken) config.headers['x-csrf-token'] = csrfToken;
      }

      // Attach the guest session id so guest carts and the post-login merge
      // work. A new id is minted ONLY for unauthenticated cart/wishlist
      // traffic — never for authenticated requests.
      let sessionId: string | null = peekClientSessionId();
      if (
        !sessionId &&
        !authenticated &&
        config.url &&
        (config.url.startsWith('/cart') || config.url.startsWith('/wishlist'))
      ) {
        sessionId = getClientSessionId();
      }
      if (sessionId && config.headers) {
        config.headers['x-session-id'] = sessionId;
      }
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// ============================================================
// Response Interceptor — Handle Auth Errors & Cookie Refresh
// ============================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(null);
    }
  });
  failedQueue = [];
};

function legacyCleanup(): void {
  try {
    localStorage.removeItem('voss_token');
    localStorage.removeItem('voss_refresh_token');
    localStorage.removeItem('voss_user');
  } catch {
    // Ignore storage failures.
  }
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const failedUrl = originalRequest.url || '';
      if (shouldSkipRefresh(failedUrl)) {
        return Promise.reject(error);
      }

      // Only a browser that believes it is signed in should attempt a refresh.
      // Unauthenticated guest requests (e.g. wishlist) simply reject.
      if (!hasAuthMarker()) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosInstance(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const csrfToken = readCookie(CSRF_COOKIE);
        await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            withCredentials: true,
            headers: csrfToken ? { 'x-csrf-token': csrfToken } : undefined,
          }
        );

        processQueue(null);
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        legacyCleanup();

        if (typeof window !== 'undefined') {
          const path = window.location.pathname;
          if (!path.startsWith('/login') && !path.startsWith('/admin/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================
// Helper: Extract error message from API response
// ============================================================

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export default axiosInstance;
