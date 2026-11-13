# VOSS — PAYMENT & CHECKOUT HARDENING: VERIFICATION REPORT

> **Date:** November 13, 2026
> **Scope:** Make the existing payment/checkout system reliable and production-ready — Stripe return handling, order idempotency, Stripe/PayPal/manual payment correctness, payment-method gating, checkout UX. **No redesign, no auth changes, no new optional features.**
> **Method:** Code-level verification with in-memory mocks (no credentials, no database), plus TypeScript compilation, ESLint and production builds for both server and client.
> **Base commit:** `f8f8e63` (working tree changes are uncommitted by request).

---

## SUMMARY

| Area | Status | Primary Files |
|------|--------|---------------|
| Stripe return / redirect handling (server-verified) | ✅ DONE | `client/src/app/checkout/page.tsx`, `server/src/controllers/checkout.controller.ts` |
| Authoritative payment-status endpoint | ✅ DONE | `server/src/controllers/checkout.controller.ts`, `server/src/routes/checkout.routes.ts` |
| Stripe reconciliation (amount + currency verified, idempotent) | ✅ DONE | `server/src/services/payment/stripe-reconcile.service.ts` |
| Stripe webhook settles through the single choke point | ✅ DONE | `server/src/controllers/webhooks.controller.ts` |
| PaymentIntent resume / no double charge | ✅ DONE | `server/src/controllers/checkout.controller.ts`, `server/src/services/stripe.service.ts`, `server/src/services/payment/providers.ts` |
| Order idempotency race-safety + null-key fix | ✅ DONE | `server/src/controllers/orders.controller.ts` |
| Failed-payment recovery + interrupted-checkout resume | ✅ DONE | `client/src/app/checkout/page.tsx` |
| PayPal return/cancel URL origin validation | ✅ DONE | `server/src/utils/urlSafety.ts`, `server/src/controllers/checkout.controller.ts` |
| Payment-method gating (no unconfigured method offered) | ✅ DONE | `server/src/services/payment/providers.ts`, `client/src/components/layout/Footer.tsx` |
| Order confirmation on settlement | ✅ DONE | `server/src/services/payment/payment-state.service.ts` |
| Code-level test harness (mocks, no credentials) | ✅ DONE | `server/scripts/verify-payment-flows.ts` |

**Result: 39/39 code-level checks pass.** Server `tsc` ✅, Client `tsc` ✅, Client ESLint ✅, Server build ✅, Client production build ✅ (`/checkout` prerenders as static).

---

## 1. PROBLEM FOUND (pre-change)

- **Stripe returns were broken.** `checkout/page.tsx` called `stripe.confirmPayment` with `return_url: window.location.href` and never read `payment_intent` / `redirect_status`; there was no backend verification. The cart was already cleared at order creation, so a 3DS return (or refresh) showed an empty cart and success was declared purely client-side.
- **Order idempotency was racy and could collide.** `createOrder` did `findFirst` then `create` with no unique-conflict handling, and `idempotencyKey` (a `@unique` nullable column) was written as `null` when the client omitted it — on MongoDB a unique index over a nullable field collides on the *second* `NULL`.
- **The Stripe webhook bypassed the paid choke point.** `webhooks.controller.ts` wrote `paymentStatus = PAID` directly via `transitionPayment`, so no customer notification/email ran and no amount/currency was checked against the order.
- **`stripeProvider.createPayment` overwrote `paymentStatus` unconditionally** with `PROCESSING`, which could demote a `PAID` order.
- **PayPal return/cancel URLs were client-supplied and unvalidated** — a customer could make PayPal bounce to an attacker origin.
- **The footer advertised `Apple Pay`**, which is not implemented.

---

## 2. CHANGES

### 2.1 Stripe return handling — server-verified, idempotent
- New `GET /api/v1/checkout/orders/:orderId/payment` returns the authoritative status. For Stripe it **re-reads the PaymentIntent from Stripe** and reconciles it; for PayPal it re-reads the PayPal order and captures settlement if complete. The browser is never trusted to declare success.
- `client/src/app/checkout/page.tsx` now:
  - sends the customer back to `…/checkout?order=<id>` (Stripe appends `payment_intent` + `redirect_status`);
  - uses `redirect: 'if_required'` so frictionless cards stay on-page while 3DS still redirects;
  - on return (and on refresh, since the query string persists) calls the backend, polls briefly while a payment settles, then shows **succeeded / processing / failed / cancelled** states.
- The checkout route is wrapped in `<Suspense>` (required because `useSearchParams` forces client rendering) and the production build confirms `/checkout` still prerenders.

### 2.2 Stripe reconciliation (new service)
`stripe-reconcile.service.ts` is the single place an observed PaymentIntent is compared to the order:
- `succeeded` is accepted **only if amount AND currency match** the server-authoritative total; otherwise the order is failed and an error is logged — it is never marked paid.
- `canceled` → failed; `processing` → PROCESSING; `requires_*` → unchanged.
- All transitions are guarded conditional updates; the customer notification/email runs only through `setOrderPaid`.
- The webhook now routes `payment_intent.succeeded` through this service (same code path as the verify endpoint), so webhook and browser can never disagree. `payment_failed` / `canceled` / `charge.refunded` keep their existing transitions.

### 2.3 PaymentIntent resume — no double charge
- `createOrderPaymentIntent` re-reads any stored intent: a live intent is handed back (same secret), a succeeded intent is reconciled and reported (no secret returned), and a **cancelled** intent triggers a genuinely new one keyed `zg_order_<id>_retry_<oldPiId>` (the default key would replay the dead intent for 24h).
- `stripeProvider.createPayment` now performs a **guarded** `updateMany` (only from PENDING/PROCESSING/FAILED) so it can never demote a `PAID` order, and throws if the order settled first.

### 2.4 Order idempotency — race-safe
- Every order now carries a **non-null** idempotency key: the client value when present, otherwise a server-generated `randomUUID()`. This eliminates the nullable-unique collision entirely.
- The `create` is wrapped: a `P2002` unique violation (concurrent duplicate) releases this request's stock/coupon reservations and returns the winning order. `releaseReservations` is now idempotent (drains its lists) so a double call cannot double-restock.
- The client key is persisted in `sessionStorage` keyed by a **cart signature**, so it survives refresh but rotates when the cart changes — an interrupted checkout reuses the same key, while a new cart gets a new one.

### 2.5 PayPal
- `createPayPalOrderForCheckout` rejects any `returnUrl` / `cancelUrl` whose origin is not in the configured allowlist (`isAllowedOrigin`, exact scheme+host match; look-alike, scheme-swapped and `javascript:` URLs are rejected).
- Cancel returns to `/checkout?cancelled=paypal`; the page now re-surfaces the interrupted order (via the stored pending-order id) with a **Complete Payment** action instead of a dead empty-cart screen.

### 2.6 Order confirmation & status
- On verified settlement, `onOrderPaid` now performs a guarded `PENDING → CONFIRMED` order-status update (a no-op if an admin already advanced it), in addition to the existing notify/email.

### 2.7 Payment-method gating
- Server already refuses to create an order for an unconfigured provider and only advertises configured methods via `GET /checkout/methods`; the client disables unavailable options. Removed the unimplemented **Apple Pay** badge from `Footer.tsx`.

---

## 3. TEST RESULTS (code-level, mocks — no credentials)

`server/scripts/verify-payment-flows.ts` mocks Prisma, config and the notification/email side effects, then exercises the **real** reconciliation and guarded payment-state services.

**Run:** `npx ts-node --transpile-only scripts/verify-payment-flows.ts` → **39 passed, 0 failed**

| Group | Coverage | Result |
|-------|----------|--------|
| State machine | PENDING→PAID allowed, PAID→REFUNDED allowed, PAID→PROCESSING forbidden, CANCELLED terminal, method normalization, manual detection | ✅ |
| Money helpers | `toCents` / `fromCents` round-trip | ✅ |
| URL allow-list | exact origin allowed; look-alike attacker origin, scheme-swapped, `javascript:`, garbage all rejected | ✅ |
| Reconcile success | settles once → PAID, auto-CONFIRMED, notify+email exactly once; duplicate reconcile is a no-op with no second notify/email | ✅ |
| Reconcile mismatch | amount mismatch and currency mismatch → `amount_mismatch`, order failed, **never PAID**, no notification | ✅ |
| Reconcile non-terminal | `processing`→PROCESSING; `requires_action` unchanged; `canceled`→FAILED; unknown PI→`no_order` | ✅ |
| Guarded transitions | `setOrderPaid` from PENDING succeeds; from PAID is a no-op; `setOrderPaymentFailed` cannot demote a PAID order | ✅ |

---

## 4. REGRESSION / BUILD CHECKS

| Check | Command | Result |
|-------|---------|--------|
| Server typecheck | `server: npx tsc --noEmit` | ✅ 0 errors |
| Client typecheck | `client: npx tsc --noEmit` | ✅ 0 errors |
| Client lint | `client: npx eslint` | ✅ 0 problems |
| Server build | `server: npm run build` | ✅ |
| Client production build | `client: npm run build` | ✅ 49 routes; `/checkout` prerendered (static) — Suspense boundary effective |
| Server lint | `server: npm run lint` | ⚠️ **pre-existing tooling break** — see `LAUNCH_BLOCKERS.md` (ESLint 9 needs a flat config; repo has `.eslintrc.json`) |

---

## 5. DESIGN DECISIONS / TRADE-OFFS

- **Cart is still cleared at order creation** (unchanged). Deferring it until payment confirmation would reopen a double-order/double-reserve window without interactive transactions on MongoDB. Instead, interrupted/failed payments are recoverable via the order's payment endpoint, the stored pending-order id, and PI reuse — so no second charge and no second order.
- **Only verified server state marks PAID.** The client never sets success; it reflects the backend (which re-reads the provider).
- **One new endpoint** was added (`GET …/orders/:orderId/payment`); it is ownership-checked, Zod-validated and read-rate-limited.

---

## 6. NOT VERIFIED / BLOCKED

All live end-to-end provider flows are **BLOCKED BY CREDENTIALS** — no Stripe/PayPal keys are configured (see `LAUNCH_BLOCKERS.md`). The following were verified by code/mocks only and require sandbox credentials to confirm live:

- Stripe 3DS redirect round-trip, webhook delivery/signature, and `payment_intent.succeeded` reconciliation against a real sandbox.
- PayPal approval + capture and webhook (signature, capture id, amount/currency).
- Manual (bank transfer / Payoneer) admin verification against a live database.
