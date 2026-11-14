# ZOYA GOODS — Deployment Status Report

Date: 2026-11-14
Branch inspected: `main`
Working tree changes: uncommitted (no commit, push, or deploy was performed)

---

## 1. Verdict

**PARTIALLY READY**

- The backend builds, starts, connects to the existing MongoDB Atlas database,
  and serves real products and categories.
- The frontend TypeScript check and production build pass.
- Deployment is blocked by owner-account actions (Render service, Redis,
  Cloudinary credentials, Vercel environment, commit/push) and by a
  cross-domain authentication decision for the current `vercel.app` +
  `onrender.com` split.
- For a catalog-only launch whose goal is "display real products", the remaining
  steps are: create Render + Redis, set Render env vars, set Vercel
  `NEXT_PUBLIC_API_URL`, commit/push, and redeploy.

---

## 2. What was verified

### Backend build / startup

| Check | Command | Exit code | Result |
| --- | --- | --- | --- |
| Clean install with `NODE_ENV=production` | `npm ci` | 0 | Pass |
| Prisma Client generation | `npx prisma generate` | 0 | Pass (Prisma 6.19.3) |
| TypeScript production build | `npm run build` | 0 | Pass |
| Compiled entry point | `node dist/bootstrap.js` | 0 | Started and listened |
| Health endpoint | `GET /api/health` | 200 | `database: connected` |
| Catalog products | `GET /api/v1/products?limit=3` | 200 | 3 returned, total 50 |
| Categories | `GET /api/v1/categories` | 200 | 35 returned |

The health/startup test was run locally in a production-like configuration with
temporary non-secret placeholder Cloudinary values and
`RATE_LIMIT_ALLOW_MEMORY=true`. No uploads were performed and no configuration
was persisted.

### MongoDB / Prisma (read-only)

| Check | Result |
| --- | --- |
| Prisma connection to existing Atlas database | Pass |
| Products | 54 total, 50 active |
| Categories | 38 total |
| Data modified/deleted/reseeded | None |
| `prisma db push` / migrations / seed | Not run |

### Product images

| Pattern | Count |
| --- | --- |
| `images.unsplash.com` | 88 |
| `via.placeholder.com` | 7 |
| Legacy `/uploads/...` URLs | 0 |
| Products with no images | 2 |
| Categories with no image | 38 |

No existing product image depends on Render's ephemeral filesystem. Existing
images are absolute external URLs already allowed by the frontend image
configuration.

### Frontend

| Check | Command | Exit code | Result |
| --- | --- | --- | --- |
| TypeScript check | `npx tsc --noEmit` | 0 | Pass |
| Production build | `npm run build` | 0 | Pass (all routes built) |
| Test suite | `npm test` | 1 | 2 of 9 tests fail (pre-existing test harness issue) |

Client test failure detail:

- `src/lib/assetUrl.test.ts` uses `require('./assetUrl')` after
  `vi.resetModules()`, which fails with `Cannot find module './assetUrl'` under
  the current Vitest ESM setup. This is a test-harness issue, not a runtime
  asset-URL failure. It was not changed to force a pass.

### Backend test failures (reported, not hidden)

`npm test` in `server` exits **1**:

- Test files: 6 failed, 11 passed
- Tests: 7 failed, 29 passed
- 1 failed suite (`src/__fsmock.test.ts`)

Failures are in diagnostic/probe artifacts and a mock-identity assertion:

- `src/__fsmock.test.ts` — `vi.mock('fs')` factory references a variable before
  initialization
- `src/__debug3.test.ts`, `src/__debug4.test.ts`, `src/__debug5.test.ts`,
  `src/__spylifecycle.test.ts` — probe tests with invalid mock APIs
- `src/controllers/media.test.ts` — 3 failures because `vi.spyOn(fs.promises,
  'unlink')` does not intercept the filesystem call in this Vitest module
  setup

These files are pre-existing and unrelated to deployment or to the changes
below. Relevant security/config/route tests pass independently:

```bash
npx vitest run src/config/index.test.ts src/middleware/auth.test.ts \
  src/routes/media.routes.test.ts src/controllers/adminMedia.test.ts \
  src/config/cloudinary.test.ts
```

Result: **19 tests passed, exit 0**.

Recommendation: remove the `__*` probe artifacts and repair the `media.test.ts`
mock in a separate change, with your approval. They do not block deployment
because the production build excludes test files.

---

## 3. Changes made

### 3.1 `server/tsconfig.json`

Excluded test files from the production TypeScript compile:

```diff
-  "exclude": ["node_modules", "dist"]
+  "exclude": ["node_modules", "dist", "src/**/*.test.ts", "src/**/*.spec.ts"]
```

Why: `tsc` compiled stray diagnostic `__*.test.ts` files and failed with type
errors, so `npm run build` failed. Production builds should not compile tests.
Vitest still runs test files because its own config includes them.

### 3.2 `server/src/app.ts`

1. CORS now uses the full configured allowlist instead of only `CLIENT_URL`:

```diff
-  origin: config.client.url,
+  origin: config.cors.allowedOrigins,
```

Why: `ALLOWED_ORIGINS` was documented and validated but ignored by CORS.
`CLIENT_URL` is always included in the allowlist, so behavior for the current
frontend is unchanged and consistent with CSRF origin validation.

2. Health endpoint now reports a coarse Redis state without exposing the URL:

```json
"redis": "connected" | "disconnected" | "memory" | "not_configured"
```

Why: Render health checks and operators need to distinguish database health
from Redis availability. No credentials, connection strings, or stack traces
are exposed.

### 3.3 New `server/.npmrc`

```ini
include=dev
```

Why: Render runs with `NODE_ENV=production`, which makes npm omit
devDependencies. TypeScript and the Prisma CLI are devDependencies. Without
this, the documented Render build command can fail with `tsc: not found`.
Verified: `npm ci` under `NODE_ENV=production` installs devDependencies with
this file in place, and the full build sequence exits 0.

### 3.4 New `server/.node-version`

```text
24
```

Why: pins Node.js 24.x on Render as required by the project.

### 3.5 New documentation

- `DEPLOYMENT_RENDER_GUIDE.md`
- `DEPLOYMENT_ENV_CHECKLIST.md`
- `DEPLOYMENT_VERCEL_GUIDE.md`
- `DEPLOYMENT_STATUS.md` (this file)

---

## 4. Files not changed

- No Prisma schema or database changes.
- No migrations, `db push`, or seed commands were run.
- No frontend source code was changed.
- No `.env` or `.env.local` file was modified or committed.
- No secrets were printed or added.
- Existing products, categories, orders, users, and media were not touched.

---

## 5. Exact Render settings

| Setting | Value |
| --- | --- |
| Root Directory | `server` |
| Runtime | Node |
| Node version | 24 (`server/.node-version`) |
| Branch | `main` |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Port | Do not set; Render injects `PORT` |

Required environment variables are listed in
`DEPLOYMENT_ENV_CHECKLIST.md`. The production-blocking ones are:

```text
NODE_ENV=production
MONGODB_URI=<existing Atlas URI>
DATABASE_URL=<same Atlas URI>
JWT_SECRET=<new random value>
JWT_REFRESH_SECRET=<different new random value>
CLIENT_URL=https://voss-two.vercel.app
CLOUDINARY_CLOUD_NAME=<value>
CLOUDINARY_API_KEY=<value>
CLOUDINARY_API_SECRET=<value>
REDIS_URL=<managed Redis URL>
COOKIE_SECURE=true
TRUST_PROXY=1
```

---

## 6. Redis requirement

Redis is **required by default in production**. Startup fails without
`REDIS_URL` unless `RATE_LIMIT_ALLOW_MEMORY=true` is explicitly set.

Recommended: managed Redis.

- Render Key Value: use the internal `redis://` URL (no TLS on private network).
- Upstash or another external provider: use the TLS `rediss://` URL.

Temporary single-instance option: `RATE_LIMIT_ALLOW_MEMORY=true`. This is not
enabled in the repository and requires your approval. Limitations: counters are
per-process, reset on restart, and are not shared across instances.

---

## 7. Exact Vercel settings

| Setting | Value |
| --- | --- |
| Root Directory | `client` |
| Framework | Next.js |
| Build Command | `npm run build` |
| Install Command | `npm ci` |
| Node.js Version | 24.x |
| Production Branch | `main` |

Required environment variable:

```text
NEXT_PUBLIC_API_URL=https://<render-service-name>.onrender.com/api/v1
```

The actual Render hostname is not known until you create the service. Do not use
`localhost`. After setting or changing this value, trigger a **new production
deployment**; `NEXT_PUBLIC_*` values are embedded at build time.

Recommended:

```text
NEXT_PUBLIC_SITE_URL=https://voss-two.vercel.app
```

---

## 8. Remaining blockers

### Blocked on your account access / approval

1. **Create the Render Web Service** with the settings above.
2. **Create/provision managed Redis** and set `REDIS_URL` (or explicitly approve
   the single-instance memory option).
3. **Provide real Cloudinary credentials** in Render. Production startup
   validation requires them, and the local `.env` currently has them empty.
4. **Confirm MongoDB Atlas network access** allows Render to connect. No Atlas
   settings were changed.
5. **Set Vercel environment variables** (`NEXT_PUBLIC_API_URL`, recommended
   `NEXT_PUBLIC_SITE_URL`) and redeploy.
6. **Commit and push** the changes in this working tree. Nothing was committed
   or pushed.
7. **Copy the actual Render URL** into Vercel. The backend URL was intentionally
   not invented.

### Decision required: cross-domain authentication

The storefront (`voss-two.vercel.app`) and API (`*.onrender.com`) are on
different registrable domains. Public product browsing works. Cookie-based
login/session/cart/checkout is not reliable because:

- the SPA cannot read cookies set by a different registrable domain
  (`voss_csrf`, `voss_auth`), and
- browsers may block third-party cookies.

Correct options (detailed in `DEPLOYMENT_VERCEL_GUIDE.md`):

- Recommended: put the storefront and API on sibling subdomains of a domain you
  own, with `COOKIE_DOMAIN=.yourdomain.com` and `COOKIE_SAMESITE=lax`.
- Alternative: proxy API calls through the Next.js origin so they are
  first-party.

Do not disable CSRF or blindly rely on `COOKIE_SAMESITE=none` as the fix.

### Pre-existing test failures

The server and client test suites have failures that predate and are unrelated
to these deployment changes. They are documented above and were not hidden or
"fixed" by weakening tests. They do not block the production build or catalog
deployment.

---

## 9. Owner action checklist

- [ ] Create Render Web Service (root `server`, Node 24, build/start/health as
      above)
- [ ] Add all mandatory Render environment variables
- [ ] Create managed Redis and set `REDIS_URL` (recommended)
- [ ] Add Cloudinary credentials
- [ ] Verify Atlas network access
- [ ] Deploy backend and confirm `/api/health` and `/api/v1/products`
- [ ] Copy the Render public URL
- [ ] Set `NEXT_PUBLIC_API_URL` in Vercel and redeploy
- [ ] Verify products render on `https://voss-two.vercel.app`
- [ ] Decide the auth architecture (custom domain or same-origin proxy)
- [ ] Commit and push the working tree changes when ready
- [ ] Optionally clean up stray `server/src/__*.test.ts` probe files and repair
      `media.test.ts`

---

## 10. Deployment readiness summary

| Area | Status |
| --- | --- |
| TypeScript compilation | Ready |
| Prisma Client generation | Ready |
| Production build | Ready |
| Compiled entry point / `npm start` | Ready |
| Node 24 compatibility | Verified locally (v24.18.0) |
| PORT handling | Ready (Render injects) |
| Graceful shutdown | Implemented |
| Health endpoint | Ready at `/api/health` |
| MongoDB Atlas read access | Verified |
| Redis production requirement | Managed Redis recommended; memory opt-in needs approval |
| CORS for `https://voss-two.vercel.app` | Ready |
| Cross-domain cookie auth | Needs architecture decision |
| Cloudinary | Credentials required |
| Frontend product display | Ready after Vercel env + redeploy |
| Database safety | No destructive operations performed |
| Secrets | No secrets exposed or committed |
| Commit / push / deploy | Not performed (requires your approval) |
