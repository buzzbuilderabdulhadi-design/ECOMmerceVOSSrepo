// Customer acceptance E2E for ZOYA GOODS (full purchase journey).
// RUN FROM WORKSPACE ROOT with:  node browser-tests/e2e-customer.js
// Requires: server on :5000, client on :3000, playwright-core at project root.
const { chromium } = require('playwright-core');

const BASE = 'http://localhost:3000';
const results = [];
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];

function step(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name}${detail ? ' -- ' + detail : ''}`);
}

async function expectVisible(selector, name, timeout = 15000) {
  try {
    await selector.waitFor({ state: 'visible', timeout });
    step(name, true);
    return true;
  } catch {
    step(name, false, 'element not visible');
    return false;
  }
}

let sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForToast(page, regex, timeout = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const t = (await page.locator('div[role="status"]').last().textContent().catch(() => '')) || '';
    if (regex.test(t)) return t;
    await sleep(400);
  }
  return (await page.locator('div[role="status"]').last().textContent().catch(() => '')) || '';
}

async function waitForBadge(page, expected) {
  const badge = page.locator('nav button[aria-label="Open cart"] span, [aria-label="Open cart"] span').first();
  for (let i = 0; i < 20; i++) {
    const t = (await badge.textContent().catch(() => '')).trim();
    if (t === expected) return t;
    await sleep(500);
  }
  return (await badge.textContent().catch(() => '')).trim();
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(`[${page.url()}] ${msg.text()}`);
  });
  page.on('pageerror', (err) => pageErrors.push(`[${page.url()}] ${err.message}`));
  page.on('requestfailed', (req) => {
    if (req.url().includes('favicon')) return;
    if (req.resourceType() === 'image' || req.resourceType() === 'font') return;
    failedRequests.push(`${req.method()} ${req.url()} :: ${req.failure()?.errorText || 'failed'}`);
  });

  const email = `e2e.customer.${Date.now()}@zoyagoods.test`;
  let orderNumber = null;
  const lastToast = () => page.locator('div[role="status"]').last().textContent().catch(() => '');

  try {
    // ================== 1. HOMEPAGE ==================
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('footer').waitFor({ timeout: 20000 });
    step('Homepage loads with footer', true);
    const homeHeading = await page.locator('h1').first().textContent().catch(() => '');
    step('Homepage renders a heading', homeHeading.trim().length > 0, `h1="${homeHeading.trim().slice(0, 40)}"`);
    await expectVisible(page.locator('a[href="/shop"]').first(), 'Homepage links to /shop');

    // ================== 2. NAVBAR SEARCH (typed query) ==================
    await page.locator('button[aria-label="Search"]').first().click();
    const searchInput = page.getByPlaceholder('What are you looking for?');
    await searchInput.waitFor({ timeout: 10000 });
    await searchInput.fill('riviera');
    await searchInput.press('Enter');
    await page.waitForURL('**/shop?search=riviera', { timeout: 20000 }).catch(() => {});
    step('Navbar search routes to /shop?search=riviera', page.url().includes('search=riviera'), page.url());
    await expectVisible(
      page.locator('a[href^="/products/"]', { hasText: 'Riviera Tennis Bracelet' }).first(),
      'Navbar search returns Riviera Tennis Bracelet'
    );

    // Search with no results shows empty state
    await page.goto(BASE + '/shop?search=zzzznomatchxyz', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('text=/No matches/i').first(), 'Search with no results shows empty state', 20000);

    // Sort by price ascending (server-side)
    await page.goto(BASE + '/shop?sort=price_asc', { waitUntil: 'domcontentloaded', timeout: 30000 });
    let sortCards = 0;
    for (let i = 0; i < 24 && sortCards === 0; i++) {
      sortCards = await page.locator('a[href^="/products/"]:has(img)').count();
      if (sortCards === 0) await page.waitForTimeout(250);
    }
    step('Sort=price_asc renders cards without errors', sortCards > 0, `cards=${sortCards}`);

    // ================== 3. CATEGORY PAGE ==================
    await page.goto(BASE + '/category/jewelry', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const catCard = page.locator('a[href^="/products/"]:has(img)').first();
    await expectVisible(catCard, 'Category page /category/jewelry shows products');

    // ================== 4. PRODUCT NOT FOUND (error state) ==================
    await page.goto(BASE + '/products/definitely-not-a-product-xyz', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expectVisible(page.locator('h1', { hasText: 'Product not found' }).first(), 'Invalid product slug shows "Product not found"');

    // ================== 5. PRODUCT DETAIL PRICE ==================
    await page.goto(BASE + '/products/cinque-terre-hoop-earrings', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const addBtn = page.locator('button', { hasText: 'Add to Cart' }).first();
    await expectVisible(addBtn, 'Product detail shows Add to Cart');
    const priceOnPage = (await page.locator('body').textContent()).match(/\$\d+(\.\d{2})?/g) || [];
    step('Product detail displays a price', priceOnPage.length > 0, priceOnPage[0] || '');

    // ================== 6. GUEST QUICK ADD (Phase 3 verification) ==================
    await page.goto(BASE + '/shop', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const targetCard = page.locator('a[href="/products/riviera-tennis-bracelet"]').first();
    await targetCard.waitFor({ timeout: 15000 });
    await targetCard.hover();
    const quickAdd = targetCard.locator('button', { hasText: 'Quick Add' }).first();
    await expectVisible(quickAdd, 'Quick Add button appears on hover', 10000);
    await quickAdd.click();

    const badge1 = await waitForBadge(page, '1');
    step('Cart badge = 1 after guest quick add', badge1 === '1', `badge="${badge1}"`);

    const drawerHeading = page.locator('h2', { hasText: 'Your Selection' });
    const drawerShown = await drawerHeading.isVisible().catch(() => false);
    step('Quick add does NOT auto-open cart drawer (Phase 3)', !drawerShown, drawerShown ? 'drawer opened!' : '');

    const quickToast = (await lastToast()) || '';
    step('Toast "Added to cart" shown', /Added to cart/.test(quickToast), quickToast.slice(0, 50));

    // Guest cart persists across refresh
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    const badgeReload = await waitForBadge(page, '1');
    step('Guest cart persists across page refresh', badgeReload === '1', `badge="${badgeReload}"`);

    // ================== 7. SECOND ITEM (variant product) ==================
    await page.goto(BASE + '/products/giada-diamond-ring', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1', { hasText: 'Giada Diamond Ring' }).first().waitFor({ timeout: 20000 });
    await page.locator('button', { hasText: 'Add to Cart' }).first().click();
    const badge2 = await waitForBadge(page, '2');
    step('Second item added (variant product) on product detail', badge2 === '2', `badge="${badge2}"`);

    // ================== 8. CART PAGE (guest) + COUPON ==================
    await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1', { hasText: 'Shopping Cart' }).first().waitFor({ timeout: 20000 });
    await page.locator('a[href^="/products/"]').first().waitFor({ timeout: 15000 }).catch(() => {});
    const itemRows = await page.locator('a[href^="/products/"]').count();
    step('Cart page lists both items', itemRows >= 2, `links=${itemRows}`);

    // Invalid coupon rejected
    await page.getByLabel('Coupon code').fill('NOTAREALCODE');
    await page.locator('button', { hasText: 'Apply' }).last().click();
    const badCouponError = await waitForToast(page, /could not|invalid|no longer valid|empty/i);
    step('Invalid coupon rejected', /could not|invalid|no longer valid|empty/i.test(badCouponError), badCouponError.slice(0, 60));

    // Valid coupon applies
    await page.getByLabel('Coupon code').fill('ZOYATEST10');
    await page.locator('button', { hasText: 'Apply' }).last().click();
    const t0 = Date.now();
    let couponApplied = false;
    while (Date.now() - t0 < 8000) {
      const t = (await page.locator('div[role="status"]').last().textContent().catch(() => '')) || '';
      if (/applied/i.test(t) && !/could not|invalid/i.test(t)) couponApplied = true;
      const rows = await page.locator('text=/Discount/').count();
      if (couponApplied || rows > 0) break;
      await sleep(400);
    }
    const discountRows = await page.locator('text=/Discount/').count();
    step('Coupon ZOYATEST10 applied', couponApplied || discountRows > 0, `toast=${couponApplied} | discount rows=${discountRows}`);

    // ================== 9. REGISTER (guest cart merge) ==================
    await page.goto(BASE + '/register', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const regForm = page.locator('form').first();
    await regForm.locator('input[type=password]').first().waitFor({ timeout: 20000 }).catch(() => {});
    await regForm.getByLabel('First Name').fill('Zoya');
    await regForm.getByLabel('Last Name').fill('Test');
    await regForm.getByLabel('Email').fill(email);
    await regForm.locator('input[type="password"]').nth(0).fill('StrongPass123!');
    await regForm.locator('input[type="password"]').nth(1).fill('StrongPass123!');
    await page.locator('button', { hasText: 'Create Account' }).first().click();
    await page.waitForTimeout(4000);
    step('Registration succeeds (redirects away from /register)', !page.url().includes('/register'), page.url());

    const badgeMerged = await waitForBadge(page, '2');
    step('Guest cart (2 items) merged into account cart', badgeMerged === '2', `badge="${badgeMerged}"`);

    // ================== 10. WISHLIST ==================
    await page.goto(BASE + '/products/giada-diamond-ring', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('button', { hasText: 'Add to Wishlist' }).first().click();
    await page.waitForTimeout(1500);
    const wishToast = (await lastToast()) || '';
    step('Add to Wishlist works when logged in', /Added to wishlist/.test(wishToast), wishToast.slice(0, 50));

    await page.goto(BASE + '/wishlist', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const wishItem = page.locator('a[href="/products/giada-diamond-ring"]').first();
    await expectVisible(wishItem, 'Wishlist page shows saved item');
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);
    step('Wishlist persists after refresh', (await wishItem.count()) > 0);

    // ================== 11. CHECKOUT (bank transfer) ==================
    await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1', { hasText: 'Shopping Cart' }).first().waitFor({ timeout: 20000 });
    // Re-apply coupon (merge dropped the guest cart coupon — revalidate on purpose)
    await page.getByLabel('Coupon code').fill('ZOYATEST10');
    await page.locator('button', { hasText: 'Apply' }).last().click();
    await waitForToast(page, /Coupon applied|Applied/i);
    await page.locator('a[href="/checkout"]').first().click();
    await page.locator('h1', { hasText: 'Checkout' }).first().waitFor({ timeout: 20000 });

    await page.getByLabel('Full Name').waitFor({ timeout: 20000 }).catch(() => {});
    await page.getByLabel('Full Name').fill('Zoya Test');
    await page.getByLabel('Phone').fill('+1 555 000 1234');
    await page.getByLabel('Address').nth(0).fill('123 Luxury Lane');
    await page.getByLabel('City').fill('New York');
    await page.getByLabel('State').fill('NY');
    await page.getByLabel('ZIP Code').fill('10001');
    await page.getByLabel('Country').fill('United States');
    await page.locator('button', { hasText: 'Continue to Payment' }).click();

    const bankBtn = page.locator('button', { hasText: /Direct Bank Transfer/ }).first();
    await bankBtn.waitFor({ timeout: 15000 });
    await bankBtn.click();
    await page.waitForTimeout(500);
    await page.locator('button', { hasText: 'Review Order' }).click();
    await page.waitForTimeout(1000);
    step('Review step shows shipping address', (await page.locator('text=/123 Luxury Lane/').count()) > 0);

    await page.locator('button', { hasText: 'Place Order' }).click();
    const successHeading = page.locator('h2', { hasText: 'Order Placed — Payment Pending' }).first();
    const success = await successHeading.waitFor({ state: 'visible', timeout: 25000 }).then(() => true).catch(() => false);
    step('Order placed with "Payment Pending" confirmation', success);
    if (success) {
      const bodyText = await page.locator('body').textContent();
      const m = bodyText.match(/#([A-Z0-9-]{3,})/);
      orderNumber = m ? m[1] : null;
      step('Order reference extracted', !!orderNumber, `#${orderNumber}`);
    }

    // ================== 12. DASHBOARD ORDERS ==================
    await page.goto(BASE + '/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('h1').first().waitFor({ timeout: 20000 });
    if (orderNumber) await page.getByText(orderNumber).first().waitFor({ timeout: 15000 }).catch(() => {});
    const orderInList = orderNumber ? await page.getByText(orderNumber).count() : 0;
    step('Order appears in My Orders', orderInList > 0, orderNumber ? `#${orderNumber}` : '');

    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    const dashH1 = await page.locator('h1').first().textContent().catch(() => '');
    step('Dashboard loads for registered customer', !!dashH1, (dashH1 || '').trim().slice(0, 40));

    // Session persists on hard refresh
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const stillLoggedIn = await page.locator('h1').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => !page.url().includes('/login')).catch(() => false);
    step('Session persists across hard refresh', stillLoggedIn, page.url());

    // ================== 13. LOGOUT + AUTH GUARDS ==================
    await page.locator('button', { hasText: /^Sign Out$/ }).first().click();
    await page.waitForTimeout(2000);
    step('Logout leaves the dashboard', !page.url().includes('/dashboard'), page.url());

    await page.goto(BASE + '/dashboard', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    step('Protected /dashboard redirects to login', page.url().includes('/login'), page.url());
    await page.goto(BASE + '/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    step('Protected /dashboard/orders redirects to login', page.url().includes('/login'), page.url());

    // ================== 14. LOGIN RESTORES STATE ==================
    await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const loginForm = page.locator('form').first();
    await loginForm.getByLabel('Email').fill(email);
    await loginForm.locator('input[type="password"]').first().fill('StrongPass123!');
    await page.locator('button', { hasText: 'Sign In' }).first().click();
    await page.waitForTimeout(4000);
    step('Login succeeds', !page.url().includes('/login'), page.url());

    await page.goto(BASE + '/dashboard/orders', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    const orderAgain = orderNumber ? await page.getByText(orderNumber).count() : 0;
    step('Order visible again after re-login', orderAgain > 0);

    await page.goto(BASE + '/wishlist', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    step('Wishlist intact after re-login', (await page.locator('a[href="/products/giada-diamond-ring"]').count()) > 0);

    await page.goto(BASE + '/cart', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    const badgeFinal = (await page.locator('[aria-label="Open cart"] span').first().textContent().catch(() => '')) || '';
    step('Cart empty after checkout (order consumed items)', badgeFinal === '' || badgeFinal === '0', `badge="${badgeFinal || '(none)'}"`);
  } catch (err) {
    step('UNCAUGHT E2E ERROR', false, String(err).slice(0, 400));
  } finally {
    console.log('\n================ SUMMARY ================');
    const passes = results.filter((r) => r.ok).length;
    const fails = results.filter((r) => !r.ok).length;
    for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'} | ${r.name}`);
    console.log(`\nTOTAL: ${results.length}  PASS: ${passes}  FAIL: ${fails}`);

    console.log(`\nConsole errors: ${consoleErrors.length}`);
    for (const e of consoleErrors.slice(0, 40)) console.log('  ' + e);
    console.log(`Page errors: ${pageErrors.length}`);
    for (const e of pageErrors.slice(0, 20)) console.log('  ' + e);
    console.log(`Failed requests (non-image/font): ${failedRequests.length}`);
    for (const e of failedRequests.slice(0, 40)) console.log('  ' + e);

    await browser.close();
    process.exit(fails > 0 ? 1 : 0);
  }
})();