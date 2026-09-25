import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

// ============================================================
// Axios Instance Configuration
// ============================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export { API_BASE_URL };

const SESSION_STORAGE_KEY = 'zoya_session_id';

// Endpoints whose 401/403 is a business/auth error — NEVER an expired-session
// signal. Triggering the refresh queue for these re-submits the failed request
// with a rotated token (e.g. a wrong-password /auth/login while an old session
// still exists) and burns a refresh-token rotation for nothing.
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
 * whether a real guest session (and therefore a guest cart to merge) exists —
 * the getter above must not be used for that check because it generates a new
 * id on the spot, which made the post-login cart merge fire on EVERY
 * authenticated page load instead of only right after a guest session.
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
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================================
// Request Interceptor — Attach JWT Token + Guest Session ID
// ============================================================

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Check if running in browser (Next.js SSR safety)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('voss_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Attach the guest session id so guest carts and the post-login merge
      // work. A new id is minted ONLY for unauthenticated cart/wishlist
      // traffic — minting here on every request was the bug: after the merge
      // removed the id, the very next authenticated GET /cart re-created it,
      // so a /cart/merge storm fired on every page load. Authenticated
      // requests never mint.
      let sessionId: string | null = null;
      const existingSession: string | null = peekClientSessionId();
      if (existingSession) {
        sessionId = existingSession;
      } else if (!token && config.url && (config.url.startsWith('/cart') || config.url.startsWith('/wishlist'))) {
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
// Response Interceptor — Handle Auth Errors & Token Refresh
// ============================================================

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // A 401 returned by an auth endpoint (login/register/refresh/…) is a
      // business failure — e.g. "Invalid email or password" — never an
      // expired-session signal. Do not enter the refresh/retry queue.
      const failedUrl = originalRequest.url || '';
      if (shouldSkipRefresh(failedUrl)) {
        return Promise.reject(error);
      }

      // A 401 on a request that never sent an access token is simply an
      // unauthenticated request (e.g. the wishlist fetch for a guest).
      // Do NOT attempt a token refresh or force-navigate to /login here —
      // that redirect caused an endless /login reload loop because global
      // providers (wishlist) hit protected endpoints on every page load.
      // Let the caller handle the rejection instead.
      const sentToken = originalRequest.headers?.Authorization;
      if (!sentToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('voss_refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refreshToken }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('voss_refresh_token', newRefreshToken);
        localStorage.setItem('voss_token', accessToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Clear auth data
        localStorage.removeItem('voss_token');
        localStorage.removeItem('voss_refresh_token');
        localStorage.removeItem('voss_user');
        document.cookie = 'voss_access_token=; path=/; max-age=0';

        // Redirect to login if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
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

