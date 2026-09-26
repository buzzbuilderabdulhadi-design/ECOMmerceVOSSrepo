const fs = require('fs');
const env = fs.readFileSync('server/.env', 'utf8');
const m = env.match(/^MONGODB_URI=(.*)$/m);
const srv = (m ? m[1].trim() : '').replace(/^"(.*)"$/, '$1');

function buildDirectUri(srvUri) {
  const m2 = /^mongodb\+srv:\/\/(([^@]*@)?)([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/.exec(srvUri);
  if (!m2) return null;
  const [, creds, , , db, query] = m2;
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
  return `mongodb://${creds}${hosts}/${db || 'zoya-goods'}?${params.toString()}`;
}

const direct = buildDirectUri(srv);
if (!direct) { console.log('parse failed'); process.exit(1); }
const { MongoClient } = require('mongodb');
(async () => {
  for (let i = 1; i <= 2; i++) {
    try {
      const c = new MongoClient(direct, { serverSelectionTimeoutMS: 25000 });
      await c.connect();
      const info = await c.db().admin().command({ ping: 1 });
      console.log('OK ping', JSON.stringify(info));
      await c.close();
      process.exit(0);
    } catch (e) {
      console.log('attempt', i, 'FAILED:', String(e.message).slice(0, 200));
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  process.exit(1);
})();