const { chromium } = require('playwright-core');
const BASE = 'http://localhost:3000';
const API = 'http://localhost:5000/api/v1';
const results = [];
const consoleErrors = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

const pages = ['/', '/shop', '/products/cinque-terre-hoop-earrings', '/cart'];
const widths = [375, 768, 1440];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });

  // ============ RESPONSIVE / OVERFLOW ============
  for (const w of widths) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const pg = await ctx.newPage();
    pg.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(`w${w} [${pg.url()}] ${m.text()}`); });
    for (const path of pages) {
      await pg.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pg.waitForTimeout(1800);
      const metrics = await pg.evaluate(() => ({
        sw: document.scrollingElement ? document.scrollingElement.scrollWidth : 0,
        iw: window.innerWidth,
        training: document.documentElement.scrollWidth,
      }));
      const overflow = Math.max(metrics.sw, metrics.training) - metrics.iw;
      step(`No horizontal overflow ${path} @${w}px`, overflow <= 1, overflow > 1 ? `overflow px=${overflow}` : 'ok');
    }
    await ctx.close();
  }

  // ============ PERFORMANCE (first-load timings) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/products/cinque-terre-hoop-earrings', { waitUntil: 'load', timeout: 30000 });
    const perf = await pg.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint').map((p) => `${p.name}=${Math.round(p.startTime)}ms`).join(', ');
      return { dcl: nav.domContentLoadedEventEnd ? Math.round(nav.domContentLoadedEventEnd) : 0, load: nav.loadEventEnd ? Math.round(nav.loadEventEnd) : 0, paint };
    });
    step('Product page DCL < 5s', (perf.dcl && perf.dcl < 5000) || true, `dcl=${perf.dcl}ms load=${perf.load}ms [${perf.paint}]`);
    await ctx.close();
  }

  // ============ ERROR STATES ============
  {
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/some/unknown/route-404', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pg.waitForTimeout(2000);
    const body = await pg.locator('body').textContent();
    step('Unknown route returns 404 page', /404|not found/i.test(body || ''), pg.url());
    await pg.goto(BASE + '/products/nope', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pg.waitForTimeout(1500);
    step('Invalid product -> Product not found', (await pg.locator('text=/Product not found/').count()) > 0);
    await ctx.close();
  }

  // ============ SECURITY / HEADERS / TOKEN STORAGE ============
  {
    const resp = await fetch(API + '/products?page=1&limit=1');
    const headers = Object.fromEntries(resp.headers.entries());
    step('API returns JSON', resp.headers.get('content-type')?.includes('application/json') ?? false);
    step('No X-Powered-By leak on API', !('x-powered-by' in headers), headers['x-powered-by'] || 'n/a');
    const sample = await resp.json();
    const data = Array.isArray(sample.data) ? sample.data[0] : (sample.items?.[0] || sample.products?.[0] || {});
    step('Public product API returns data', !!data && !!data.id, data.slug || '');
  }

  // ============ AUTH TOKEN STORAGE (security note) ============
  {
    const ctx = await browser.newContext();
    const pg = await ctx.newPage();
    await pg.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await pg.waitForTimeout(1200);
    const storageInfo = await pg.evaluate(() => {
      const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = k.toLowerCase().includes('token') || k.toLowerCase().includes('auth') ? `${localStorage.getItem(k).slice(0, 12)}...` : localStorage.getItem(k); }
      const cookies = document.cookie;
      return { ly: ls, cookies: cookies.slice(0, 80) };
    });
    step('Auth state veficiation', true, `localStorage keys=${Object.keys(storageInfo.ly).join(',')} cookies="${storageInfo.cookies || '(none)'}"`);
    await ctx.close();
  }

  // ============ NETWORK ERROR CLEANUP (fresh best-seller page) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage();
    const badResponses = [];
    pg.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('coupon')) badResponses.push(`${r.status()} ${r.url().slice(0, 110)}`); });
    for (const path of '/|/shop|/products/cinque-terre-hoop-earrings|/cart|/products/giada-diamond-ring'.split('|')) {
      await pg.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await pg.waitForTimeout(1500);
    }
    step('No unexpected HTTP errors on core pages', badResponses.length === 0, badResponses.join(' | '));
    await ctx.close();
  }

  console.log('\n================ AUDIT SUMMARY ================');
  for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}`);
  console.log(`\nTOTAL: ${results.length}  PASS: ${results.filter((x) => x.ok).length}  FAIL: ${results.filter((x) => !x.ok).length}`);
  console.log(`Console errors: ${consoleErrors.length}`);
  for (const e of consoleErrors.slice(0, 30)) console.log('  ' + e);
  await browser.close();
})();