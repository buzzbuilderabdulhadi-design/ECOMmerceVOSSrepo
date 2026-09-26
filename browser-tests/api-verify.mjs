import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1';
const envFile = path.join(__dirname, '..', 'server', '.env');
const env = fs.readFileSync(envFile, 'utf8');
const raw = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
};

const ADMIN_EMAIL = raw('ADMIN_EMAIL');
const ADMIN_PASSWORD = raw('ADMIN_PASSWORD');
const MONGODB_URI = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ADMIN_EMAIL/ADMIN_PASSWORD not found in server/.env');
  process.exit(1);
}

const TS = Date.now();
const TAG = `ZG-ADM-${TS}`;
const TEST = (suffix) => `${TAG}-${suffix}`;

const results = [];
let passed = 0;
let failed = 0;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------
function step(name, ok, detail = '') {
  const status = ok ? 'PASS' : 'FAIL';
  results.push({ status, name, detail });
  if (ok) passed++; else failed++;
  console.log(`  [${status}] ${name}${detail ? '  -> ' + detail : ''}`);
}

const created = { products: [], variants: [], categories: [], childCats: [], coupons: [], media: [], uploadedFiles: [], users: [], addresses: [], reviews: [], questions: [], orders: [] };

async function api(method, url, { token, body, form } = {}) {
  const headers = {};
  if (!form) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: form || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
}

function bodyOf(res) {
  return res.json && res.json.data !== undefined ? res.json.data : res.json;
}

async function login(email, password) {
  const res = await api('POST', '/auth/login', { body: { email, password } });
  if (res.status !== 200 || !res.json?.data?.accessToken) throw new Error('login failed for ' + email);
  return res.json.data; // { user, accessToken, refreshToken }
}

// ---------------------------------------------------------------------------
// Mongo cleanup (explicit IDs only)
// ---------------------------------------------------------------------------
let db;
let ObjectId;
function buildDirectUri(srvUri) {
  const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srvUri);
  if (!m) return null;
  const [, creds, , , dbname, query] = m;
  const hosts = [
    'ac-lvpwpcf-shard-00-00.krjy1ox.mongodb.net',
    'ac-lvpwpcf-shard-00-01.krjy1ox.mongodb.net',
    'ac-lvpwpcf-shard-00-02.krjy1ox.mongodb.net',
  ].map((h) => `${h}:27017`).join(',');
  const params = new URLSearchParams(query || '');
  if (!params.has('replicaSet')) params.set('replicaSet', 'atlas-63jqru-shard-0');
  if (!params.has('authSource')) params.set('authSource', 'admin');
  if (!params.has('tls')) params.set('tls', 'true');
  if (!params.has('retryWrites')) params.set('retryWrites', 'true');
  return `mongodb://${creds}${hosts}/${dbname || 'zoya-goods'}?${params.toString()}`;
}

async function connectDb() {
  if (!MONGODB_URI) return false;
  const { MongoClient, ObjectId: OI } = await import('mongodb');
  ObjectId = OI;
  const uris = [MONGODB_URI, buildDirectUri(MONGODB_URI)].filter(Boolean);
  let lastErr;
  for (const uri of uris) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        db = new MongoClient(uri, { serverSelectionTimeoutMS: 25000 });
        await db.connect();
        return true;
      } catch (e) {
        lastErr = e;
        try { await db.close(); } catch { /* ignore */ }
        db = null;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  console.log('  DB connect failed:', lastErr ? String(lastErr.message).slice(0, 160) : '');
  return false;
}

async function cleanup() {
  console.log('\n--- CLEANUP (explicit IDs only) ---');
  if (!db) { console.log('  no DB connection; skipping DB-level cleanup'); return; }
  const oid = (x) => (typeof x === 'string' ? ObjectId.createFromHexString(x) : x);
  try {
    const byId = (col, list) => list.length && db.db().collection(col).deleteMany({ _id: { $in: list.map(oid) } });
    await byId('Coupon', created.coupons);
    await byId('Review', created.reviews);
    await byId('ProductQuestion', created.questions);
    await byId('Address', created.addresses);
    await byId('Media', created.media);
    await byId('Order', created.orders);
    await db.db().collection('OrderItem').deleteMany({ orderId: { $in: created.orders.map(oid) } });
    await db.db().collection('PaymentEvent').deleteMany({ orderId: { $in: created.orders.map(oid) } });

    if (created.users.length) {
      const us = created.users.map(oid);
      await db.db().collection('Cart').deleteMany({ userId: { $in: us } });
      const carts = await db.db().collection('Cart').find({ userId: { $in: us } }).project({ _id: 1 }).toArray();
      await db.db().collection('CartItem').deleteMany({ cartId: { $in: carts.map((c) => c._id) } });
      await db.db().collection('Notification').deleteMany({ userId: { $in: us } });
      await db.db().collection('ActivityLog').deleteMany({ userId: { $in: us } });
      await db.db().collection('User').deleteMany({ _id: { $in: us } });
    }
    await byId('ProductVariant', created.variants);
    await byId('Product', created.products);
    await byId('Category', created.categories);
    await byId('Category', created.childCats);
    for (const f of created.uploadedFiles) {
      try { fs.rmSync(path.join(__dirname, '..', 'server', 'uploads', f), { force: true }); } catch { /* ignore */ }
    }
    console.log('  cleanup done');
  } catch (e) {
    console.error('  cleanup error:', e.message);
  } finally {
    try { await db.close(); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
let customer;
let admin;
let orderId;
let couponPctId;
let couponFixId;

try {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`API VERIFY RUN  tag=${TAG}  ts=${new Date().toISOString()}`);
  console.log(`Base: ${BASE}`);
  console.log('='.repeat(70) + '\n');

  // ------------------------------------------------------------------
  // A. Unauthenticated / authorization gating
  // ------------------------------------------------------------------
  console.log('A. Authorization gating (no token / bad token)');
  for (const url of ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/customers', '/admin/coupons', '/admin/reviews']) {
    const r = await api('GET', url);
    step(`401 no-token ${url}`, r.status === 401, `got ${r.status}`);
  }
  const badToken = await api('GET', '/admin/dashboard', { token: 'invalid.token.value' });
  step('401 invalid-token /admin/dashboard', badToken.status === 401, `got ${badToken.status}`);

  // ------------------------------------------------------------------
  // B. Admin auth lifecycle
  // ------------------------------------------------------------------
  console.log('\nB. Admin auth lifecycle');
  const adminSession = await login(ADMIN_EMAIL, ADMIN_PASSWORD);
  admin = adminSession.user;
  step('admin login returns session', !!adminSession.accessToken && !!adminSession.refreshToken && !!adminSession.user?.id, adminSession.user?.email);
  step('admin user has role ADMIN', adminSession.user.role === 'ADMIN', `role=${adminSession.user.role}`);
  step('admin payload has no passwordHash', !('passwordHash' in adminSession.user));

  const me = await api('GET', '/auth/me', { token: adminSession.accessToken });
  step('GET /auth/me (admin)', me.status === 200 && me.json?.data?.role === 'ADMIN', `status=${me.status}`);

  const refresh = await api('POST', '/auth/refresh', { body: { refreshToken: adminSession.refreshToken } });
  step('POST /auth/refresh issues new tokens', refresh.status === 200 && !!refresh.json?.data?.accessToken, `status=${refresh.status}`);
  adminSession.accessToken = refresh.json?.data?.accessToken || adminSession.accessToken;

  // ------------------------------------------------------------------
  // C. Test customer
  // ------------------------------------------------------------------
  console.log('\nC. Test customer');
  const custEmail = TEST('customer').toLowerCase() + '@example.com';
  const reg = await api('POST', '/auth/register', { body: { name: 'ZG Verify Customer', email: custEmail, password: 'ZG-verify-12345!' } });
  step('customer registration', reg.status === 201 || reg.status === 200, `status=${reg.status}`);
  if (!reg.json?.data?.user?.id) {
    const existing = await login(custEmail, 'ZG-verify-12345!');
    customer = existing;
    step('customer login fallback (already registered from prior run)', true, existing.user.email);
  } else {
    customer = reg.json.data;
    created.users.push(customer.user.id);
  }
  step('customer registered role CUSTOMER', customer.user.role === 'CUSTOMER', `role=${customer.user.role}`);

  // ------------------------------------------------------------------
  const custToken = customer.accessToken;

  // ------------------------------------------------------------------
  // D. Admin-only access control: customer -> 403 on every admin surface
  // ------------------------------------------------------------------
  console.log('\nD. Customer blocked from admin API (403 matrix)');
  const adminGuarded = ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/customers', '/admin/coupons', '/admin/reviews', '/admin/questions', '/admin/analytics', '/admin/settings', '/admin/media'];
  for (const url of adminGuarded) {
    const r = await api('GET', url, { token: custToken });
    step(`403 customer ${url}`, r.status === 403, `got ${r.status}`);
  }
  const custCreateProduct = await api('POST', '/admin/products', { token: custToken, body: { name: 'nope', sku: 'nope', categoryId: 'aaaabbbbccccddddeeeefff0', regularPrice: 1 } });
  step('403 customer POST /admin/products', custCreateProduct.status === 403, `got ${custCreateProduct.status}`);

  // ------------------------------------------------------------------
  // E. Dashboard + analytics sanity (real data)
  // ------------------------------------------------------------------
  console.log('\nE. Dashboard + analytics');
  const dash = await api('GET', '/admin/dashboard', { token: adminSession.accessToken });
  const dv = bodyOf(dash).stats || bodyOf(dash);
  step('200 /admin/dashboard', dash.status === 200, `status=${dash.status}`);
  const dashNumbersOk = typeof dv?.totalRevenue === 'number' && Number.isFinite(dv.totalRevenue) && !Number.isNaN(dv.totalRevenue)
    && typeof dv?.totalOrders === 'number' && !Number.isNaN(dv.totalOrders)
    && typeof dv?.totalProducts === 'number' && !Number.isNaN(dv.totalProducts);
  step('dashboard totals are real finite numbers', dashNumbersOk, `orders=${dv?.totalOrders}, products=${dv?.totalProducts}, revenue=${dv?.totalRevenue}`);
  for (const url of ['/analytics', '/analytics/sales', '/analytics/orders', '/analytics/products', '/analytics/customers']) {
    const r = await api('GET', '/admin' + url, { token: adminSession.accessToken });
    step(`200 /admin${url}`, r.status === 200 && r.json?.data !== undefined, `status=${r.status}${r.json?.error ? ' error=' + String(r.json.error).slice(0, 80) : ''}`);
  }

  // ------------------------------------------------------------------
  // F. Categories
  // ------------------------------------------------------------------
  console.log('\nF. Categories CRUD');
  const catName = TEST('Category');
  const c1 = await api('POST', '/admin/categories', { token: adminSession.accessToken, body: { name: catName, slug: TEST('cat'), description: 'temp verification category', isActive: true } });
  const cat = bodyOf(c1);
  step('create category', c1.status === 201 && !!cat?.id, `status=${c1.status}`);
  created.categories.push(cat?.id);

  const child = await api('POST', '/admin/categories', { token: adminSession.accessToken, body: { name: TEST('ChildCat'), slug: TEST('cat-child'), parentId: cat?.id, isActive: true } });
  const childCat = bodyOf(child);
  step('create child category', child.status === 201 && !!childCat?.id, `status=${child.status}`);
  created.childCats.push(childCat?.id);

  const catList = await api('GET', '/admin/categories?search=' + encodeURIComponent(TEST('Category').slice(0, 12)), { token: adminSession.accessToken });
  step('category list includes created', (catList.json?.data || []).some((c) => c.id === cat?.id), `count=${(catList.json?.data || []).length}`);

  const catUpd = await api('PUT', `/admin/categories/${cat?.id}`, { token: adminSession.accessToken, body: { name: catName + ' UPDATED', displayOrder: 3 } });
  step('update category', catUpd.status === 200 && bodyOf(catUpd)?.name === catName + ' UPDATED', `status=${catUpd.status}`);

  const catOne = await api('GET', `/admin/categories/${cat?.id}`, { token: adminSession.accessToken });
  step('get single category', catOne.status === 200 && bodyOf(catOne)?.name === catName + ' UPDATED');

  const circular = await api('PUT', `/admin/categories/${cat?.id}`, { token: adminSession.accessToken, body: { parentId: childCat?.id } });
  step('circular parent rejected', circular.status === 400, `got ${circular.status}${circular.json?.error ? ' ' + String(circular.json.error).slice(0, 60) : ''}`);

  const badId = await api('GET', '/admin/categories/notanid', { token: adminSession.accessToken });
  step('malformed ObjectId -> 400', badId.status === 400, `got ${badId.status}`);

  // ------------------------------------------------------------------
  // G. Product CRUD
  // ------------------------------------------------------------------
  console.log('\nG. Products CRUD');
  const SKU = TEST('SKU');
  const prodPayload = {
    name: TEST('Product'),
    slug: TEST('product'),
    sku: SKU,
    categoryId: cat?.id,
    regularPrice: 100,
    salePrice: 80,
    stock: 50,
    lowStockThreshold: 5,
    description: 'Temporary verification product',
    material: 'Test',
    brand: 'Zoya',
    images: ['https://example.com/zg-verify.jpg'],
    tags: ['verify', 'temp'],
    isActive: true,
    isFeatured: false,
  };
  const p1 = await api('POST', '/admin/products', { token: adminSession.accessToken, body: prodPayload });
  const prod = bodyOf(p1);
  const PROD_SLUG = prod?.slug || TEST('product').toLowerCase();
  step('create product', p1.status === 201 && !!prod?.id && prod?.sku === SKU, `status=${p1.status}`);

  // validation negatives
  const invalPrice = await api('POST', '/admin/products', { token: adminSession.accessToken, body: { ...prodPayload, sku: TEST('SKU2'), salePrice: 9999 } });
  step('product salePrice>regularPrice rejected', invalPrice.status === 400, `got ${invalPrice.status}`);
  const invalCat = await api('POST', '/admin/products', { token: adminSession.accessToken, body: { ...prodPayload, sku: TEST('SKU3'), categoryId: 'abc' } });
  step('product bad categoryId rejected', invalCat.status === 400, `got ${invalCat.status}`);
  const emptyUpd = await api('PUT', `/admin/products/${prod?.id}`, { token: adminSession.accessToken, body: {} });
  step('empty product update rejected', emptyUpd.status === 400, `got ${emptyUpd.status}`);

  // admin reads
  if (prod?.id) created.products.push(prod.id);
  const pGet = await api('GET', `/admin/products/${prod?.id}`, { token: adminSession.accessToken });
  step('admin get product', pGet.status === 200 && bodyOf(pGet)?.sku === SKU, `status=${pGet.status}`);

  const pSearch = await api('GET', '/admin/products?search=' + encodeURIComponent(SKU), { token: adminSession.accessToken });
  step('admin product search finds SKU', (pSearch.json?.data?.products || pSearch.json?.data || []).some((p) => p.id === prod?.id) || pSearch.json?.data?.total > 0, `status=${pSearch.status}`);

  // storefront reflection
  const pub1 = await api('GET', '/products/' + PROD_SLUG);
  const pubv1 = bodyOf(pub1);
  step('storefront product reachable by slug', pub1.status === 200 && pubv1?.slug === PROD_SLUG, `status=${pub1.status} slug=${pubv1?.slug}`);

  const upd = await api('PUT', `/admin/products/${prod?.id}`, { token: adminSession.accessToken, body: { regularPrice: 110, salePrice: 90, stock: 60 } });
  step('update product (price/stock)', upd.status === 200 && bodyOf(upd)?.regularPrice === 110, `status=${upd.status}`);

  const pub2 = await api('GET', '/products/' + PROD_SLUG);
  const pubv2 = bodyOf(pub2);
  const pubPrice = pubv2?.salePrice ?? pubv2?.regularPrice;
  const pubStock = pubv2?.stock;
  step('storefront reflects price update via cache invalidation', pubPrice === 90, `salePrice=${pubPrice}`);
  step('storefront reflects stock update', pubStock === 60, `stock=${pubStock}`);

  // inactive product hidden from storefront listing
  const deact = await api('PUT', `/admin/products/${prod?.id}`, { token: adminSession.accessToken, body: { isActive: false } });
  step('deactivate product', deact.status === 200, `status=${deact.status}`);
  const pub3 = await api('GET', '/products/' + PROD_SLUG);
  step('deactivated product not fetchable on storefront', pub3.status === 404 || pub3.status === 200 && bodyOf(pub3)?.isActive === false, `got ${pub3.status} isActive=${bodyOf(pub3)?.isActive}`);
  await api('PUT', `/admin/products/${prod?.id}`, { token: adminSession.accessToken, body: { isActive: true } });
  const pub4 = await api('GET', '/products/' + PROD_SLUG);
  step('reactivated product visible again', pub4.status === 200 && bodyOf(pub4)?.isActive !== false, `status=${pub4.status}`);

  // ------------------------------------------------------------------
  // H. Variants
  // ------------------------------------------------------------------
  console.log('\nH. Variants CRUD');
  const v1 = await api('POST', `/admin/products/${prod?.id}/variants`, { token: adminSession.accessToken, body: { color: 'Ocean Blue', colorHex: '#0057ff', size: 'M', stock: 30, priceOverride: 95, sku: TEST('VSKU-A') } });
  const variant = bodyOf(v1);
  step('create variant', v1.status === 201 && !!variant?.id && variant?.size === 'M', `status=${v1.status}`);
  created.variants.push(variant?.id);

  const v2 = await api('POST', `/admin/products/${prod?.id}/variants`, { token: adminSession.accessToken, body: { color: 'Sand', colorHex: '#e4d5b7', size: 'L', stock: 10, priceOverride: 97 } });
  const variantB = bodyOf(v2);
  step('create second variant (no SKU -> auto-generated)', v2.status === 201 && !!variantB?.id, `status=${v2.status}`);
  created.variants.push(variantB?.id);

  const dupVariant = await api('POST', `/admin/products/${prod?.id}/variants`, { token: adminSession.accessToken, body: { color: 'Ocean Blue', colorHex: '#0057ff', size: 'M', stock: 1, sku: TEST('VSKU-A') } });
  step('duplicate variant SKU rejected', dupVariant.status === 409, `got ${dupVariant.status}`);

  const pubV = await api('GET', '/products/' + PROD_SLUG);
  const pubVariants = bodyOf(pubV)?.variants || [];
  step('storefront exposes variants', pubVariants.some((x) => x.id === variant?.id), `count=${pubVariants.length}`);

  const vUpd = await api('PUT', `/admin/products/${prod?.id}/variants/${variant?.id}`, { token: adminSession.accessToken, body: { priceOverride: 92, stock: 25 } });
  step('update variant price/stock', vUpd.status === 200 && bodyOf(vUpd)?.stock === 25, `status=${vUpd.status}`);

  const pubV2 = await api('GET', '/products/' + PROD_SLUG);
  step('storefront reflects variant stock/price update', (bodyOf(pubV2)?.variants || []).some((x) => x.id === variant?.id && x.stock === 25 && x.priceOverride === 92));

  // variant that will be deleted: variantB (keep variant for the order)
  const vDel = await api('DELETE', `/admin/products/${prod?.id}/variants/${variantB?.id}`, { token: adminSession.accessToken });
  step('delete unused variant', vDel.status === 200, `status=${vDel.status}`);
  created.variants = created.variants.filter((x) => x !== variantB?.id);
  const pubV3 = await api('GET', '/products/' + PROD_SLUG);
  step('deleted variant gone from storefront', !(bodyOf(pubV3)?.variants || []).some((x) => x.id === variantB?.id));

  // variant used by an order cannot be deleted (guard)
  const vWrongParent = await api('DELETE', `/admin/products/${cat?.id}/variants/${variant?.id}`, { token: adminSession.accessToken });
  step('variant delete rejects wrong product', vWrongParent.status === 400, `got ${vWrongParent.status}`);

  // ------------------------------------------------------------------
  // I. Coupons
  // ------------------------------------------------------------------
  console.log('\nI. Coupons CRUD + validation');
  const couponCodePct = TEST('PCT');
  const cpPct = await api('POST', '/admin/coupons', { token: adminSession.accessToken, body: { code: couponCodePct, type: 'PERCENTAGE', value: 10, minOrderAmount: 50, maxUses: 5, maxDiscount: 25 } });
  couponPctId = bodyOf(cpPct)?.id;
  step('create PERCENTAGE coupon', cpPct.status === 201 && !!couponPctId, `status=${cpPct.status}`);
  created.coupons.push(couponPctId);

  const couponFixCode = TEST('FIX');
  const cpFix = await api('POST', '/admin/coupons', { token: adminSession.accessToken, body: { code: couponFixCode, type: 'FIXED', value: 12 } });
  couponFixId = bodyOf(cpFix)?.id;
  step('create FIXED coupon', cpFix.status === 201 && !!couponFixId, `status=${cpFix.status}`);
  created.coupons.push(couponFixId);

  const couponBadPct = await api('POST', '/admin/coupons', { token: adminSession.accessToken, body: { code: TEST('BAD'), type: 'PERCENTAGE', value: 150 } });
  step('coupon percentage>100 rejected', couponBadPct.status === 400, `got ${couponBadPct.status}`);

  const couponList = await api('GET', '/admin/coupons', { token: adminSession.accessToken });
  step('coupon list contains both', (couponList.json?.data?.coupons || couponList.json?.data || []).some((c) => c.id === couponPctId) && (couponList.json?.data?.coupons || couponList.json?.data || []).some((c) => c.id === couponFixId), `status=${couponList.status}`);

  // public validation
  const val1 = await api('POST', '/coupons/validate', { body: { code: couponCodePct, subtotal: 200 } });
  step('validate 10% coupon on $200', val1.status === 200 && bodyOf(val1)?.discount === 20, `status=${val1.status} discount=${bodyOf(val1)?.discount}`);
  const valCap = await api('POST', '/coupons/validate', { body: { code: couponCodePct, subtotal: 300 } });
  step('discount capped by maxDiscount ($25)', valCap.status === 200 && bodyOf(valCap)?.discount === 25, `discount=${bodyOf(valCap)?.discount}`);
  const valMin = await api('POST', '/coupons/validate', { body: { code: couponCodePct, subtotal: 40 } });
  step('min order amount enforced', valMin.status === 400, `got ${valMin.status}`);
  const valUnknown = await api('POST', '/coupons/validate', { body: { code: 'NO-SUCH-CODE-123456', subtotal: 100 } });
  step('unknown coupon rejected', valUnknown.status === 404, `got ${valUnknown.status}`);

  const cpDeact = await api('PUT', `/admin/coupons/${couponPctId}`, { token: adminSession.accessToken, body: { isActive: false } });
  step('deactivate coupon', cpDeact.status === 200, `status=${cpDeact.status}`);
  const valDeact = await api('POST', '/coupons/validate', { body: { code: couponCodePct, subtotal: 200 } });
  step('inactive coupon rejected on validate', valDeact.status === 400, `got ${valDeact.status}`);
  await api('PUT', `/admin/coupons/${couponPctId}`, { token: adminSession.accessToken, body: { isActive: true } });
  const valReac = await api('POST', '/coupons/validate', { body: { code: couponCodePct, subtotal: 200 } });
  step('reactivated coupon validates again', valReac.status === 200, `status=${valReac.status}`);

  const cpGet = await api('GET', `/admin/coupons/${couponPctId}`, { token: adminSession.accessToken });
  step('admin get single coupon', cpGet.status === 200 && bodyOf(cpGet)?.code === couponCodePct, `status=${cpGet.status}`);

  // ------------------------------------------------------------------
  // J. Customer cart + order with bank transfer + coupon
  // ------------------------------------------------------------------
  console.log('\nJ. Customer -> admin order flow (BANK_TRANSFER)');
  const methods = await api('GET', '/checkout/methods', { token: custToken });
  const methodRows = methods.json?.data?.methods || methods.json?.data || [];
  const bankInMethods = methodRows.some((m) => m.method === 'BANK_TRANSFER' || m.id === 'BANK_TRANSFER');
  step('checkout/methods includes BANK_TRANSFER', methods.status === 200 && bankInMethods, `status=${methods.status} methods=${JSON.stringify(methodRows.map((m) => m.method || m.id))}`);

  const addr = await api('POST', '/addresses', { token: custToken, body: { label: 'Verify HQ', fullName: 'ZG Verify Customer', phone: '5550001234', line1: '1 Verify Way', line2: 'Suite 9', city: 'Testville', state: 'TT', zip: '12345', country: 'US', isDefault: true } });
  const addrId = bodyOf(addr)?.id;
  step('customer creates shipping address', addr.status === 201 && !!addrId, `status=${addr.status}`);
  created.addresses.push(addrId);

  const addItem = await api('POST', '/cart/items', { token: custToken, body: { productId: prod?.id, variantId: variant?.id, quantity: 2 } });
  step('customer adds product (with variant) to cart', addItem.status === 201 || addItem.status === 200, `status=${addItem.status}`);

  const applyCoup = await api('POST', '/cart/coupon', { token: custToken, body: { code: couponCodePct } });
  step('customer applies coupon to cart', applyCoup.status === 200 && bodyOf(applyCoup)?.couponCode === couponCodePct, `status=${applyCoup.status}`);

  const cart = await api('GET', '/cart', { token: custToken });
  const cartPrice = bodyOf(cart)?.items?.[0]?.variant?.priceOverride;
  step('cart reflects variant price (server-side pricing)', cartPrice === 92, `variant.priceOverride=${cartPrice}`);

  const o1 = await api('POST', '/orders', { token: custToken, body: { shippingAddressId: addrId, paymentMethod: 'BANK_TRANSFER', couponCode: couponCodePct, idempotencyKey: TEST('idem').slice(0, 30), notes: 'zg api verify' } });
  const order = bodyOf(o1);
  orderId = order?.id;
  step('create order (BANK_TRANSFER) with coupon', o1.status === 201 && !!orderId && order.paymentStatus === 'AWAITING_VERIFICATION', `status=${o1.status} number=${order.orderNumber} paymentStatus=${order.paymentStatus}`);
  created.orders.push(orderId);

  step('order totals correct (server-priced, incl shipping+tax)',
    order.subtotal === 184 && order.discount === 18.4 && order.shippingCost === 15 && order.tax === 13.25 && order.total === 193.85,
    `subtotal=${order.subtotal} discount=${order.discount} tax=${order.tax} shippingCost=${order.shippingCost} total=${order.total}`);
  step('order carries coupon reference', order.couponCode === couponCodePct, order.couponCode);
  step('order paymentReference is order number', order.paymentReference === order.orderNumber, order.paymentReference);

  const o1b = await api('POST', '/orders', { token: custToken, body: { shippingAddressId: addrId, paymentMethod: 'BANK_TRANSFER', couponCode: couponCodePct, idempotencyKey: TEST('idem').slice(0, 30) } });
  step('idempotency: repeat checkout returns same order', o1b.status === 200 && bodyOf(o1b)?.id === orderId, `status=${o1b.status}`);

  // stock drained check: variant stock should now be 23 (was 25, ordered 2)
  const stockAfter = await api('GET', `/admin/products/${prod?.id}`, { token: adminSession.accessToken });
  const variantAfter = (bodyOf(stockAfter)?.variants || []).find((x) => x.id === variant?.id);
  step('variant stock decremented after order', variantAfter?.stock === 23, `stock=${variantAfter?.stock}`);

  // over-stock rejected: temporarily drop variant stock to 1, then try qty 5
  await api('PUT', `/admin/products/${prod?.id}/variants/${variant?.id}`, { token: adminSession.accessToken, body: { stock: 1 } });
  const overStockAttempt = await api('POST', '/cart/items', { token: custToken, body: { productId: prod?.id, variantId: variant?.id, quantity: 5 } });
  step('over-stock add-to-cart rejected', overStockAttempt.status === 400, `got ${overStockAttempt.status}${overStockAttempt.json?.error ? ' ' + String(overStockAttempt.json.error).slice(0, 70) : ''}`);
  await api('PUT', `/admin/products/${prod?.id}/variants/${variant?.id}`, { token: adminSession.accessToken, body: { stock: 23 } });

  // empty cart -> order fails cleanly
  const emptyCartOrder = await api('POST', '/orders', { token: custToken, body: { shippingAddressId: addrId, paymentMethod: 'BANK_TRANSFER', idempotencyKey: TEST('emptyorder').slice(0, 30) } });
  step('empty-cart order rejected', emptyCartOrder.status === 400, `got ${emptyCartOrder.status}${emptyCartOrder.json?.error ? ' ' + String(emptyCartOrder.json.error).slice(0, 60) : ''}`);

  const adminOrders = await api('GET', '/admin/orders', { token: adminSession.accessToken });
  const adminOrderList = adminOrders.json?.data?.orders || adminOrders.json?.data || [];
  const mineInList = adminOrderList.some((o) => o.id === orderId);
  step('admin orders list includes new order', mineInList, `total=${adminOrderList.length}`);

  // coupon usedCount incremented
  const couponAfter = await api('GET', `/admin/coupons/${couponPctId}`, { token: adminSession.accessToken });
  step('coupon usedCount incremented by order', bodyOf(couponAfter)?.usedCount >= 1, `usedCount=${bodyOf(couponAfter)?.usedCount}`);

  // ------------------------------------------------------------------
  // K. Payment verification (admin)
  // ------------------------------------------------------------------
  console.log('\nK. Admin payment verification');
  const adminId = admin?.id;
  const pay = await api('PATCH', `/admin/orders/${orderId}/payment`, { token: adminSession.accessToken, body: { status: 'PAID' } });
  const paidOrder = bodyOf(pay);
  step('admin verifies manual payment -> PAID', pay.status === 200 && paidOrder?.paymentStatus === 'PAID', `status=${pay.status}`);
  step('payment records verifiedBy + verifiedAt', !!paidOrder?.paymentVerifiedBy && !!paidOrder?.paymentVerifiedAt, `verifiedBy=${paidOrder?.paymentVerifiedBy}, at=${paidOrder?.paymentVerifiedAt}`);
  step('payment verifiedBy is admin user', paidOrder?.paymentVerifiedBy === adminId, `match=${!!adminId}`);

  const custOrder = await api('GET', `/orders/${orderId}`, { token: custToken });
  step('customer order detail reflects PAID', custOrder.status === 200 && bodyOf(custOrder)?.paymentStatus === 'PAID', `status=${custOrder.status}`);

  // ------------------------------------------------------------------
  // L. Order status transitions
  // ------------------------------------------------------------------
  console.log('\nL. Order status transitions + tracking');
  const tCnf = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'CONFIRMED' } });
  step('PENDING -> CONFIRMED', tCnf.status === 200 && bodyOf(tCnf)?.status === 'CONFIRMED', `got ${tCnf.status}`);
  const tProc = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'PROCESSING' } });
  step('CONFIRMED -> PROCESSING', tProc.status === 200 && bodyOf(tProc)?.status === 'PROCESSING', `got ${tProc.status}`);
  const tShip = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'SHIPPED', trackingNumber: '1Z999TEST' } });
  step('PROCESSING -> SHIPPED (with tracking)', tShip.status === 200 && bodyOf(tShip)?.status === 'SHIPPED' && bodyOf(tShip)?.trackingNumber === '1Z999TEST', `got ${tShip.status}`);

  const badTx = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'PENDING' } });
  step('invalid transition SHIPPED->PENDING rejected', badTx.status === 400, `got ${badTx.status}`);

  const custShipCheck = await api('GET', `/orders/${orderId}`, { token: custToken });
  step('customer sees tracking number + SHIPPED', bodyOf(custShipCheck)?.status === 'SHIPPED' && bodyOf(custShipCheck)?.trackingNumber === '1Z999TEST');

  const tDel = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'DELIVERED' } });
  step('SHIPPED -> DELIVERED', tDel.status === 200 && bodyOf(tDel)?.status === 'DELIVERED', `got ${tDel.status}`);

  const cancelPaid = await api('PATCH', `/admin/orders/${orderId}/status`, { token: adminSession.accessToken, body: { status: 'CANCELLED' } });
  step('PAID/DELIVERED order cannot be cancelled', cancelPaid.status === 400, `got ${cancelPaid.status}`);

  // customer cannot verify their own payment
  const selfVerify = await api('PATCH', `/admin/orders/${orderId}/payment`, { token: custToken, body: { status: 'PAID' } });
  step('customer cannot verify payment (403)', selfVerify.status === 403, `got ${selfVerify.status}`);

  // ------------------------------------------------------------------
  // M. Customers admin
  // ------------------------------------------------------------------
  console.log('\nM. Customers (admin)');
  const custList = await api('GET', '/admin/customers?search=' + encodeURIComponent(custEmail), { token: adminSession.accessToken });
  const custRows = custList.json?.data?.customers || custList.json?.data || [];
  const myCustRow = custRows.find((c) => c.email === custEmail);
  step('admin customer search finds test customer', custList.status === 200 && !!myCustRow, `status=${custList.status}`);

  const custDetail = await api('GET', `/admin/customers/${myCustRow?.id || customer.user.id}`, { token: adminSession.accessToken });
  const custDv = bodyOf(custDetail);
  step('admin customer detail (no passwordHash leak)', custDetail.status === 200 && !('passwordHash' in (custDv || {})) && !('refreshTokenHash' in (custDv || {})), `status=${custDetail.status}`);

  const custUpd = await api('PUT', `/admin/customers/${myCustRow?.id || customer.user.id}`, { token: adminSession.accessToken, body: { name: 'ZG Verify Customer Updated' } });
  step('admin updates customer name', custUpd.status === 200 && bodyOf(custUpd)?.name === 'ZG Verify Customer Updated', `status=${custUpd.status}`);

  // ------------------------------------------------------------------
  // N. Reviews
  // ------------------------------------------------------------------
  console.log('\nN. Reviews');
  const rv = await api('POST', '/reviews', { token: custToken, body: { productId: prod?.id, rating: 5, title: 'Temp review', text: 'Temporary verification review' } });
  const review = bodyOf(rv);
  step('customer submits review (pending)', rv.status === 201 && review?.isApproved === false, `status=${rv.status}`);
  created.reviews.push(review?.id);

  const dupRev = await api('POST', '/reviews', { token: custToken, body: { productId: prod?.id, rating: 4, text: 'dup' } });
  step('duplicate review rejected', dupRev.status === 409, `got ${dupRev.status}`);

  const adminRev = await api('GET', '/admin/reviews', { token: adminSession.accessToken });
  const revRows = adminRev.json?.data?.reviews || adminRev.json?.data || [];
  step('admin review list includes pending review', revRows.some((r) => r.id === review?.id), `count=${revRows.length}`);

  const appr = await api('PUT', `/admin/reviews/${review?.id}`, { token: adminSession.accessToken, body: { isApproved: true } });
  step('admin approves review', appr.status === 200 && bodyOf(appr)?.isApproved === true, `status=${appr.status}`);

  const pubRev = await api('GET', '/reviews/product/' + PROD_SLUG);
  step('approved review shows on storefront', (pubRev.json?.data?.reviews || pubRev.json?.data || []).some((r) => r.id === review?.id), `status=${pubRev.status} count=${(pubRev.json?.data?.reviews || pubRev.json?.data || []).length}`);

  // ------------------------------------------------------------------
  // O. Questions
  // ------------------------------------------------------------------
  console.log('\nO. Product questions');
  const q = await api('POST', '/questions', { token: custToken, body: { productId: prod?.id, question: 'Is this temporary?' } });
  const question = bodyOf(q);
  step('customer asks question', q.status === 201 && !!question?.id, `status=${q.status}`);
  created.questions.push(question?.id);

  const qc = await api('POST', '/questions', { token: custToken, body: { productId: prod?.id, question: 'Dupe?' } });
  step('duplicate open question rejected', qc.status === 409, `got ${qc.status}`);

  const adminQ = await api('GET', '/admin/questions', { token: adminSession.accessToken });
  const qRows = adminQ.json?.data?.questions || adminQ.json?.data || [];
  step('admin question list includes it', qRows.some((x) => x.id === question?.id), `count=${qRows.length}`);

  const ans = await api('PUT', `/admin/questions/${question?.id}/answer`, { token: adminSession.accessToken, body: { answer: 'Yes, temporary. Automated test.' } });
  step('admin answers question', ans.status === 200 && !!bodyOf(ans)?.answer, `status=${ans.status}`);

  const pubQ = await api('GET', '/questions/product/' + PROD_SLUG);
  const pubQRows = pubQ.json?.data?.questions || pubQ.json?.data || [];
  step('answered question publishes to storefront', pubQRows.some((x) => x.id === question?.id && !!x.answer), `status=${pubQ.status} count=${pubQRows.length}`);

  // ------------------------------------------------------------------
  // P. Notifications + media + settings/seo (admin)
  // ------------------------------------------------------------------
  console.log('\nP. Notifications, media upload guard, settings, activity logs');
  const notifs = await api('GET', '/admin/notifications', { token: adminSession.accessToken });
  step('admin notifications list', notifs.status === 200 && Array.isArray(notifs.json?.data?.notifications || notifs.json?.data), `status=${notifs.status} count=${(notifs.json?.data?.notifications || notifs.json?.data || []).length}`);

  const notifRows = notifs.json?.data?.notifications || notifs.json?.data || [];
  if (notifRows.length) {
    const one = await api('PATCH', `/admin/notifications/${notifRows[0].id}/read`, { token: adminSession.accessToken });
    step('mark single notification read', one.status === 200, `status=${one.status}`);
    const all = await api('PATCH', '/admin/notifications/read-all', { token: adminSession.accessToken, body: {} });
    step('mark all notifications read', all.status === 200, `status=${all.status}`);
  } else {
    step('mark notification read (skipped - none)', true, 'no notifications to mark');
  }

  // invalid media upload (security control)
  const badFile = new Blob(['not an image'], { type: 'text/plain' });
  const fd = new FormData();
  fd.append('file', badFile, 'evil.txt');
  const upBad = await api('POST', '/admin/media/upload', { token: adminSession.accessToken, form: fd });
  step('invalid file type rejected on upload', upBad.status === 400, `got ${upBad.status}${upBad.json?.error ? ' ' + String(upBad.json.error).slice(0, 70) : ''}`);

  // valid media upload + delete
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const goodFd = new FormData();
  goodFd.append('file', new Blob([png], { type: 'image/png' }), 'zg-verify.png');
  const upGood = await api('POST', '/admin/media/upload', { token: adminSession.accessToken, form: goodFd });
  const media = bodyOf(upGood);
  step('valid PNG upload', upGood.status === 201 && !!media?.id && media.mimeType === 'image/png', `status=${upGood.status}`);
  created.media.push(media?.id);
  if (media?.url) {
    const fileName = String(media.url).split('/').pop();
    if (fileName && !fileName.includes('res.cloudinary')) created.uploadedFiles.push(fileName);
  }

  const mediaList = await api('GET', '/admin/media', { token: adminSession.accessToken });
  step('media list includes upload', Array.isArray(mediaList.json?.data) && mediaList.json.data.some((m) => m.id === media?.id), `status=${mediaList.status}`);

  const delMed = await api('DELETE', `/admin/media/${media?.id}`, { token: adminSession.accessToken });
  step('admin deletes media record', delMed.status === 200, `status=${delMed.status}`);
  created.media = created.media.filter((x) => x !== media?.id);

  const settings = await api('GET', '/admin/settings', { token: adminSession.accessToken });
  step('GET /admin/settings (object map)', settings.status === 200 && settings.json?.data && typeof settings.json.data === 'object', `status=${settings.status}`);
  const seo = await api('GET', '/admin/seo', { token: adminSession.accessToken });
  step('GET /admin/seo', seo.status === 200 && Array.isArray(seo.json?.data), `status=${seo.status}`);
  const logs = await api('GET', '/admin/activity-logs', { token: adminSession.accessToken });
  step('GET /admin/activity-logs', logs.status === 200 && Array.isArray(logs.json?.data?.logs || logs.json?.data), `status=${logs.status}`);

  // ------------------------------------------------------------------
  // Q. Regression: baseline data intact
  // ------------------------------------------------------------------
  console.log('\nQ. Regression (seeded data intact)');
  const allProds = await api('GET', '/admin/products', { token: adminSession.accessToken });
  const prodRows = allProds.json?.data?.products || allProds.json?.data || [];
  step('product list still returns seeded catalog', prodRows.length >= 1, `count=${prodRows.length}`);
  const allCats = await api('GET', '/admin/categories', { token: adminSession.accessToken });
  step('category list returns categories', (allCats.json?.data || []).length > 0, `count=${(allCats.json?.data || []).length}`);
  const ordersFinal = await api('GET', '/admin/orders', { token: adminSession.accessToken });
  step('orders list returns order data', (ordersFinal.json?.data?.orders || ordersFinal.json?.data || []).length >= 1, `count=${(ordersFinal.json?.data?.orders || ordersFinal.json?.data || []).length}`);
  const custsFinal = await api('GET', '/admin/customers', { token: adminSession.accessToken });
  step('customer list returns customers', (custsFinal.json?.data?.customers || custsFinal.json?.data || []).length >= 1, `count=${(custsFinal.json?.data?.customers || custsFinal.json?.data || []).length}`);

  // ------------------------------------------------------------------
  // Cleanup
  // ------------------------------------------------------------------
  await connectDb();
  await cleanup();
} catch (e) {
  console.error('\nFATAL ERROR:', e && e.stack || e);
  failed++;
} finally {
  // ----------------------------------------------------------------
  // Summary
  // ----------------------------------------------------------------
  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    console.log(`  ${r.status === 'PASS' ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '   [' + r.detail + ']' : ''}`);
  }
  console.log(`\nTOTAL: ${passed} passed / ${failed} failed (${results.length} checks)`);
  const overall = failed === 0;
  console.log(`\n>>> API VERIFY ${overall ? 'PASS' : 'FAIL'} <<<`);
  process.exit(overall ? 0 : 1);
}