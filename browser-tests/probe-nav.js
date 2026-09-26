const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';

(async () => {
  const envFile = path.join(__dirname, '..', 'server', '.env');
  const content = fs.readFileSync(envFile, 'utf8');
  const get = (k) => (content.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim() || '';

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

  await page.goto(BASE + '/admin/login', { waitUntil: 'domcontentloaded' });
  console.log('after goto login:', page.url());
  await page.locator('input[type="email"]').fill(get('ADMIN_EMAIL'));
  await page.locator('input[type="password"]').fill(get('ADMIN_PASSWORD'));
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('**/admin', { timeout: 25000 });
  console.log('after submit:', page.url());

  await page.goto(BASE + '/admin/reviews', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  console.log('after goto /admin/reviews:', page.url());
  console.log('h1 texts:', await page.locator('h1').allTextContents());

  await browser.close();
  process.exit(0);
})();