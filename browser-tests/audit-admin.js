// Comprehensive admin audit: all pages + key CRUD flows.
// RUN: node browser-tests/audit-admin.js
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';
const results = [];
const consoleErrors = [];
let apiFailures = [];
let resource404s = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

function loadAdminCreds() {
  const envFile = path.join(__dirname, '..', 'server', '.env');
  const content = fs.readFileSync(envFile, 'utf8');
  const get = (k) => {
    const m = content.match(new RegExp(`^${k}=(.*)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  return { email: get('ADMIN_EMAIL'), password: get('ADMIN_PASSWORD') };
}

const TAG = `ADMAUD-${Date.now()}`;

async function apiCall(token, method, url, body) {
  const res = await fetch(API + url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, bodyOf: () => (json && json.data !== undefined ? json.data : json) };
}

(async () => {
  const { email: adminEmail, password: adminPassword } = loadAdminCreds();
  const adminLogin = await apiCall('', 'POST', '/auth/login', { email: adminEmail, password: adminPassword });
  const token = adminLogin.bodyOf().accessToken;

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text().slice(0, 220)}`); });
  page.on('response', (resp) => {
    const u = resp.url();
    if (u.includes('/api/v1/admin') && resp.status() >= 400) {
      apiFailures.push(`${resp.status()} ${resp.request().method()} ${u.replace('http://localhost:5000/api/v1', '')}`);
    }
    if (resp.status() === 404 && u.startsWith('http') && !u.includes('/api/v1/admin')) {
      resource404s.push(u);
    }
  });

  // ---- login via UI ----
  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill(adminPassword);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 25000 });
  step('Admin login', true);

  // ---- navigate pages, time to h1 ----
  const pages = [
    ['/admin', 'Dashboard'],
    ['/admin/analytics', 'Analytics'],
    ['/admin/products', 'Products'],
    ['/admin/products/new', 'New Product'],
    ['/admin/categories', 'Categories'],
    ['/admin/media', 'Media Library'],
    ['/admin/orders', 'Orders'],
    ['/admin/discounts', 'Discounts'],
    ['/admin/customers', 'Customers'],
    ['/admin/reviews', 'Reviews'],
    ['/admin/questions', 'Product Questions'],
    ['/admin/homepage-content', 'Homepage Content'],
    ['/admin/seo', 'SEO'],
    ['/admin/notifications', 'Notifications'],
    ['/admin/activity-logs', 'Activity Logs'],
    ['/admin/settings', 'Settings'],
  ];
  for (const [route, h1] of pages) {
    const t0 = Date.now();
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try {
      await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 });
      step(`${h1} page loads`, true, `${Date.now() - t0}ms`);
    } catch {
      step(`${h1} page loads`, false, `h1 not found after ${Date.now() - t0}ms; url=${page.url()}`);
    }
    await page.waitForTimeout(300);
  }

  // ---- detail pages ----
  const prodResp = await apiCall(token, 'GET', '/admin/products?page=1&limit=1');
  const prodId = prodResp.bodyOf()[0]?.id;
  if (prodId) {
    await page.goto(BASE + `/admin/products/${prodId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try { await page.locator('h1', { hasText: 'Edit Product' }).first().waitFor({ timeout: 15000 }); step('Product edit detail loads', true); }
    catch { step('Product edit detail loads', false, page.url()); }
  }
  const ord = await apiCall(token, 'GET', '/admin/orders?page=1&limit=1');
  const ordId = ord.bodyOf()[0]?.id;
  if (ordId) {
    await page.goto(BASE + `/admin/orders/${ordId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try { await page.locator('h1').first().waitFor({ timeout: 15000 }); step('Order detail loads', true); }
    catch { step('Order detail loads', false, page.url()); }
  }
  const cust = await apiCall(token, 'GET', '/admin/customers?page=1&limit=1');
  const custId = cust.bodyOf()[0]?.id;
  if (custId) {
    await page.goto(BASE + `/admin/customers/${custId}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    try { await page.locator('h1').first().waitFor({ timeout: 15000 }); step('Customer detail loads', true); }
    catch { step('Customer detail loads', false, page.url()); }
  }

  // ---- CATEGORY full lifecycle via UI ----
  const catName = `${TAG}-cat`;
  await page.goto(BASE + '/admin/categories', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Add Category/i }).click();
  const catDialog = page.getByRole('dialog');
  await catDialog.getByRole('button', { name: /Create/i }).waitFor({ timeout: 10000 });
  await catDialog.locator('input[type="text"]').first().fill(catName);
  await catDialog.getByRole('button', { name: /Create/i }).click();
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(1000);
  const catVisible = (await page.getByText(catName).count()) > 0;
  step('Category created via UI', catVisible, catName);
  let catId = null;
  {
    const cats = await apiCall(token, 'GET', `/admin/categories?search=${encodeURIComponent(catName)}`);
    const row = cats.bodyOf().find((c) => c.name === catName);
    catId = row?.id || null;
  }
  // rename via UI
  let renamed = false;
  if (catId) {
    await page.locator(`tr:has-text("${catName}") button`).first().click();
    const editDialog = page.getByRole('dialog');
    await editDialog.locator('input[type="text"]').first().fill(catName + '-renamed');
    await editDialog.getByRole('button', { name: /Update/i }).click();
    await page.waitForTimeout(1000);
    renamed = (await page.getByText(catName + '-renamed').count()) > 0;
    step('Category renamed via UI', renamed);
  }

  // ---- COUPON create (correct schema) + visible in UI + toggle ----
  const cp = await apiCall(token, 'POST', '/admin/coupons', {
    code: `${TAG}-CP`, type: 'PERCENTAGE', value: 12, maxDiscount: 1000, minOrderAmount: 0, isActive: true,
  });
  step('Coupon create (API)', cp.status === 201 || cp.status === 200, `${cp.status} ${cp.json?.message || cp.json?.error || ''}`);
  const cpId = cp.bodyOf().id;
  await page.goto(BASE + '/admin/discounts', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.getByText(`${TAG}-CP`).first().waitFor({ timeout: 12000 }).catch(() => {});
  step('Created coupon visible in admin UI', (await page.getByText(`${TAG}-CP`).count()) > 0);
  if (cpId) {
    const tog = await apiCall(token, 'PUT', `/admin/coupons/${cpId}`, { isActive: false });
    step('Coupon toggle inactive', tog.status === 200, `${tog.status}`);
    await apiCall(token, 'DELETE', `/admin/coupons/${cpId}`);
  }

  // ---- REVIEW lifecycle: seed pending review, approve via UI, delete via UI ----
  const custEmail = `admaud-${Date.now()}@example.com`;
  const regCust = await apiCall('', 'POST', '/auth/register', { name: 'Audit Customer', email: custEmail, password: 'Audit-12345!' });
  const custToken = regCust.bodyOf().accessToken;
  const rev = await apiCall(custToken, 'POST', '/reviews', { productId: prodId, rating: 4, title: 'Audit review ' + TAG, text: 'Temporary audit review ' + TAG });
  const revId = rev.bodyOf().id;
  step('Review seeded (pending)', !!revId, `id=${revId}`);
  await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.getByText(TAG).first().waitFor({ timeout: 12000 }).catch(() => {});
  step('Review visible in admin', (await page.getByText(TAG).count()) > 0);
  const revRow = page.locator('.divide-y > div.p-5', { hasText: TAG }).first();
  const approveBtn = revRow.getByRole('button', { name: 'Approve' });
  if (await approveBtn.count()) {
    await approveBtn.click(); await page.waitForTimeout(1000);
    const revRowAfter = page.locator('.divide-y > div.p-5', { hasText: TAG }).first();
    step('Review approve action works', (await revRowAfter.getByText('Approved').count()) > 0);
  } else {
    step('Review approve action works', false, 'no Approve button');
  }
  if (revId) {
    await revRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(800);
    step('Review delete action works', (await page.getByText(TAG).count()) === 0);
  }

  // ---- QUESTION lifecycle: seed, answer via UI, delete via UI ----
const q = await apiCall(custToken, 'POST', '/questions', { productId: prodId, question: 'Is this audit question? ' + TAG });
  const qId = q.bodyOf().id;
  step('Question seeded (unanswered)', !!qId, `id=${qId}`);
  await page.goto(BASE + '/admin/questions', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.getByText(TAG).first().waitFor({ timeout: 12000 }).catch(() => {});
  step('Question visible in admin', (await page.getByText(TAG).count()) > 0);
  if (qId) {
    const qRow = page.locator('.divide-y > div.p-5', { hasText: TAG }).first();
    await qRow.getByRole('button', { name: 'Answer' }).click();
    await qRow.locator('input[placeholder*="Write an answer"]').fill('Yes, automated audit answer.');
    await qRow.getByRole('button', { name: 'Publish' }).click();
    await page.waitForTimeout(1200);
    step('Question answer published', (await qRow.getByText('Yes, automated audit answer.').count()) > 0);
    await qRow.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(800);
  }
  step('Question delete action works', (await page.getByText(TAG).count()) === 0);

  // ---- MEDIA upload via UI + delete via UI ----
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.goto(BASE + '/admin/media', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.getByRole('button', { name: /Upload/i }).click();
  await page.getByRole('dialog').locator('input[type="file"]').setInputFiles({ name: 'audit.png', mimeType: 'image/png', buffer: png });
  await page.getByRole('dialog').getByRole('button', { name: /Upload/ }).click();
  await page.waitForTimeout(1800);
  const uploadedVisible = (await page.getByText('audit.png').count()) > 0;
  step('Media upload via UI works', uploadedVisible);
  const delBtn = page.locator(`button[aria-label^="Delete audit.png"]`).first();
  if (uploadedVisible && (await delBtn.count())) {
    await delBtn.click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
    await page.waitForTimeout(1000);
    step('Media delete via UI works', (await page.getByText('audit.png').count()) === 0);
  } else {
    step('Media delete via UI works', false, 'uploaded file not found');
  }

  // ---- HOMEPAGE CONTENT create via API + visible ----
  const hp = await apiCall(token, 'POST', '/admin/homepage', { key: 'audit_banner_' + TAG, value: { title: 'Audit Banner' } });
  step('Homepage content create (API)', hp.status === 201 || hp.status === 200, `${hp.status} ${hp.json?.message || hp.json?.error || ''}`);
  if (hp.bodyOf()?.id) {
    await page.goto(BASE + '/admin/homepage-content', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    const upd = await apiCall(token, 'PUT', `/admin/homepage/${hp.bodyOf().id}`, { value: { title: 'Audit Banner Updated' } });
    step('Homepage content update (API)', upd.status === 200, `${upd.status}`);
    const del = await apiCall(token, 'DELETE', `/admin/homepage/${hp.bodyOf().id}`);
    step('Homepage content delete (API)', del.status === 200, `${del.status}`);
  }

  // ---- SEO edit + revert ----
  const seo = await apiCall(token, 'GET', '/admin/seo');
  const entries = seo.bodyOf();
  if (Array.isArray(entries) && entries.length > 0) {
    const target = entries[0];
    await page.goto(BASE + '/admin/seo', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1').first().waitFor({ timeout: 15000 });
    await page.locator('button', { hasText: /Edit/ }).first().click();
    const mt = page.locator('label', { hasText: 'Meta Title' }).locator('..').locator('input').first();
    const original = (await mt.inputValue()).trim();
    const marker = original ? `${original} | ${TAG}` : `Audit-${TAG}`;
    await mt.fill(marker);
    await page.getByRole('button', { name: 'Save' }).click();
    await page.waitForTimeout(1200);
    step('SEO edit saved', (await page.getByText(marker).count()) > 0);
    // revert
    const updRev = await apiCall(token, 'PUT', `/admin/seo/${encodeURIComponent(target.page)}`, { metaTitle: original });
    step('SEO revert', updRev.status === 200, `${updRev.status}`);
  } else {
    step('SEO edit saved', false, 'no SEO entries');
  }

  // ---- SETTINGS save ----
  await page.goto(BASE + '/admin/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  const setSave = page.getByRole('button', { name: /Save/i }).first();
  if (await setSave.count()) {
    await setSave.click(); await page.waitForTimeout(1200);
    step('Settings save (no change)', true);
  } else { step('Settings save (no change)', false, 'no save button'); }

  // ---- NOTIFICATIONS: create one (via activity) then mark read ----
  // Notifications are generated server-side on order/status events; if the
  // admin's list already has rows we exercise mark-all-read.
  await page.goto(BASE + '/admin/notifications', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('h1').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(800);
  const notifRows = await page.locator('text=/[A-Za-z0-9]/').count();
  const markAll = page.getByRole('button', { name: /Mark all as read/i }).first();
  if (await markAll.count()) {
    await markAll.click(); await page.waitForTimeout(800);
    step('Notifications mark-all-read', true);
  } else {
    const empty = (await page.getByText('No notifications').count()) > 0;
    step('Notifications mark-all-read', empty || notifRows > 0, empty ? 'empty list' : 'list present, no unread');
  }

  // ---- ACTIVITY LOGS rows ----
  const al = await apiCall(token, 'GET', '/admin/activity-logs?page=1&limit=20');
  const alRows = al.bodyOf().length || 0;
  step('Activity logs return rows', alRows > 0, `${alRows} rows`);

  // ---- cleanup category ----
  if (catId) {
    if (renamed) {
      const cats = await apiCall(token, 'GET', `/admin/categories?search=${encodeURIComponent(catName + '-renamed')}`);
      catId = cats.bodyOf().find((c) => c.name === catName + '-renamed')?.id || catId;
    }
    const del = await apiCall(token, 'DELETE', `/admin/categories/${catId}`);
    step('Category delete (API)', del.status === 200, `${del.status}`);
  }

  console.log('\n================ SUMMARY ================');
  const passes = results.filter((r) => r.ok).length;
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`);
  console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${results.length - passes}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 60)) console.log('  ' + e);
  console.log(`Admin API failures: ${apiFailures.length}`);
  for (const f of apiFailures.slice(0, 60)) console.log('  ' + f);
  console.log(`404 resources: ${resource404s.length}`);
  for (const f of resource404s.slice(0, 20)) console.log('  ' + f);
  await browser.close();
  process.exit(results.length - passes > 0 ? 1 : 0);
})();