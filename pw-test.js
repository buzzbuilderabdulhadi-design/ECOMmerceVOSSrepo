const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  console.log('TITLE: ' + await page.title());
  await browser.close();
  console.log('PW OK');
})().catch(e => { console.error('PW FAIL: ' + e.message); process.exit(1); });
