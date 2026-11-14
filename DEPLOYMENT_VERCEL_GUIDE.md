# ZOYA GOODS — Vercel Frontend Deployment Guide

This guide configures the existing Next.js 16 storefront (`client/`) to use the
Render backend and display real products from MongoDB Atlas.

> The backend URL is not known until you create the Render service. Do not guess
> it. Copy the URL from the Render dashboard after the service is live.

---

## 1. Vercel project settings

| Setting | Value |
| --- | --- |
| Repository | `buzzbuilderabdulhadi-design/ECOMmerceVOSSrepo` |
| Production Branch | `main` |
| Root Directory | `client` |
| Framework Preset | Next.js |
| Install Command | `npm ci` (or leave Vercel's default `npm install`) |
| Build Command | `npm run build` |
| Output Directory | `.next` (Next.js default — leave blank) |
| Node.js Version | 24.x |

The client is a standalone app. `client/next.config.ts` pins the Turbopack root
so the root-level lockfile does not confuse module resolution.

---

## 2. Frontend environment variables

Set these in **Vercel → Project → Settings → Environment Variables** for the
**Production** environment (and Preview if you use it).

### Required

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://<render-service-name>.onrender.com/api/v1` |

Rules for `NEXT_PUBLIC_API_URL`:

- Must start with `https://` in production.
- Must end with `/api/v1`.
- Must have **no trailing slash** after `v1`.
- Must be the Render service's public URL, not `http://localhost/...` and not
  the Vercel URL.

Example shape (replace the host):

```text
https://zoya-goods-api.onrender.com/api/v1
```

If your Render service has a different hostname, use that exact hostname.

### Recommended

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://voss-two.vercel.app` |

This value controls canonical URLs, robots.txt, sitemap.xml, and Open Graph
metadata. If you later add a custom domain, change it to that domain.

### Optional

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Display/app name (`ZOYA GOODS`) |
| `NEXT_PUBLIC_CLOUDINARY_NAME` | Cloudinary cloud name, only if the frontend uses it directly |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Enables Stripe Elements on checkout (publishable key only) |

Do **not** add server secrets to Vercel. `NEXT_PUBLIC_*` variables are embedded
in the browser bundle and are public.

---

## 3. Why a redeploy is required

`NEXT_PUBLIC_*` values are inlined at build time. They are also used at build
time by `client/next.config.ts` to construct:

- The Content-Security-Policy `connect-src` entry for the API origin.
- The Next.js image `remotePatterns` entry for legacy `/uploads/**` images.

Therefore, after adding or changing `NEXT_PUBLIC_API_URL`:

1. Save the variable.
2. Trigger a **new production deployment** (Deployments → Redeploy, or push a
   commit).
3. Do not assume an existing deployment will pick up the new value.

If the API URL is wrong at build time, the browser will either call
`localhost` or the CSP will block the API request.

---

## 4. Backend CORS must match this frontend

On Render, ensure:

```text
CLIENT_URL=https://voss-two.vercel.app
```

The backend allows this exact normalized origin for credentialed CORS and CSRF
origin validation. The code now also honors `ALLOWED_ORIGINS` for additional
origins, but `CLIENT_URL` alone is sufficient for this deployment.

Do not add a trailing slash to `CLIENT_URL`.

---

## 5. Authentication caveat for cross-domain cookies

The current production pair is:

- Frontend: `https://voss-two.vercel.app`
- Backend: `https://<service>.onrender.com`

These are **different registrable domains**. Public product browsing works
cross-origin with CORS. Cookie-based authentication is more delicate:

- Session cookies are HttpOnly and must be cross-site (`SameSite=None; Secure`)
  to be sent between the two domains.
- The frontend needs to read two non-HttpOnly cookies (`voss_csrf` and
  `voss_auth`) from `document.cookie`. JavaScript on `vercel.app` **cannot read
  cookies set for `onrender.com`**.
- Modern browsers may also block third-party cookies for cross-site requests.

Consequence: with `vercel.app` + `onrender.com`, **product display works, but
login persistence, authenticated cart mutations, and checkout may be
unreliable or blocked**.

### Correct solutions (choose one before relying on accounts/checkout)

1. **Custom domain under one registrable domain (recommended).**
   Serve the storefront and API as sibling subdomains of a domain you own, for
   example `www.zoyagoods.com` and `api.zoyagoods.com`. Then set:

   ```text
   CLIENT_URL=https://www.zoyagoods.com
   COOKIE_DOMAIN=.zoyagoods.com
   COOKIE_SAMESITE=lax
   COOKIE_SECURE=true
   ```

   Cookies become same-site and the storefront can read the CSRF/auth-marker
   cookies.

2. **Same-origin reverse proxy.**
   Have the Next.js app proxy API requests to Render under the same origin
   (for example a rewrite from `/api/:path*` to the Render URL). Browser calls
   become first-party to the Vercel domain. This requires a frontend change and
   should be implemented deliberately.

Do **not** simply switch `COOKIE_SAMESITE` to `none` and disable CSRF. The code
already supports `none` for cross-site sending, but that alone does not make the
SPA-readable CSRF/marker cookies work across different registrable domains.

For a **catalog-only launch** whose goal is to display real products, the
current cross-domain setup is sufficient. Decide on one of the two solutions
above before promising working customer accounts and checkout.

---

## 6. Verification after redeploying

1. Open `https://voss-two.vercel.app` in a fresh browser tab.
2. Open DevTools → Network and filter for the Render hostname.
3. Confirm requests such as:
   - `GET https://<render-service>.onrender.com/api/v1/products?...`
   - `GET https://<render-service>.onrender.com/api/v1/categories`
   return HTTP 200.
4. Confirm products render with images.
5. Check DevTools → Console for Content-Security-Policy errors. If the API
   request is blocked, `NEXT_PUBLIC_API_URL` was wrong at build time or the
   deployment was not rebuilt.
6. Inspect the response headers for the page and confirm the CSP `connect-src`
   includes `https://<render-service>.onrender.com`.
7. From the terminal, confirm the deployed CSP header contains the Render host:

   ```powershell
   curl.exe -sI https://voss-two.vercel.app | Select-String "Content-Security-Policy"
   ```

   (Use `grep` instead of `Select-String` on macOS/Linux.)

8. Confirm the backend health endpoint is green:

   ```powershell
   curl.exe -i https://<render-service>.onrender.com/api/health
   ```

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Product pages empty and network shows `localhost:5000` | `NEXT_PUBLIC_API_URL` not set at build time | add it and redeploy |
| Requests blocked by CSP | CSP built before env var was set | redeploy after setting env |
| CORS error in console | `CLIENT_URL` mismatch (trailing slash, http vs https, wrong domain) | set exact `https://voss-two.vercel.app` on Render |
| Images missing | Image host not in `remotePatterns` or bad image URL | current product images are Unsplash/placeholder URLs already allowed |
| Login succeeds but session does not persist | cross-site cookie restrictions | use custom domain or same-origin proxy |
| 401 loop / redirect to `/login` | refresh cookie blocked cross-site | same as above |

---

## 8. Do not

- Do not hardcode the Render URL in source files.
- Do not commit `.env.local` or any `.env` file.
- Do not put database, JWT, Cloudinary secret, Stripe secret, or SMTP
  credentials in Vercel.
- Do not disable the Content-Security-Policy to make API calls work; configure
  `NEXT_PUBLIC_API_URL` correctly instead.
