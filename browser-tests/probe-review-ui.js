const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

(async () => {
  const envFile = path.join(__dirname, '..', 'server', '.env');
  const content = fs.readFileSync(envFile, 'utf8');
  const get = (k) => (content.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || '';

  const login = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: get('ADMIN_EMAIL'), password: get('ADMIN_PASSWORD') }) });
  const admin = (await login.json()).data;
  const products = (await (await fetch(API + '/admin/products?page=1&limit=1', { headers: { Authorization: `Bearer ${admin.accessToken}` } })).json());
  const prodId = products.data[0].id;

  const custEmail = `prob-${Date.now()}@example.com`;
  await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Probe User', email: custEmail, password: 'Probe-12345!' }) });
  const custLogin = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: custEmail, password: 'Probe-12345!' }) });
  const cust = (await custLogin.json()).data;
  const rev = await fetch(API + '/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust.accessToken}` }, body: JSON.stringify({ productId: prodId, rating: 4, title: 'Probe review', text: 'Probe audit review' }) });
  const revJson = await rev.json();
  console.log('review create:', rev.status, JSON.stringify(revJson).slice(0, 200));

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE ERR:', m.text().slice(0, 200)); });

  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(get('ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(get('ADMIN_PASSWORD'));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 25000 });

  await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  await page.locator('h1', { hasText: 'Reviews' }).waitFor({ timeout: 15000 });
  await page.getByText('Probe review').first().waitFor({ timeout: 12000 });
  let rows = await page.locator('div.p-5').count();
  console.log('review rows:', rows);
  const firstRow = page.locator('div.p-5').first();
  console.log('FIRST ROW BUTTONS:', await firstRow.locator('button').allTextContents());
  console.log('FIRST ROW TEXT:', (await firstRow.textContent()).slice(0, 300));

  const approveBtn = page.getByRole('button', { name: 'Approve' }).first();
  console.log('approve count on page:', await page.getByRole('button', { name: 'Approve' }).count());
  await approveBtn.click();
  await page.waitForTimeout(1500);
  console.log('AFTER CLICK approve count:', await page.getByRole('button', { name: 'Approve' }).count());
  console.log('AFTER CLICK first row buttons:', await firstRow.locator('button').allTextContents());
  console.log('AFTER CLICK first row text:', (await firstRow.textContent()).slice(0, 300));
  console.log('Approved badges in row:', await firstRow.getByText('Approved').count());

  await browser.close();
  process.exit(0);
})();