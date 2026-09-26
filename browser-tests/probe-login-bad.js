const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text().slice(0, 160)));
  page.on('pageerror', (e) => console.log('PAGE-ERR:', String(e).slice(0, 200)));
  page.on('response', (r) => {
    if (r.url().includes('/api/v1/auth')) console.log('API-RESP', r.status(), r.url());
  });
  await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { name: 'Welcome back' }).waitFor();
  await page.getByLabel('Email*', { exact: true }).fill(`bad-${Date.now()}@example.com#x`);
  await page.getByLabel('Password*', { exact: true }).fill('WrongPass-123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await page.waitForTimeout(3000);
  const state = await page.evaluate(() => ({
    token: localStorage.getItem('voss_token'),
    user: localStorage.getItem('voss_user'),
  }));
  console.log('LOCALSTORAGE:', JSON.stringify(state));
  await browser.close();
})();