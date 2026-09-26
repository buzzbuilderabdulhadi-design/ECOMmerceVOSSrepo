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
  const products = await (await fetch(API + '/admin/products?page=1&limit=1', { headers: { Authorization: `Bearer ${admin.accessToken}` } })).json();
  const prodId = products.data[0].id;
  const custEmail = `prob2-${Date.now()}@example.com`;
  const rr = await fetch(API + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Probe2 User', email: custEmail, password: 'Probe-12345!' }) });
  if (!(await rr.json()).data?.accessToken) throw new Error('register failed');
  const cl = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: custEmail, password: 'Probe-12345!' }) });
  const cust = (await cl.json()).data;
  if (!cust?.accessToken) throw new Error('cust login failed');
  await fetch(API + '/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cust.accessToken}` }, body: JSON.stringify({ productId: prodId, rating: 5, title: 'ZZZProbe2 review', text: 'probe two' }) });

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('framenavigated', f => console.log('NAV:', f.url()));

  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill(get('ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(get('ADMIN_PASSWORD'));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 25000 });

  await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  await page.locator('h1', { hasText: 'Reviews' }).waitFor({ timeout: 15000 });
  await page.getByText('ZZZProbe2 review').first().waitFor({ timeout: 12000 });

  const dumpRows = async (label) => {
    const rows = await page.locator('div.p-5').all();
    const out = [];
    for (let i = 0; i < rows.length; i++) {
      const t = (await rows[i].textContent()).replace(/\s+/g, ' ').trim();
      out.push(`${i}: ${t.slice(0, 90)}`);
    }
    console.log(`=== ${label} (${rows.length} rows) ===`);
    out.forEach(l => console.log('  ' + l));
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
})();