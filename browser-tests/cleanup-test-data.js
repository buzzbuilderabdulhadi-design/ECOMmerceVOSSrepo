const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const accidentallyInactive = [
  'stiletto-heels',
  'tailored-wool-blazer',
  'silk-evening-gown',
  'eau-de-parfum',
  'santorini-maxi-dress',
  'siena-leather-tote',
  'torino-shoulder-bag',
  'soho-court-sneaker',
  'sorrento-chain-bracelet',
];

async function main() {
  const restored = await p.product.updateMany({
    where: { slug: { in: accidentallyInactive } },
    data: { isActive: true },
  });
  console.log(`Restored ${restored.count} real products`);

  const testProducts = await p.product.findMany({
    where: { slug: { startsWith: 'test-' } },
    select: { id: true, name: true, slug: true },
  });
  console.log(`Test-prefixed products: ${testProducts.length}`);
  for (const t of testProducts) console.log(`  - ${t.name} (${t.slug})`);
  if (testProducts.length) {
    const r = await p.product.updateMany({
      where: { slug: { startsWith: 'test-' } },
      data: { isActive: false },
    });
    console.log(`Deactivated ${r.count} test products`);
  }

  const inactive = await p.product.count({ where: { isActive: false } });
  console.log(`Inactive products now: ${inactive}`);

  // Categories with test- slug: deactivate only if zero active products (incl. children)
  const testCats = await p.category.findMany({
    where: { slug: { startsWith: 'test-' } },
    select: { id: true, name: true, slug: true },
  });
  for (const cat of testCats) {
    const direct = await p.product.count({ where: { isActive: true, categoryId: cat.id } });
    const children = await p.product.count({ where: { isActive: true, category: { parentId: cat.id } } });
    if (direct + children === 0) {
      await p.category.update({ where: { id: cat.id }, data: { isActive: false } });
      console.log(`Deactivated category ${cat.slug}`);
    } else {
      console.log(`KEPT category ${cat.slug} (${direct + children} active products)`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());