import type { User } from '@/types';

// ============================================================
// Client session store — synchronous, SSR-safe session helpers.
//
// These helpers read/write a locally persisted session so the
// provider layer can recognize a valid session without leaning
// on browser-only APIs during server rendering (they no-op
// safely when `window` is unavailable).
// ============================================================

const TOKEN_KEY = 'voss_token';
const USER_KEY = 'voss_user';

interface StoredSession {
  user: User;
  token: string;
}

let cachedSession: StoredSession | null | undefined;

/**
 * Returns the locally persisted session, or null when none exists.
 * On the server this always returns null; the cache is only filled
 * from real localStorage on the client.
 */
export function getStoredSession(): StoredSession | null {
  if (cachedSession !== undefined) return cachedSession;

  if (typeof window === 'undefined') {
    cachedSession = null;
    return cachedSession;
  }

  try {
    const token = window.localStorage.getItem(TOKEN_KEY);
    const userStr = window.localStorage.getItem(USER_KEY);

    if (token && userStr) {
      cachedSession = { token, user: JSON.parse(userStr) as User };
      return cachedSession;
    }
  } catch {
    // Corrupt or unavailable storage — treat as logged out.
  }

  cachedSession = null;
  return cachedSession;
}

/** Persists the session token/user to localStorage and caches it. */
export function saveStoredSession(user: User, token: string): void {
  cachedSession = { user, token };
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage failures (e.g. private mode).
  }
}

/** Removes the persisted session and invalidates the cache. */
export function clearStoredSession(): void {
  cachedSession = null;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
  } catch {
    // Ignore storage failures.
  }
}