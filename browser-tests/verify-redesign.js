const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'verify-home');

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const report = { viewports: [] };

  for (const vp of [
    { name: 'mobile-390', width: 390, height: 844 },
    { name: 'tablet-768', width: 768, height: 1024 },
    { name: 'laptop-1024', width: 1024, height: 768 },
    { name: 'desktop-1440', width: 1440, height: 900 },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    const errors = [];
    const failed = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('requestfailed', (r) => failed.push(`${r.url()} :: ${r.failure()?.errorText}`));

    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3500);

    const data = await page.evaluate(() => {
      const de = document.documentElement;
      const overflowers = [];
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2)) {
          const style = getComputedStyle(el);
          if (style.position === 'fixed') return;
          const parent = el.parentElement;
          if (parent) {
            const ps = getComputedStyle(parent);
            if (ps.overflowX === 'hidden' || ps.overflowX === 'clip' || ps.overflow === 'hidden') return;
          }
          overflowers.push(
            `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} left=${Math.round(r.left)}`
          );
        }
      });

      // Detect real text clipping: a text-bearing element whose content is
      // taller/wider than its box while overflow is hidden or clipped.
      const clipped = [];
      document.querySelectorAll('body *').forEach((el) => {
        if (el.querySelector('img, video, svg, canvas')) return;
        const hasOwnText = [...el.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent.trim().length > 0
        );
        if (!hasOwnText) return;
        const s = getComputedStyle(el);
        if (s.overflow === 'visible' && s.overflowY === 'visible' && s.overflowX === 'visible') return;
        const cutY = el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0;
        const cutX = el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0;
        if (!cutY && !cutX) return;
        clipped.push(
          `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 50)} ${cutY ? `sh=${el.scrollHeight}/ch=${el.clientHeight}` : ''} ${cutX ? `sw=${el.scrollWidth}/cw=${el.clientWidth}` : ''} "${el.textContent.trim().slice(0, 40)}"`
        );
      });

      const nav = document.querySelector('header');
      const announcement = document.querySelector('header > div');
      const sections = [...document.querySelectorAll('section[id]')].map((s) => s.id);
      const footer = document.querySelector('footer');
      const video = document.querySelector('video');

      return {
        scrollWidth: de.scrollWidth,
        innerWidth: window.innerWidth,
        docOverflow: de.scrollWidth > window.innerWidth + 1,
        overflowers: overflowers.slice(0, 8),
        clippedText: clipped.slice(0, 12),
        clippedCount: clipped.length,
        navHeight: nav ? Math.round(nav.getBoundingClientRect().height) : null,
        navPosition: nav ? getComputedStyle(nav).position : null,
        sections,
        footerWidth: footer ? Math.round(footer.getBoundingClientRect().width) : null,
        footerRight: footer ? Math.round(footer.getBoundingClientRect().right) : null,
        videoPresent: Boolean(video),
        heroHeight: Math.round(document.querySelector('section')?.getBoundingClientRect().height || 0),
        h1: document.querySelector('main h1')?.textContent?.replace(/\s+/g, ' ').trim() || null,
        h1Count: document.querySelectorAll('main h1').length,
        darkBody: getComputedStyle(document.querySelector('main')).backgroundColor,
        railCount: document.querySelectorAll('.rail').length,
        imgSlots: document.querySelectorAll('.border-dashed').length,
      };
    });

    await page.screenshot({ path: path.join(OUT, `${vp.name}-full.png`), fullPage: true });
    await page.screenshot({ path: path.join(OUT, `${vp.name}-top.png`) });

    report.viewports.push({ ...vp, ...data, pageErrors: errors, failedRequests: failed.filter((f) => !f.includes('/videos/hero.mp4')).slice(0, 6) });
    await page.close();
  }

  // Interaction checks on desktop
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(2500);
  const inter = {};

  // Category dropdowns are hover-driven links (Shop itself is a plain link).
  const clothingLink = page.locator('header nav a:has-text("Clothing")').first();
  inter.shopMenuOpens = await clothingLink.hover()
    .then(() => page.waitForTimeout(500))
    .then(async () => page.locator('header a:has-text("Jackets")').first().isVisible())
    .catch(() => false);
  // The mega menu is a sibling of <nav> with its own onMouseEnter that cancels
  // the close timer, so moving into the panel must keep it open. Only a point
  // outside both boxes should dismiss it.
  await page.mouse.move(700, 600);
  await page.waitForTimeout(400);
  const insidePanel = await page.locator('header a:has-text("Jackets")').first().isVisible();
  inter.shopMenuStaysOpenInsidePanel = insidePanel;

  const away = await page.evaluate(() => {
    const nav = document.querySelector('header nav');
    const panel = [...document.querySelectorAll('header a')].find((a) => a.textContent.includes('Jackets'))
      ?.closest('[class*="fixed"],[class*="absolute"]');
    const boxes = [nav, panel].filter(Boolean).map((el) => el.getBoundingClientRect());
    const w = window.innerWidth;
    const h = window.innerHeight;
    const candidates = [
      [w - 2, h - 2],
      [2, h - 2],
      [w - 2, 2],
      [2, 2],
    ];
    const hit = candidates.find(([x, y]) => !boxes.some((b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom));
    return hit;
  });
  if (away) await page.mouse.move(away[0], away[1]);
  await page.waitForTimeout(700);
  inter.shopMenuClosesOnLeave = (await page.locator('header a:has-text("Jackets")').count()) === 0;

  inter.searchIconCount = await page.locator('header button[aria-label*="earch" i]').count();
  await page.keyboard.press('/');
  await page.waitForTimeout(600);
  // The overlay input's placeholder is "What are you looking for?"; the inline
  // header input is hidden below 2xl, so match the dialog itself.
  const searchDialog = page.locator('[role="dialog"][aria-label="Search"]');
  inter.searchOverlayOpensOnSlash = await searchDialog.isVisible();
  inter.searchInputFocused =
    (await page.locator('input[placeholder*="looking for" i]').first().evaluate((el) => el === document.activeElement));
  await page.screenshot({ path: path.join(OUT, 'search-overlay.png') });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  inter.searchClosesOnEscape = (await searchDialog.count()) === 0;

  report.interactions = inter;
  await page.close();

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('FAIL: ' + e.message);
  process.exit(1);
});
