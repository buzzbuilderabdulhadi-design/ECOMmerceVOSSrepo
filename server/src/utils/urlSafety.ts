// ============================================================
// URL safety helpers
//
// Customer-supplied redirect URLs (PayPal return/cancel) must resolve to an
// origin this deployment owns. Without this check, a hosted provider could be
// asked to bounce a customer to an attacker-controlled site after payment.
// ============================================================

/**
 * True when `value` is a syntactically valid http(s) URL whose origin exactly
 * matches one of the allowed origins (scheme + host + port, case-insensitive).
 */
export function isAllowedOrigin(value: string, allowedOrigins: string[]): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const origin = `${url.protocol}//${url.host}`.toLowerCase();
  return allowedOrigins.map((allowed) => allowed.toLowerCase()).includes(origin);
}
