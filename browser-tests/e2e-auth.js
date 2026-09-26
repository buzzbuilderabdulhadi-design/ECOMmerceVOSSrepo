// Authentication E2E: admin login + storefront login/register/forgot/reset.
// RUN: node browser-tests/e2e-auth.js
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

const results = [];
const consoleErrors = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

function loadAdminCreds() {
  const content = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
  const get = (k) => (content.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]?.trim() || '';
  return { email: get('ADMIN_EMAIL'), password: get('ADMIN_PASSWORD') };
}

function nowEmail(prefix) {
  return `${prefix}-${Date.now()}@example.com`;
}

(async () => {
  const { email: adminEmail, password: adminPassword } = loadAdminCreds();
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text().slice(0, 180)}`);
  });

  const resetAuth = async () => {
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear()).catch(() => {});
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);
  };

  // ---- 1. Admin login page loads clean ----
  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  step('Admin login page loads', true, `h1="${await page.locator('h1').first().textContent()}"`);

  // ---- 2. Admin login with WRONG password shows error (no crash) ----
  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill('Definitely-Wrong-99');
  await page.locator('button[type="submit"]').click();
  try {
    await page.locator('text=/Invalid email or password/i').first().waitFor({ timeout: 12000 });
    step('Admin login wrong password -> error shown', true, 'Invalid email or password');
  } catch {
    step('Admin login wrong password -> error shown', false, `url=${page.url()} pageText=${(await page.locator('body').innerText().catch(() => '')).slice(0, 160)}`);
  }

  // ---- 3. Admin login with CORRECT password ----
  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill(adminPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 20000 });
  step('Admin login correct -> /admin', true, page.url());

  // ---- 4. Admin sign out returns to admin login ----
  await page.goto(BASE + '/admin', { waitUntil: 'domcontentloaded' });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  const userBtn = page.locator('header button', { hasText: /Admin ZOYA GOODS|A$/ }).first();
  await userBtn.waitFor({ timeout: 15000 }).catch(() => {});
  if ((await userBtn.count()) > 0) {
    await userBtn.click().catch(() => userBtn.dispatchEvent('click'));
    const signOut = page.locator('header button', { hasText: /Sign out/ }).first();
    await signOut.waitFor({ timeout: 10000 }).catch(() => {});
    await signOut.dispatchEvent('click');
  }
  await page.waitForURL('**/admin/login', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  step('Admin sign out returns to admin login', page.url().includes('/admin/login'), page.url());

  // ---- 5. Storefront /login loads ----
  await resetAuth();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 15000 });
  step('Storefront login page loads', true);

  // ---- 6. Storefront login wrong password -> error ----
  await page.getByLabel('Email*', { exact: true }).fill(nowEmail('nosuch'));
  await page.getByLabel('Password*', { exact: true }).fill('WrongPass-123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  try {
    await page.locator('text=/Invalid email or password/i').first().waitFor({ timeout: 12000 });
    step('Storefront login wrong creds -> error shown', true);
  } catch {
    step('Storefront login wrong creds -> error shown', false, 'no error text');
  }

  // ---- 7. Storefront register new account -> authenticated + redirected ----
  await resetAuth();
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Create your account' }).waitFor({ timeout: 15000 });
  const regEmail = nowEmail('e2e');
  await page.getByLabel('First Name*', { exact: true }).fill('E2E');
  await page.getByLabel('Last Name*', { exact: true }).fill('Auth');
  await page.getByLabel('Email*', { exact: true }).fill(regEmail);
  await page.getByLabel('Password*', { exact: true }).fill('Auth-12345!');
  await page.getByLabel('Confirm Password*', { exact: true }).fill('Auth-12345!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await page.waitForURL('http://localhost:3000/', { timeout: 20000 });
  const authed = await page.evaluate(() => Boolean(localStorage.getItem('voss_token')));
  step('Register -> redirected home + authenticated', authed, regEmail);

  // ---- 8. Duplicate registration -> "Email already registered" ----
  await resetAuth();
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('First Name*', { exact: true }).fill('E2E');
  await page.getByLabel('Last Name*', { exact: true }).fill('Auth');
  await page.getByLabel('Email*', { exact: true }).fill(regEmail);
  await page.getByLabel('Password*', { exact: true }).fill('Auth-12345!');
  await page.getByLabel('Confirm Password*', { exact: true }).fill('Auth-12345!');
  await page.getByRole('button', { name: 'Create Account' }).click();
  try {
    await page.locator('text=/Email already registered/i').first().waitFor({ timeout: 12000 });
    step('Duplicate registration -> error shown', true);
  } catch {
    step('Duplicate registration -> error shown', false, 'no conflict error text');
  }

  // ---- 9. Register client-side validation (short password) ----
  await page.getByLabel('Email*', { exact: true }).fill(nowEmail('short'));
  await page.getByLabel('Password*', { exact: true }).fill('Short1');
  await page.getByLabel('Confirm Password*', { exact: true }).fill('Short1');
  await page.getByRole('button', { name: 'Create Account' }).click();
  try {
    await page.locator('text=/Password must be at least 8 characters/i').first().waitFor({ timeout: 10000 });
    step('Register short password validated client-side', true);
  } catch {
    step('Register short password validated client-side', false, 'no validation message');
  }

  // ---- 10. Forgot password (known email) -> success screen ----
  await resetAuth();
  await page.goto(BASE + '/forgot-password', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Forgot Password' }).waitFor({ timeout: 15000 });
  await page.getByLabel('Email Address*', { exact: true }).fill(regEmail);
  await page.getByRole('button', { name: 'Send Reset Link' }).click();
  try {
    await page.getByRole('heading', { name: 'Check Your Email' }).waitFor({ timeout: 12000 });
    step('Forgot password -> success screen', true);
  } catch {
    step('Forgot password -> success screen', false, 'no success screen');
  }

  // ---- 11. Forgot password (unknown email) also succeeds (no user leak) ----
  await page.getByRole('button', { name: /Try again/i }).click();
  await page.getByLabel('Email Address*', { exact: true }).fill(nowEmail('unknown'));
  await page.getByRole('button', { name: 'Send Reset Link' }).click();
  try {
    await page.getByRole('heading', { name: 'Check Your Email' }).waitFor({ timeout: 12000 });
    step('Forgot password unknown email -> no leak, success screen', true);
  } catch {
    step('Forgot password unknown email -> no leak, success screen', false, 'no success screen');
  }

  // ---- 12. Reset password with invalid token -> error (no crash) ----
  await page.goto(BASE + '/reset-password/invalid-token-123', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Reset Password' }).waitFor({ timeout: 15000 });
  await page.getByLabel('New Password*', { exact: true }).fill('NewPass-12345!');
  await page.getByLabel('Confirm Password*', { exact: true }).fill('NewPass-12345!');
  await page.getByRole('button', { name: 'Reset Password' }).click();
  try {
    await page.locator('text=/Invalid or expired/i').first().waitFor({ timeout: 12000 });
    step('Reset password invalid token -> error shown', true);
  } catch {
    step('Reset password invalid token -> error shown', false, 'no error text');
  }

  // ---- 13. Google button bounces to not_configured when unconfigured ----
  const gTab = await context.newPage();
  gTab.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[google] ${msg.text().slice(0, 140)}`); });
  await gTab.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await gTab.getByRole('button', { name: /Sign in with Google/i }).click();
  try {
    await gTab.waitForURL(/google=not_configured/, { timeout: 15000 });
    step('Google unconfigured -> bounces to login?google=not_configured', true, gTab.url());
  } catch {
    step('Google unconfigured -> bounces to login?google=not_configured', false, `url=${gTab.url()}`);
  }
  await gTab.close();

  // ---- 14. Login as registered user -> session persists after hard reload ----
  await resetAuth();
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Email*', { exact: true }).fill(regEmail);
  await page.getByLabel('Password*', { exact: true }).fill('Auth-12345!');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForURL('http://localhost:3000/', { timeout: 20000 });
  const tokenOk = await page.evaluate(() => Boolean(localStorage.getItem('voss_token')));
  step('Login as registered user -> authenticated', tokenOk, regEmail);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const tokenAfterReload = await page.evaluate(() => Boolean(localStorage.getItem('voss_token')));
  step('Session persists after reload', tokenAfterReload);

  console.log('\n================ SUMMARY ================');
  const passes = results.filter((r) => r.ok).length;
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`);
  console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${results.length - passes}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 40)) console.log('  ' + e);
  await browser.close();
  process.exit(results.length - passes > 0 ? 1 : 0);
})();