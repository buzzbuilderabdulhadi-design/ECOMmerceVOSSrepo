import { API_BASE_URL } from '@/services/axios';

// ============================================================
// Google OAuth — browser side of the authorization-code flow.
//
// The client never touches the Google client secret. It only:
//   1. generates a `state` nonce (stored locally for CSRF verification),
//   2. bounces the browser to our server's GET /auth/google (which forwards
//      to accounts.google.com), and
//   3. receives the code back on /auth/google/callback, verifies the echoed
//      state, and POSTs the code to the server to be exchanged.
// ============================================================

const GOOGLE_STATE_KEY = 'zoya_google_state';

function generateState(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `zg-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Creates and persists a CSRF nonce for the Google redirect round-trip. */
export function createGoogleState(): string {
  const state = generateState();
  try {
    window.localStorage.setItem(GOOGLE_STATE_KEY, state);
  } catch {
    // Storage unavailable — continue; the callback will fail closed.
  }
  return state;
}

/**
 * Verifies the state echoed back by Google matches the one we sent, then
 * consumes it. Returns false on mismatch/missing so the callback can fail
 * closed against state-injection / login-CSRF.
 */
export function consumeGoogleState(provided: string): boolean {
  let expected: string | null = null;
  try {
    expected = window.localStorage.getItem(GOOGLE_STATE_KEY);
  } catch {
    expected = null;
  }
  const ok = Boolean(expected) && expected === provided;
  try {
    window.localStorage.removeItem(GOOGLE_STATE_KEY);
  } catch {
    // Ignore storage failures.
  }
  return ok;
}

/** Begins the "Continue with Google" redirect to the server OAuth endpoint. */
export function startGoogleSignIn(): void {
  const state = createGoogleState();
  const params = new URLSearchParams({ state });
  window.location.href = `${API_BASE_URL}/auth/google?${params.toString()}`;
}