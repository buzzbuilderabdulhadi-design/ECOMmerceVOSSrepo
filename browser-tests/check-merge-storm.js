// Confirms the /cart/merge storm is gone on authenticated page (re)loads.
// Run from workspace root: node browser-tests/check-merge-storm.js
const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
for (const l of env.split(/\r?\n/)) {
  const t = l.trim();
  if (!t || t.startsWith('#')) continue;
  const i = t.indexOf('=');
  if (i <= 0) continue;
  const k = t.slice(0, i).trim();
  const v = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  if (k && !process.env[k]) process.env[k] = v;
}
const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const merges = [];
  page.on('response', (r) => { if (r.url().includes('/cart/merge')) merges.push(r.status()); });

  // guest: add to cart so a real guest session + cart exists before login
  await page.goto(BASE + '/products/giada-diamond-ring', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const addok = await page.locator('button', { hasText: /add to cart/i }).first().isVisible({ timeout: 10000 }).catch(() => false);
  if (addok) await page.locator('button', { hasText: /add to cart/i }).first().click();
  await page.waitForTimeout(2500);
  const guestMergeIdBefore = await page.evaluate(() => localStorage.getItem('zoya_session_id'));
  console.log('guest session id minted by guest cart activity:', !!guestMergeIdBefore);

  merges.length = 0;
  await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('form');
  const form = page.locator('form').first();
  await form.getByLabel('First Name').fill('Merge');
  await form.getByLabel('Last Name').fill('Check');
  const email = `merge-${Date.now().toString(36)}@example.com`;
  await form.getByLabel('Email').fill(email);
  await form.locator('input[type="password"]').nth(0).fill('StrongPass123!');
  await form.locator('input[type="password"]').nth(1).fill('StrongPass123!');
  await page.locator('button', { hasText: 'Create Account' }).first().click();
  await page.waitForTimeout(4500);
  console.log('merges fired during REGISTER (expect 1):', merges.length);

  const sessionAfter = await page.evaluate(() => localStorage.getItem('zoya_session_id'));
  console.log('session id present after register merge (expect false):', !!sessionAfter);

  for (let i = 1; i <= 3; i++) {
    merges.length = 0;
    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    const nav = await page.evaluate(() => document.title);
    console.log(`page reload #${i} /dashboard → merges=${merges.length} (title=${nav})`);
  }

  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  try {
    const u = await prisma.user.findMany({ where: { email }, select: { id: true } });
    const ids = u.map((x) => x.id);
if (ids.length) {
      const carts = await prisma.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const cartIds = carts.map((c) => c.id);
      if (cartIds.length) {
        await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
        await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
      }
      await prisma.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
    }
    console.log('cleaned merge-check user');
  } catch (e) { console.log('cleanup:', String(e && e.message).slice(0, 80)); }
  finally { await prisma.$disconnect(); }

  await browser.close();
})();