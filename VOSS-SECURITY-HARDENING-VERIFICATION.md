# VOSS — SECURITY HARDENING + RUNTIME SMOKE TEST: VERIFICATION REPORT

> **Date:** November 13, 2026
> **Scope:** End-to-end hardening pass over the VOSS / ZOYA GOODS API and Next.js client — HttpOnly cookie sessions, CSRF, rate limiting, per-account login throttle, IDOR closure, request guards, CSP.
> **Method:** Runtime smoke test against a locally booted server (`http://localhost:5000`) on November 9, 2026, plus TypeScript compilation checks and a production-config/cookie verification pass.

---

## SUMMARY

| Area | Status | Primary Files |
|------|--------|---------------|
| HttpOnly cookie sessions (access/refresh/csrf/marker) | ✅ DONE | `server/src/utils/authCookies.ts`, `server/src/controllers/auth.controller.ts` |
| Refresh-token rotation + reuse detection | ✅ DONE | `server/src/services/auth.service.ts` |
| CSRF double-submit + Origin/Referer allowlist | ✅ DONE | `server/src/middleware/csrf.middleware.ts` |
| Route-scoped rate limiting (Redis-backed, fail-closed in prod) | ✅ DONE | `server/src/middleware/rateLimit.middleware.ts`, `server/src/config/redis.ts` |
| Per-account failed-login throttle | ✅ DONE | `server/src/utils/loginThrottle.ts` |
| Request guards (URL length / query count / query value) | ✅ DONE | `server/src/middleware/requestGuards.ts` |
| IDOR closure — addresses / wishlist / cart / orders | ✅ DONE | `server/src/controllers/*.ts`, route files |
| Client cookie-auth migration (no tokens in localStorage) | ✅ DONE | `client/src/services/axios.ts`, `client/src/lib/session.ts`, `client/src/proxy.ts`, `client/src/context/AuthContext.tsx` |
| Content Security Policy | ✅ DONE | `client/next.config.ts` |
| Startup ordering (DB → config → Redis → app) | ✅ DONE | `server/src/bootstrap.ts` |
| Credential-artifact hygiene | ✅ DONE | `.gitignore`, `browser-tests/lib/auth.mjs` |

**Result: hardening complete. Runtime smoke test: 88/88 checks pass.**

**Build checks:** Server `npx tsc --noEmit` ✅ | Client `npx tsc --noEmit` ✅ — zero TypeScript errors.

---

## SMOKE TEST RESULTS

- **Run:** `2026-11-09T07:08:19Z`, base `http://localhost:5000`
- **Total:** 88 | **Passed:** 88 | **Failed:** 0
- **Script:** `smoke.js` (throwaway users `smoke.a.*` / `smoke.b.*`)

| Group | Coverage | Result |
|-------|----------|--------|
| `SYS` | Health/DB connectivity, Helmet deny-by-default CSP + `frame-ancestors 'none'` | ✅ |
| `AUTH` | Unauthenticated `/auth/me`, `/orders`, `/wishlist`, `/addresses`, admin all 401; bad password 401 with **0 cookies**; login body contains **no** access/refresh token | ✅ |
| `COOK` | All four cookies issued; access/refresh HttpOnly + `SameSite=Lax` + `Path=/`; csrf/marker readable; `Secure` off in dev (on in prod) | ✅ |
| `REF` | Refresh via HttpOnly cookie; **rotation** of both tokens; rotated cookie authenticates; **replayed rotated token rejected**; reuse detection fails closed | ✅ |
| `TOK` | Expired token → `TOKEN_EXPIRED`; wrong-secret token rejected (cannot forge ADMIN); malformed bearer rejected; bearer auth still works without cookies | ✅ |
| `REG` | A & B register as distinct accounts | ✅ |
| `BASE` | Cookie session authenticates `/cart`, `/wishlist`, `/addresses`, `/orders` | ✅ |
| `CSRF` | Cookie writes without token → 403; mismatched token → 403; unlisted Origin → 403; missing Origin/Referer → 403; matching double-submit → 201; Referer-only allowed; login from unlisted Origin blocked; non-browser login (no Origin) still reaches auth; webhooks exempt | ✅ |
| `IDOR` | Cross-account address/cart/wishlist/order access returns **404** (no 403 existence oracle); foreign records unchanged; own-record CRUD intact | ✅ |
| `CART`/`WISH` | Owner add/remove works; CSRF enforced on mutations | ✅ |
| `ADMIN` | Customer → admin dashboard 403; customer → media upload 403 before multer; admin login/session/dashboard OK; disallowed upload type 400 | ✅ |
| `CORS` | Configured origin preflight allowed with credentials; unlisted origin not granted; cross-site POST without cookies unauthenticated | ✅ |
| `LOGOUT` | Logout without/with wrong CSRF → 403 (session intact); valid logout clears **4/4** cookies; cookie session dead after logout; refresh token revoked server-side | ✅ |
| `GUARD` | Over-long URL → 414 before routing; too many query params → 400; oversized query value → 400 | ✅ |
| `RATE` | Login limiter 429 on 11th attempt; per-account throttle 429 after 10 failures across distinct IPs; search limiter 429 on 31st/min; normal browsing unaffected | ✅ |
| `CLIENT` | No auth tokens written to localStorage; axios uses `withCredentials: true` | ✅ |

**Post-run cleanup:** throwaway users removed via `cleanup-smoke-users-prisma.js` — final run reported `matched: 0` (no residual `smoke.*` users, carts, orders, addresses, or wishlist rows).

---

## PRODUCTION CONFIG / COOKIE VERIFICATION

Cookie flags emitted with `NODE_ENV=production` (`verify-prod-cookies.js`):

| Cookie | HttpOnly | Secure | SameSite | Path |
|--------|----------|--------|----------|------|
| `voss_access_token` | ✅ | ✅ | lax | / |
| `voss_refresh_token` | ✅ | ✅ | lax | / |
| `voss_csrf` | ❌ (by design, double-submit) | ✅ | lax | / |
| `voss_auth` | ❌ (marker) | ✅ | lax | / |

`validateConfig()` in production additionally enforces: ≥32-char `JWT_SECRET`/`JWT_REFRESH_SECRET`, concrete `https://` `CLIENT_URL` (no wildcard), `COOKIE_SAMESITE=none` ⇒ Secure, shared `REDIS_URL` (or explicit `RATE_LIMIT_ALLOW_MEMORY=true`), `https://` origins only, complete email pair, and `STRIPE_WEBHOOK_SECRET` whenever `STRIPE_SECRET_KEY` is set.

> A full production boot was not performed locally because `CLOUDINARY_*` is intentionally unset in the dev `.env` (validation therefore reports `CLOUDINARY_NAME` missing — expected, not a code defect). `validateConfig()` accepts either `CLOUDINARY_CLOUD_NAME` or `CLOUDINARY_NAME`.

---

## KEY IMPLEMENTATION NOTES

- **Cookie auth is the only browser session mechanism.** Login/register/refresh set cookies server-side; the response body carries only the user object. Tokens are never exposed to client JavaScript.
- **CSRF is layered:** double-submit cookie comparison **and** Origin/Referer allowlisting for cookie-authenticated mutations. Auth-entry routes tolerate a missing Origin (non-browser clients) but reject an *unlisted* one. `/api/health` and `/api/v1/webhooks/` are exempt.
- **Rate limiting keys on resolved client IP** (`req.ip`, honouring `trust proxy`) and optionally the authenticated user id. Redis store is used when `REDIS_URL` is set; it **fails closed in production** (`passOnStoreError: false`) so a broken shared store cannot silently disable limits.
- **Login throttle** is per-account, 15-minute window, 10 failures max; account emails are hashed before becoming Redis keys.
- **IDOR responses use 404, not 403**, to avoid confirming existence of another user's records. Order responses use a customer-safe projection excluding internal notes and payment secrets.
- **Startup order** (`bootstrap.ts`): connect DB → `validateConfig()` → connect Redis → dynamically `import('./app')`, so limiter modules that construct a Redis store at import time see a ready connection.
- **Client migration:** `session.ts` purges legacy `voss_token` / `voss_refresh_token` / `voss_user` localStorage keys; `proxy.ts` gates on the readable `voss_access_token` cookie; `axios.ts` sends `withCredentials`.
- **CSP** (`client/next.config.ts`) allows `'unsafe-inline'`, adds `'unsafe-eval'` in dev only, and whitelists the API origin plus Stripe/PayPal in `connect-src`.

---

## REPRODUCING THE VERIFICATION

```powershell
# Type checks
cd server; npx tsc --noEmit
cd ..\client; npx tsc --noEmit

# Boot API (needs server/.env with Mongo + JWT secrets)
cd ..\server; npx ts-node-dev --respawn --transpile-only src/bootstrap.ts

# Smoke test (separate shell)
node "C:\Users\buzzb\AppData\Local\Temp\opencode\smoke.js"

# Remove throwaway users created by the smoke test
node "C:\Users\buzzb\AppData\Local\Temp\opencode\cleanup-smoke-users-prisma.js"
```

**Residual (non-blocking):** JWT role claims are trusted until access-token expiry (short-lived); the client `proxy.ts` cookie gate is a UX/access layer, not the security boundary — the server enforces authz on every route.
