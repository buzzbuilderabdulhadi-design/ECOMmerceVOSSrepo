import { chromium } from 'playwright-core';
import { getAdminToken, adminApi, envGet } from './lib/auth.mjs';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

const adminToken = await getAdminToken();
const prods = await adminApi('GET', '/admin/products?page=1&limit=1');
const prodId = prods.body.data[0].id;

const custEmail = `prob3-${Date.now()}@example.com`;
const rr = await fetch(API + '/auth/register', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Probe3 User', email: custEmail, password: 'Probe-12345!' }),
});
const reg = await rr.json();
if (!reg.data?.accessToken) throw new Error('register failed');

const cv = await fetch(API + '/reviews', {
  method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${reg.data.accessToken}` },
  body: JSON.stringify({ productId: prodId, rating: 5, title: 'ZZZProbe3 review', text: 'probe three body' }),
});
console.log('review create:', cv.status, JSON.stringify((await cv.json()).data?.id));

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
page.on('framenavigated', (f) => console.log('NAV:', f.url()));

await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
await page.locator('input[type="email"]').fill(envGet('ADMIN_EMAIL'));
await page.locator('input[type="password"]').fill(envGet('ADMIN_PASSWORD'));
await page.locator('button[type="submit"]').click();
await page.waitForURL('**/admin', { timeout: 25000 });

await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded' });
await page.locator('h1', { hasText: 'Reviews' }).waitFor({ timeout: 15000 });
await page.getByText('ZZZProbe3 review').first().waitFor({ timeout: 12000 });

const dumpRows = async (label) => {
  const rows = await page.locator('table, .divide-y > div.p-5').all();
  console.log(`=== ${label} (p-5 rows found: ${rows.length}) ===`);
  const out = [];
  for (let i = 0; i < rows.length; i++) {
    const t = (await rows[i].textContent()).replace(/\s+/g, ' ').trim();
    out.push(`${i}: ${t.slice(0, 100)}`);
  }
  out.forEach((l) => console.log('  ' + l));
};

await dumpRows('BEFORE');
const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
await approveBtn.click();
await page.waitForTimeout(2000);
console.log('URL:', page.url());
await dumpRows('AFTER');
console.log('Approve buttons remaining:', await page.getByRole('button', { name: 'Approve' }).count());

await browser.close();
process.exit(0);