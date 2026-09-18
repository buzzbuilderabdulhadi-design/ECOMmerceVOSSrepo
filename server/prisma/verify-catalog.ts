/**
 * Read-only reconciliation check between the static catalog and MongoDB.
 *
 * Reports:
 *  - static vs DB product counts
 *  - static slugs missing from the DB (must be 0 for "fully purchasable")
 *  - DB-only products (seed/demo data, informational)
 *  - variant coverage for imported (ZG-) products
 *
 * Usage: npx ts-node --transpile-only prisma/verify-catalog.ts
 */
import { PrismaClient } from '@prisma/client';
import { allProducts } from '../../client/src/data/products';

const prisma = new PrismaClient();

async function main() {
  const [dbProducts, categoryCount, variantCount] = await Promise.all([
    prisma.product.findMany({ select: { id: true, slug: true, sku: true, stock: true, _count: { select: { variants: true } } } }),
    prisma.category.count(),
    prisma.productVariant.count(),
  ]);

  const dbBySlug = new Map(dbProducts.map((p) => [p.slug, p]));
  const staticSlugs = allProducts.map((p) => p.slug);

  const missing = staticSlugs.filter((slug) => !dbBySlug.has(slug));
  const imported = staticSlugs.filter((slug) => dbBySlug.get(slug)?.sku.startsWith('ZG-'));
  const noVariants = imported.filter((slug) => (dbBySlug.get(slug)!._count.variants ?? 0) === 0).map((s) => s);
  const zeroStock = imported.filter((slug) => (dbBySlug.get(slug)!.stock ?? 0) < 1).map((s) => s);

  const staticSet = new Set(staticSlugs);
  const dbOnly = dbProducts.filter((p) => !staticSet.has(p.slug)).map((p) => p.slug);

  console.log(JSON.stringify({
    staticProducts: allProducts.length,
    dbProducts: dbProducts.length,
    categories: categoryCount,
    variants: variantCount,
    importedProductCount: imported.length,
    missingFromDb: missing,
    importedWithoutVariants: noVariants,
    importedWithZeroStock: zeroStock,
    dbOnlyProducts: dbOnly,
    reconciliationOk: missing.length === 0,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error('Verify failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
