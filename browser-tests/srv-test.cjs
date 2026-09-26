const dns = require('dns').promises;
(async () => {
  try {
    const recs = await dns.resolveSrv('_mongodb._tcp.cluster0.krjy1ox.mongodb.net');
    console.log('SRV ok', JSON.stringify(recs));
  } catch (e) {
    console.log('resolveSrv FAILED:', e.message, e.code);
  }
})();