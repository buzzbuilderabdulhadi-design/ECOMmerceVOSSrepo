// ============================================================
// Legacy client-session cleanup.
//
// Authentication now lives entirely in HttpOnly cookies set by the API.
// This helper removes tokens written by older builds so an upgrade cannot
// leave a usable long-lived JWT behind in localStorage.
// ============================================================

const LEGACY_KEYS = ['voss_token', 'voss_refresh_token', 'voss_user'];

export function clearLegacySession(): void {
  if (typeof window === 'undefined') return;
  try {
    for (const key of LEGACY_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures (e.g. private mode).
  }
}
