// Debug + clean auth test accounts against the live Mongo (via server Prisma).
const path = require('path');
const fs = require('fs');
module.paths.push(path.join(__dirname, '..', 'server', 'node_modules'));
const serverEnv = fs.readFileSync(path.join(__dirname, '..', 'server', '.env'), 'utf8');
for (const rawLine of serverEnv.split(/\r?\n/)) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;
  const eq = line.indexOf('=');
  if (eq <= 0) continue;
  const key = line.slice(0, eq).trim();
  let value = line.slice(eq + 1).trim();
  value = value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
  if (key && !process.env[key]) process.env[key] = value;
}
console.log('MONGODB_URI set?', Boolean(process.env.MONGODB_URI), process.env.MONGODB_URI ? process.env.MONGODB_URI.slice(0, 24) + '…' : '');

const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    console.log('connecting…');
    await prisma.$connect();
    const found = await prisma.user.findMany({
      where: { OR: [{ email: { startsWith: 'verify-' } }, { email: { startsWith: 'trace-' } }] },
      select: { id: true, email: true, name: true },
    });
    console.log('found test users:', JSON.stringify(found, null, 2));
    const ids = found.map((u) => u.id);
    if (ids.length > 0) {
      const carts = await prisma.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } });
      const cartIds = carts.map((c) => c.id);
      if (cartIds.length) {
        await prisma.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
        await prisma.cart.deleteMany({ where: { id: { in: cartIds } } });
      }
      await prisma.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
    }
    const del = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    console.log('deleted users=', del.count);
  } catch (e) {
    console.error('ERROR:', e && e.message);
    console.error('FULL:', e);
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
})();