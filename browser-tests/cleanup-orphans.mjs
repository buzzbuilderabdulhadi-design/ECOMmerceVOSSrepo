import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient, ObjectId } from 'mongodb';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
const raw = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02'].map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || ''); params.set('replicaSet', 'atlas-63jqru-shard-0'); params.set('authSource', 'admin'); params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;
const c = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await c.connect();
const db = c.db();

const products = await db.collection('Product').find({}, { projection: { _id: 1 } }).toArray();
const productIds = new Set(products.map((p) => String(p._id)));
for (const [coll, field] of [['ProductQuestion', 'productId'], ['Review', 'productId']]) {
  const all = await db.collection(coll).find({}, { projection: { [field]: 1 } }).toArray();
  const orphans = all.filter((r) => !productIds.has(String(r[field])));
  if (orphans.length) {
    const ids = orphans.map((r) => ObjectId.createFromHexString(String(r._id)));
    const res = await db.collection(coll).deleteMany({ _id: { $in: ids } });
    console.log(`${coll}: deleted ${res.deletedCount} orphan(s)`);
    orphans.forEach((o) => console.log('   orphan id', String(o._id), '->', String(o[field])));
  } else {
    console.log(`${coll}: no orphans`);
  }
}
const left = await db.collection('ProductQuestion').countDocuments({});
console.log('remaining productQuestions:', left);
await c.close();