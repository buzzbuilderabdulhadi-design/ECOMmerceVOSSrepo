# ZOYA GOODS — Deployment Environment Variable Checklist

No real secret values belong in this file. Use placeholders and enter real
values directly into Render / Vercel.

Legend: **R** = required, **C** = conditionally required, **O** = optional.

---

## 1. Backend (Render)

### 1.1 Core / mandatory

| Variable | Status | Purpose | Where to get it |
| --- | --- | --- | --- |
| `NODE_ENV` | R | Enables production validation, secure cookies, fail-closed rate limiting | Set to `production` in Render |
| `PORT` | R | HTTP port the server listens on | Provided automatically by Render — do not set |
| `MONGODB_URI` | R | Prisma datasource (MongoDB Atlas) | Atlas → Database → Connect → Drivers |
| `DATABASE_URL` | R* | Application config fallback for the database URL | Use the **same** value as `MONGODB_URI` |
| `JWT_SECRET` | R | Signs access tokens; must be ≥ 32 chars | Generate locally with Node crypto |
| `JWT_REFRESH_SECRET` | R | Signs refresh tokens; must differ from `JWT_SECRET`; ≥ 32 chars | Generate locally with Node crypto |
| `CLIENT_URL` | R | Primary browser origin allowed by CORS and CSRF | `https://voss-two.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` | R | Durable image storage (production validation requires it) | Cloudinary Console → Dashboard → Credentials |
| `CLOUDINARY_API_KEY` | R | Cloudinary upload/delete authentication | Cloudinary Console → Dashboard → Credentials |
| `CLOUDINARY_API_SECRET` | R | Cloudinary upload/delete authentication | Cloudinary Console → Dashboard → Credentials |
| `REDIS_URL` | C | Shared rate-limit/login-throttle store | Render Key Value / Upstash / other managed Redis |
| `RATE_LIMIT_ALLOW_MEMORY` | C | Explicit single-instance opt-in when Redis is not used | Set only with owner approval |
| `COOKIE_SECURE` | R | Send cookies over HTTPS only | `true` (default in production) |
| `TRUST_PROXY` | R | Trust Render's TLS-terminating proxy for `req.ip` / secure cookies | `1` |

`*` `DATABASE_URL` is not strictly required by the current code because
`config.database.url` falls back to `MONGODB_URI`, but the production validation
message names `DATABASE_URL`. Set both to the same Atlas URI to avoid confusion.

### 1.2 Cookie / cross-site settings

| Variable | Status | Purpose | Value guidance |
| --- | --- | --- | --- |
| `COOKIE_SAMESITE` | C | Controls whether cookies are sent on cross-site requests | `lax` for a same-site custom-domain deployment. `none` requires `COOKIE_SECURE=true`. See the auth caveat in `DEPLOYMENT_VERCEL_GUIDE.md` before using `none`. |
| `COOKIE_DOMAIN` | O | Shares cookies across sibling subdomains | Leave unset for `onrender.com`. Set to `.yourdomain.com` only when the storefront and API are sibling subdomains of a domain you control. |
| `ALLOWED_ORIGINS` | O | Extra browser origins allowed by CORS + CSRF (comma-separated) | Example shape: `https://www.yourdomain.com`. Must be `https://` in production. |

### 1.3 Rate limiting (optional tuning)

| Variable | Default | Purpose |
| --- | --- | --- |
| `RATE_LIMIT_WINDOW_MS` | `900000` | Global API rate-limit window (ms) |
| `RATE_LIMIT_MAX` | `100` | General limiter ceiling |
| `RATE_LIMIT_PUBLIC_MAX` | `1000` | Global API backstop ceiling |
| `RATE_LIMIT_KEY_PREFIX` | `voss:rl:` | Redis key namespace |
| `REDIS_CONNECT_TIMEOUT_MS` | `5000` | Bounds Redis connection attempts |

### 1.4 JWT tuning (optional)

| Variable | Default | Purpose |
| --- | --- | --- |
| `JWT_EXPIRES_IN` | `7d` | Access token lifetime |
| `JWT_REFRESH_EXPIRES_IN` | `30d` | Refresh token lifetime |

### 1.5 Optional integrations

Only configure these if you actually use the integration. Missing credentials
disable the corresponding payment method rather than breaking catalog browsing.

| Variable | Status | Purpose | Where to get it |
| --- | --- | --- | --- |
| `EMAIL_SERVICE` | O | Nodemailer service name | Your email provider |
| `EMAIL_USER` | O* | SMTP username | Your email provider |
| `EMAIL_PASSWORD` | O* | SMTP password / app password | Your email provider |
| `STRIPE_SECRET_KEY` | O | Server-side Stripe API key | Stripe Dashboard → Developers → API keys |
| `STRIPE_WEBHOOK_SECRET` | O* | Stripe webhook signature verification | Stripe Dashboard → Webhooks |
| `PAYPAL_CLIENT_ID` | O | PayPal Orders v2 client ID | PayPal Developer Dashboard |
| `PAYPAL_CLIENT_SECRET` | O* | PayPal client secret | PayPal Developer Dashboard |
| `PAYPAL_ENVIRONMENT` | O | `sandbox` or `live` | Your PayPal setup |
| `PAYPAL_WEBHOOK_ID` | O | PayPal webhook signature verification | PayPal Developer Dashboard |
| `GOOGLE_CLIENT_ID` | O | Google OAuth client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | O* | Google OAuth client secret | Google Cloud Console → Credentials |
| `GOOGLE_REDIRECT_URI` | O | OAuth callback URL; must match Google console exactly | `https://voss-two.vercel.app/auth/google/callback` |
| `BANK_TRANSFER_ENABLED` | O | Enables manual bank transfer | Your decision |
| `BANK_NAME` | O* | Bank name shown to customer | Your bank details |
| `BANK_ACCOUNT_TITLE` | O | Account title | Your bank details |
| `BANK_IBAN` | O* | IBAN shown to customer | Your bank details |
| `BANK_ACCOUNT_NUMBER` | O | Account number | Your bank details |
| `BANK_SWIFT_CODE` | O | SWIFT/BIC | Your bank details |
| `BANK_BRANCH` | O | Branch | Your bank details |
| `BANK_TRANSFER_INSTRUCTIONS` | O | Extra customer instructions | Your decision |
| `PAYONEER_ENABLED` | O | Enables manual/external Payoneer method | Your decision |
| `PAYONEER_ACCOUNT_EMAIL` | O* | Receiving Payoneer email shown to customer | Your Payoneer account |
| `PAYONEER_INSTRUCTIONS` | O | Extra customer instructions | Your decision |
| `CURRENCY` | O | Currency code (default `usd`) | Your store currency |

Pair rules enforced by production validation:

- `EMAIL_USER` and `EMAIL_PASSWORD` must both be set or both be empty.
- `STRIPE_WEBHOOK_SECRET` is required if `STRIPE_SECRET_KEY` is set.
- `COOKIE_SAMESITE=none` requires secure cookies.
- `REDIS_URL`, when present, must start with `redis://` or `rediss://`.

### 1.6 Do not set

| Variable | Why |
| --- | --- |
| `ADMIN_EMAIL` | Used only by the seed script. Do not set or run the seed against production. |
| `ADMIN_PASSWORD` | Same as above. Do not set or commit. |

---

## 2. Frontend (Vercel)

| Variable | Status | Purpose | Value guidance |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | R | Base URL for every catalog/cart/checkout/auth API call; also used to build the CSP `connect-src` and the image remote pattern for `/uploads` | `https://<render-service-name>.onrender.com/api/v1` — no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | O | Canonical site URL for metadata, robots, sitemap | `https://voss-two.vercel.app` |
| `NEXT_PUBLIC_APP_NAME` | O | Display/app name | `ZOYA GOODS` |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | O | Exposed Cloudinary cloud name, if used by the frontend | Your Cloudinary cloud name |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | O | Enables Stripe Elements in checkout | Stripe Dashboard → Developers → API keys (publishable key only) |

`NEXT_PUBLIC_*` values are embedded in the frontend bundle at build time.
Changing any of them requires a new Vercel deployment.

Never put a backend secret behind a `NEXT_PUBLIC_` prefix. Anything prefixed
this way is public.

---

## 3. Secret generation (run locally, paste directly into the provider)

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this twice:

- first output → `JWT_SECRET`
- second output → `JWT_REFRESH_SECRET`

Do not reuse development secrets. Do not paste the outputs into chat, documents,
GitHub issues, or frontend code.

---

## 4. Handling rules

- `.env` files are gitignored at the repository root and must never be committed.
- Store production values only in Render / Vercel dashboards.
- Rotate any credential that is ever exposed.
- The database connection string, JWT secrets, Cloudinary API secret, Stripe
  secret key, PayPal client secret, and SMTP password are secrets.
- Atlas database name is part of `MONGODB_URI`; changing it points the app at a
  different database. Do not change it unless that is intentional.
