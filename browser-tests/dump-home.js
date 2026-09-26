const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 60000 });
  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.slice(0, 3000));
  console.log('===========LINKS===========');
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(Boolean));
  console.log(links.slice(0, 60).join('\n'));
  await browser.close();
})().catch(e => { console.error('FAIL: ' + e.message); process.exit(1); });
