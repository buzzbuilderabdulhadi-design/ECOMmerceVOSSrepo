import { chromium } from 'playwright-core';
import { getAdminToken, envGet } from './lib/auth.mjs';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

const adminToken = await getAdminToken();
const prods = await (await fetch(API + '/admin/products?page=1&limit=1', { headers: { Authorization: `Bearer ${adminToken}` } })).json();
const prodId = prods.data[0].id;

const custEmail = `prob4-${Date.now()}@example.com`;
await fetch(API + '/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Probe4 User', email: custEmail, password: 'Probe-12345!' }),
});
const cv = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: custEmail, password: 'Probe-12345!' }) });
const cvj = await cv.json();
const cr = await fetch(API + '/reviews', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cvj.data.accessToken}` },
  body: JSON.stringify({ productId: prodId, rating: 5, title: 'ZZZProbe4 review', text: 'probe four body' }),
});
console.log('review create:', cr.status);

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

page.on('console', (m) => { if (m.type() !== 'log') console.log('CONSOLE[' + m.type() + ']:', m.text().slice(0, 150)); });
page.on('pageerror', (e) => console.log('PAGEERROR:', String(e).slice(0, 200)));
page.on('response', (r) => {
  const u = r.url();
  if (!u.includes('/_next/static')) {
    console.log('RESP:' + r.status() + ' ' + u.replace(BASE, ''));
  }
});

await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
await page.locator('input[type="email"]').fill(envGet('ADMIN_EMAIL'));
await page.locator('input[type="password"]').fill(envGet('ADMIN_PASSWORD'));
await page.locator('button[type="submit"]').click();
await page.waitForURL('**/admin', { timeout: 25000 });

await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded' });
await page.locator('h1', { hasText: 'Reviews' }).waitFor({ timeout: 15000 });
await page.getByText('ZZZProbe4 review').first().waitFor({ timeout: 12000 });

const dumpList = async (label) => {
  const container = page.locator('.divide-y');
  const text = (await container.innerText()).split('\n').filter((l) => l.trim()).join(' | ');
  console.log(`=== ${label} listText ===`);
  console.log(text.slice(0, 900));
};

await dumpList('BEFORE');
const target = page.locator('.divide-y > div.p-5', { hasText: 'ZZZProbe4 review' }).first();
await target.getByRole('button', { name: 'Approve' }).click();
await page.waitForTimeout(2500);
console.log('URL after:', page.url());
await dumpList('AFTER');
console.log('Approve count after:', await page.getByRole('button', { name: 'Approve' }).count());
await page.screenshot({ path: 'browser-tests/probe-review-after.png', fullPage: true });

await browser.close();
process.exit(0);