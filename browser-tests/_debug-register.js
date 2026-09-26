const { chromium } = require('playwright-core');
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const events = [];
  page.on('response', (r) => {
    if (r.url().includes('/api/')) events.push(`RES ${r.request().method()} ${r.url().replace(BASE, '')} -> ${r.status()}`);
  });
  page.on('console', (m) => { if (m.type() === 'error') events.push(`CONSOLE ${m.text().slice(0, 200)}`); });
  page.on('pageerror', (e) => events.push(`PAGEERROR ${String(e).slice(0, 200)}`));

  // mint a guest session via guest cart activity first
  await page.goto(BASE + '/products/giada-diamond-ring', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await page.locator('button', { hasText: 'Add to Cart' }).first().click();
  await page.waitForTimeout(2000);

  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form');
  const form = page.locator('form').first();
  const email = `dbg-${Date.now().toString(36)}@example.com`;
  await form.getByLabel('First Name').fill('Debug');
  await form.getByLabel('Last Name').fill('Test');
  await form.getByLabel('Email').fill(email);
  await form.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await form.locator('input[type="password"]').nth(1).fill('StrongPass123!');
  events.push('>> click Create Account');
  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await page.waitForTimeout(6000);
  events.push(`>> url now: ${page.url()}`);
  const body = (await page.locator('body').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400);
  events.push(`>> body: ${body}`);
  console.log(events.join('\n'));

  await browser.close();
})();