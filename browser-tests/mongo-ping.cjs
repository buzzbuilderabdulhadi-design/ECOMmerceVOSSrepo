const fs = require('fs');
const env = fs.readFileSync('server/.env', 'utf8');
const m = env.match(/^MONGODB_URI=(.*)$/m);
const uri = (m ? m[1].trim() : '').replace(/^"(.*)"$/, '$1');
const { MongoClient } = require('mongodb');
(async () => {
  for (let i = 1; i <= 3; i++) {
    try {
      const c = new MongoClient(uri, { serverSelectionTimeoutMS: 20000 });
      await c.connect();
      const info = await c.db().admin().command({ ping: 1 });
      const servers = c.topology && c.topology.description && c.topology.description.servers
        ? JSON.stringify([...c.topology.description.servers.keys()]) : 'n/a';
      console.log('OK ping', JSON.stringify(info), 'hosts=', servers);
      await c.close();
      process.exit(0);
    } catch (e) {
      console.log('attempt', i, 'FAILED:', String(e.message).slice(0, 200));
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  process.exit(1);
})();