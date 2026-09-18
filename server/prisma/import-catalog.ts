/**
 * Idempotent catalog importer.
 *
 * Reconciles the static storefront catalog (client/src/data/products.ts) with
 * MongoDB so that every visible product maps to a real Product record (real
 * ObjectId) and can be purchased.
 *
 * Safety guarantees:
 *  - Matching is by `slug` (unique). Existing records whose SKU does not start
 *    with `ZG-` (i.e. seed/demo data) are NEVER modified or deleted.
 *  - Re-running the script creates nothing new (idempotent).
 *  - Products/colors/sizes/categories are preserved; variants are generated
 *    from each product's colors x sizes with stock distributed from the
 *    product-level stock so the totals stay consistent.
 *
 * Usage:
 *   npx ts-node --transpile-only prisma/import-catalog.ts --dry-run
 *   npx ts-node --transpile-only prisma/import-catalog.ts
 */
import { PrismaClient } from '@prisma/client';
import { allProducts, type ProductData } from '../../client/src/data/products';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

interface PlannedVariant {
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  sku: string;
  images: string[];
}

function planVariants(product: ProductData): PlannedVariant[] {
  const combos = product.colors.flatMap((color) =>
    product.sizes.map((size) => ({ color, size })),
  );
  const total = combos.length;
  if (total === 0) return [];
  const base = Math.floor(product.stock / total);
  const remainder = product.stock % total;
  return combos.map((combo, index) => ({
    color: combo.color.name,
    colorHex: combo.color.hex,
    size: combo.size,
    stock: base + (index < remainder ? 1 : 0),
    sku: `${product.sku}-V${index + 1}`,
    images: product.images,
  }));
}

async function ensureCategory(
  name: string,
  parentId: string | null,
  cache: Map<string, string>,
): Promise<string> {
  const key = `${parentId ?? 'root'}::${name}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await prisma.category.findFirst({
    where: { name, parentId: parentId ?? null },
    select: { id: true },
  });
  if (existing) {
    cache.set(key, existing.id);
    return existing.id;
  }

  const base = slugify(name) || 'category';
  let slug = base;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const created = await prisma.category.create({
    data: { name, slug, parentId: parentId ?? undefined, isActive: true },
    select: { id: true },
  });
  cache.set(key, created.id);
  return created.id;
}

interface Summary {
  productsCreated: number;
  productsUpdated: number;
  productsSkipped: number;
  variantsCreated: number;
  skipped: string[];
}

async function main() {
  const products: ProductData[] = allProducts;
  console.log(`${DRY_RUN ? '[dry-run] ' : ''}Static catalog: ${products.length} products`);

  const staticCategories = Array.from(new Set(products.map((p) => p.category)));
  const staticSubcategories = new Map<string, Set<string>>();
  for (const p of products) {
    if (!staticSubcategories.has(p.category)) staticSubcategories.set(p.category, new Set());
    staticSubcategories.get(p.category)!.add(p.subcategory);
  }
  const totalSubcategories = Array.from(staticSubcategories.values()).reduce((n, s) => n + s.size, 0);
  const totalVariants = products.reduce((n, p) => n + planVariants(p).length, 0);

  console.log(`${DRY_RUN ? '[dry-run] ' : ''}Plan: ${staticCategories.length} categories, ${totalSubcategories} subcategories, ${totalVariants} variants`);

  if (DRY_RUN) {
    for (const [category, subs] of staticSubcategories) {
      console.log(`  ${category} -> ${Array.from(subs).sort().join(', ')}`);
    }
    return;
  }

  const categoryCache = new Map<string, string>();
  const categoryIds = new Map<string, string>();
  for (const name of staticCategories) {
    categoryIds.set(name, await ensureCategory(name, null, categoryCache));
  }
  const subcategoryIds = new Map<string, string>();
  for (const p of products) {
    const key = `${p.category}::${p.subcategory}`;
    if (!subcategoryIds.has(key)) {
      subcategoryIds.set(key, await ensureCategory(p.subcategory, categoryIds.get(p.category)!, categoryCache));
    }
  }

  const slugs = products.map((p) => p.slug);
  const existing = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, sku: true },
  });
  const existingBySlug = new Map(existing.map((e) => [e.slug, e]));

  const summary: Summary = { productsCreated: 0, productsUpdated: 0, productsSkipped: 0, variantsCreated: 0, skipped: [] };

  for (const p of products) {
    const current = existingBySlug.get(p.slug);
    if (current && !current.sku.startsWith('ZG-')) {
      summary.productsSkipped += 1;
      summary.skipped.push(p.slug);
      continue;
    }

    const data = {
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      description: p.description,
      material: p.material,
      brand: p.brand,
      categoryId: categoryIds.get(p.category)!,
      subcategoryId: subcategoryIds.get(`${p.category}::${p.subcategory}`)!,
      regularPrice: p.regularPrice,
      salePrice: p.salePrice ?? null,
      discountPercent: p.discountPercent ?? null,
      stock: p.stock,
      images: p.images,
      tags: p.tags,
      isNew: p.isNew ?? false,
      isBestSeller: p.isBestSeller ?? false,
      isActive: true,
      specifications: { Material: p.material, Origin: 'Imported' },
    };

    let productId: string;
    if (current) {
      await prisma.product.update({ where: { id: current.id }, data });
      productId = current.id;
      summary.productsUpdated += 1;
    } else {
      const created = await prisma.product.create({ data, select: { id: true } });
      productId = created.id;
      summary.productsCreated += 1;
    }

    const planned = planVariants(p);
    if (planned.length === 0) continue;

    const existingVariants = await prisma.productVariant.findMany({
      where: { productId },
      select: { color: true, size: true },
    });
    const have = new Set(existingVariants.map((v) => `${v.color}||${v.size}`));
    const missing = planned.filter((v) => !have.has(`${v.color}||${v.size}`));
    if (missing.length > 0) {
      await prisma.productVariant.createMany({
        data: missing.map((v) => ({
          productId,
          color: v.color,
          colorHex: v.colorHex,
          size: v.size,
          stock: v.stock,
          sku: v.sku,
          images: v.images,
          isActive: true,
        })),
      });
      summary.variantsCreated += missing.length;
    }
  }

  console.log('Import complete:');
  console.log(JSON.stringify(summary, null, 2));
}

main()
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
