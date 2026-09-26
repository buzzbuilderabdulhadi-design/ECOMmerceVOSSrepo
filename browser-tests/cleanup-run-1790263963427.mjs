import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
const raw = (k) => {
  const m = env.match(new RegExp('^' + k + '=(.*)$', 'm'));
  return m ? m[1].trim() : '';
};
const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02']
  .map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || '');
params.set('replicaSet', 'atlas-63jqru-shard-0');
params.set('authSource', 'admin');
params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;

const TAG = 'ZG-ADM-1790263963427';
const EMAIL = TAG.toLowerCase() + '-customer@example.com';
const SKU = TAG + '-SKU';
const VSKUA = SKU + '-VSKU-A';
const VSKUB = SKU + '-Sand-L';
const PKG_NAME = TAG + '-Product';
const CHILD_NAME = TAG + '-ChildCat';
const CAT_NAME = TAG + '-Category';
const PCT_CODE = 'ZG-ADM-1790263963';
const ORDER_NUMBER = 'ZG-MUFOYA3G-7WY9';

const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db();
const out = (c, n) => console.log(`  cleaned ${c}: ${n}`);

// User + per-user docs (exact email)
const user = await db.collection('User').findOne({ email: EMAIL });
if (user) {
  const uid = user._id;
  out('Notification', (await db.collection('Notification').deleteMany({ userId: uid })).deletedCount);
  out('Cart', (await db.collection('Cart').deleteMany({ userId: uid })).deletedCount);
  const carts = await db.collection('Cart').find({ userId: uid }).project({ _id: 1 }).toArray();
  out('CartItem', (await db.collection('CartItem').deleteMany({ cartId: { $in: carts.map((c) => c._id) } })).deletedCount);
  out('Address', (await db.collection('Address').deleteMany({ userId: uid })).deletedCount);
  out('ActivityLog', (await db.collection('ActivityLog').deleteMany({ userId: uid })).deletedCount);
  out('User', (await db.collection('User').deleteMany({ _id: uid })).deletedCount);
} else {
  console.log('  no matching user found');
}

// Order by orderNumber
const order = await db.collection('Order').findOne({ orderNumber: ORDER_NUMBER });
if (order) {
  out('OrderItem', (await db.collection('OrderItem').deleteMany({ orderId: order._id })).deletedCount);
  out('PaymentEvent', (await db.collection('PaymentEvent').deleteMany({ orderId: order._id })).deletedCount);
  out('Order', (await db.collection('Order').deleteMany({ _id: order._id })).deletedCount);
} else {
  console.log('  no matching order found');
}

// Coupon (exact code both cases)
out('Coupon', (await db.collection('Coupon').deleteMany({ code: { $in: [PCT_CODE, PCT_CODE.toLowerCase()] } })).deletedCount);

// Product by sku/slug + variants by sku
const product = await db.collection('Product').findOne({ $or: [{ sku: SKU }, { sku: SKU.toLowerCase() }, { slug: `${TAG.toLowerCase()}-product` }] });
const variantSkus = [VSKUA, VSKUB, VSKUA.toLowerCase(), VSKUB.toLowerCase()];
await db.collection('ProductVariant').deleteMany({ sku: { $in: variantSkus } });
if (product) {
  await db.collection('ProductVariant').deleteMany({ productId: product._id });
  out('ProductVariant (by sku/product)', 'done');
  out('Product', (await db.collection('Product').deleteMany({ _id: product._id })).deletedCount);
} else {
  out('ProductVariant (by sku)', 'done');
}

// Categories by slug prefix that exactly belongs to this run
const catSlugs = [`${TAG.toLowerCase()}-cat`, `${TAG.toLowerCase()}-cat-child`];
out('Category', (await db.collection('Category').deleteMany({ slug: { $in: catSlugs } })).deletedCount);

await client.close();
console.log('\nResidual cleanup complete (exact identifiers only).');