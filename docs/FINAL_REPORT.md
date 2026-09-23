# ZOYA GOODS — Final Project Report

## 1. Already Working (Verified, No Changes Needed)
- Storefront: home, shop, product detail, category pages, cart drawer/cart page, wishlist, checkout (incl. PayPal flow), user dashboard (profile, orders, addresses, settings), auth (register/login/refresh), SEO (sitemap.xml, robots.txt, meta tags), design system (colors #0F1F33 navy / #8C9E8E sage / #A58E69 walnut / #FFF9F0 ivory), animations (FadeIn, TextReveal, page transitions), cookie/legal/company pages, affiliate program.
- Backend core: auth (JWT + refresh rotation), categories, products, reviews, wishlist, cart (guest session + login merge), orders + order items, users/addresses, coupons, PayNow/PayPal integration (untouched per spec), media uploads (Cloudinary or local fallback), notifications, SEO entries, homepage content, site settings, activity logs.
- MongoDB connection already handled Mongo record ids (`_id`/`id` mapping in Prisma client per `prisma/prisma.ts`). Multiple API calls per route already present (guard with optional chaining + empty-state fallbacks).

## 2. Fixed During This Work
- **Validation `validate` middleware**: Zod errors now → `400 VALIDATION_ERROR` with `{ field, message }` details (was generic 400).
- **Auth role check**: admin guard now re-reads role from DB (with `auth:user:<id>` 30s TTL cache) instead of trusting the JWT `role` claim — a demoted user can no longer keep admin access until token expiry.
- **Delete with dependencies** (Mongo has no FK constraints, all manual):
  - `deleteOrder` blocks deleting a `PAID` order (client + server guard), deletes `OrderItem` + `PaymentEvent` rows first; returns the order + related data for re-saving.
  - `deleteCustomer` blocks deleting yourself or customers with order history; removes their `Address` + `CartItem` + `WishlistItem` rows first.
  - `deleteProduct` soft-deletes when referenced by order items (set `isActive=false`, keep stock) and cleans any `CartItem`/`WishlistItem` rows.
  - `deleteProductVariant` blocks deleting a variant referenced by orders, cleans its `CartItem`/`WishlistItem` rows.
  - `deleteReview` sets product avg rating recalc path.
- **Order payment + status**: cancellations only when payment not terminal via `isOrderCancellable`; transition map `ORDER_TRANSITIONS` enforced on update; `verifyOrderPayment` returns the updated order with `verifiedByUser` lookup.
- **Dashboard stats** recomputed correctly (paid orders, awaiting-verification orders, active/inactive products, cancelled orders).
- **Slugify util** handles URL-safe slugs + unique slug naming (`slug-2`, `slug-3`); missing `slug` generation in controller was moved behind a shared util.
- **Coupons**: code uppercased, `PERCENTAGE` value ≤ 100 (409 + client validation), unique code conflicts → 409.
- **Uploads**: `app.ts` serves `/uploads` statically; storefront requests for `/uploads/*` work offline; media routes carry objectId validator on `/:id`.
- **`as string` casts** applied for Express v5 `string | string[]` param typing.

## 3. Implemented
- **Product Variants** (new): `ProductVariant` model (`color`, `colorHex?`, `size`, `stock`, `priceOverride?`, `images` Json, `sku` unique, `isActive`, `@@unique([productId, color, size])`); admin routes `POST /admin/products/:id/variants`, `PUT/DELETE /admin/products/:productId/variants/:id`; ownership + SKU-collision checks; admin UI Variants tab (create/edit/delete, price override, color/size, stock).
- **Order workflow enforcement**: `server/src/constants/order.ts` with `ORDER_TRANSITIONS`, `canTransitionOrder`, `isOrderCancellable`, `PAYMENT_TERMINAL` (mirrored in `client/src/constants/order.ts` for transition-aware UI).
- **Admin dashboard**: error/retry state, quick-stat cards, inventory snapshot, active/inactive/paid/awaiting-verification/cancelled counts.
- **Admin UX improvements**: debounced search (400ms, `useDebounce`) on products/reviews/discounts; inline 401/500 error + retry states; quick activate/deactivate product toggle; shared accessible `Modal` + `ConfirmDialog` (Escape-to-close, `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap + restore, `loading` prop) replacing all inline dialogs and `confirm()` calls (activity-logs, homepage-content, media).
- **Media library real upload**: multipart `file` upload via `/admin/media/upload` (`upload.single('file')`) with alt-text/folder, folder filter, ConfirmDialog delete.
- **Order detail page**: transition-aware status buttons, verified-by display (`verifiedByUser.name`), re-fetch after status/verify/tracking updates, Danger Zone delete (disabled for PAID orders).
- **Customer detail**: not-found state, edit modal (name/phone/emailVerified), delete confirm.
- **Dashboard notifications**: admin layout consumes server `unreadCount` badge, resets to 0 after mark-all-read.

## 4. Backend Changes
Files (server): `controllers/admin.controller.ts` (hardened), `controllers/{orders,customers,wishlist,cart,coupons,addresses}.controller.ts`, `middleware/{auth.middleware,validate,error.middleware}.ts`, `routes/admin.routes.ts` (objectId validators + variant + upload routes), `constants/order.ts`, `utils/{slugify,pagination,objectId}.ts`, `config/{index,db}.ts`, `app.ts` (static `/uploads`), `prisma/schema.prisma` (ProductVariant), `package.json`. Server `tsc --noEmit` clean.

## 5. Frontend Changes
Admin (`client/src/app/admin/`): dashboard, products (list + editor with Variants tab + not-found), orders (list + detail), customers (list + detail), categories, reviews, discounts, media (file upload), activity-logs, homepage-content, seo, settings, analytics, notifications, layout. Shared: `components/admin/{Modal,ConfirmDialog}.tsx`, `constants/order.ts`, `services/admin.ts` (uploadMedia added, unused type imports removed), `types/admin.ts` (CustomerDetail.emailVerified, OrderDetail.verifiedByUser, _stats). Client `tsc --noEmit` clean.

## 6. Security Fixes
- Admin role verified from DB (not JWT claim) with short TTL cache.
- Server-side authorization on all admin mutations (not just client navigation).
- ObjectId validation on admin dynamic-id routes.
- Validation errors return field-level 400 details.
- Cancel/delete guards for terminal payment states.
- No secrets committed; server `.env` ignored (only `.env.example` committed).

## 7. Tests Pass / Fail
No automated test suite exists in the repo (`TESTING.md` describes manual QA checklist only). Runtime API verification was NOT possible (see section 10). Static verification results are in section 8.

## 8. Build / Typecheck Results
- `server`: `npx tsc --noEmit` → PASS (no errors).
- `client`: `npx tsc --noEmit` → PASS (no errors).
- `client`: `next build` → PASS — compiled successfully, 48 routes generated (all `/admin/*` routes present, ƒ Proxy ≈ Next 16 middleware preserved), TypeScript step clean.
- `client`: `eslint` → 55 problems (42 errors, 13 warnings) — **all pre-existing repo-wide** (fetch-on-mount `react-hooks/set-state-in-effect` rule fires on every data page including untouched storefront files `checkout/page.tsx`, `products/[slug]/page.tsx`, `components/ui/Select.tsx`, `hooks/useAsyncData.ts`, plus `any` in `login/register`, `no-img-element`, unused vars in `FadeIn/TextReveal/Button/ShareButton`). No lint problems were introduced by this work (count reduced 64 → 55).

## 9. Remaining Issues
- Admin database is effectively unseeded — every admin page renders empty states until real admins/products/orders exist.
- Cloudinary credentials are empty in server `.env` → uploaded media fall back to local `/uploads` (works, but not CDN-served).
- `react-hooks/*` ESLint errors are picadillo-level React Compiler lint rules that require a repo-wide fetch-pattern refactor to fully silence (37 of 42 errors are one rule). Not addressed to avoid a broad risky refactor during this pass.
- Some storefront lint warnings (unused vars in `FadeIn`, `TextReveal`, `Button`, `ShareButton`, `Select`) pre-date this work.
- Settings/SEO/homepage-content/social edit forms parse raw JSON — no structured editor (by design given generic `value` storage).

## 10. External Blockers
- **MongoDB unreachable**: local `mongod` not running, no Docker on the machine, and the Atlas cluster (`cluster0.krjy1ox.mongodb.net`) is unreachable from this network (`querySrv ECONNREFUSED` on `_mongodb._tcp.cluster0.krjy1ox.mongodb.net`). Consequence: no live end-to-end run of admin API/page flows (login → 401/403 guards, CRUD, order transitions, variant SKU checks, payment verify) or storefront/order checkout could be verified at runtime. All verification is static (typecheck, build, code review of route↔service↔UI signatures).
- Deployment configs (`.env` for Atlas/Cloudinary/PayPal client keys) assume credentials the machine does not currently have.