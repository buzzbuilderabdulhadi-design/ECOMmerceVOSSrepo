const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const OUT = path.join(__dirname, 'verify-home');

(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const report = {};

  const failed = [];
  const errors = [];
  page.on('requestfailed', (r) => failed.push(`${r.url().split('/').pop()} :: ${r.failure()?.errorText}`));
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Product data actually rendered from the API?
  report.productLinks = await page.locator('a[href^="/products/"]').count();
  report.sectionHeadings = await page.locator('section h2').allTextContents();
  report.categoryTiles = await page.locator('#shop-by-category a[href^="/category/"]').count();
  report.focusTiles = await page.locator('#categories-in-focus a[href^="/category/"]').count();
  report.heroVideoRequests = failed.filter((f) => f.includes('hero.mp4'));
  report.videoStillInDom = await page.locator('video').count();
  report.heroPosterVisible = await page.locator('section img.object-cover').first().isVisible();
  report.pageErrors = errors;

  // Mega menu: hover the first category link in the desktop nav
  const catLink = page.locator('header nav a[href^="/category/"]').first();
  report.firstCategory = (await catLink.textContent())?.trim();
  await catLink.hover();
  await page.waitForTimeout(700);
  report.megaMenuVisible = await page.locator('header a:has-text("Jackets")').count();
  await page.screenshot({ path: path.join(OUT, 'megamenu.png') });

  // Search overlay lifecycle
  const overlayInput = page.locator('input[placeholder="What are you looking for?"]');
  await page.mouse.move(400, 700);
  await page.waitForTimeout(300);
  await page.keyboard.press('/');
  await page.waitForTimeout(600);
  report.overlayOpensOnSlash = await overlayInput.isVisible();
  await page.screenshot({ path: path.join(OUT, 'search-overlay.png') });

  await overlayInput.fill('leather');
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  report.searchNavigatesTo = page.url();
  report.overlayClosedAfterSearch = (await overlayInput.count()) === 0;
  report.bodyScrollRestored = await page.evaluate(() => document.body.style.overflow || 'unset');

  // Reopen and close with Escape
  await page.keyboard.press('/');
  await page.waitForTimeout(500);
  const openedAgain = await overlayInput.isVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  report.overlayOpensAgain = openedAgain;
  report.overlayClosesOnEscape = (await overlayInput.count()) === 0;

  // Sticky navbar material change
  await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  report.navBgAtTop = await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor);
  await page.mouse.wheel(0, 1200);
  await page.waitForTimeout(800);
  report.navBgScrolled = await page.locator('header').evaluate((el) => getComputedStyle(el).backgroundColor);
  report.navStickyTop = await page.locator('header').evaluate((el) => el.getBoundingClientRect().top);
  report.newArrivalsCards = await page.locator('section:has-text("New Arrivals") a[href^="/products/"]').count()
  report.docOverflowAfterScroll = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1
  );

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('FAIL: ' + e.message);
  process.exit(1);
});
