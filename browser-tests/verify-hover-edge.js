const { chromium } = require('playwright-core');
const devices = require('playwright-core').devices;

/** Edge cases + all ProductCard variants for the rebuilt ProductHoverImage. */
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let fails = 0;
  const check = (n, ok, x) => { if (!ok) fails++; console.log('   ' + (ok ? 'PASS' : 'FAIL') + '  ' + n + (x ? '  [' + x + ']' : '')); };

  /* 0-image product -> placeholder, no <img> at all */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errs = [];
    page.on('response', r => { if (r.status() === 404 && !/\/videos\//.test(r.url())) errs.push('404 ' + r.url().slice(0,60)); });
    await page.goto('http://localhost:3000/category/qg-cat-1790267650602', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    const g = await page.evaluate(() => {
      const h = document.querySelector('a[href="/products/qg-prod-1790267650602"] .product-hover');
      if (!h) return { found: false };
      return { found: true, imgs: h.querySelectorAll('img').length,
               emptySrcs: [...h.querySelectorAll('img')].filter(i => !i.getAttribute('src')).length,
               role: !!h.querySelector('[role="img"]') };
    });
    console.log('\n### 0-image product (qg-prod-1790267650602)');
    console.log('  found:', g.found, 'imgs:', g.imgs ?? '-', 'placeholder:', g.role ?? '-');
    check('stage renders', g.found === true);
    check('renders zero <img> elements', g.imgs === 0);
    check('shows the existing placeholder', g.role === true);
    check('never src=""', g.emptySrcs === 0);
    check('no 404 image requests', errs.length === 0, errs.join(','));
    await page.close();
  }

  /* 1-image product -> single frame, no crossfade, image visible */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000/category/clothing-accessories', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(6000);
    await page.evaluate(() => document.querySelector('a[href="/products/linen-blazer"]').scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => {
      const i = document.querySelector('a[href="/products/linen-blazer"] .product-hover img');
      return i && i.complete && i.naturalWidth > 0;
    }, null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);
    const g = await page.evaluate(() => {
      const h = document.querySelector('a[href="/products/linen-blazer"] .product-hover');
      const im = [...h.querySelectorAll('img')];
      return { frames: im.length, op: im.map(i => getComputedStyle(i).opacity),
               one: im[0].classList.contains('product-frame-one') };
    });
    console.log('\n### 1-image product (linen-blazer)');
    console.log('  frames:', g.frames, 'opacity:', JSON.stringify(g.op));
    check('renders exactly one frame', g.frames === 1);
    check('that frame is visible at rest', g.op[0] === '1');
    check('no second/empty frame invented', g.frames < 2);
    await page.close();
  }

  /* 2+ images: frame two must be a DIFFERENT url, never a repeat */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:3000/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(7000);
    const g = await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms));
      const out = [];
      for (let y = 0; y < 4000 && out.length < 5; y += 400) {
        window.scrollTo(0, y); await sleep(250);
        for (const h of document.querySelectorAll('.product-hover')) {
          const im = [...h.querySelectorAll('img')];
          if (im.length !== 2) continue;
          out.push({ href: h.closest('a')?.getAttribute('href'),
                     a: im[0].getAttribute('src'), b: im[1].getAttribute('src'),
                     emptySrc: im.filter(i => !i.getAttribute('src')).length,
                     natural: im.every(i => i.naturalWidth > 0) });
        }
      }
      return out;
    });
    console.log('\n### every 2-frame card on /shop');
    check('found 2-frame cards', g.length > 0, g.length + ' cards');
    check('frame two URL is never identical to frame one', g.every(x => x.a !== x.b));
    check('no frame has src=""', g.every(x => x.emptySrc === 0));
    check('both frames are real decoded images', g.every(x => x.natural));
    g.slice(0,3).forEach(x => console.log(`  ${x.href}\n     A=${decodeURIComponent(x.a).replace(/^.*url=/,'').split('&')[0]}\n     B=${decodeURIComponent(x.b).replace(/^.*url=/,'').split('&')[0]}`));
    await page.close();
  }

  /* touch device: must show image 1, never permanently image 2 */
  {
    const ctx = await browser.newContext({ ...devices['iPhone 13'] });
    const page = await ctx.newPage();
    await page.goto('http://localhost:3000/shop', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(9000);
    const g = await page.evaluate(() => {
      const hs = [...document.querySelectorAll('.product-hover')];
      const two = hs.filter(h => h.querySelectorAll('img').length === 2);
      const h = two[0];
      const im = h ? [...h.querySelectorAll('img')] : [];
      return { hoverCapable: matchMedia('(hover: hover)').matches,
               stages: hs.length, twoFrame: two.length,
               op: im.map(i => getComputedStyle(i).opacity) };
    });
    console.log('\n### touch device (iPhone 13) /shop');
    console.log('  hover:hover =', g.hoverCapable, '| stages:', g.stages, '| 2-frame:', g.twoFrame, '| opacity:', JSON.stringify(g.op));
    check('cards render on touch', g.stages > 0);
    check('two frames still mounted', g.twoFrame > 0);
    check('shows IMAGE 1 on touch, not image 2', g.op[0] === '1' && g.op[1] === '0');
    await ctx.close();
  }

  console.log(fails === 0 ? '\nALL EDGE-CASE CHECKS PASSED' : `\n${fails} EDGE-CASE CHECK(S) FAILED`);
  await browser.close();
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('FAIL ' + e.message); process.exit(1); });
