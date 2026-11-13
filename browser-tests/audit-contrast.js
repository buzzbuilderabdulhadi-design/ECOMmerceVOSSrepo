const { chromium } = require('playwright-core');

/**
 * Contrast audit that understands this design system's gradient surfaces.
 *
 * The earlier version only read `background-color`, but almost every surface
 * here is a linear-gradient (which has a transparent background-color), so it
 * walked past the real backdrop up to the dark <main> and reported false
 * failures. This version composes the whole ancestor paint stack and, when a
 * gradient is involved, checks EVERY colour stop and reports the worst case.
 */
const AUDIT = () => {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });

  // Resolve any CSS colour (hex, rgb, lab, oklch, named) to exact RGBA.
  const parse = (c) => {
    if (!c || c === 'transparent' || c === 'none') return null;
    // Sentinel that is itself a valid colour, so an invalid value leaves
    // fillStyle untouched and can be detected. (Comparing against '#000000'
    // would wrongly reject genuine black.)
    const SENTINEL = 'rgba(1, 2, 3, 0.5)';
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = SENTINEL;
    ctx.fillStyle = c;
    if (ctx.fillStyle === SENTINEL) return null;
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return { r: d[0], g: d[1], b: d[2], a: d[3] / 255 };
  };

  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });

  // Tailwind v4 emits modern colour notation (lab/oklch/color()) in computed
  // styles, so the matcher has to cover every colour function, not just hex
  // and rgb(). Missing these made every gradient invisible to the audit.
  const COLOR_RE = '(?:#[0-9a-fA-F]{3,8}|(?:rgba?|hsla?|lab|lch|oklab|oklch|color)\\([^)]*\\))';

  // Pull colour stops out of a computed background-image value.
  const stopsOf = (bi) => {
    const out = [];
    const re = new RegExp(COLOR_RE + '|\\btransparent\\b', 'gi');
    let m;
    while ((m = re.exec(bi))) out.push(m[0]);
    return out.map(parse).filter((c) => c && c.a > 0);
  };

  // Parse `linear-gradient(<dir>, <colour> <pos>%, ...)` so the gradient can be
  // evaluated AT THE TEXT rather than worst-cased across every stop.
  const parseLinear = (bi) => {
    const m = /linear-gradient\(([^)]*)\)/i.exec(bi);
    if (!m) return null;
    const parts = m[1].split(/\s*,\s*/);
    const dir = parts[0].trim().toLowerCase();
    const stops = [];
    const stopRe = new RegExp('^(' + COLOR_RE + ')\\s*([\\d.]+%)?');
    for (let i = 1; i < parts.length; i++) {
      const cm = stopRe.exec(parts[i].trim());
      if (!cm) continue;
      const c = parse(cm[1]);
      if (!c) continue;
      stops.push({ c, pos: cm[2] != null ? parseFloat(cm[2]) / 100 : null });
    }
    if (stops.length < 2) return null;
    if (stops.every((s) => s.pos === null)) {
      stops.forEach((s, i) => { s.pos = i / (stops.length - 1); });
    } else {
      const first = stops.find((s) => s.pos !== null);
      const last = stops.slice().reverse().find((s) => s.pos !== null);
      stops.forEach((s, i) => {
        if (s.pos === null) {
          s.pos = first.pos + ((last.pos - first.pos) * i) / Math.max(1, stops.length - 1);
        }
      });
    }
    stops.sort((a, b) => a.pos - b.pos);
    return { dir, stops };
  };

  // Where the text sits along the gradient axis, 0..1.
  const axisPos = (dir, el, box) => {
    const er = el.getBoundingClientRect();
    const br = box.getBoundingClientRect();
    const cx = (er.x + er.width / 2 - br.x) / (br.width || 1);
    const cy = (er.y + er.height / 2 - br.y) / (br.height || 1);
    let p;
    if (dir.includes('top')) p = 1 - cy;
    else if (dir.includes('bottom')) p = cy;
    else if (dir.includes('left')) p = 1 - cx;
    else p = cx;
    return Math.min(1, Math.max(0, p));
  };

  const sampleLinear = (lin, el, box) => {
    const p = axisPos(lin.dir, el, box);
    const s = lin.stops;
    let a = s[0];
    let b = s[s.length - 1];
    for (let i = 0; i < s.length - 1; i++) {
      if (p >= s[i].pos && p <= s[i + 1].pos) { a = s[i]; b = s[i + 1]; break; }
    }
    const span = b.pos - a.pos;
    const t = span <= 0 ? 0 : (p - a.pos) / span;
    return {
      r: a.c.r + (b.c.r - a.c.r) * t,
      g: a.c.g + (b.c.g - a.c.g) * t,
      b: a.c.b + (b.c.b - a.c.b) * t,
      a: a.c.a + (b.c.a - a.c.a) * t,
    };
  };

  // A node's own background, as the list of colours it can contribute.
  const ownLayer = (node, el) => {
    const cs = getComputedStyle(node);
    const out = [];
    const bc = parse(cs.backgroundColor);
    if (bc && bc.a > 0) out.push(bc);
    const bi = cs.backgroundImage;
    if (bi && bi !== 'none') {
      const lin = parseLinear(bi);
      if (lin && node !== el) {
        const c = sampleLinear(lin, el, node);
        if (c.a > 0) out.push(c);
      } else {
        for (const c of stopsOf(bi)) out.push(c);
      }
    }
    return out;
  };

  // Every card/tile in this design puts an absolutely positioned gradient
  // scrim in a SIBLING of the caption. Walking ancestors never sees it, which
  // made the audit report light-section colours under text that is actually
  // sitting on a dark scrim. Composite those overlays explicitly.
  const overlaysOf = (node, el) => {
    if (node === el) return [];
    const er = el.getBoundingClientRect();
    const cx = er.x + er.width / 2;
    const cy = er.y + er.height / 2;
    const out = [];
    for (const child of node.children) {
      const cs = getComputedStyle(child);
      if (cs.position !== 'absolute' && cs.position !== 'fixed') continue;
      const r = child.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      // Only overlays that actually sit under the text.
      if (cx < r.x || cx > r.x + r.width || cy < r.y || cy > r.y + r.height) continue;
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const lin = parseLinear(bi);
        if (lin) {
          const c = sampleLinear(lin, el, child);
          if (c.a > 0) out.push(c);
        } else {
          for (const c of stopsOf(bi)) out.push(c);
        }
        continue;
      }
      const bc = parse(cs.backgroundColor);
      if (bc && bc.a > 0) out.push(bc);
    }
    return out;
  };

  // Composite the ancestor paint stack (outermost -> innermost) and return
  // every plausible effective background.
  const bgVariants = (el) => {
    const chain = [];
    let n = el;
    while (n && n !== document.documentElement) {
      chain.push(n);
      n = n.parentElement;
    }
    chain.push(document.documentElement);

    const root =
      parse(getComputedStyle(document.documentElement).backgroundColor) ||
      { r: 255, g: 255, b: 255, a: 1 };

    const layers = [];
    for (let i = chain.length - 1; i >= 0; i--) {
      for (const c of ownLayer(chain[i], el)) layers.push([c]);
      for (const c of overlaysOf(chain[i], el)) layers.push([c]);
    }

    let variants = [root];
    for (const layer of layers) {
      const next = [];
      for (const base of variants) {
        for (const c of layer) next.push(over(c, base));
      }
      variants = next.slice(0, 24);
    }
    return variants.length ? variants : [root];
  };

  const results = { checked: 0, low: [], darkBg: 0, lightBg: 0, sections: [] };

  document.querySelectorAll('section[id], footer, header').forEach((s) => {
    const cs = getComputedStyle(s);
    const bc = parse(cs.backgroundColor);
    results.sections.push({
      id: s.id || s.tagName.toLowerCase(),
      bgColor: bc && bc.a > 0 ? `rgb(${bc.r},${bc.g},${bc.b})` : 'transparent',
      hasGradient: cs.backgroundImage !== 'none',
    });
  });

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let node;
  while ((node = walker.nextNode())) {
    const text = node.textContent.trim();
    if (!text || text.length < 2) continue;
    const el = node.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const fgRaw = parse(cs.color);
    if (!fgRaw) continue;

    const variants = bgVariants(el);
    const size = parseFloat(cs.fontSize);
    const bold = +cs.fontWeight >= 700;
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;

    let worst = Infinity;
    let worstBg = null;
    for (const v of variants) {
      const fg = fgRaw.a < 1 ? over(fgRaw, v) : fgRaw;
      const cr = ratio(fg, v);
      if (cr < worst) {
        worst = cr;
        worstBg = v;
      }
    }
    results.checked++;
    if (lum(worstBg) < 0.2) results.darkBg++;
    else results.lightBg++;

    if (worst < need) {
      results.low.push({
        text: text.slice(0, 46),
        cls: String(el.className).slice(0, 54),
        color: cs.color,
        bg: `rgb(${Math.round(worstBg.r)},${Math.round(worstBg.g)},${Math.round(worstBg.b)})`,
        ratio: +worst.toFixed(2),
        need,
        size,
        gradientBg: variants.length > 1,
      });
    }
  }
  return results;
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const routes = process.argv[2] ? [process.argv[2]] : ['/', '/shop', '/products/napoli-block-heel', '/cart', '/wishlist', '/checkout', '/login'];
  const all = {};
  for (const route of routes) {
    // reducedMotion settles every scroll-reveal at full opacity. Without it,
    // below-fold sections stay at opacity 0 and get skipped entirely, which
    // silently shrinks the audit to a couple of elements.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    const res = await page.evaluate(AUDIT);
    all[route] = res;
    console.log(
      `${route.padEnd(32)} checked=${String(res.checked).padStart(4)}  low=${String(res.low.length).padStart(3)}  dark=${res.darkBg} light=${res.lightBg}`
    );
    await page.close();
  }
  console.log('\n=== FAILURES ===');
  for (const [route, res] of Object.entries(all)) {
    for (const f of res.low) {
      console.log(`${route}  ${f.ratio} (need ${f.need})  ${f.color} on ${f.bg}${f.gradientBg ? ' [grad]' : ''}  "${f.text}"  .${f.cls}`);
    }
  }
  await browser.close();
})().catch((e) => {
  console.error('FAIL: ' + e.message);
  process.exit(1);
});
