# ZOYA GOODS — Deployment Status Report

Date: 2026-11-20
Branch inspected: `main`
Working tree changes: uncommitted (no commit, push, or deploy performed)

---

## A. Verdict

**CODE-SIDE READY; EXTERNAL DEPLOYMENT STILL REQUIRES OWNER ACTION.**

The frontend now calls the backend through same-origin Next.js API routes, so
the browser stays on `https://voss-two.vercel.app`. Server-side route handlers
forward to Render using `API_PROXY_TARGET`. The previous cross-domain cookie
blocker is resolved in code.

Deployment still requires owner-account actions: create Render service and
managed Redis, supply Cloudinary credentials, confirm Atlas network access, set
Render/Vercel environment variables, commit/push, and redeploy.

---

## B. Verified checks

| Area | Command / check | Result |
| --- | --- | --- |
| Client lint | `npm run lint` | Pass |
| Client typecheck | `npx tsc --noEmit` | Pass |
| Client tests | `npm test` | Pass — 2 files, 20 tests |
| Client production build | `npm run build` | Pass — 49/49 static pages |
| Proxy E2E | `proxy-e2e.mjs` | Pass — 21 checks, `ALL CHECKS PASSED` |
| Server lint | `npm run lint` | Pass — 0 errors, 108 warnings |
| Server typecheck | `npx tsc --noEmit` | Pass |
| Server tests | `npm test` | Pass — 7 files, 29 tests |
| Server production build | `npm run build` | Pass |

Production build includes:

```text
ƒ /api/uploads/[...path]
ƒ /api/v1/[...path]
ƒ Proxy (Middleware)
```

The E2E script verified status/query/method/body forwarding, cookie and header
preservation, multiple `Set-Cookie` handling, no-store responses, no backend
hostname leakage, uploads proxying, 5xx passthrough, OPTIONS support, and CSP
without the backend origin.

---

## C. Changes made

### Frontend / proxy

- Added `client/src/app/api/v1/[...path]/route.ts` and
  `client/src/app/api/uploads/[...path]/route.ts`.
- Added server-only `API_PROXY_TARGET` resolver and hardened proxy utilities in
  `client/src/lib/apiProxyTarget.server.ts` and `client/src/lib/apiProxy.server.ts`.
- Updated API/asset helpers to use `/api/v1` and `/api/uploads`.
- Removed backend origin from CSP and image remote patterns.
- Added 11 proxy unit tests; updated asset URL tests.
- Hardened login redirects, admin role handling, `AuthContext.login()`, image
  fallback, error boundary, mobile nav breakpoint, category breadcrumb, shop
  sort URL sync, disabled/internal `Button` navigation, and Stripe
  `PaymentElement` mount persistence through checkout review.
- Validated all hardcoded category links against the existing database; no
  navigation/footer category links needed changes.

### Backend / security

- Fixed production entry point to `dist/bootstrap.js`.
- Added graceful shutdown and fatal-process handlers in `bootstrap.ts`.
- Strengthened production config validation: database URL, HTTPS client URL,
  Google redirect URI, cookie SameSite/Secure pairing, Redis requirement, JWT
  TTL cap of 1 hour, and complete SMTP/Stripe credential pairs.
- Reduced default access-token lifetime to 15 minutes.
- Added Google OAuth state cookie and constant-time state verification.
- Exempted `/api/health` from rate limiting.
- Escaped transactional email HTML and stripped CRLF from subjects.
- Added magic-byte image signature validation for JPEG/PNG/WebP uploads.
- Added ESLint 9 flat config and fixed all lint errors.
- Repaired media cleanup mocks and removed stray `__*.test.ts` debug artifacts.
- Added config TTL and image-signature tests.

---

## D. Remaining owner actions

1. Create the Render Web Service:
   - Root directory: `server`
   - Runtime: Node 24
   - Build: `npm ci && npx prisma generate && npm run build`
   - Start: `npm start`
   - Health check: `/api/health`
   - Do not set `PORT` manually.
2. Create/provision managed Redis and set `REDIS_URL`.
3. Supply real Cloudinary credentials.
4. Confirm MongoDB Atlas Network Access allows Render to connect.
5. Set Render environment variables in `DEPLOYMENT_ENV_CHECKLIST.md` and
   `DEPLOYMENT_RENDER_GUIDE.md`.
6. Set Vercel `API_PROXY_TARGET=https://<render-service-name>.onrender.com`.
7. Commit and push the working tree when ready.
8. Redeploy Render and Vercel, then verify `/api/v1` calls from the Vercel
   origin and no direct browser calls to `*.onrender.com`.

---

## E. Risks / notes

- Server lint passes with warnings only; most are pre-existing explicit `any`
  and unused-variable warnings.
- `npm install --save-dev typescript-eslint@^8.73.0 @eslint/js@^9.39.5`
  reported npm audit findings: 19 vulnerabilities (5 moderate, 11 high, 3
  critical). No `npm audit fix` was run.
- External Render, Vercel, Redis, Cloudinary, and live DNS behavior were not
  verified because no external deployment or credentials were used.
- No custom domain was configured. The same-origin proxy removes the need for
  `SameSite=None` for the current Vercel deployment.

---

## F. Database / secrets safety

- Existing Atlas data was queried read-only only.
- No migrations, `db push`, seed commands, deletes, updates, or reseeding were
  run.
- No `.env` or `.env.local` secret values were printed, committed, or added to
  documentation.
- No product, category, order, user, or media records were modified.

---

## G. Readiness summary

| Area | Status |
| --- | --- |
| Frontend code and tests | Ready |
| Same-origin API proxy | Ready and E2E verified |
| Backend code, tests, and build | Ready |
| Production config validation | Ready |
| Cookie architecture for current domains | Ready via proxy |
| Redis production requirement | Managed Redis still required |
| Cloudinary credentials | Owner must supply |
| Render / Vercel deployment | Owner must create/configure/redeploy |
| Commit / push / deploy | Not performed |
| Overall | Code-side ready; deployment blocked only by owner actions |
