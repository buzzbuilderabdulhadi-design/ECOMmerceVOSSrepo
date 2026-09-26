const path = require('path');
const fs = require('fs');
module.paths.push(path.join(process.cwd(), 'server', 'node_modules'));
const env = fs.readFileSync('server/.env', 'utf8');
for (const l of env.split(/\r?\n/)) {
  const t = l.trim();
  if (!t || t.startsWith('#') || !t.includes('=')) continue;
  const k = t.slice(0, t.indexOf('=')).trim();
  let v = t.slice(t.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  if (k && !process.env[k]) process.env[k] = v;
}
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const u = await p.user.findMany({ where: { OR: [{ email: { startsWith: 'merge-' } }, { email: { startsWith: 'perf-' } }] }, select: { id: true } });
  const ids = u.map((x) => x.id);
  console.log('found:', ids.length, 'users');
  if (ids.length) {
    const carts = await p.cart.findMany({ where: { userId: { in: ids } }, select: { id: true } });
    const cartIds = carts.map((c) => c.id);
    if (cartIds.length) {
      await p.cartItem.deleteMany({ where: { cartId: { in: cartIds } } });
      await p.cart.deleteMany({ where: { id: { in: cartIds } } });
    }
    await p.wishlistItem.deleteMany({ where: { userId: { in: ids } } });
  }
  const d = await p.user.deleteMany({ where: { id: { in: ids } } });
  console.log('deleted:', d.count);
  await p.$disconnect();
})();