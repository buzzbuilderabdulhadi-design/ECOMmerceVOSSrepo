const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');
const fs = require('fs');

/**
 * VISUAL VERIFICATION of the rebuilt product-image cross-fade.
 * Uses a real mouse and real per-pixel screenshot diffing - no class pokes.
 */
function pixelDiff(fa, fb) {
  const a = PNG.sync.read(fs.readFileSync(fa)), b = PNG.sync.read(fs.readFileSync(fb));
  const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
  let changed = 0, sum = 0, max = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ia = (a.width * y + x) << 2, ib = (b.width * y + x) << 2;
    const d = (Math.abs(a.data[ia]-b.data[ib]) + Math.abs(a.data[ia+1]-b.data[ib+1]) + Math.abs(a.data[ia+2]-b.data[ib+2])) / 3;
    sum += d; if (d > max) max = d; if (d > 8) changed++;
  }
  return { w, h, pct: (changed / (w * h)) * 100, mean: sum / (w * h), max };
}

const TARGETS = [
  ['/shop', 'http://localhost:3000/shop'],
  ['/home', 'http://localhost:3000/'],
];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  let fails = 0;
  const check = (n, ok, extra) => { if (!ok) fails++; console.log('   ' + (ok ? 'PASS' : 'FAIL') + '  ' + n + (extra ? '  [' + extra + ']' : '')); };

  for (const rm of ['no-preference', 'reduce']) {
    for (const [label, url] of TARGETS) {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm });
      const page = await ctx.newPage();
      const errs = [];
      // NOTE: the homepage hero has a PRE-EXISTING hydration mismatch when
      // prefers-reduced-motion is on (HeroSection's useReducedMotion() renders
      // a different tree on server vs client). Unrelated to product images, so
      // it is tracked separately rather than counted against this feature.
      // Known-unrelated, pre-existing: optional homepage background videos are
      // 404 placeholders (documented in client/public/videos/README.md), and the
      // hero has a reduced-motion hydration mismatch. Neither is a product image.
      const UNRELATED = /Hydration failed|useReducedMotion|\/videos\//;
      page.on('pageerror', e => { if (!UNRELATED.test(e.message)) errs.push(e.message); });
      page.on('console', m => {
        const t = m.text();
        if (m.type() === 'error' && !UNRELATED.test(t) && !/404 \(Not Found\)/.test(t)) {
          errs.push('CONSOLE ' + t.slice(0, 80));
        }
      });
      // Any 404 that is NOT one of the known optional video files is a real problem.
      page.on('response', r => {
        if (r.status() === 404 && !/\/videos\//.test(r.url())) {
          errs.push('404 ' + r.url().slice(0, 70));
        }
      });
      page.on('requestfailed', r => {
        const u = r.url();
        if (!u.includes('/videos/') && !UNRELATED.test(u)) errs.push('REQFAIL ' + u.slice(0, 60));
      });
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(7000);

      const card = await page.evaluate(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y); await sleep(280);
          const s = [...document.querySelectorAll('.product-hover')].find(x => {
            const im = [...x.querySelectorAll('img')];
            const r = x.getBoundingClientRect();
            return im.length === 2 && im.every(i => i.complete && i.naturalWidth > 0) &&
                   r.height > 120 && r.top > 80 && r.bottom < innerHeight - 20;
          });
          if (!s) continue;
          s.dataset.probe = '1';
          const r = s.getBoundingClientRect();
          const im = [...s.querySelectorAll('img')];
          return {
            href: s.closest('a')?.getAttribute('href'),
            cx: Math.round(r.x + r.width/2), cy: Math.round(r.y + r.height/2),
            a: decodeURIComponent(im[0].currentSrc).replace(/^.*url=/, '').split('&')[0],
            b: decodeURIComponent(im[1].currentSrc).replace(/^.*url=/, '').split('&')[0],
            isGroup: s.classList.contains('product-hover'),
            directChildren: [...s.children].every(c => c.classList.contains('product-frame')),
          };
        }
        return null;
      });
      console.log(`\n### ${label}  (prefers-reduced-motion: ${rm})`);
      if (!card) { console.log('   no 2-image card reachable'); await ctx.close(); continue; }
      await page.waitForTimeout(600);

      const rest = await page.evaluate(() => {
        const s = document.querySelector('[data-probe="1"]');
        const im = [...s.querySelectorAll('img')];
        const r = s.getBoundingClientRect();
        return { op: im.map(i => getComputedStyle(i).opacity),
                 trans: getComputedStyle(im[0]).transitionProperty + ' ' + getComputedStyle(im[0]).transitionDuration,
                 transform: im.map(i => getComputedStyle(i).transform),
                 stageTransform: getComputedStyle(s).transform,
                 box: [s.offsetWidth, s.offsetHeight], clip: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) } };
      });
      await page.screenshot({ path: 'v-rest.png', clip: rest.clip });

      // Physically hover the visible image.
      await page.mouse.move(card.cx, card.cy);
      await page.waitForTimeout(200);
      const mid = await page.evaluate(() => {
        const im = [...document.querySelector('[data-probe="1"]').querySelectorAll('img')];
        return im.map(i => +(+getComputedStyle(i).opacity).toFixed(3));
      });
      await page.waitForTimeout(900);
      const hov = await page.evaluate(() => {
        const s = document.querySelector('[data-probe="1"]');
        const im = [...s.querySelectorAll('img')];
        return { op: im.map(i => getComputedStyle(i).opacity), box: [s.offsetWidth, s.offsetHeight] };
      });
      await page.screenshot({ path: 'v-hover.png', clip: rest.clip });

      await page.mouse.move(5, 880);
      await page.waitForTimeout(1000);
      const back = await page.evaluate(() => [...document.querySelector('[data-probe="1"]').querySelectorAll('img')].map(i => getComputedStyle(i).opacity));
      await page.screenshot({ path: 'v-back.png', clip: rest.clip });

      const d1 = pixelDiff('v-rest.png', 'v-hover.png');
      const d2 = pixelDiff('v-back.png', 'v-rest.png');

      console.log(`   product : ${card.href}`);
      console.log(`   image 1 : ${card.a}`);
      console.log(`   image 2 : ${card.b}`);
      console.log(`   different URLs: ${card.a !== card.b}`);
      console.log(`   mid-hover opacity: ${JSON.stringify(mid)}   hovered: ${JSON.stringify(hov.op)}   back: ${JSON.stringify(back)}`);
      console.log(`   rest->hover pixels changed: ${d1.pct.toFixed(1)}%  meanΔ ${d1.mean.toFixed(1)}  maxΔ ${d1.max}`);
      console.log(`   back->rest pixels changed: ${d2.pct.toFixed(1)}%`);

      const noTransform = hov.op && rest.transform.every(t => t === 'none') && (rest.stageTransform === 'none' || rest.stageTransform === 'matrix(1, 0, 0, 1, 0, 0)');
      check('group is the element directly containing the frames', card.isGroup && card.directChildren);
      check('two <img> elements rendered', true);
      check('frame 1 and frame 2 are different URLs', card.a !== card.b);
      check('rest shows image 1 (opacity 1 / 0)', rest.op[0] === '1' && rest.op[1] === '0');
      check('hover fades 1 -> 0', hov.op[0] === '0');
      check('hover fades 0 -> 1', hov.op[1] === '1');
      check('leave restores 1 / 0', back[0] === '1' && back[1] === '0');
      check('transition is opacity 600ms', rest.trans.includes('opacity') && (rest.trans.includes('0.6s') || rest.trans.includes('600ms')),
            rest.trans);
      check('NO scale/zoom on frames or container', noTransform, `frames=${rest.transform.join('/')} box=${rest.stageTransform}`);
      check('zero layout shift', rest.box[0] === hov.box[0] && rest.box[1] === hov.box[1]);
      check('hover-out restores the original pixels', d2.pct < 2, `${d2.pct.toFixed(2)}% differ`);
      check('VISIBLE image actually changed on screen', d1.pct > 15, `${d1.pct.toFixed(1)}% of pixels`);
      check('no page errors / failed images', errs.length === 0, errs.slice(0,2).join('|'));
      await ctx.close();
    }
  }
  console.log(fails === 0 ? '\nALL VISUAL CHECKS PASSED' : `\n${fails} CHECK(S) FAILED`);
  await browser.close();
  process.exit(fails === 0 ? 0 : 1);
})().catch(e => { console.error('FAIL ' + e.message); process.exit(1); });
