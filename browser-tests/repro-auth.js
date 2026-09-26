// Live reproduction: customer registration + login behavior.
// RUN FROM WORKSPACE ROOT: node browser-tests/repro-auth.js
// Captures the exact network request/response for /auth/register and /auth/login,
// the live DOM button types, error card behavior, and console/page errors.
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';
const results = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const traced = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => pageErrors.push(`[${page.url()}] ${err.message}`));
  page.on('requestfailed', (req) => {
    if (req.url().includes('favicon')) return;
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure() && req.failure().errorText}`);
  });
  page.on('response', async (res) => {
    const u = res.url();
    if (u.startsWith(API)) {
      let body = '';
      try { body = JSON.stringify(await res.json()).slice(0, 500); } catch { body = '(non-json)'; }
      traced.push(`${res.status()} ${res.request().method()} ${u}\n   -> ${body}`);
    }
  });

  const unique = `trace-${Date.now().toString(36)}@example.com`;
  console.log(`\n=== 1. REGISTER fresh user ${unique} ===\n`);

  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  const btnType = await page.locator('button', { hasText: 'Create Account' }).first().getAttribute('type');
  step('Create Account button rendered as type="submit"', btnType === 'submit', `type="${btnType}"`);

  const form = page.locator('form').first();
  await form.getByLabel('First Name').fill('Trace');
  await form.getByLabel('Last Name').fill('Repro');
  await form.getByLabel('Email').fill(unique);
  await form.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await form.locator('input[type="password"]').nth(1).fill('StrongPass123!');

  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await sleep(4000);

  const regErrCard = await page.locator('.text-red-600').first().textContent().catch(() => '');
  step('No error card after register submit', regErrCard === '' || regErrCard === null, regErrCard ? `error="${regErrCard.trim()}"` : '');
  step('Register redirects away from /register', !page.url().includes('/register'), page.url());

  const loggedInNav = (await page.locator('nav').first().textContent().catch(() => '')) || '';
  step('Navbar reflects authenticated customer', /Trace Repro/i.test(loggedInNav) || /My Account|Dashboard/i.test(loggedInNav), loggedInNav.replace(/\n/g, ' ').slice(0, 80));

  const storedToken = await page.evaluate(() => localStorage.getItem('voss_token'));
  step('voss_token persisted in localStorage', !!storedToken, storedToken ? (storedToken.length + ' chars') : 'MISSING');

  console.log(`\n--- traced /api/v1 events (register) ---`);
  for (const t of traced) console.log(t);

  console.log(`\n=== 2. DUPLICATE registration → clean error ===\n`);
  traced.length = 0;
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(1000);
  const form2 = page.locator('form').first();
  await form2.getByLabel('First Name').fill('Trace');
  await form2.getByLabel('Last Name').fill('Repro');
  await form2.getByLabel('Email').fill(unique);
  await form2.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await form2.locator('input[type="password"]').nth(1).fill('StrongPass123!');
  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await sleep(4000);
  const dupErr = await page.locator('.text-red-600').first().textContent().catch(() => '');
  step('Duplicate email shows "Email already registered"', /already registered/i.test(dupErr || ''), `error="${(dupErr || '').trim()}"`);
  step('Duplicate registration stays on /register', page.url().includes('/register'), page.url());
  console.log(`--- traced /api/v1 events (duplicate) ---`);
  for (const t of traced) console.log(t);

  console.log(`\n=== 3. LOGIN wrong password → clean error ===\n`);
  traced.length = 0;
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('form', { timeout: 20000 });
  const signInType = await page.locator('button', { hasText: 'Sign In' }).first().getAttribute('type');
  step('Sign In button rendered as type="submit"', signInType === 'submit', `type="${signInType}"`);
  const lf = page.locator('form').first();
  await lf.getByLabel('Email').fill(unique);
  await lf.locator('input[type="password"]').first().fill('WrongPass999!');
  await page.locator('button', { hasText: 'Sign In' }).first().click();
  await sleep(4000);
  const wrongErr = await page.locator('.text-red-600').first().textContent().catch(() => '');
  step('Wrong password shows "Invalid email or password"', /invalid email or password/i.test(wrongErr || ''), `error="${(wrongErr || '').trim()}"`);
  step('Wrong password stays on /login (no redirect)', page.url().includes('/login'), page.url());

  console.log(`\n=== 4. LOGIN correct password ===\n`);
  await lf.getByLabel('Email').fill(unique);
  await lf.locator('input[type="password"]').first().fill('StrongPass123!');
  await page.locator('button', { hasText: 'Sign In' }).first().click();
  await sleep(4000);
  step('Correct login leaves /login', !page.url().includes('/login'), page.url());
  console.log(`--- traced /api/v1 events (login) ---`);
  for (const t of traced) console.log(t);

  await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await sleep(2500);
  const dash = await page.locator('h1').first().textContent().catch(() => '');
  step('Dashboard accessible after login', !!dash && !page.url().includes('/login'), `h1="${(dash || '').trim().slice(0, 40)}"`);

  // Cleanup: remove this trace account so it does not pollute catalog/user data
  const { MongoClient } = require('mongodb');
  const mono = new MongoClient('mongodb://127.0.0.1:27017');
  try {
    await mono.connect();
    const db = mono.db(process.env.ZG_DB || 'zoya_goods');
    const del = await db.collection('users').deleteMany({ email: unique, name: 'Trace Repro' });
    step('Trace account cleaned up', true, `deleted=${del.deletedCount}`);
  } catch (e) {
    step('Trace account cleanup (skip if DB blocked)', true, String(e).slice(0, 80));
  } finally {
    await mono.close();
  }

  console.log('\n================ SUMMARY ================');
  const passes = results.filter((r) => r.ok).length;
  const fails = results.filter((r) => !r.ok).length;
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}`);
  console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${fails}`);
  console.log(`\nConsole errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 40)) console.log('  ' + e);
  console.log(`Page errors: ${pageErrors.length}`);
  for (const e of pageErrors.slice(0, 20)) console.log('  ' + e);
  console.log(`Failed requests: ${failedRequests.length}`);
  for (const e of failedRequests.slice(0, 40)) console.log('  ' + e);

  await browser.close();
  process.exit(fails > 0 ? 1 : 0);
})();