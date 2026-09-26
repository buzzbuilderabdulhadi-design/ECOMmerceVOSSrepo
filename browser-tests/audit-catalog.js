const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const active = await p.product.count({ where: { isActive: true } });
  const total = await p.product.count();
  const testNamed = await p.product.count({ where: { name: { contains: '[TEST]' } } });
  const testSlugs = await p.product.count({ where: { slug: { startsWith: 'test-' } } });
  const inactive = await p.product.count({ where: { isActive: false } });

  const withVariants = await p.product.count({ where: { isActive: true, variants: { some: { isActive: true } } } });
  const activeCats = await p.category.count({ where: { isActive: true } });
  const testCats = await p.category.count({ where: { slug: { startsWith: 'test-' } } });

  // quick sanity: active products that still carry a via.placeholder / test image
  const actives = await p.product.findMany({
    where: { isActive: true },
    select: { name: true, slug: true, images: true },
  });
  const placeholderImg = actives.filter((pr) => (pr.images || []).some((i) => /\bvia\.placeholder\.com|placehold\.co|test/i.test(i)));
  const nearDuplicate = actives.filter((pr) => /\[TEST\]/i.test(pr.name));

  console.log(`products total=${total} active=${active} inactive=${inactive}`);
  console.log(`products with [TEST] in name=${testNamed}, test- slug=${testSlugs}`);
  console.log(`active products with variant set=${withVariants}`);
  console.log(`categories active=${activeCats} test-slug cats=${testCats}`);
  console.log(`active products still having placeholder/test image URLs=${placeholderImg.length}`);
  if (placeholderImg.length) {
    for (const pr of placeholderImg.slice(0, 20)) console.log(`  - ${pr.name} (${pr.slug}) -> ${JSON.stringify((pr.images || []).filter(i => /\bvia\.placeholder\.com|placehold\.co|test/i.test(i)))}`);
  }
  const slugs = actives.map((a) => a.slug);
  console.log(`total slugs=${slugs.length}; unique=${new Set(slugs).size}`);
  console.log('slug sample:', slugs.slice(0, 12).join(', '));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => p.$disconnect());