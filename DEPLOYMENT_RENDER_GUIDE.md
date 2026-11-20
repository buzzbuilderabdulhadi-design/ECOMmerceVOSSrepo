# ZOYA GOODS — Render Backend Deployment Guide

This guide covers deploying the existing Express + TypeScript + Prisma backend
(`server/`) to Render and connecting it to the existing MongoDB Atlas database.

> Nothing in this guide was executed against your Render, Atlas, Redis, or
> Vercel accounts. All provider actions below are for you to perform.

---

## 1. Verified build and start commands

These commands were run locally against the current `main` working tree:

```bash
cd server
npm ci
npx prisma generate
npm run build
npm start
```

Verified results:

| Step | Result |
| --- | --- |
| `npm ci` with `NODE_ENV=production` | exit 0 |
| `npx prisma generate` (Prisma 6.19.3) | exit 0 |
| `npm run build` (`tsc`) | exit 0 |
| Compiled entry point | `server/dist/bootstrap.js` |
| `npm start` | starts and listens on `PORT` |
| `GET /api/health` | HTTP 200 with database connected |
| `GET /api/v1/products?limit=3` | HTTP 200, real Atlas products returned |

### Important: `NODE_ENV=production` and devDependencies

Render sets `NODE_ENV=production`. By default, npm then omits
`devDependencies`, but this project needs `typescript` and `prisma` (both
devDependencies) during the build. A project-level `server/.npmrc` was added
with:

```ini
include=dev
```

This keeps build-time tooling available during install without changing runtime
behavior. The originally expected command now works:

```bash
npm ci && npx prisma generate && npm run build
```

If you prefer to avoid `.npmrc`, use this equivalent build command instead:

```bash
npm ci --include=dev && npx prisma generate && npm run build
```

---

## 2. Render service settings

Create a **Web Service** from the GitHub repository
`buzzbuilderabdulhadi-design/ECOMmerceVOSSrepo`.

| Setting | Value |
| --- | --- |
| Service type | Web Service |
| Repository | `buzzbuilderabdulhadi-design/ECOMmerceVOSSrepo` |
| Branch | `main` |
| Root Directory | `server` |
| Runtime | Node |
| Node version | `24` (pinned by `server/.node-version`) |
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Auto-Deploy | On (or manual, your choice) |
| Persistent Disk | Not required and not recommended for uploads |

The start command runs `node dist/bootstrap.js` (defined in
`server/package.json`). The compiled entry point exists after the build.

### PORT handling

Do **not** set `PORT` manually in Render. Render injects its own `PORT` value
and the server reads `process.env.PORT`. The local default is `5000`, which is
irrelevant on Render.

### Graceful shutdown

`server/src/bootstrap.ts` handles `SIGTERM` and `SIGINT`, disconnecting Redis
and Prisma before exiting. Render sends `SIGTERM` during deploys and restarts.

---

## 3. MongoDB Atlas and Prisma

The Prisma schema is:

```prisma
datasource db {
  provider = "mongodb"
  url      = env("MONGODB_URI")
}
```

Facts verified from the code:

- Prisma reads **`MONGODB_URI`** from `server/prisma/schema.prisma`.
- The application config reads `MONGODB_URI` first, then falls back to
  `DATABASE_URL` (`server/src/config/index.ts`).
- `DATABASE_URL` is therefore **not strictly required** if `MONGODB_URI` is
  present, but the production validation error message refers to
  `DATABASE_URL`.
- **Recommended:** set both `MONGODB_URI` and `DATABASE_URL` to the **same**
  Atlas connection string. This avoids confusion and keeps any tooling that
  expects `DATABASE_URL` working.

### Do not run database-mutating commands

Do **not** run any of the following against Atlas:

- `prisma db push`
- `prisma migrate`
- `prisma migrate deploy`
- any seed script (`prisma:seed`, `seed:catalog`)
- any reset / drop / delete script

`npx prisma generate` is safe: it only generates the client locally and does
not modify the database.

### Atlas network access

Render's outbound IPs are not fixed on all plans. In MongoDB Atlas, confirm
**Network Access** allows Render to connect. For many setups this means adding
`0.0.0.0/0`, or the specific Render egress IPs if your plan provides them.
Do not change Atlas network settings without deciding this is acceptable for
your security posture.

### Existing data

A read-only check against the existing Atlas database confirmed:

- 54 products total
- 50 active products
- 38 categories

No database records were modified, deleted, or reseeded.

---

## 4. Redis (required in production by default)

Production startup validation requires either a shared Redis store or an
explicit single-instance memory opt-in.

### Recommended: managed Redis

Use a Redis-compatible provider in the same region as the Render service:

1. **Render Key Value (Redis-compatible)** — easiest if available on your plan.
   Use the **Internal Redis URL**, normally `redis://...`. No TLS is needed on
   Render's private network.
2. **Upstash Redis** — use the TLS URL, normally `rediss://...`.
3. Any other managed Redis that exposes a standard `redis://` or `rediss://`
   URL.

Set:

```text
REDIS_URL=<provider connection URL>
```

The current `redis` npm client supports both `redis://` and
`rediss://`. Production validation rejects any other scheme.

Redis is used for:

- Shared rate-limit counters across instances
- The per-account login throttle

Do not silently remove Redis or weaken rate limiting.

### Temporary single-instance alternative (requires your approval)

If you intentionally run exactly one backend instance and accept weaker abuse
protection, you can set:

```text
RATE_LIMIT_ALLOW_MEMORY=true
```

Limitations:

- Counters are per process and reset on every deploy/restart.
- Limits are not shared across multiple instances.
- Abuse protection is weaker during restarts and scaling.
- This is not enabled anywhere in this repository; it is an operational choice.

**Use managed Redis for a normal production launch.**

---

## 5. Render environment variables

Set these in **Render → your service → Environment**. See
`DEPLOYMENT_ENV_CHECKLIST.md` for the full table, sources, and optional
integrations.

Mandatory for startup:

```text
NODE_ENV=production
MONGODB_URI=<your existing Atlas connection string>
DATABASE_URL=<same Atlas connection string>
JWT_SECRET=<new random 64-byte hex>
JWT_REFRESH_SECRET=<a different new random 64-byte hex>
JWT_EXPIRES_IN=15m
CLIENT_URL=https://voss-two.vercel.app
CLOUDINARY_CLOUD_NAME=<Cloudinary cloud name>
CLOUDINARY_API_KEY=<Cloudinary API key>
CLOUDINARY_API_SECRET=<Cloudinary API secret>
REDIS_URL=<managed Redis URL>
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
TRUST_PROXY=1
GOOGLE_REDIRECT_URI=https://voss-two.vercel.app/auth/google/callback
```

Generate JWT secrets locally and paste them directly into Render (never into
this chat, Git, or any document):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run it twice; the two secrets must be different.

`PORT` is provided by Render automatically.

### Cookie settings for the current architecture

The browser talks only to `https://voss-two.vercel.app`; Next.js route handlers
forward requests server-side to Render. From the browser's perspective the API
is same-origin, so keep `COOKIE_SAMESITE=lax`, `COOKIE_SECURE=true`, leave
`COOKIE_DOMAIN` unset, and set `TRUST_PROXY=1` on Render.

---

## 6. Cloudinary

Production validation requires all three Cloudinary values:

```text
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

Obtain them from the Cloudinary console (Dashboard → Product Environment
Credentials). The legacy alias `CLOUDINARY_NAME` is also accepted for the cloud
name.

Cloudinary is required for durable uploads because Render's local filesystem is
ephemeral. Existing product images in Atlas were checked and all are absolute
external URLs (Unsplash / placeholder); none depend on the local `/uploads`
folder.

---

## 7. Deploy and verify

After the Render service is live, run these checks from your machine:

```powershell
curl.exe -i https://<service-name>.onrender.com/api/health
```

Expected: HTTP 200, `database: "connected"`, `redis: "connected"`
(or `"memory"` only if you explicitly opted in), and integration booleans.

```powershell
curl.exe "https://<service-name>.onrender.com/api/v1/products?limit=3"
```

Expected: `success: true`, a non-empty `data` array, and `pagination.total`
around 50.

```powershell
curl.exe "https://<service-name>.onrender.com/api/v1/categories"
```

Expected: `success: true` and a non-empty category list.

CORS preflight from the storefront origin:

```powershell
curl.exe -i -X OPTIONS "https://<service-name>.onrender.com/api/v1/products" -H "Origin: https://voss-two.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: content-type"
```

Expected: a 204/200 response with
`Access-Control-Allow-Origin: https://voss-two.vercel.app` and
`Access-Control-Allow-Credentials: true`.

The health endpoint never returns credentials, connection strings, or stack
traces.

---

## 8. Common Render failures

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `tsc: not found` during build | devDependencies omitted | keep `server/.npmrc` (`include=dev`) or use `npm ci --include=dev` |
| `Missing or invalid required environment variable: CLOUDINARY_NAME` | Cloudinary env vars missing/empty | add all three Cloudinary values |
| `REDIS_URL is required in production` | no Redis and no memory opt-in | add managed Redis, or explicitly opt into memory after approval |
| `CLIENT_URL must be an https:// origin` | localhost URL in production | set `CLIENT_URL=https://voss-two.vercel.app` |
| Database connected but products empty | wrong Atlas database name or empty collection | verify the connection string's database name; do not reseed blindly |
| Health 503 | database unreachable | check Atlas network access and URI |
| Redis connection error at startup | wrong URL/scheme or TLS mismatch | use `rediss://` for external TLS providers, internal URL for Render Key Value |

---

## 9. What must not be done

- Do not run `prisma db push`, migrations, or seeds.
- Do not delete or reset Atlas collections.
- Do not commit `.env` files or credentials.
- Do not put secrets in frontend variables (`NEXT_PUBLIC_*`) or in Git.
- Do not create the Render service, Redis instance, or change Atlas settings
  without the account owner's action.
