import fs from 'node:fs';
import path from 'node:path';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
const raw = (k) => { const m = env.match(new RegExp('^' + k + '=(.*)$', 'm')); return m ? m[1].trim() : ''; };
const srv = (raw('MONGODB_URI') || '').replace(/^"(.*)"$/, '$1');
const m = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srv);
const hosts = ['ac-lvpwpcf-shard-00-00', 'ac-lvpwpcf-shard-00-01', 'ac-lvpwpcf-shard-00-02'].map((h) => `${h}.krjy1ox.mongodb.net:27017`).join(',');
const params = new URLSearchParams(m[5] || '');
params.set('replicaSet', 'atlas-63jqru-shard-0'); params.set('authSource', 'admin'); params.set('tls', 'true');
const uri = `mongodb://${m[2]}${hosts}/${m[4] || 'zoya-goods'}?${params.toString()}`;
const codes = ['ZG-ADM-17902639634', 'zg-adm-17902639634', 'ZG-ADM-179026396342', 'zg-adm-179026396342'];
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
await client.connect();
const db = client.db();
console.log('candidates:', JSON.stringify(codes));
const found = await db.collection('Coupon').find({ code: { $in: codes } }).project({ code: 1, isActive: 1 }).toArray();
console.log('found:', JSON.stringify(found));
if (found.length) {
  const res = await db.collection('Coupon').deleteMany({ code: { $in: codes } });
  console.log('deleted:', res.deletedCount);
}
await client.close();