const dns = require('dns').promises;
(async () => {
  for (const host of ['ac-lvpwpcf-shard-00-00.krjy1ox.mongodb.net', 'cluster0.krjy1ox.mongodb.net']) {
    try {
      const a = await dns.resolve4(host);
      console.log(host, '->', a.join(','));
    } catch (e) {
      console.log(host, 'resolve4 FAILED:', e.message);
    }
  }
})();