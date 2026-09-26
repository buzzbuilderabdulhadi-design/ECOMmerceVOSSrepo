// Live verification of the reworked customer auth UX.
// RUN FROM WORKSPACE ROOT: node browser-tests/verify-auth-ux.js
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
const results = [];
const consoleErrors = [];
const pageErrors = [];
const apiEvents = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}
let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`); });
  page.on('pageerror', (err) => pageErrors.push(`[${page.url()}] ${err.message}`));
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('/api/v1/')) {
      let body = '';
      try { body = JSON.stringify(await res.json()).slice(0, 200); } catch { body = '(non-json)'; }
      apiEvents.push({ at: Date.now(), stamp: '', status: res.status(), method: res.request().method(), url: u.replace('http://localhost:5000/api/v1', ''), body });
    }
  });

  const unique = `verify-${Date.now().toString(36)}@example.com`;

  console.log('\n=== 1. REGISTER → navbar shows authenticated account ===\n');
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  const googleBtnOnRegister = await page.locator('button', { hasText: 'Sign up with Google' }).count();
  step('Register page has "Sign up with Google" button', googleBtnOnRegister > 0);
  const regForm = page.locator('form').first();
  await regForm.getByLabel('First Name').fill('AuthUX');
  await regForm.getByLabel('Last Name').fill('Verifier');
  await regForm.getByLabel('Email').fill(unique);
  await regForm.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await regForm.locator('input[type="password"]').nth(1).fill('StrongPass123!');
  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await page.waitForURL('**/!(register)**', { timeout: 20000 }).catch(() => {});
  await sleep(2500);

  const accountMenu = page.locator('button[aria-label="Account menu"]');
  const menuVisible = await accountMenu.waitFor({ state: 'visible', timeout: 15000 }).then(() => true).catch(() => false);
  step('Navbar shows account menu after register', menuVisible);

  // open it and check identity + Sign Out
  if (menuVisible) {
    await accountMenu.click();
    await sleep(600);
    const menuText = (await page.locator('text=/AuthUX Verifier/').count()) > 0;
    const signOutInMenu = (await page.locator('button', { hasText: 'Sign Out' }).count()) > 0;
    step('Account menu shows full name + email', menuText);
    step('Sign Out option present in menu', signOutInMenu);
  }

  console.log('\n=== 2. WRONG-PASSWORD login while a valid session exists (was the refresh storm) ===\n');
  apiEvents.length = 0;
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  const googleBtnOnLogin = await page.locator('button', { hasText: 'Sign in with Google' }).count();
  step('Login page has "Sign in with Google" button', googleBtnOnLogin > 0);
  const lf = page.locator('form').first();
  await lf.getByLabel('Email').fill(unique);
  await lf.locator('input[type="password"]').first().fill('WrongPass999!');
  await page.locator('button', { hasText: 'Sign In' }).first().click();
  await sleep(3500);
  const wrongErr = (await page.locator('.text-red-600').first().textContent().catch(() => '')) || '';
  step('Wrong password shows clean error', /invalid email or password/i.test(wrongErr), `"${wrongErr.trim()}"`);
  step('Wrong password stays on /login', page.url().includes('/login'));

  const refreshCalls = apiEvents.filter((e) => e.url.includes('/auth/refresh'));
  const loginPosts = apiEvents.filter((e) => e.url.includes('/auth/login'));
  step('No /auth/refresh triggered by failed login', refreshCalls.length === 0, `refresh=${refreshCalls.length}`);
  step('Only ONE login POST (no auto-resubmit)', loginPosts.length === 1, `login posts=${loginPosts.length}`);

  console.log('\n=== 3. CORRECT login ===\n');
  await lf.getByLabel('Email').fill(unique);
  await lf.locator('input[type="password"]').first().fill('StrongPass123!');
  await page.locator('button', { hasText: 'Sign In' }).first().click();
  await page.waitForTimeout(3000);
  const acct2 = await page.locator('button[aria-label="Account menu"]').waitFor({ state: 'visible', timeout: 12000 }).then(() => true).catch(() => false);
  step('Account menu visible after login', acct2, page.url());

  console.log('\n=== 4. SIGN OUT via navbar ===\n');
  await page.locator('button[aria-label="Account menu"]').click();
  await sleep(500);
  await page.locator('button', { hasText: 'Sign Out' }).first().click();
  await sleep(2500);
  const signInLink = await page.locator('a[aria-label="Sign in"]').waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);
  const noAccountMenu = (await page.locator('button[aria-label="Account menu"]').count()) === 0;
  step('Navbar shows Sign In after logout', signInLink);
  step('Account menu removed after logout', noAccountMenu);

  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  step('Protected /dashboard redirects to login after sign out', page.url().includes('/login'), page.url());

  console.log('\n=== 5. GOOGLE not-configured graceful path ===\n');
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  await page.locator('button', { hasText: 'Sign in with Google' }).first().click();
  await sleep(3000);
  const url = page.url();
  step('Google redirect bounces back to /login when not configured', url.includes('/login') && url.includes('google'), url.slice(-60));
  const toastText = (await page.locator('div[role="status"]').last().textContent().catch(() => '')) || '';
  step('"Not configured" toast shown', /configured/i.test(toastText), toastText.slice(0, 80));

  console.log('\n=== 6. CLEANUP test accounts ===\n');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const found = await prisma.user.findMany({
      where: {
        OR: [
          { email: { startsWith: 'verify-' }, name: 'AuthUX Verifier' },
          { email: { startsWith: 'trace-' }, name: 'Trace Repro' },
        ],
      },
      select: { id: true },
    });
    const ids = found.map((u) => u.id);
    if (ids.length > 0) {
      const carts = await prisma.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const cartIds = carts.map((c) => c.id);
      if (cartIds.length) {
        await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
        await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
      }
      await prisma.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
    }
    const del = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    step('Test accounts cleaned from DB', true, `deleted=${del.count}`);
  } catch (e) {
    step('Cleanup (skip if DB blocked)', true, String(e && e.message).slice(0, 100));
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n================ SUMMARY ================');
  const passes = results.filter((r) => r.ok).length;
  const fails = results.filter((r) => !r.ok).length;
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}`);
  console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${fails}`);
  console.log(`\nConsole errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 30)) console.log('  ' + e);
  console.log(`Page errors: ${pageErrors.length}`);
  for (const e of pageErrors.slice(0, 15)) console.log('  ' + e);

  await browser.close();
  process.exit(fails > 0 ? 1 : 0);
})();