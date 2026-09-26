import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
const raw = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const BASE = 'http://localhost:5000/api/v1';
const api = async (m, url, token, body) => {
  const res = await fetch(BASE + url, {
    method: m,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null; try { j = await res.json(); } catch {}
  return { status: res.status, json: j };
};
const login = await api('POST', '/auth/login', null, { email: raw('ADMIN_EMAIL'), password: raw('ADMIN_PASSWORD') });
const token = login.json.data.accessToken;
const TS = Date.now();
const cat = await api('POST', '/admin/categories', token, { name: `DBG-Cat-${TS}`, slug: `dbg-cat-${TS}` });
const catId = cat.json.data.id;
const prod = await api('POST', '/admin/products', token, {
  name: `DBG-Prod-${TS}`, slug: `dbg-prod-${TS}`, sku: `DBG-${TS}`, categoryId: catId, regularPrice: 10, stock: 5, isActive: true,
});
const slug = prod.json.data.slug;
console.log('created product slug=', slug);
const p1 = await api('GET', '/products/' + slug);
console.log('after create:  status=', p1.status, 'isActive=', p1.json.data && p1.json.data.isActive);
const deact = await api('PUT', `/admin/products/${prod.json.data.id}`, token, { isActive: false });
console.log('deact HTTP:', deact.status);
const p2 = await api('GET', '/products/' + slug);
console.log('after deact:   status=', p2.status, 'isActive=', p2.json.data && p2.json.data.isActive);
const react = await api('PUT', `/admin/products/${prod.json.data.id}`, token, { isActive: true });
const p3 = await api('GET', '/products/' + slug);
console.log('after react:   status=', p3.status, 'isActive=', p3.json.data && p3.json.data.isActive);
// cleanup exact ids
import { MongoClient, ObjectId } from 'mongodb';
const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02'].map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || ''); params.set('replicaSet', 'atlas-63jqru-shard-0'); params.set('authSource', 'admin'); params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;
const c = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await c.connect();
await c.db().collection('ProductVariant').deleteMany({ productId: ObjectId.createFromHexString(prod.json.data.id) });
await c.db().collection('Product').deleteMany({ _id: ObjectId.createFromHexString(prod.json.data.id) });
await c.db().collection('Category').deleteMany({ _id: ObjectId.createFromHexString(catId) });
await c.close();
console.log('debug probe done');