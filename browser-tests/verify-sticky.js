const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');
const OUT = path.join(__dirname, 'verify-home');

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const out = {};

  for (const vp of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'tablet', width: 834, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    const before = await page.locator('header').evaluate((el) => el.getBoundingClientRect().top);
    await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(900);
    const after = await page.locator('header').evaluate((el) => el.getBoundingClientRect().top);
    const navBg = await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, `${vp.name}-full.png`), fullPage: true });

    const m = await page.evaluate(() => {
      const de = document.documentElement;
      return {
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        docOverflow: de.scrollWidth > window.innerWidth + 1,
        footerRight: Math.round(document.querySelector('footer').getBoundingClientRect().right),
        productLinks: document.querySelectorAll('a[href^="/products/"]').length,
        categoryTiles: document.querySelectorAll('#shop-by-category a[href^="/category/"]').length,
      };
    });

    out[vp.name] = { headerTopAtTop: Math.round(before), headerTopAfterScroll1_5k: Math.round(after), sticky: Math.abs(after) < 2, navBgAfterScroll: navBg, errors, ...m };
    await page.close();
  }

  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => { console.error('FAIL: ' + e.message); process.exit(1); });
