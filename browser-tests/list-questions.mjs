import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
const raw = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02'].map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || ''); params.set('replicaSet', 'atlas-63jqru-shard-0'); params.set('authSource', 'admin'); params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;
const { MongoClient } = await import('mongodb');
const c = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await c.connect();
const db = c.db();
const all = await db.collection('ProductQuestion').find({}).toArray();
console.log('total questions:', all.length);
for (const q of all) {
  console.log(' ', q._id.toString(), 'productId=', JSON.stringify(q.productId), 'userId=', String(q.userId), 'isPublished=', q.isPublished, 'answer?', 'answer' in q);
}
await c.close();