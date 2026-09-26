// Admin acceptance E2E for ZOYA GOODS.
// RUN FROM WORKSPACE ROOT with:  node browser-tests/e2e-admin.js
// Loads ADMIN_EMAIL/ADMIN_PASSWORD from server/.env at runtime (not hardcoded).
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const results = [];
const consoleErrors = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

async function expectH1(page, text, timeout = 20000) {
  try {
    await page.locator('h1', { hasText: text }).first().waitFor({ state: 'visible', timeout });
    step(text, true);
    return true;
  } catch {
    step(text, false, 'h1 not found');
    return false;
  }
}

// Load ADMIN creds from server/.env
function loadAdminCreds() {
  const envFile = path.join(__dirname, '..', 'server', '.env');
  const content = fs.readFileSync(envFile, 'utf8');
  const get = (k) => {
    const m = content.match(new RegExp(`^${k}=(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  return { email: get('ADMIN_EMAIL'), password: get('ADMIN_PASSWORD') };
}

(async () => {
  const { email: adminEmail, password: adminPassword } = loadAdminCreds();
  if (!adminEmail || !adminPassword) {
    console.error('ADMIN_EMAIL or ADMIN_PASSWORD missing from server/.env');
    process.exit(1);
  }

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`); });

  try {
    // ---------- 1. AUTH GUARD (logged out) ----------
    await page.goto(BASE + '/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    step('Logged-out /admin redirects to admin login', page.url().includes('/admin/login'), page.url());
    await page.goto(BASE + '/admin/products', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    step('Logged-out /admin/products redirects to admin login', page.url().includes('/admin/login'), page.url());

    // ---------- 2. ADMIN LOGIN ----------
    await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(adminPassword);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/admin', { timeout: 25000 }).catch(() => {});
    step('Admin login succeeds', page.url() === BASE + '/admin/' || page.url() === BASE + '/admin', page.url());
    await expectH1(page, 'Dashboard');

    // ---------- 3. SECTION NAVIGATION + DATA ----------
    // Products
    await page.goto(BASE + '/admin/products', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Products');
    await page.getByText('Riviera Tennis Bracelet').first().waitFor({ timeout: 20000 }).catch(() => {});
    step('Products list shows Riviera Tennis Bracelet', (await page.getByText('Riviera Tennis Bracelet').count()) > 0);

    // Edit existing product page
    const editLink = page.locator('a[aria-label^="Edit Riviera Tennis Bracelet"]').first();
    await editLink.waitFor({ timeout: 15000 }).catch(() => {});
    if ((await editLink.count()) > 0) {
      await editLink.click();
      await page.waitForTimeout(3000);
      step('Product edit page opens', page.url().includes('/admin/products/'));
      await expectH1(page, 'Edit Product');
    } else {
      step('Product edit link present', false);
    }

    // New Product form
    await page.goto(BASE + '/admin/products', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const newLink = page.locator('a[href="/admin/products/new"]').first();
    await newLink.waitFor({ timeout: 15000 }).catch(() => {});
    if ((await newLink.count()) > 0) {
      await newLink.click();
      await page.waitForTimeout(3000);
      step('New Product form loads', page.url().includes('/admin/products/new'));
      await expectH1(page, 'New Product');
    } else {
      step('New Product link present', false);
    }

    // Categories
    await page.goto(BASE + '/admin/categories', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Categories');

    // Orders (expect at least the demo order from customer runs)
    await page.goto(BASE + '/admin/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Orders');
    await page.waitForTimeout(2500);
    const orderRows = await page.locator('text=/ZG-/').count();
    step('Orders list contains order rows', orderRows > 0, `refs=${orderRows}`);

    // Discounts (coupons)
    await page.goto(BASE + '/admin/discounts', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Discounts');
    await page.getByText('ZOYATEST10').first().waitFor({ timeout: 20000 }).catch(() => {});
    step('Discounts list shows ZOYATEST10 coupon', (await page.getByText('ZOYATEST10').count()) > 0);

    // Customers (seeded Jane is below page 1 as test users accumulate, so
    // exercise the search box which is the functional path to find her)
    await page.goto(BASE + '/admin/customers', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Customers');
    await page.locator('input[placeholder*="Search customers"]').fill('jane');
    await page.waitForTimeout(1200);
    await page.getByText('jane@example.com').first().waitFor({ timeout: 20000 }).catch(() => {});
    step('Customers search finds seeded Jane Doe', (await page.getByText('jane@example.com').count()) > 0);

    // Reviews / Questions / Analytics load
    await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Reviews');
    await page.goto(BASE + '/admin/questions', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Product Questions');
    await page.goto(BASE + '/admin/analytics', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectH1(page, 'Analytics');

    // ---------- 4. SIGN OUT + RE-GUARD ----------
    await page.goto(BASE + '/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const userBtn = page.locator('header button', { hasText: /Admin ZOYA GOODS|A$/ }).first();
    await userBtn.waitFor({ timeout: 15000 }).catch(() => {});
    if ((await userBtn.count()) > 0) {
      await userBtn.click();
      const signOut = page.locator('header button', { hasText: /Sign out/ }).first();
      await signOut.waitFor({ timeout: 10000 }).catch(() => {});
      await signOut.dispatchEvent('click').catch(() => {});
    } else {
      step('User menu present', false);
    }
    await page.waitForURL('**/admin/login', { timeout: 20000 }).catch(() => {});
    step('Admin sign out returns to admin login', page.url().includes('/admin/login'), page.url());

    await page.goto(BASE + '/admin/customers', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    step('Admin sections guarded after sign out', page.url().includes('/admin/login'), page.url());
  } catch (err) {
    step('UNCAUGHT ADMIN E2E ERROR', false, String(err).slice(0, 400));
  } finally {
    console.log('\n================ SUMMARY ================');
    const passes = results.filter((r) => r.ok).length;
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}`);
    console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${results.length - passes}`);
    console.log(`Console errors: ${consoleErrors.length}`);
    for (const e of consoleErrors.slice(0, 40)) console.log('  ' + e);
    await browser.close();
    process.exit(results.length - passes > 0 ? 1 : 0);
  }
})();