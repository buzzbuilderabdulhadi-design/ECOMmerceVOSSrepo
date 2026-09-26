// Google OAuth acceptance — every path testable WITHOUT live Google credentials.
// Run from workspace root: node browser-tests/e2e-google-oauth.js
//  * "Sign in with Google" / "Sign up with Google" buttons on /login and /register
//  * not-configured bounce (server has blank GOOGLE_CLIENT_ID) -> /login?google=not_configured + toast
//  * callback page with mismatched state -> local error card
//  * callback page with valid state but server not configured -> graceful error card
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const results = [];
  const step = (name, pass, extra = '') => {
    results.push({ name, pass });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}${extra ? ' -- ' + extra : ''}`);
  };

  // 1. Button presence on both pages
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Google")', { timeout: 20000 }).then(() => step('Login page shows "Sign in with Google"', true)).catch(() => step('Login page shows "Sign in with Google"', false));

  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Google")', { timeout: 20000 }).then(() => step('Register page shows "Sign up with Google"', true)).catch(() => step('Register page shows "Sign up with Google"', false));

  // 2. Clicking Google when not configured -> bounce to /login?google=not_configured + toast
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Google")', { timeout: 20000 });
  await page.locator('button:has-text("Google")').first().click();
  await page.waitForTimeout(4000);
  const url1 = page.url();
  step('Google click bounces away from OAuth domain when not configured', !url1.includes('accounts.google.com'), url1.slice(0, 90));
  step('Bounced to /login with google=not_configured', url1.includes('/login?google=not_configured'), url1.slice(0, 90));
  const toast1 = await page.locator('text=/configured/i').first().isVisible({ timeout: 5000 }).catch(() => false);
  step('"Not configured" toast visible', toast1);

  // 3. Callback state mismatch -> local error card (no server call)
  await ctx.addInitScript(() => localStorage.setItem('zoya_google_state', 'SENT-STATE'));
  await page.goto(BASE + '/auth/google/callback?code=abc123&state=DIFFERENT-STATE', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  const textMismatch = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  const mismatchCard = textMismatch.includes('Sign-in incomplete') && /session expired/i.test(textMismatch);
  step('Callback with mismatched state shows error card', mismatchCard, textMismatch.slice(0, 140));

  // 4. Callback with valid state -> server returns not-configured -> graceful error card
  await ctx.addInitScript(() => localStorage.setItem('zoya_google_state', 'VALIDSECRET'));
  await page.goto(BASE + '/auth/google/callback?code=abc123&state=VALIDSECRET', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  const body4 = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ');
  const hasErrCard = body4.includes('Sign-in incomplete') && /not configured/i.test(body4);
  step('Callback with valid state but unconfigured server shows graceful error', hasErrCard, body4.slice(0, 140));

  console.log('\n================ SUMMARY ================');
  const passN = results.filter((r) => r.pass).length;
  console.log(`TOTAL: ${results.length}  PASS: ${passN}  FAIL: ${results.length - passN}`);

  await browser.close();
  process.exit(passN === results.length ? 0 : 1);
})();