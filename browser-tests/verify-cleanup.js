const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const slugs = ['soho-court-sneaker', 'sorrento-chain-bracelet', 'stiletto-heels', 'siena-leather-tote', 'silk-evening-gown', 'test-zoya-leather-care-kit', 'test-zoya-essential-hoodie'];
    const rows = await p.product.findMany({ where: { slug: { in: slugs } }, select: { id: true, name: true, slug: true, isActive: true } });
    console.log(JSON.stringify(rows, null, 1));
    const deactivated = await p.product.findMany({ where: { isActive: false }, select: { name: true, slug: true } });
    console.log('TOTAL INACTIVE PRODUCTS:', deactivated.length);
    console.log(JSON.stringify(deactivated, null, 1));
  } finally {
    await p.$disconnect();
  }
})();