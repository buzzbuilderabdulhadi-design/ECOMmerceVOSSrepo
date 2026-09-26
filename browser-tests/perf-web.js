// Performance measurement for ZOYA GOODS customer pages.
// RUN FROM WORKSPACE ROOT: node browser-tests/perf-web.js
// Reports navigation timings + per-page API request profile (including any
// duplicated request URLs within a single page load) for guest and authed flows.
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const serverEnv = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
for (const rawLine of serverEnv.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq <= 0) continue;
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  value = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (key && !process.env[key]) process.env[key] = value;
}

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  async function measure(label, url, opts = {}) {
    const requests = {};
    let bytes = 0;
    const onResponse = (res) => {
      const u = res.url();
      if (u.startsWith(API)) {
        const p = u.replace(API, '');
        requests[p] = (requests[p] || 0) + 1;
      }
    };
    page.on('response', onResponse);
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000, ...opts });
    // let async data loads settle
    await page.waitForTimeout((opts.settleMs == null ? 2500 : opts.settleMs));
    const nav = await page.evaluate(() => {
      const p = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByType('paint').find((e) => e.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint').pop();
      return {
        dcl: Math.round((p?.domContentLoadedEventEnd || 0)),
        load: Math.round((p?.loadEventEnd || 0)),
        fcp: Math.round(fcp?.startTime || 0),
        lcp: Math.round(lcp?.startTime || 0),
      };
    });
    const dupes = Object.entries(requests).filter(([, n]) => n > 1);
    const totalMs = Date.now() - t0;
    console.log(`\n[${label}] ${url}`);
    console.log(`  nav: DCL ${nav.dcl}ms  FCP ${nav.fcp}ms  LCP ${nav.lcp}ms  load ${nav.load}ms (wall ${totalMs}ms)`);
    const entries = Object.entries(requests).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [p, n] of entries) console.log(`   x${n} ${p}`);
    console.log(dupes.length ? `  DUPES: ${dupes.map(([p, n]) => `${p} x${n}`).join(', ')}` : '  DUPES: none');
    page.off('response', onResponse);
    return { nav, requests, totalMs, dupes };
  }

  // Guest pages
  await measure('HOME (guest)', BASE + '/', { settleMs: 3000 });
  await measure('SHOP (guest)', BASE + '/shop');
  await measure('PRODUCT (guest)', BASE + '/products/giada-diamond-ring');
  await measure('CART (guest)', BASE + '/cart');
  await measure('LOGIN', BASE + '/login');

  // Authed dashboards
  const email = `perf-${Date.now().toString(36)}@example.com`;
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  const rf = page.locator('form').first();
  await rf.getByLabel('First Name').fill('Perf');
  await rf.getByLabel('Last Name').fill('Test');
  await rf.getByLabel('Email').fill(email);
  await rf.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await rf.locator('input[type="password"]').nth(1).fill('StrongPass123!');
  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await page.waitForTimeout(4000);

  await measure('DASHBOARD (authed)', BASE + '/dashboard');
  await measure('WISHLIST (authed)', BASE + '/wishlist');
  await measure('HOME (authed)', BASE + '/');

  // cleanup
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const found = await prisma.user.findMany({ where: { email, name: 'Perf Test' }, select: { id: true } });
    const ids = found.map((u) => u.id);
if (ids.length) {
      const carts = await prisma.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const cartIds = carts.map((c) => c.id);
      if (cartIds.length) {
        await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
        await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
      }
      await prisma.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
    }
    console.log('\ncleaned perf user');
  } catch (e) {
    console.log('\ncleanup skipped:', String(e && e.message).slice(0, 80));
  } finally {
    await prisma.$disconnect();
  }

  await browser.close();
})();