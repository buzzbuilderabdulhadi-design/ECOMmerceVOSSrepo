const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE-ERR:', m.text().slice(0, 200)); });
  page.on('pageerror', (e) => console.log('PAGE-ERR:', String(e).slice(0, 200)));
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor({ timeout: 15000 }).catch(() => console.log('heading not found'));
  await page.waitForTimeout(1500);
  const inputs = await page.evaluate(() => Array.from(document.querySelectorAll('input')).map((i) => ({ id: i.id, type: i.type, placeholder: i.placeholder, name: i.name })));
  const labels = await page.evaluate(() => Array.from(document.querySelectorAll('label')).map((l) => ({ for: l.htmlFor, text: l.textContent.trim().slice(0, 30) })));
  console.log('INPUTS:', JSON.stringify(inputs, null, 1));
  console.log('LABELS:', JSON.stringify(labels, null, 1));
  const bodyText = await page.locator('body').innerText();
  console.log('BODY-HAS-FORM-EMAIL:', bodyText.includes('john@example.com'));
  console.log('BODY-first1500:', bodyText.slice(0, 1500));
  await browser.close();
})();