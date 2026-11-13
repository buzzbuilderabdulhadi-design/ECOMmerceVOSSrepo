# LAUNCH BLOCKERS

> **Date:** November 13, 2026
> **Scope:** Outstanding items that prevent a fully verified production launch of the payment/checkout system. Code changes are complete and pass all code-level checks; the items below require credentials, external configuration, or tooling work.

---

## 1. BLOCKING — Payment provider credentials not configured

No live payment flow can be exercised end-to-end until these are set. All provider secrets are currently **empty**; PayPal variables are not present at all.

### Stripe (server — `server/.env`)
| Variable | Current | Required for |
|----------|---------|--------------|
| `STRIPE_SECRET_KEY` | empty | Creating/retrieving PaymentIntents |
| `STRIPE_WEBHOOK_SECRET` | empty | Verifying `stripe-signature` on `POST /api/v1/webhooks/stripe` |

### Stripe (client — `client/.env.local`)
| Variable | Current | Required for |
|----------|---------|--------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | empty | Rendering Stripe Elements / PaymentElement |

### PayPal (server — `server/.env`)
| Variable | Current | Required for |
|----------|---------|--------------|
| `PAYPAL_CLIENT_ID` | missing | OAuth token for Orders v2 |
| `PAYPAL_CLIENT_SECRET` | missing | OAuth token for Orders v2 |
| `PAYPAL_ENVIRONMENT` | missing (defaults `sandbox`) | `sandbox` vs `live` |
| `PAYPAL_WEBHOOK_ID` | missing | Verifying `POST /api/v1/webhooks/paypal` signatures |

### Cloudinary (server — `server/.env`)
| Variable | Current | Required for |
|----------|---------|--------------|
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | empty | Product/media uploads (config validation fails without these) |

**Impact:** `GET /checkout/methods` correctly reports every online method as `enabled: false`, and `createOrder` refuses to create an order for an unconfigured provider (fail-safe, by design). Manual methods (bank transfer / Payoneer) remain usable. **No fake success is ever produced.**

**To unblock:** populate the variables above with **sandbox/test** credentials, then run the live verification checklist in §3.

---

## 2. NON-BLOCKING — Tooling

- **Server ESLint is broken (pre-existing).** `server/package.json` runs `eslint src/**/*.ts` but the repo ships a legacy `.eslintrc.json`; ESLint 9.39 requires an `eslint.config.(js|mjs|cjs)` flat config and exits with “couldn't find an eslint.config file”. This predates the payment work. `npx tsc --noEmit` is the effective static gate for the server today. **Fix:** migrate `.eslintrc.json` → `eslint.config.mjs` (out of scope for the payment task).

---

## 3. Live verification checklist (run once credentials exist)

- [ ] Stripe: successful card (no 3DS) → returns to `/checkout`, backend reports `PAID`, order becomes `CONFIRMED`, one confirmation email.
- [ ] Stripe: 3DS card → redirect round-trip verified via `GET …/orders/:id/payment`, no duplicate order/charge on refresh.
- [ ] Stripe: failed card → `FAILED` state shown, **Retry payment** succeeds on the same order (no second order).
- [ ] Stripe: `payment_intent.succeeded` webhook delivered and signature accepted; duplicate delivery is a no-op.
- [ ] Stripe: tampered/partial amount cannot mark an order `PAID` (mismatch is refused and logged).
- [ ] PayPal: approve → capture on `/checkout/paypal` → `PAID`; cancel → interrupted order is re-surfaced with **Complete Payment**.
- [ ] PayPal: a `returnUrl`/`cancelUrl` on a foreign origin is rejected by the API (400).
- [ ] Manual (bank transfer / Payoneer): order is `AWAITING_VERIFICATION`; admin verification moves it to `PAID`; no online charge occurs.
- [ ] Idempotency: double-submitting checkout / refreshing mid-checkout produces exactly one order.
- [ ] Payment-method gating: only configured methods are selectable.

---

## 4. Notes

- The storefront cart is intentionally cleared at order creation; interrupted payments are recovered via the order payment endpoint and the stored pending-order id (see `VOSS-PAYMENT-CHECKOUT-VERIFICATION.md` §5).
- Do not use live credentials for verification. Use provider sandbox/test mode only.
