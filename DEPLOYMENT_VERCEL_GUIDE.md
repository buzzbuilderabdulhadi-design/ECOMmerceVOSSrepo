# ZOYA GOODS — Vercel Frontend Deployment Guide

This guide configures the existing Next.js 16 storefront (`client/`) to call the
Render backend through same-origin API routes. The browser never calls Render
directly.

> The backend URL is not known until you create the Render service. Do not guess
> it. Copy the Render service URL from the dashboard after the service is live.

---

## 1. Vercel project settings

| Setting | Value |
| --- | --- |
| Repository | `buzzbuilderabdulhadi-design/ECOMmerceVOSSrepo` |
| Production Branch | `main` |
| Root Directory | `client` |
| Framework Preset | Next.js |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `.next` (Next.js default — leave blank) |
| Node.js Version | 24.x |

---

## 2. Frontend environment variables

Set these in **Vercel → Project → Settings → Environment Variables**.

### Required

| Name | Value |
| --- | --- |
| `API_PROXY_TARGET` | `https://<render-service-name>.onrender.com` |

Rules for `API_PROXY_TARGET`:

- Must be an absolute `http(s)` URL.
- Must include only the origin: no `/api/v1`, no path, no query, no trailing slash.
- Must not contain credentials.
- Must never use a `NEXT_PUBLIC_` prefix. It is server-only.

Example shape (replace the host):

```text
https://zoya-goods-api.onrender.com
```

The browser calls `/api/v1/products`, `/api/v1/categories`, and
`/api/uploads/...` on `https://voss-two.vercel.app`. Server-side route handlers
in `client/src/app/api/**` forward those requests to `API_PROXY_TARGET` and
preserve cookies, headers, multipart bodies, and query strings.

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

Do **not** add server secrets to Vercel `NEXT_PUBLIC_*` variables. Those values
are embedded in the browser bundle and are public.

---

## 3. Why a redeploy is required

Changing `API_PROXY_TARGET` or any `NEXT_PUBLIC_*` value requires a new
deployment. Save the variables, then trigger a new production deployment.

There is no longer a Render origin in the frontend CSP `connect-src` or in the
Next.js image `remotePatterns`; all browser requests stay on the Vercel origin.

---

## 4. Backend CORS and cookies must match this frontend

On Render, ensure:

```text
CLIENT_URL=https://voss-two.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=lax
TRUST_PROXY=1
```

Leave `COOKIE_DOMAIN` unset. Because the browser only talks to the Vercel
origin, session and CSRF cookies are first-party from the browser's perspective.

---

## 5. Verification after redeploying

1. Open `https://voss-two.vercel.app` in a fresh browser tab.
2. Open DevTools → Network and filter for `/api/v1/`.
3. Confirm requests such as:
   - `GET /api/v1/products?...`
   - `GET /api/v1/categories`
   return HTTP 200 from the Vercel origin.
4. Confirm no browser request goes directly to `*.onrender.com`.
5. Confirm products render with images.
6. Check DevTools → Console for Content-Security-Policy errors.
7. Confirm login, authenticated cart actions, and checkout work if those flows
   are enabled for the deployment.
8. Confirm the backend health endpoint is green:

```powershell
curl.exe -i https://<render-service>.onrender.com/api/health
```

---

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Product pages empty and `/api/v1` returns 500 | `API_PROXY_TARGET` missing or wrong | set the exact Render origin and redeploy |
| Browser requests go to `localhost:5000` | stale deployment or old `NEXT_PUBLIC_API_URL` still set | remove `NEXT_PUBLIC_API_URL`, set `API_PROXY_TARGET`, redeploy |
| CORS error in console | backend `CLIENT_URL` mismatch | set exact `https://voss-two.vercel.app` on Render |
| Login succeeds but session does not persist | cookie/proxy misconfiguration | check `COOKIE_SECURE=true`, `COOKIE_SAMESITE=lax`, `TRUST_PROXY=1` |
| Images missing | bad stored image URL | current product images are Unsplash/placeholder URLs already allowed |

---

## 7. Do not

- Do not hardcode the Render URL in source files.
- Do not commit `.env.local` or any `.env` file.
- Do not put database, JWT, Cloudinary secret, Stripe secret, or SMTP
  credentials in Vercel.
- Do not set `NEXT_PUBLIC_API_URL`; the current architecture uses
  `API_PROXY_TARGET` only.
- Do not disable the Content-Security-Policy to make API calls work.
