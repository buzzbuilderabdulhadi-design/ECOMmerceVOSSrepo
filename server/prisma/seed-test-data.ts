import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// ============================================================
// ZOYA GOODS — Controlled E2E Test Data Seed (idempotent)
//
// Purpose: add CLEARLY IDENTIFIABLE test data to the live Atlas
// database so runtime e2e flows can be exercised without touching
// existing real products/categories.
//
// Safety:
//  - Only ever writes rows whose slug/sku/code are prefixed with
//    "test-" / "ZTEST-" / "ZOYATEST"; existing real data is never
//    modified or deleted.
//  - Idempotent: re-running upserts the same stable keys. Variant
//    stock is reset to the declared baseline each run so stock
//    validations are reproducible.
//  - The test customer is NOT created here (it is registered through
//    the live /auth/register endpoint during Phase 4, so the app's
//    own flow is the sole path that creates the account).
// ============================================================

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({ datasourceUrl: process.env.MONGODB_URI });

const CLOTHING_PARENT_ID = '6aa95ae9e76a462a5026ed92'; // "Clothing & Accessories" (existing top-level category)

function img(text: string): string {
  return `https://via.placeholder.com/800x1000/0F1F33/FFF9F0?text=${text.replace(/ /g, '+')}`;
}

async function ensureCategory(data: {
  name: string;
  slug: string;
  parentId: string;
  displayOrder: number;
  description: string;
  seoTitle: string;
  seoDescription: string;
}) {
  const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
  if (existing) {
    return prisma.category.update({ where: { slug: data.slug }, data });
  }
  return prisma.category.create({ data });
}

interface VariantSeed {
  color: string;
  colorHex: string;
  size: string;
  stock: number;
}

async function ensureProduct(data: {
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  subcategoryId: string | null;
  regularPrice: number;
  salePrice: number | null;
  discountPercent: number | null;
  description: string;
  shortDescription: string;
  material: string;
  brand: string;
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  seoTitle: string;
  variants: VariantSeed[];
  baseStock?: number;
}) {
  const totalStock = data.baseStock ?? data.variants.reduce((sum, v) => sum + v.stock, 0);

  const base = {
    name: data.name,
    sku: data.sku,
    categoryId: data.categoryId,
    subcategoryId: data.subcategoryId,
    regularPrice: data.regularPrice,
    salePrice: data.salePrice,
    discountPercent: data.discountPercent,
    description: data.description,
    shortDescription: data.shortDescription,
    material: data.material,
    brand: data.brand,
    specifications: data.specifications,
    images: data.images,
    tags: data.tags,
    isNew: data.isNew,
    isBestSeller: data.isBestSeller,
    isFeatured: data.isFeatured,
    seoTitle: data.seoTitle,
    lowStockThreshold: 5,
    stock: totalStock,
    isActive: true,
  };

  const existing = await prisma.product.findUnique({ where: { slug: data.slug } });
  const product = existing
    ? await prisma.product.update({ where: { slug: data.slug }, data: base })
    : await prisma.product.create({ data: { ...base, slug: data.slug } });

  // Reset the declared variants (create or restore stock) so stock tests are
  // reproducible across runs.
  for (const v of data.variants) {
    const vSku = `${data.sku}-${v.color.replace(/[^A-Za-z]/g, '').slice(0, 10).toUpperCase()}-${v.size.toUpperCase()}`;
    const existingVariant = await prisma.productVariant.findUnique({ where: { sku: vSku } });
    if (existingVariant) {
      await prisma.productVariant.update({
        where: { sku: vSku },
        data: { color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock, isActive: true },
      });
    } else {
      await prisma.productVariant.create({
        data: { productId: product.id, color: v.color, colorHex: v.colorHex, size: v.size, stock: v.stock, sku: vSku, isActive: true },
      });
    }
  }
  return product;
}

async function ensureCoupon() {
  const code = 'ZOYATEST10';
  const data = {
    code,
    type: 'PERCENTAGE',
    value: 10,
    maxUses: 100,
    maxDiscount: null,
    minOrderAmount: 0,
    usedCount: 0,
    expiresAt: new Date('2027-09-23T23:59:59.000Z'),
    isActive: true,
  };
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return prisma.coupon.update({ where: { code }, data });
  return prisma.coupon.create({ data });
}

async function main() {
  console.log('Seeding [TEST] data (idempotent)...');

  const cats = await Promise.all([
    ensureCategory({
      name: '[TEST] Leather Jackets',
      slug: 'test-leather-jackets',
      parentId: CLOTHING_PARENT_ID,
      displayOrder: 7,
      description: 'Test category: leather jackets for runtime e2e verification.',
      seoTitle: '[TEST] Leather Jackets | ZOYA GOODS',
      seoDescription: 'Controlled test-data category.',
    }),
    ensureCategory({
      name: '[TEST] Cotton Jackets',
      slug: 'test-cotton-jackets',
      parentId: CLOTHING_PARENT_ID,
      displayOrder: 8,
      description: 'Test category: cotton jackets for runtime e2e verification.',
      seoTitle: '[TEST] Cotton Jackets | ZOYA GOODS',
      seoDescription: 'Controlled test-data category.',
    }),
    ensureCategory({
      name: '[TEST] Hoodies',
      slug: 'test-hoodies',
      parentId: CLOTHING_PARENT_ID,
      displayOrder: 9,
      description: 'Test category: hoodies for runtime e2e verification.',
      seoTitle: '[TEST] Hoodies | ZOYA GOODS',
      seoDescription: 'Controlled test-data category.',
    }),
  ]);
  const jackets = cats[0];
  const cottons = cats[1];
  const hoodies = cats[2];

  const p1 = await ensureProduct({
    name: '[TEST] ZOYA Classic Leather Jacket',
    slug: 'test-zoya-classic-leather-jacket',
    sku: 'ZTEST-LJ-001',
    categoryId: CLOTHING_PARENT_ID,
    subcategoryId: jackets.id,
    regularPrice: 499,
    salePrice: 449,
    discountPercent: 10,
    description: 'Controlled test product: full-grain leather jacket with zip front, quilted lining and side pockets. Multiple colors and sizes.',
    shortDescription: 'Full-grain leather jacket (test data)',
    material: 'Full-Grain Leather',
    brand: 'ZOYA',
    specifications: { fit: 'True to size', lining: 'Quilted viscose', care: 'Professional leather cleaning only' },
    images: [img('TEST Leather Jacket'), img('TEST Jacket Detail')],
    tags: ['leather', 'jacket', 'test-data'],
    isNew: true,
    isBestSeller: false,
    isFeatured: false,
    seoTitle: '[TEST] ZOYA Classic Leather Jacket | ZOYA GOODS',
    variants: [
      { color: 'Black', colorHex: '#111827', size: 'S', stock: 8 },
      { color: 'Black', colorHex: '#111827', size: 'M', stock: 1 }, // LOW STOCK
      { color: 'Black', colorHex: '#111827', size: 'L', stock: 6 },
      { color: 'Black', colorHex: '#111827', size: 'XL', stock: 7 },
      { color: 'Brown', colorHex: '#6B4226', size: 'S', stock: 0 }, // ZERO STOCK
      { color: 'Brown', colorHex: '#6B4226', size: 'M', stock: 5 },
      { color: 'Brown', colorHex: '#6B4226', size: 'L', stock: 4 },
      { color: 'Brown', colorHex: '#6B4226', size: 'XL', stock: 3 },
      { color: 'Tan', colorHex: '#D2B48C', size: 'S', stock: 6 },
      { color: 'Tan', colorHex: '#D2B48C', size: 'M', stock: 7 },
      { color: 'Tan', colorHex: '#D2B48C', size: 'L', stock: 9 },
      { color: 'Tan', colorHex: '#D2B48C', size: 'XL', stock: 5 },
    ],
  });

  const p2 = await ensureProduct({
    name: '[TEST] ZOYA Urban Bomber',
    slug: 'test-zoya-urban-bomber',
    sku: 'ZTEST-BMB-001',
    categoryId: CLOTHING_PARENT_ID,
    subcategoryId: cottons.id,
    regularPrice: 189,
    salePrice: null,
    discountPercent: null,
    description: 'Controlled test product: cotton-blend bomber jacket with ribbed cuffs and stand collar.',
    shortDescription: 'Cotton-blend bomber jacket (test data)',
    material: 'Cotton Blend',
    brand: 'ZOYA',
    specifications: { fit: 'Relaxed', care: 'Machine wash cold' },
    images: [img('TEST Urban Bomber'), img('TEST Bomber Back')],
    tags: ['bomber', 'jacket', 'test-data'],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    seoTitle: '[TEST] ZOYA Urban Bomber | ZOYA GOODS',
    variants: [
      { color: 'Black', colorHex: '#1F2937', size: 'S', stock: 4 },
      { color: 'Black', colorHex: '#1F2937', size: 'M', stock: 5 },
      { color: 'Black', colorHex: '#1F2937', size: 'L', stock: 3 },
      { color: 'Olive', colorHex: '#4B5320', size: 'S', stock: 3 },
      { color: 'Olive', colorHex: '#4B5320', size: 'M', stock: 6 },
      { color: 'Olive', colorHex: '#4B5320', size: 'L', stock: 0 }, // ZERO STOCK
    ],
  });

  const p3 = await ensureProduct({
    name: '[TEST] ZOYA Essential Hoodie',
    slug: 'test-zoya-essential-hoodie',
    sku: 'ZTEST-HD-001',
    categoryId: CLOTHING_PARENT_ID,
    subcategoryId: hoodies.id,
    regularPrice: 99,
    salePrice: 79,
    discountPercent: 20,
    description: 'Controlled test product: heavy-weight brushed-back cotton hoodie with kangaroo pocket.',
    shortDescription: 'Heavy-weight cotton hoodie (test data)',
    material: 'Heavy-Weight Cotton',
    brand: 'ZOYA',
    specifications: { fit: 'Regular', care: 'Machine wash cold, tumble dry low' },
    images: [img('TEST Essential Hoodie'), img('TEST Hoodie Pocket')],
    tags: ['hoodie', 'test-data'],
    isNew: false,
    isBestSeller: true,
    isFeatured: false,
    seoTitle: '[TEST] ZOYA Essential Hoodie | ZOYA GOODS',
    variants: [
      { color: 'Black', colorHex: '#111827', size: 'S', stock: 10 },
      { color: 'Black', colorHex: '#111827', size: 'M', stock: 12 },
      { color: 'Black', colorHex: '#111827', size: 'L', stock: 9 },
      { color: 'Black', colorHex: '#111827', size: 'XL', stock: 8 },
      { color: 'Heather Grey', colorHex: '#B0B0B0', size: 'S', stock: 2 }, // LOW STOCK
      { color: 'Heather Grey', colorHex: '#B0B0B0', size: 'M', stock: 11 },
      { color: 'Heather Grey', colorHex: '#B0B0B0', size: 'L', stock: 7 },
      { color: 'Heather Grey', colorHex: '#B0B0B0', size: 'XL', stock: 5 },
      { color: 'Navy', colorHex: '#1E3A8A', size: 'S', stock: 6 },
      { color: 'Navy', colorHex: '#1E3A8A', size: 'M', stock: 0 }, // ZERO STOCK
      { color: 'Navy', colorHex: '#1E3A8A', size: 'L', stock: 10 },
      { color: 'Navy', colorHex: '#1E3A8A', size: 'XL', stock: 4 },
    ],
  });

  await ensureProduct({
    name: '[TEST] ZOYA Leather Care Kit',
    slug: 'test-zoya-leather-care-kit',
    sku: 'ZTEST-LCK-001',
    categoryId: jackets.id,
    subcategoryId: null,
    regularPrice: 49,
    salePrice: null,
    discountPercent: null,
    description: 'Controlled test product with no variants: leather cleaner, conditioner and application cloth in a travel pouch.',
    shortDescription: 'Leather care kit (test data, no variants)',
    material: 'Kit',
    brand: 'ZOYA',
    specifications: { includes: 'Cleaner 250ml, Conditioner 250ml, Microfibre cloth' },
    images: [img('TEST Leather Care Kit')],
    tags: ['care', 'accessory', 'test-data'],
    isNew: false,
    isBestSeller: false,
    isFeatured: false,
    seoTitle: '[TEST] ZOYA Leather Care Kit | ZOYA GOODS',
    variants: [],
    baseStock: 25,
  });

  await ensureCoupon();

  console.log('Seed complete.');
  console.log('Products:', p1.name, '|', p2.name, '|', p3.name, '| [TEST] ZOYA Leather Care Kit');
  process.exit(0);
}

main().catch((e) => {
  console.error('SEED FAILED:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});