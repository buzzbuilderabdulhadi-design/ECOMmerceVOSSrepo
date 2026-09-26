import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
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
const aToken = login.json.data.accessToken;
const TS = Date.now();
const cat = await api('POST', '/admin/categories', aToken, { name: `QG-Cat-${TS}`, slug: `qg-cat-${TS}` });
const catId = cat.json.data.id;
const prod = await api('POST', '/admin/products', aToken, {
  name: `QG-Prod-${TS}`, slug: `qg-prod-${TS}`, sku: `QG-${TS}`, categoryId: catId, regularPrice: 10, stock: 5,
});
const pid = prod.json.data.id;
const email = `qg-${TS}-customer@example.com`;
await api('POST', '/auth/register', null, { name: 'QG User', email, password: 'ZG-verify-12345!' });
const lgn = await api('POST', '/auth/login', null, { email, password: 'ZG-verify-12345!' });
const cToken = lgn.json.data.accessToken;

const q1 = await api('POST', '/questions', cToken, { productId: pid, question: 'Is this in stock?' });
console.log('q1 status', q1.status, 'id', q1.json?.data?.id, JSON.stringify(q1.json));
const q2 = await api('POST', '/questions', cToken, { productId: pid, question: 'Any discounts?' });
console.log('q2 (same user/product, both unanswered) status', q2.status, JSON.stringify(q2.json));

const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02'].map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || ''); params.set('replicaSet', 'atlas-63jqru-shard-0'); params.set('authSource', 'admin'); params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;
const c = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await c.connect();
const row = await c.db().collection('ProductQuestion').findOne({ _id: ObjectId.createFromHexString(q1.json.data.id) });
console.log('q1 raw doc:', JSON.stringify(row, null, 2));
const ids = [q1.json.data.id];
if (q2.json?.data?.id) ids.push(q2.json.data.id);
await c.db().collection('ProductQuestion').deleteMany({ _id: { $in: ids.map((i) => ObjectId.createFromHexString(i)) } });
await c.db().collection('ProductVariant').deleteMany({ productId: ObjectId.createFromHexString(pid) });
await c.db().collection('Product').deleteMany({ _id: ObjectId.createFromHexString(pid) });
await c.db().collection('Category').deleteMany({ _id: ObjectId.createFromHexString(catId) });
const uid = row.userId; await c.db().collection('User').deleteMany({ _id: ObjectId.createFromHexString(String(uid)) });
await c.close();
console.log('probe done');