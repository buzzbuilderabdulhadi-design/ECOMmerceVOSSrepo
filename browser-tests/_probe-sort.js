const { chromium } = require('playwright-core');
const BASE = 'http://localhost:3000';
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const t0 = Date.now();
  await page.goto(BASE + '/shop?sort=price_asc', { waitUntil: 'domcontentloaded' });
  let cards = 0;
  for (let i = 0; i < 20; i++) {
    cards = await page.locator('a[href^="/products/"]:has(img)').count();
    if (cards > 0) break;
    await page.waitForTimeout(250);
  }
  const first = await page.locator('a[href^="/products/"]:has(img)').first().getAttribute('href').catch(() => null);
  console.log(`sort=price_asc → cards=${cards} firstCard=${first} afterMs=${Date.now() - t0}`);
  await browser.close();
})();