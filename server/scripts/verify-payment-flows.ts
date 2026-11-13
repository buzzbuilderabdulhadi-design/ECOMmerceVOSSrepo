/* eslint-disable no-console */
// ============================================================
// Code-level verification for the payment/checkout hardening.
//
// No credentials and no database are required: the Prisma client, config and
// outbound notification/email side effects are replaced with in-memory fakes
// before the real services are loaded. This exercises the *real*
// reconciliation + guarded payment-state logic.
//
// Run: npx ts-node --transpile-only scripts/verify-payment-flows.ts
// ============================================================

import path from 'path';

// ------------------------------------------------------------
// Tiny test harness
// ------------------------------------------------------------
let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail?: string): void {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    failures.push(name + (detail ? ` — ${detail}` : ''));
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ------------------------------------------------------------
// Module mocking (inject into require.cache before requiring the services)
// ------------------------------------------------------------
type Order = Record<string, any>;

const orders = new Map<string, Order>();
let notifyPaidCalls = 0;
let emailPaidCalls = 0;

function matchesWhere(order: Order, where: any): boolean {
  return Object.entries(where).every(([key, expected]) => {
    const actual = order[key];
    if (expected && typeof expected === 'object') {
      if ('in' in expected) return (expected.in as any[]).includes(actual);
      if ('gte' in expected) return actual >= expected.gte;
      if ('gt' in expected) return actual > expected.gt;
      if ('lt' in expected) return actual < expected.lt;
    }
    return actual === expected;
  });
}

function applyData(order: Order, data: any): void {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object') {
      const op = value as any;
      if ('increment' in op) {
        order[key] = (order[key] ?? 0) + op.increment;
        continue;
      }
      if ('decrement' in op) {
        order[key] = (order[key] ?? 0) - op.decrement;
        continue;
      }
    }
    order[key] = value;
  }
}

function project(order: Order, select?: any): any {
  if (!select) return { ...order };
  const out: Record<string, any> = {};
  for (const key of Object.keys(select)) {
    if (select[key]) out[key] = order[key];
  }
  return out;
}

const fakePrisma: any = {
  order: {
    async findUnique({ where, select }: any) {
      let found: Order | undefined;
      if (where.id) found = orders.get(where.id);
      else if (where.stripePaymentIntentId) {
        found = [...orders.values()].find((o) => o.stripePaymentIntentId === where.stripePaymentIntentId);
      }
      return found ? project(found, select) : null;
    },
    async findFirst({ where, select }: any) {
      const found = [...orders.values()].find((o) => matchesWhere(o, where));
      return found ? project(found, select) : null;
    },
    async updateMany({ where, data }: any) {
      let count = 0;
      for (const order of orders.values()) {
        if (matchesWhere(order, where)) {
          applyData(order, data);
          count += 1;
        }
      }
      return { count };
    },
    async update({ where, data, select }: any) {
      const order = orders.get(where.id);
      if (!order) throw new Error('order not found');
      applyData(order, data);
      return project(order, select);
    },
    async create({ data }: any) {
      orders.set(data.id, { ...data });
      return { ...data };
    },
  },
  paymentEvent: {
    async findUnique({ where }: any) {
      return null;
    },
    async create() {
      return {};
    },
  },
  coupon: { async update() { return {}; } },
};

const fakeConfig: any = {
  env: 'test',
  currency: 'USD',
  client: { url: 'http://localhost:3000' },
  cors: { allowedOrigins: ['http://localhost:3000'] },
};

function mockModule(modulePath: string, exports: any): void {
  const resolved = require.resolve(modulePath);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (require.cache as any)[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
}

mockModule(path.resolve(__dirname, '..', 'src', 'config', 'db'), fakePrisma);
mockModule(path.resolve(__dirname, '..', 'src', 'config', 'index'), {
  __esModule: true,
  default: fakeConfig,
  ...fakeConfig,
});
mockModule(path.resolve(__dirname, '..', 'src', 'services', 'notification.service'), {
  notifyOrderPaid: async () => {
    notifyPaidCalls += 1;
  },
  notifyOrderCreated: async () => {},
  notifyAdminsLowStock: async () => {},
});
mockModule(path.resolve(__dirname, '..', 'src', 'utils', 'email'), {
  sendPaymentConfirmationEmail: async () => {
    emailPaidCalls += 1;
  },
  sendOrderConfirmationEmail: async () => {},
  sendManualPaymentEmail: async () => {},
});

// Now load the real modules under test.
const { reconcileStripePaymentIntent } = require(path.resolve(
  __dirname,
  '..',
  'src',
  'services',
  'payment',
  'stripe-reconcile.service'
));
const paymentState = require(path.resolve(__dirname, '..', 'src', 'services', 'payment', 'payment-state.service'));
const orderConstants = require(path.resolve(__dirname, '..', 'src', 'constants', 'order'));
const pricing = require(path.resolve(__dirname, '..', 'src', 'utils', 'pricing'));
const { isAllowedOrigin } = require(path.resolve(__dirname, '..', 'src', 'utils', 'urlSafety'));

function seedOrder(overrides: Partial<Order> = {}): Order {
  const id = overrides.id ?? `order-${orders.size + 1}`;
  const order: Order = {
    id,
    orderNumber: `ZG-${id}`,
    userId: 'user-1',
    status: 'PENDING',
    paymentStatus: 'PENDING',
    paymentMethod: 'STRIPE',
    total: 100,
    stripePaymentIntentId: null,
    user: { id: 'user-1', name: 'Test', email: 'test@example.com' },
    ...overrides,
  };
  orders.set(id, order);
  return order;
}

async function run(): Promise<void> {
  // ----------------------------------------------------------
  section('Order/payment state machine (pure)');
  check('PENDING -> PAID allowed', orderConstants.canTransitionPayment('PENDING', 'PAID'));
  check('PAID -> REFUNDED allowed', orderConstants.canTransitionPayment('PAID', 'REFUNDED'));
  check('PAID -> PROCESSING forbidden', !orderConstants.canTransitionPayment('PAID', 'PROCESSING'));
  check('CANCELLED is terminal', !orderConstants.canTransitionPayment('CANCELLED', 'PAID'));
  check('card normalizes to STRIPE', orderConstants.normalizePaymentMethod('card') === 'STRIPE');
  check('BANK_TRANSFER is manual', orderConstants.isManualPaymentMethod('BANK_TRANSFER'));
  check('STRIPE is not manual', !orderConstants.isManualPaymentMethod('STRIPE'));

  section('Money helpers (pure)');
  check('toCents rounds to integer cents', pricing.toCents(19.99) === 1999);
  check('fromCents converts back', pricing.fromCents(1999) === 19.99);

  section('Redirect URL origin allow-listing (pure)');
  check(
    'exact origin allowed',
    isAllowedOrigin('http://localhost:3000/checkout/paypal?orderId=1', ['http://localhost:3000'])
  );
  check(
    'look-alike attacker origin rejected',
    !isAllowedOrigin('http://localhost:3000.evil.com/x', ['http://localhost:3000'])
  );
  check(
    'different scheme rejected',
    !isAllowedOrigin('https://localhost:3000/x', ['http://localhost:3000'])
  );
  check('javascript: rejected', !isAllowedOrigin('javascript:alert(1)', ['http://localhost:3000']));
  check('garbage rejected', !isAllowedOrigin('not a url', ['http://localhost:3000']));

  // ----------------------------------------------------------
  section('Stripe reconciliation — verified success settles the order once');
  notifyPaidCalls = 0;
  emailPaidCalls = 0;
  const paidOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_paid_1' });
  const r1 = await reconcileStripePaymentIntent({
    id: 'pi_paid_1',
    status: 'succeeded',
    amount: 10000,
    currency: 'usd',
  });
  check('outcome is paid', r1.outcome === 'paid', JSON.stringify(r1));
  check('paymentStatus is PAID', orders.get(paidOrder.id)!.paymentStatus === 'PAID');
  check('order auto-confirmed PENDING -> CONFIRMED', orders.get(paidOrder.id)!.status === 'CONFIRMED');

  // Notification/email are intentionally fire-and-forget; let them settle.
  await new Promise((resolve) => setTimeout(resolve, 20));
  check('customer notified exactly once', notifyPaidCalls === 1, `calls=${notifyPaidCalls}`);
  check('confirmation email sent exactly once', emailPaidCalls === 1, `calls=${emailPaidCalls}`);

  const r2 = await reconcileStripePaymentIntent({
    id: 'pi_paid_1',
    status: 'succeeded',
    amount: 10000,
    currency: 'usd',
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  check('duplicate succeeded reconcile is a no-op', r2.outcome === 'unchanged', JSON.stringify(r2));
  check('no duplicate notification', notifyPaidCalls === 1, `calls=${notifyPaidCalls}`);
  check('no duplicate email', emailPaidCalls === 1, `calls=${emailPaidCalls}`);

  // ----------------------------------------------------------
  section('Stripe reconciliation — amount mismatch is refused');
  notifyPaidCalls = 0;
  const mismatchOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_mismatch' });
  const rm = await reconcileStripePaymentIntent({
    id: 'pi_mismatch',
    status: 'succeeded',
    amount: 5000,
    currency: 'usd',
  });
  check('outcome is amount_mismatch', rm.outcome === 'amount_mismatch', JSON.stringify(rm));
  check('order NOT marked paid', orders.get(mismatchOrder.id)!.paymentStatus !== 'PAID');
  check('order marked failed', orders.get(mismatchOrder.id)!.paymentStatus === 'FAILED');
  check('customer never notified', notifyPaidCalls === 0);

  // ----------------------------------------------------------
  section('Stripe reconciliation — currency mismatch is refused');
  const currencyOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_currency' });
  const rc = await reconcileStripePaymentIntent({
    id: 'pi_currency',
    status: 'succeeded',
    amount: 10000,
    currency: 'eur',
  });
  check('outcome is amount_mismatch', rc.outcome === 'amount_mismatch', JSON.stringify(rc));
  check('order NOT marked paid', orders.get(currencyOrder.id)!.paymentStatus !== 'PAID');

  // ----------------------------------------------------------
  section('Stripe reconciliation — non-terminal intents never settle');
  const procOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_proc' });
  const rp = await reconcileStripePaymentIntent({
    id: 'pi_proc',
    status: 'processing',
    amount: 10000,
    currency: 'usd',
  });
  check('outcome is processing', rp.outcome === 'processing', JSON.stringify(rp));
  check('order moved to PROCESSING', orders.get(procOrder.id)!.paymentStatus === 'PROCESSING');

  const actionOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_action' });
  const ra = await reconcileStripePaymentIntent({
    id: 'pi_action',
    status: 'requires_action',
    amount: 10000,
    currency: 'usd',
  });
  check('requires_action leaves order unchanged', ra.outcome === 'unchanged', JSON.stringify(ra));
  check('order stays PENDING', orders.get(actionOrder.id)!.paymentStatus === 'PENDING');

  const cancelOrder = seedOrder({ total: 100, stripePaymentIntentId: 'pi_cancel' });
  const rcan = await reconcileStripePaymentIntent({
    id: 'pi_cancel',
    status: 'canceled',
    amount: 10000,
    currency: 'usd',
  });
  check('canceled intent fails the order', rcan.outcome === 'failed', JSON.stringify(rcan));
  check('order marked FAILED', orders.get(cancelOrder.id)!.paymentStatus === 'FAILED');

  const unknown = await reconcileStripePaymentIntent({
    id: 'pi_unknown',
    status: 'succeeded',
    amount: 10000,
    currency: 'usd',
  });
  check('unknown PaymentIntent is no_order', unknown.outcome === 'no_order', JSON.stringify(unknown));

  // ----------------------------------------------------------
  section('Guarded payment transitions (real service)');
  const guardOrder = seedOrder({ paymentStatus: 'PENDING' });
  const firstPaid = await paymentState.setOrderPaid(guardOrder.id);
  check('setOrderPaid from PENDING succeeds', firstPaid === true);
  const secondPaid = await paymentState.setOrderPaid(guardOrder.id);
  check('setOrderPaid from PAID is a guarded no-op', secondPaid === false);

  const failedFromPaid = await paymentState.setOrderPaymentFailed(guardOrder.id);
  check('setOrderPaymentFailed cannot demote a PAID order', failedFromPaid === false);
  check('paid order remains PAID', orders.get(guardOrder.id)!.paymentStatus === 'PAID');

  // ----------------------------------------------------------
  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
