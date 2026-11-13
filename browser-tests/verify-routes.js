const { chromium } = require('playwright-core');

const ROUTES = [
  '/', '/shop', '/products/napoli-block-heel', '/category/handbags',
  '/cart', '/wishlist', '/login', '/register', '/checkout',
  '/about', '/contact', '/faq', '/shipping', '/returns', '/size-guide',
  '/sustainability', '/privacy', '/terms', '/cookies', '/careers', '/press',
  '/affiliates', '/dashboard', '/admin',
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const rows = [];

  for (const route of ROUTES) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.split('\n')[0].slice(0, 120)));
    let status = 'n/a';
    let info = {};
    try {
      const res = await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded', timeout: 45000 });
      status = res.status();
      await page.waitForTimeout(2200);
      info = await page.evaluate(() => {
        const de = document.documentElement;
        const nav = document.querySelector('header');
        return {
          h1: document.querySelector('h1')?.textContent?.trim().slice(0, 38) || null,
          navPresent: Boolean(nav),
          navH: nav ? Math.round(nav.getBoundingClientRect().height) : null,
          footerPresent: Boolean(document.querySelector('footer')),
          overflow: de.scrollWidth > window.innerWidth + 1,
          text: document.body.innerText.trim().length,
        };
      });
    } catch (e) {
      status = 'ERR';
      info = { error: e.message.split('\n')[0].slice(0, 100) };
    }
    rows.push({ route, status, errors: errors.length, ...info });
    await page.close();
  }

  console.table(rows);
  const bad = rows.filter((r) => r.status === 'ERR' || (typeof r.status === 'number' && r.status >= 500) || r.errors > 0 || r.overflow);
  console.log(bad.length ? 'PROBLEMS:\n' + JSON.stringify(bad, null, 2) : 'ALL ROUTES OK');
  await browser.close();
})().catch((e) => { console.error('FAIL: ' + e.message); process.exit(1); });
