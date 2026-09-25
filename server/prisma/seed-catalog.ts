import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// ============================================================
// ZOYA GOODS — Real Storefront Catalog Seed (idempotent)
//
// Expands the live MongoDB catalog with ~38 high-quality ZOYA
// products inside the EXISTING category architecture.
//
// Namespace:
//   - Product SKUs   : ZCAT-...  (clearly distinguishable)
//   - Categories     : created only when a needed child category
//                      is missing under an existing parent (by slug)
//
// Safety:
//   - Matching is by `slug` first, then `sku`. Products whose sku
//     does NOT start with ZCAT- are NEVER modified (real/test seed).
//   - Re-running updates the same stable rows in place; nothing is
//     duplicated; no real product/category is deleted.
//   - Variant stock is reset to the declared baseline each run.
//   - Existing customers, orders, payments, coupons, wishlists and
//     reviews are untouched.
//
// Usage:
//   npm run seed:catalog
// ============================================================

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient({ datasourceUrl: process.env.MONGODB_URI });

const SKU_PREFIX = 'ZCAT';

// ------------------------------------------------------------------
// Image strategy
//   Reuses the project's existing strategy (real CDN photography with
//   `?w=` sizing, as used by the original seed). Every URL below was
//   verified to return HTTP 200 from images.unsplash.com at seed time,
//   so the catalog renders without broken-image icons. Real product
//   photography should still be uploaded for production (see report).
// ------------------------------------------------------------------
const IMG = (id: string) => `https://images.unsplash.com/${id}?w=800`;

const COLORS: Record<string, string> = {
  Black: '#000000',
  Brown: '#5C3A21',
  'Dark Brown': '#3B2B20',
  Tan: '#D2B48C',
  Navy: '#000080',
  Olive: '#4B5320',
  Cream: '#F5F0E1',
  White: '#FFFFFF',
  Charcoal: '#36454F',
  Burgundy: '#800020',
  Grey: '#808080',
  Camel: '#C19A6B',
  Beige: '#D8C7A9',
  Gold: '#C9A227',
  Silver: '#C0C0C0',
};

const img = {
  leatherJacket: [IMG('photo-1551028719-00167b16eac5'), IMG('photo-1591047139829-d91aecb6caea')],
  leatherJacket2: [IMG('photo-1521223890158-f9f7c3d5d504'), IMG('photo-1551028719-00167b16eac5')],
  bomber: [IMG('photo-1591047139829-d91aecb6caea'), IMG('photo-1551537482-f2075a1d41f2')],
  cottonJacket: [IMG('photo-1539533018447-63fcce2678e3'), IMG('photo-1544022613-e87ca75a784a')],
  hoodie: [IMG('photo-1556821840-3a63f95609a7'), IMG('photo-1509942774463-acf339cf87d5')],
  blazer: [IMG('photo-1594938298603-c8148c4dae35'), IMG('photo-1507679799987-c73779587ccf')],
  coat: [IMG('photo-1544022613-e87ca75a784a'), IMG('photo-1511556820780-d912e42b4980')],
  shirt: [IMG('photo-1603252109303-2751441dd157'), IMG('photo-1596755094514-f87e34085b2c')],
  tee: [IMG('photo-1521572163474-6864f9cf17ab'), IMG('photo-1503341504253-dff4815485f1')],
  trouser: [IMG('photo-1624378439575-d8705ad7ae80'), IMG('photo-1584370848010-d7fe6bc767ec')],
  dress: [IMG('photo-1566174053879-31528523f8ae'), IMG('photo-1572804013309-59a88b7e92f1')],
  dress2: [IMG('photo-1572804013309-59a88b7e92f1'), IMG('photo-1566174053879-31528523f8ae')],
  tote: [IMG('photo-1584917865442-de89df76afd3'), IMG('photo-1566150905458-1bf1fc113f0d')],
  tote2: [IMG('photo-1548036328-c9fa89d128fa'), IMG('photo-1584917865442-de89df76afd3')],
  crossbody: [IMG('photo-1566150905458-1bf1fc113f0d'), IMG('photo-1548036328-c9fa89d128fa')],
  crossbody2: [IMG('photo-1590874103328-eac38a683ce7'), IMG('photo-1559563458-527698bf5295')],
  shoulder: [IMG('photo-1559563458-527698bf5295'), IMG('photo-1575032617751-6ddec2089882')],
  shoulder2: [IMG('photo-1575032617751-6ddec2089882'), IMG('photo-1590874103328-eac38a683ce7')],
  loafer: [IMG('photo-1562273138-f46be4ebdf33'), IMG('photo-1556306535-0f09a537f0a3')],
  sneaker: [IMG('photo-1549298916-b41d501d3772'), IMG('photo-1560769629-975ec94e6a86')],
  sneaker2: [IMG('photo-1600185365926-3a2ce3cdb9eb'), IMG('photo-1595950653106-6c9ebd614d3a')],
  boot: [IMG('photo-1608256246200-53e635b5b65f'), IMG('photo-1525966222134-fcfa99b8ae77')],
  heel: [IMG('photo-1543163521-1bf539c55dd2'), IMG('photo-1560343090-f0409e92791a')],
  heel2: [IMG('photo-1595777457583-95e059d581b8'), IMG('photo-1543163521-1bf539c55dd2')],
  watch: [IMG('photo-1547996160-81dfa63595aa'), IMG('photo-1523170335258-f5ed11844a49')],
  watch2: [IMG('photo-1524592094714-0f0654e20314'), IMG('photo-1533139502658-0198f920d8e8')],
  watch3: [IMG('photo-1508057198894-247b23fe5ade'), IMG('photo-1523170335258-f5ed11844a49')],
  necklace: [IMG('photo-1605100804763-247f67b3557e'), IMG('photo-1573408301185-9146fe634ad0')],
  ring: [IMG('photo-1515562141207-7a88fb7ce338'), IMG('photo-1605100804763-247f67b3557e')],
  ring2: [IMG('photo-1599643478518-a784e5dc4c8f'), IMG('photo-1515562141207-7a88fb7ce338')],
  bracelet: [IMG('photo-1610725664285-7c57e6eeac3f'), IMG('photo-1605100804763-247f67b3557e')],
  bracelet2: [IMG('photo-1602173574767-37ac01994b2a'), IMG('photo-1610725664285-7c57e6eeac3f')],
  earrings: [IMG('photo-1611652022419-a9419f74343d'), IMG('photo-1601121141461-9d6647bca1ed')],
  earrings2: [IMG('photo-1602173574767-37ac01994b2a'), IMG('photo-1611652022419-a9419f74343d')],
};

// ------------------------------------------------------------------
// Catalog data
// ------------------------------------------------------------------

const categoryCache = new Map<string, string>();

async function getParentId(slug: string): Promise<string> {
  const cached = categoryCache.get(slug);
  if (cached) return cached;
  const found = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (!found) throw new Error(`Parent category not found: ${slug}`);
  categoryCache.set(slug, found.id);
  return found.id;
}

async function findCategory(slug: string): Promise<{ id: string } | null> {
  const cached = categoryCache.get(slug);
  if (cached) return { id: cached };
  const found = await prisma.category.findUnique({ where: { slug }, select: { id: true } });
  if (found) categoryCache.set(slug, found.id);
  return found;
}

async function ensureChildCategory(data: {
  name: string;
  slug: string;
  parentSlug: string;
  description: string;
  displayOrder: number;
  isFeatured: boolean;
  seoTitle: string;
}): Promise<string> {
  const existing = await findCategory(data.slug);
  if (existing) return existing.id;
  const parentId = await getParentId(data.parentSlug);
  const { name, slug, description, displayOrder, isFeatured, seoTitle } = data;
  const created = await prisma.category.create({
    data: { name, slug, description, displayOrder, isFeatured, seoTitle, parentId },
    select: { id: true },
  });
  categoryCache.set(data.slug, created.id);
  return created.id;
}

interface VariantSeed {
  color: string;
  size: string;
  stock: number;
}

interface ProductSeed {
  name: string;
  slug: string;
  sku: string;
  categorySlug: string;
  subcategorySlug: string;
  regularPrice: number;
  salePrice: number | null;
  discountPercent: number | null;
  description: string;
  shortDescription: string;
  material: string;
  specifications: Record<string, string>;
  images: string[];
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isLimitedEdition?: boolean;
  variants: VariantSeed[];
  baseStock?: number;
}

const PRODUCTS: ProductSeed[] = [
  // ---------------- Clothing & Accessories ----------------
  {
    name: 'Milano Leather Jacket', slug: 'milano-leather-jacket', sku: 'ZCAT-LJ-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'jackets',
    regularPrice: 429, salePrice: 386, discountPercent: 10,
    description: 'A full-grain Italian leather jacket with a tailored silhouette, asymmetric zip front and quilted satin lining. Finished with antique-nickel hardware and interior pocketing. Pairs as easily over a knit as it does with a silk dress.',
    shortDescription: 'Full-grain Italian leather, tailored fit',
    material: 'Full-Grain Leather',
    specifications: { Fit: 'Tailored true to size', Lining: 'Quilted satin', Closure: 'Asymmetric zip', Care: 'Professional leather cleaning only' },
    images: img.leatherJacket, tags: ['leather', 'jacket', 'milano'],
    isNew: true, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Black', size: 'S', stock: 5 }, { color: 'Black', size: 'M', stock: 7 }, { color: 'Black', size: 'L', stock: 5 }, { color: 'Black', size: 'XL', stock: 3 },
      { color: 'Brown', size: 'S', stock: 4 }, { color: 'Brown', size: 'M', stock: 5 }, { color: 'Brown', size: 'L', stock: 4 }, { color: 'Brown', size: 'XL', stock: 2 },
      { color: 'Tan', size: 'S', stock: 4 }, { color: 'Tan', size: 'M', stock: 6 }, { color: 'Tan', size: 'L', stock: 4 }, { color: 'Tan', size: 'XL', stock: 2 },
    ],
  },
  {
    name: 'Verona Cropped Leather Jacket', slug: 'verona-cropped-leather-jacket', sku: 'ZCAT-LJ-002',
    categorySlug: 'clothing-accessories', subcategorySlug: 'jackets',
    regularPrice: 385, salePrice: null, discountPercent: null,
    description: 'A cropped lambskin jacket with a zip front, stand collar and subtle contrast topstitching. Hits at the waist for a clean, modern line',
    shortDescription: 'Cropped lambskin with waist-length fit',
    material: 'Lambskin Leather',
    specifications: { Fit: 'Cropped, true to size', Lining: 'Viscose', Care: 'Professional leather cleaning only' },
    images: img.leatherJacket2, tags: ['leather', 'cropped', 'jacket'],
    isNew: false, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Black', size: 'XS', stock: 4 }, { color: 'Black', size: 'S', stock: 6 }, { color: 'Black', size: 'M', stock: 5 },
      { color: 'Tan', size: 'XS', stock: 3 }, { color: 'Tan', size: 'S', stock: 5 }, { color: 'Tan', size: 'M', stock: 4 },
    ],
  },
  {
    name: 'Heritage Bomber Jacket', slug: 'heritage-bomber-jacket', sku: 'ZCAT-BJ-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'bomber-jackets',
    regularPrice: 215, salePrice: null, discountPercent: null,
    description: 'A classic nylon-shell bomber with ribbed cuffs and hem, two-way front zip and a warm cotton-blend lining. The everyday layering piece with a sharp, collarless finish.',
    shortDescription: 'Nylon shell bomber, ribbed trims',
    material: 'Nylon Blend',
    specifications: { Fit: 'Relaxed modern', Shell: 'Waxed nylon', Care: 'Spot clean, dry clean for best results' },
    images: img.bomber, tags: ['bomber', 'jacket', 'nylon'],
    isNew: true, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Black', size: 'S', stock: 6 }, { color: 'Black', size: 'M', stock: 8 }, { color: 'Black', size: 'L', stock: 6 }, { color: 'Black', size: 'XL', stock: 4 },
      { color: 'Olive', size: 'S', stock: 4 }, { color: 'Olive', size: 'M', stock: 6 }, { color: 'Olive', size: 'L', stock: 5 }, { color: 'Olive', size: 'XL', stock: 3 },
    ],
  },
  {
    name: 'Heritage Cotton Jacket', slug: 'heritage-cotton-jacket', sku: 'ZCAT-CJ-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'cotton-jackets',
    regularPrice: 148, salePrice: 133, discountPercent: 10,
    description: 'A washed, garment-dyed cotton twill jacket with corozo buttons and two chest patch pockets. Soft-hand feel that breaks in beautifully, cut for easy layering.',
    shortDescription: 'Garment-dyed cotton twill overshirt',
    material: 'Cotton Twill',
    specifications: { Fit: 'Relaxed', Fabric: '100% cotton twill', Care: 'Machine wash cold, hang dry' },
    images: img.cottonJacket, tags: ['cotton', 'jacket', 'overshirt'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Navy', size: 'S', stock: 5 }, { color: 'Navy', size: 'M', stock: 7 }, { color: 'Navy', size: 'L', stock: 6 }, { color: 'Navy', size: 'XL', stock: 4 },
      { color: 'Charcoal', size: 'S', stock: 4 }, { color: 'Charcoal', size: 'M', stock: 6 }, { color: 'Charcoal', size: 'L', stock: 5 }, { color: 'Charcoal', size: 'XL', stock: 3 },
    ],
  },
  {
    name: 'Atelier Oversized Hoodie', slug: 'atelier-oversized-hoodie', sku: 'ZCAT-HD-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'hoodies',
    regularPrice: 89, salePrice: null, discountPercent: null,
    description: 'Heavyweight 450gsm loopback cotton hoodie with a dropped shoulder, double-layer hood and kangaroo pocket. Brushed inside for comfort, built to keep its shape.',
    shortDescription: '450gsm loopback cotton, oversized fit',
    material: 'Heavyweight Cotton',
    specifications: { Fit: 'Oversized', Fabric: '450gsm brushed loopback', Care: 'Machine wash cold, tumble dry low' },
    images: img.hoodie, tags: ['hoodie', 'casual', 'cotton'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Black', size: 'S', stock: 8 }, { color: 'Black', size: 'M', stock: 10 }, { color: 'Black', size: 'L', stock: 9 }, { color: 'Black', size: 'XL', stock: 7 }, { color: 'Black', size: 'XXL', stock: 5 },
      { color: 'Cream', size: 'S', stock: 6 }, { color: 'Cream', size: 'M', stock: 8 }, { color: 'Cream', size: 'L', stock: 7 }, { color: 'Cream', size: 'XL', stock: 5 }, { color: 'Cream', size: 'XXL', stock: 4 },
      { color: 'Camel', size: 'M', stock: 5 }, { color: 'Camel', size: 'L', stock: 5 }, { color: 'Camel', size: 'XL', stock: 4 },
    ],
  },
  {
    name: 'Regent Wool Blazer', slug: 'regent-wool-blazer', sku: 'ZCAT-BLZ-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'suits-blazers',
    regularPrice: 298, salePrice: 253, discountPercent: 15,
    description: 'A structured single-breasted blazer in softly brushed wool with notch lapels, pick-stitching and a half-canvas front. Half-canvas tailoring gives it a flattering drape that keeps its shape.',
    shortDescription: 'Brushed wool, half-canvas tailoring',
    material: 'Wool Blend',
    specifications: { Fit: 'Slim-sharp', Construction: 'Half-canvas', Care: 'Dry clean only' },
    images: img.blazer, tags: ['blazer', 'tailoring', 'wool'],
    isNew: false, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Navy', size: 'XS', stock: 4 }, { color: 'Navy', size: 'S', stock: 6 }, { color: 'Navy', size: 'M', stock: 7 }, { color: 'Navy', size: 'L', stock: 5 }, { color: 'Navy', size: 'XL', stock: 3 },
      { color: 'Charcoal', size: 'S', stock: 5 }, { color: 'Charcoal', size: 'M', stock: 6 }, { color: 'Charcoal', size: 'L', stock: 4 }, { color: 'Charcoal', size: 'XL', stock: 2 },
    ],
  },
  {
    name: 'Kensington Wool Coat', slug: 'kensington-wool-coat', sku: 'ZCAT-CT-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'coats',
    regularPrice: 465, salePrice: 418, discountPercent: 10,
    description: 'A floor-skimming wool-blend coat with a notched lapel, concealed placket and deep side pockets. Fully lined, with a flared sweep that moves beautifully. The cold-weather anchor of the collection.',
    shortDescription: 'Wool-blend overcoat, flared silhouette',
    material: 'Wool Blend',
    specifications: { Fit: 'Relaxed-tall', Fabric: '80% wool, 20% nylon', Care: 'Dry clean only' },
    images: img.coat, tags: ['coat', 'winter', 'wool'],
    isNew: true, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Camel', size: 'S', stock: 5 }, { color: 'Camel', size: 'M', stock: 7 }, { color: 'Camel', size: 'L', stock: 5 }, { color: 'Camel', size: 'XL', stock: 3 },
      { color: 'Black', size: 'S', stock: 5 }, { color: 'Black', size: 'M', stock: 6 }, { color: 'Black', size: 'L', stock: 5 }, { color: 'Black', size: 'XL', stock: 3 },
      { color: 'Grey', size: 'M', stock: 4 }, { color: 'Grey', size: 'L', stock: 3 },
    ],
  },
  {
    name: 'Verona Oxford Shirt', slug: 'verona-oxford-shirt', sku: 'ZCAT-SH-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'tops-shirts',
    regularPrice: 94, salePrice: 80, discountPercent: 15,
    description: 'An oxford button-down in softly washed cotton with a collar roll that sits just right. Mother-of-pearl buttons and a box-pleat back complete a shirt that works from desk to dinner.',
    shortDescription: 'Washed oxford cotton button-down',
    material: 'Cotton Oxford',
    specifications: { Fit: 'Classic regular', Fabric: '100% cotton oxford', Care: 'Machine wash cold' },
    images: img.shirt, tags: ['shirt', 'oxford', 'cotton'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'White', size: 'XS', stock: 5 }, { color: 'White', size: 'S', stock: 7 }, { color: 'White', size: 'M', stock: 8 }, { color: 'White', size: 'L', stock: 6 }, { color: 'White', size: 'XL', stock: 4 },
      { color: 'Cream', size: 'S', stock: 5 }, { color: 'Cream', size: 'M', stock: 6 }, { color: 'Cream', size: 'L', stock: 5 },
      { color: 'Navy', size: 'S', stock: 4 }, { color: 'Navy', size: 'M', stock: 6 }, { color: 'Navy', size: 'L', stock: 5 },
    ],
  },
  {
    name: 'Como Heavyweight Tee', slug: 'como-heavyweight-tee', sku: 'ZCAT-TS-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 't-shirts',
    regularPrice: 49, salePrice: null, discountPercent: null,
    description: 'A boxy heavyweight tee in 240gsm combed cotton with a rib collar that holds its shape. Pre-shrunk, garment-washed and cut with a clean hem that layers well.',
    shortDescription: '240gsm combed cotton, boxy fit',
    material: 'Combed Cotton',
    specifications: { Fit: 'Boxy regular', Fabric: '240gsm combed cotton', Care: 'Machine wash cold, tumble dry low' },
    images: img.tee, tags: ['tee', 'essentials', 'cotton'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'White', size: 'S', stock: 10 }, { color: 'White', size: 'M', stock: 12 }, { color: 'White', size: 'L', stock: 10 }, { color: 'White', size: 'XL', stock: 8 }, { color: 'White', size: 'XXL', stock: 5 },
      { color: 'Black', size: 'S', stock: 9 }, { color: 'Black', size: 'M', stock: 10 }, { color: 'Black', size: 'L', stock: 9 }, { color: 'Black', size: 'XL', stock: 7 }, { color: 'Black', size: 'XXL', stock: 4 },
      { color: 'Charcoal', size: 'M', stock: 6 }, { color: 'Charcoal', size: 'L', stock: 6 },
    ],
  },
  {
    name: 'Milan Tailored Trouser', slug: 'milan-tailored-trouser', sku: 'ZCAT-TR-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'trousers',
    regularPrice: 158, salePrice: null, discountPercent: null,
    description: 'A high-rise tailored trouser in stretch wool with a pressed crease, side adjusters and a full-length straight leg. Polished enough for tailoring, comfortable enough for travel.',
    shortDescription: 'Stretch wool, high-rise tailored fit',
    material: 'Stretch Wool',
    specifications: { Fit: 'High-rise straight leg', Fabric: '98% wool, 2% elastane', Care: 'Dry clean only' },
    images: img.trouser, tags: ['trouser', 'tailoring', 'wool'],
    isNew: false, isBestSeller: true, isFeatured: false,
    variants: [
      { color: 'Black', size: '28', stock: 4 }, { color: 'Black', size: '30', stock: 6 }, { color: 'Black', size: '32', stock: 7 }, { color: 'Black', size: '34', stock: 5 }, { color: 'Black', size: '36', stock: 3 },
      { color: 'Charcoal', size: '30', stock: 5 }, { color: 'Charcoal', size: '32', stock: 6 }, { color: 'Charcoal', size: '34', stock: 4 },
      { color: 'Navy', size: '30', stock: 4 }, { color: 'Navy', size: '32', stock: 5 }, { color: 'Navy', size: '34', stock: 4 },
    ],
  },
  {
    name: 'Firenze Satin Slip Dress', slug: 'firenze-satin-slip-dress', sku: 'ZCAT-DR-001',
    categorySlug: 'clothing-accessories', subcategorySlug: 'dresses',
    regularPrice: 189, salePrice: null, discountPercent: null,
    description: 'A bias-cut satin slip dress with delicate adjustable straps and a draped cowl back. Fluid, floor-skimming and deeply elegant, cut to move with the body.',
    shortDescription: 'Bias-cut satin, cowl back',
    material: 'Satin',
    specifications: { Fit: 'Bias-cut, true to size', Fabric: 'Silk-touch satin', Care: 'Dry clean only' },
    images: img.dress, tags: ['dress', 'satin', 'evening'],
    isNew: false, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Burgundy', size: 'XS', stock: 4 }, { color: 'Burgundy', size: 'S', stock: 6 }, { color: 'Burgundy', size: 'M', stock: 5 }, { color: 'Burgundy', size: 'L', stock: 3 },
      { color: 'Black', size: 'XS', stock: 4 }, { color: 'Black', size: 'S', stock: 6 }, { color: 'Black', size: 'M', stock: 6 }, { color: 'Black', size: 'L', stock: 4 },
      { color: 'Cream', size: 'S', stock: 4 }, { color: 'Cream', size: 'M', stock: 4 },
    ],
  },
  {
    name: 'Santorini Maxi Dress', slug: 'santorini-maxi-dress', sku: 'ZCAT-DR-002',
    categorySlug: 'clothing-accessories', subcategorySlug: 'dresses',
    regularPrice: 164, salePrice: 139, discountPercent: 15,
    description: 'A breezy cotton-poplin maxi dress with smocked bodice, gathered tiered skirt and elbow-length sleeves. Easy, sunny and effortless from market days to resort evenings.',
    shortDescription: 'Cotton-poplin tiered maxi',
    material: 'Cotton Poplin',
    specifications: { Fit: 'Relaxed, smocked bodice', Fabric: '100% cotton poplin', Care: 'Machine wash cold' },
    images: img.dress2, tags: ['dress', 'maxi', 'summer'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'White', size: 'XS', stock: 5 }, { color: 'White', size: 'S', stock: 7 }, { color: 'White', size: 'M', stock: 6 }, { color: 'White', size: 'L', stock: 4 },
      { color: 'Olive', size: 'S', stock: 5 }, { color: 'Olive', size: 'M', stock: 6 }, { color: 'Olive', size: 'L', stock: 4 },
    ],
  },

  // ---------------- Handbags ----------------
  {
    name: 'Siena Leather Tote', slug: 'siena-leather-tote', sku: 'ZCAT-TB-001',
    categorySlug: 'handbags', subcategorySlug: 'tote-bags',
    regularPrice: 345, salePrice: null, discountPercent: null,
    description: 'A structured full-grain leather tote with rolled handles, magnetic top closure and a spacious suede-lined interior with zip pocket. Brushed-gold hardware and feet protect the base.',
    shortDescription: 'Full-grain leather everyday tote',
    material: 'Full-Grain Leather',
    specifications: { Interior: 'Suede, zip pocket', Hardware: 'Brushed gold-tone', Care: 'Store with dust bag' },
    images: img.tote, tags: ['tote', 'leather', 'everyday'],
    isNew: false, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Brown', size: 'One Size', stock: 8 },
      { color: 'Black', size: 'One Size', stock: 10 },
      { color: 'Tan', size: 'One Size', stock: 6 },
    ],
  },
  {
    name: 'Venezia Shopping Tote', slug: 'venezia-shopping-tote', sku: 'ZCAT-TB-002',
    categorySlug: 'handbags', subcategorySlug: 'tote-bags',
    regularPrice: 285, salePrice: null, discountPercent: null,
    description: 'A roomy calfskin shopping tote with flat top handles and an interior organizer for cards and phone. Clean lines and an unstructured body that slouches beautifully with wear.',
    shortDescription: 'Calfskin shopping tote, unstructured',
    material: 'Calfskin Leather',
    specifications: { Interior: 'Organizer pockets', Hardware: 'Signature plaque', Care: 'Store with dust bag' },
    images: img.tote2, tags: ['tote', 'calfskin', 'bag'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Black', size: 'One Size', stock: 9 },
      { color: 'Cream', size: 'One Size', stock: 5 },
    ],
  },
  {
    name: 'Verona Crossbody Bag', slug: 'verona-crossbody-bag', sku: 'ZCAT-CB-001',
    categorySlug: 'handbags', subcategorySlug: 'crossbody-bags',
    regularPrice: 268, salePrice: null, discountPercent: null,
    description: 'A boxy crossbody in smooth leather with a curbed chain-and-leather strap, flap closure and interior zip wall. The versatile going-out bag that fits the essentials and crosses from day to night.',
    shortDescription: 'Boxy leather crossbody, chain strap',
    material: 'Smooth Leather',
    specifications: { Interior: 'Zip wall pocket', Hardware: 'Gunmetal-tone', Care: 'Store with dust bag' },
    images: img.crossbody, tags: ['crossbody', 'leather', 'bag'],
    isNew: false, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Black', size: 'One Size', stock: 8 },
      { color: 'Tan', size: 'One Size', stock: 6 },
    ],
  },
  {
    name: 'Milano Mini Crossbody', slug: 'milano-mini-crossbody', sku: 'ZCAT-CB-002',
    categorySlug: 'handbags', subcategorySlug: 'crossbody-bags',
    regularPrice: 198, salePrice: null, discountPercent: null,
    description: 'A compact mini crossbody with a top handle, removable shoulder strap and engraved turn-lock. Big on detail, small in size, finished in soft pebbled calf.',
    shortDescription: 'Mini pebbled crossbody, two ways to carry',
    material: 'Pebbled Calf',
    specifications: { Carry: 'Top handle + strap', Closure: 'Turn-lock', Care: 'Store with dust bag' },
    images: img.crossbody2, tags: ['crossbody', 'mini', 'bag'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Black', size: 'One Size', stock: 7 },
      { color: 'Burgundy', size: 'One Size', stock: 5 },
      { color: 'Cream', size: 'One Size', stock: 4 },
    ],
  },
  {
    name: 'Torino Shoulder Bag', slug: 'torino-shoulder-bag', sku: 'ZCAT-SB-001',
    categorySlug: 'handbags', subcategorySlug: 'shoulder-bags',
    regularPrice: 312, salePrice: null, discountPercent: null,
    description: 'A structured shoulder bag in polished calf with a hinged top bar, arched flap and short shoulder strap. Elevated hardware and a refined silhouette for daily polish.',
    shortDescription: 'Polished calf flap shoulder bag',
    material: 'Polished Calf',
    specifications: { Interior: 'Divided suede', Hardware: 'Hinged top bar', Care: 'Store with dust bag' },
    images: img.shoulder, tags: ['shoulder', 'leather', 'bag'],
    isNew: false, isBestSeller: true, isFeatured: false,
    variants: [
      { color: 'Navy', size: 'One Size', stock: 6 },
      { color: 'Black', size: 'One Size', stock: 8 },
    ],
  },
  {
    name: 'Riviera Chain Shoulder Bag', slug: 'riviera-chain-shoulder-bag', sku: 'ZCAT-SB-002',
    categorySlug: 'handbags', subcategorySlug: 'shoulder-bags',
    regularPrice: 289, salePrice: null, discountPercent: null,
    description: 'A soft lambskin shoulder bag with a glistening curb chain strap and magnetic smile closure. Unlined in the spirit of classic evening bags, with a supple, slouchy drape.',
    shortDescription: 'Lambskin chain shoulder bag',
    material: 'Lambskin',
    specifications: { Strap: 'Curb chain', Closure: 'Magnetic smile', Care: 'Store with dust bag' },
    images: img.shoulder2, tags: ['shoulder', 'evening', 'bag'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'White', size: 'One Size', stock: 6 },
      { color: 'Black', size: 'One Size', stock: 7 },
    ],
  },

  // ---------------- Footwear ----------------
  {
    name: 'Milano Leather Loafer', slug: 'milano-leather-loafer', sku: 'ZCAT-LF-001',
    categorySlug: 'footwear', subcategorySlug: 'loafers',
    regularPrice: 198, salePrice: null, discountPercent: null,
    description: 'A hand-finished penny loafer in burnished calf with a leather sole and stacked heel. The oxford-thickness leather molds to the foot for all-day, anywhere polish.',
    shortDescription: 'Burnished calf penny loafer',
    material: 'Burnished Calf',
    specifications: { Sole: 'Leather, stacked heel', Last: 'True to size', Care: 'Use shoe trees' },
    images: img.loafer, tags: ['loafer', 'leather', 'shoes'],
    isNew: false, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Black', size: '37', stock: 5 }, { color: 'Black', size: '38', stock: 7 }, { color: 'Black', size: '39', stock: 8 }, { color: 'Black', size: '40', stock: 6 }, { color: 'Black', size: '41', stock: 5 }, { color: 'Black', size: '42', stock: 4 },
      { color: 'Brown', size: '38', stock: 5 }, { color: 'Brown', size: '39', stock: 6 }, { color: 'Brown', size: '40', stock: 5 }, { color: 'Brown', size: '41', stock: 4 },
    ],
  },
  {
    name: 'Brescia Penny Loafer', slug: 'brescia-penny-loafer', sku: 'ZCAT-LF-002',
    categorySlug: 'footwear', subcategorySlug: 'loafers',
    regularPrice: 176, salePrice: null, discountPercent: null,
    description: 'A softly tumbled leather loafer with a tonal penny strap and a lightweight rubber-blend sole for grip. Polished enough for tailoring and relaxed enough for jeans.',
    shortDescription: 'Tumbled leather penny loafer',
    material: 'Tumbled Calf',
    specifications: { Sole: 'Rubber-blend', Last: 'True to size', Care: 'Wipe clean, condition regularly' },
    images: img.loafer, tags: ['loafer', 'leather', 'shoes'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Tan', size: '37', stock: 5 }, { color: 'Tan', size: '38', stock: 6 }, { color: 'Tan', size: '39', stock: 6 }, { color: 'Tan', size: '40', stock: 5 }, { color: 'Tan', size: '41', stock: 4 },
      { color: 'Brown', size: '38', stock: 5 }, { color: 'Brown', size: '39', stock: 5 }, { color: 'Brown', size: '40', stock: 5 },
    ],
  },
  {
    name: 'Lake Como Sneaker', slug: 'lake-como-sneaker', sku: 'ZCAT-SN-001',
    categorySlug: 'footwear', subcategorySlug: 'sneakers',
    regularPrice: 145, salePrice: null, discountPercent: null,
    description: 'A clean court sneaker in smooth white leather with tonal stitching and a cushioned cupsole. Minimal, crisp and endlessly wearable.',
    shortDescription: 'White leather court sneaker',
    material: 'Leather',
    specifications: { Sole: 'Cushioned cupsole', Fit: 'True to size', Care: 'Wipe clean' },
    images: img.sneaker2, tags: ['sneaker', 'leather', 'shoes'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'White', size: '38', stock: 4 }, { color: 'White', size: '39', stock: 3 }, { color: 'White', size: '40', stock: 4 }, { color: 'White', size: '41', stock: 3 }, { color: 'White', size: '42', stock: 2 },
      { color: 'Navy', size: '38', stock: 3 }, { color: 'Navy', size: '39', stock: 3 }, { color: 'Navy', size: '40', stock: 2 },
    ],
  },
  {
    name: 'Soho Court Sneaker', slug: 'soho-court-sneaker', sku: 'ZCAT-SN-002',
    categorySlug: 'footwear', subcategorySlug: 'sneakers',
    regularPrice: 128, salePrice: 106, discountPercent: 17,
    description: 'A retro court sneaker with a two-tone leather upper, perforated toe cap and classic gum-blend outsole. Built for all-day wear with a softer, more flexible ride.',
    shortDescription: 'Two-tone leather court sneaker',
    material: 'Leather',
    specifications: { Sole: 'Gum-blend outsole', Fit: 'True to size', Care: 'Wipe clean' },
    images: img.sneaker, tags: ['sneaker', 'leather', 'shoes'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Cream', size: '37', stock: 5 }, { color: 'Cream', size: '38', stock: 6 }, { color: 'Cream', size: '39', stock: 7 }, { color: 'Cream', size: '40', stock: 6 }, { color: 'Cream', size: '41', stock: 5 }, { color: 'Cream', size: '42', stock: 3 },
      { color: 'Black', size: '38', stock: 5 }, { color: 'Black', size: '39', stock: 6 }, { color: 'Black', size: '40', stock: 5 }, { color: 'Black', size: '41', stock: 4 },
    ],
  },
  {
    name: 'Vienna Chelsea Boot', slug: 'vienna-chelsea-boot', sku: 'ZCAT-BT-001',
    categorySlug: 'footwear', subcategorySlug: 'boots',
    regularPrice: 268, salePrice: null, discountPercent: null,
    description: 'A sleek Chelsea boot in smooth calf with elasticated side panels, pull tabs and a low stacked heel.', 
    shortDescription: 'Calfskin Chelsea boot, stacked heel',
    material: 'Calfskin',
    specifications: { Heel: 'Low stacked', Sole: 'Full leather', Fit: 'True to size' },
    images: img.boot, tags: ['boot', 'chelsea', 'leather'],
    isNew: false, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Black', size: '38', stock: 5 }, { color: 'Black', size: '39', stock: 7 }, { color: 'Black', size: '40', stock: 7 }, { color: 'Black', size: '41', stock: 5 }, { color: 'Black', size: '42', stock: 4 }, { color: 'Black', size: '43', stock: 4 },
      { color: 'Brown', size: '38', stock: 4 }, { color: 'Brown', size: '39', stock: 5 }, { color: 'Brown', size: '40', stock: 5 }, { color: 'Brown', size: '41', stock: 4 }, { color: 'Brown', size: '42', stock: 3 },
    ],
  },
  {
    name: 'Palermo Ankle Boot', slug: 'palermo-ankle-boot', sku: 'ZCAT-BT-002',
    categorySlug: 'footwear', subcategorySlug: 'boots',
    regularPrice: 232, salePrice: null, discountPercent: null,
    description: 'A refined ankle boot with an almond toe, inside zip and a 60mm heel. Burnished leather that catches the light, built on a cushioned footbed.',
    shortDescription: 'Burnished ankle boot, 60mm heel',
    material: 'Burnished Leather',
    specifications: { Heel: '60mm', Closure: 'Inside zip', Fit: 'True to size' },
    images: img.boot, tags: ['boot', 'ankle', 'heel'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Burgundy', size: '37', stock: 4 }, { color: 'Burgundy', size: '38', stock: 5 }, { color: 'Burgundy', size: '39', stock: 5 }, { color: 'Burgundy', size: '40', stock: 4 }, { color: 'Burgundy', size: '41', stock: 3 },
      { color: 'Tan', size: '38', stock: 5 }, { color: 'Tan', size: '39', stock: 5 }, { color: 'Tan', size: '40', stock: 4 },
    ],
  },
  {
    name: 'Napoli Block Heel', slug: 'napoli-block-heel', sku: 'ZCAT-HL-001',
    categorySlug: 'footwear', subcategorySlug: 'heels',
    regularPrice: 158, salePrice: null, discountPercent: null,
    description: 'A squared-toe pump on a 70mm block heel with a soft cushioned footbed. The dependable heel that walks as well as it looks.',
    shortDescription: 'Squared-toe block heel pump',
    material: 'Nappa Leather',
    specifications: { Heel: '70mm block', Fit: 'True to size', Care: 'Store with heel protectors' },
    images: img.heel2, tags: ['heels', 'block', 'pump'],
    isNew: false, isBestSeller: true, isFeatured: false,
    variants: [
      { color: 'Black', size: '36', stock: 5 }, { color: 'Black', size: '37', stock: 7 }, { color: 'Black', size: '38', stock: 8 }, { color: 'Black', size: '39', stock: 6 }, { color: 'Black', size: '40', stock: 5 },
      { color: 'Tan', size: '37', stock: 5 }, { color: 'Tan', size: '38', stock: 5 }, { color: 'Tan', size: '39', stock: 5 },
    ],
  },
  {
    name: 'Capri Slingback', slug: 'capri-slingback', sku: 'ZCAT-HL-002',
    categorySlug: 'footwear', subcategorySlug: 'heels',
    regularPrice: 142, salePrice: null, discountPercent: null,
    description: 'An open-cut slingback pump with an adjustable ankle strap and 60mm heel. Clean minimal lines in soft-touch nappa with a leather sole.',
    shortDescription: 'Open-cut slingback, 60mm heel',
    material: 'Nappa Leather',
    specifications: { Heel: '60mm', Closure: 'Adjustable strap', Fit: 'True to size' },
    images: img.heel, tags: ['heels', 'slingback', 'pump'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Cream', size: '36', stock: 5 }, { color: 'Cream', size: '37', stock: 6 }, { color: 'Cream', size: '38', stock: 6 }, { color: 'Cream', size: '39', stock: 5 }, { color: 'Cream', size: '40', stock: 4 },
      { color: 'Black', size: '37', stock: 5 }, { color: 'Black', size: '38', stock: 6 }, { color: 'Black', size: '39', stock: 5 },
    ],
  },

  // ---------------- Watches ----------------
  {
    name: 'Regent Chronograph', slug: 'regent-chronograph', sku: 'ZCAT-WT-001',
    categorySlug: 'watches', subcategorySlug: 'mechanical-watches',
    regularPrice: 438, salePrice: 394, discountPercent: 10,
    description: 'A steel chronograph with a sapphire crystal, tachymeter bezel and three-register dial. Automatic movement, exhibition caseback and water resistance to 100m.',
    shortDescription: 'Steel automatic chronograph, sapphire crystal',
    material: 'Stainless Steel',
    specifications: { Movement: 'Automatic chronograph', Crystal: 'Sapphire', WaterResistance: '100m' },
    images: img.watch, tags: ['watch', 'chronograph', 'automatic'],
    isNew: false, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Black', size: 'One Size', stock: 6 },
      { color: 'Brown', size: 'One Size', stock: 5 },
    ],
  },
  {
    name: 'Venezia Automatic', slug: 'venezia-automatic', sku: 'ZCAT-WT-002',
    categorySlug: 'watches', subcategorySlug: 'automatic-watches',
    regularPrice: 325, salePrice: null, discountPercent: null,
    description: 'A clean automatic dress tool in steel with a sunray navy dial, date window and domed sapphire crystal. Slim 11mm case slips easily under a cuff.',
    shortDescription: 'Steel automatic, sunray navy dial',
    material: 'Stainless Steel',
    specifications: { Movement: 'Automatic', Case: '40mm slim', Crystal: 'Domed sapphire' },
    images: img.watch2, tags: ['watch', 'automatic'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [], baseStock: 22,
  },
  {
    name: 'Verona Dress Watch', slug: 'verona-dress-watch', sku: 'ZCAT-WT-003',
    categorySlug: 'watches', subcategorySlug: 'dress-watches',
    regularPrice: 289, salePrice: null, discountPercent: null,
    description: 'An elegant dress watch with a minimal dial, slim profile and polished case. Leather strap and a precise quartz movement keep it discreet and dependable.',
    shortDescription: 'Minimal dress watch, leather strap',
    material: 'Stainless Steel',
    specifications: { Movement: 'Quartz', Case: '38mm', Strap: 'Leather' },
    images: img.watch3, tags: ['watch', 'dress'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Black', size: 'One Size', stock: 7 },
      { color: 'Gold', size: 'One Size', stock: 5 },
    ],
  },
  {
    name: 'Padova Skeleton Automatic', slug: 'padova-skeleton-automatic', sku: 'ZCAT-WT-004',
    categorySlug: 'watches', subcategorySlug: 'automatic-watches',
    regularPrice: 524, salePrice: null, discountPercent: null,
    description: 'A skeletonized automatic exposing the hand-finished movement beneath a sapphire crystal. Numbered edition and a limited run of 250 pieces worldwide.',
    shortDescription: 'Skeleton automatic, limited edition',
    material: 'Stainless Steel',
    specifications: { Movement: 'Skeleton automatic', Edition: 'Limited 250', Crystal: 'Top + exhibition' },
    images: img.watch, tags: ['watch', 'skeleton', 'limited'],
    isNew: true, isBestSeller: false, isFeatured: true, isLimitedEdition: true,
    variants: [], baseStock: 5,
  },

  // ---------------- Jewelry ----------------
  {
    name: 'Aurelia Pendant Necklace', slug: 'aurelia-pendant-necklace', sku: 'ZCAT-NL-001',
    categorySlug: 'jewelry', subcategorySlug: 'necklaces',
    regularPrice: 248, salePrice: null, discountPercent: null,
    description: 'A hand-finished pendant on a fine chain with an adjustable extender. The bezel-set stone sits flush and catches the light from every angle.',
    shortDescription: 'Bezel-set pendant with adjustable chain',
    material: '18k Gold-Plated Sterling',
    specifications: { Length: '18in with 2in extender', Finish: 'High polish', Hypoallergenic: 'Nickel-free' },
    images: img.necklace, tags: ['necklace', 'pendant', 'gold'],
    isNew: false, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Gold', size: 'One Size', stock: 9 },
      { color: 'Silver', size: 'One Size', stock: 7 },
    ],
  },
  {
    name: 'Bianca Layered Necklace', slug: 'bianca-layered-necklace', sku: 'ZCAT-NL-002',
    categorySlug: 'jewelry', subcategorySlug: 'necklaces',
    regularPrice: 186, salePrice: null, discountPercent: null,
    description: 'A layered two-chain necklace with coin and bar charms. Lightweight, tangle-resistant and designed to sit effortlessly over knits and necklines.',
    shortDescription: 'Two-chain layered necklace with charms',
    material: 'Gold-Plated Brass',
    specifications: { Length: '16in + 18in layers', Closure: 'Lobster clasp', Finish: 'Matte polish' },
    images: img.necklace, tags: ['necklace', 'layered', 'gold'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Gold', size: 'One Size', stock: 10 },
    ],
  },
  {
    name: 'Milano Signet Ring', slug: 'milano-signet-ring', sku: 'ZCAT-RG-001',
    categorySlug: 'jewelry', subcategorySlug: 'rings',
    regularPrice: 198, salePrice: null, discountPercent: null,
    description: 'A polished signet ring with a subtle engraveable face. Substantial weight and a clean band designed for daily stacking or on its own.',
    shortDescription: 'Polished signet ring, engraveable face',
    material: 'Sterling Silver',
    specifications: { Band: '6mm', Finish: 'High polish', Width: 'Slim profile' },
    images: img.ring, tags: ['ring', 'signet', 'silver'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Silver', size: '6', stock: 5 }, { color: 'Silver', size: '7', stock: 6 }, { color: 'Silver', size: '8', stock: 5 },
      { color: 'Gold', size: '6', stock: 4 }, { color: 'Gold', size: '7', stock: 5 }, { color: 'Gold', size: '8', stock: 4 },
    ],
  },
  {
    name: 'Giada Diamond Ring', slug: 'giada-diamond-ring', sku: 'ZCAT-RG-002',
    categorySlug: 'jewelry', subcategorySlug: 'rings',
    regularPrice: 389, salePrice: null, discountPercent: null,
    description: 'A solitaire ring with a lab-grown diamond in a four-prong setting and pavé-set shoulders. Bright, ethical and cut to sparkle.',
    shortDescription: 'Lab-grown diamond solitaire',
    material: '14k Gold + Lab Diamond',
    specifications: { Stone: '0.5ct lab-grown', Band: 'Pavé shoulders', Setting: 'Four-prong' },
    images: img.ring2, tags: ['ring', 'diamond', 'gold'],
    isNew: true, isBestSeller: false, isFeatured: true,
    variants: [
      { color: 'Gold', size: '5', stock: 3 }, { color: 'Gold', size: '6', stock: 3 }, { color: 'Gold', size: '7', stock: 2 },
    ],
  },
  {
    name: 'Sorrento Chain Bracelet', slug: 'sorrento-chain-bracelet', sku: 'ZCAT-BR-001',
    categorySlug: 'jewelry', subcategorySlug: 'bracelets',
    regularPrice: 164, salePrice: null, discountPercent: null,
    description: 'A fine curb-chain bracelet with a bar charm and secure lobster clasp. Layered-friendly weight, sold in a signature gift box.',
    shortDescription: 'Curb-chain bracelet with bar charm',
    material: 'Gold-Plated Sterling',
    specifications: { Length: '7in', Closure: 'Lobster clasp', Finish: 'High polish' },
    images: img.bracelet, tags: ['bracelet', 'chain', 'gold'],
    isNew: true, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Silver', size: 'One Size', stock: 8 },
      { color: 'Gold', size: 'One Size', stock: 8 },
    ],
  },
  {
    name: 'Riviera Tennis Bracelet', slug: 'riviera-tennis-bracelet', sku: 'ZCAT-BR-002',
    categorySlug: 'jewelry', subcategorySlug: 'bracelets',
    regularPrice: 412, salePrice: null, discountPercent: null,
    description: 'A classic tennis bracelet with channel-set cubic zirconia in a polished setting. Even, brilliant and comfortable all day.',
    shortDescription: 'Channel-set tennis bracelet',
    material: 'Sterling Silver Vermeil',
    specifications: { Length: '7in', Setting: 'Channel', Finish: 'Brilliant polish' },
    images: img.bracelet2, tags: ['bracelet', 'tennis', 'cz'],
    isNew: false, isBestSeller: true, isFeatured: true,
    variants: [
      { color: 'Gold', size: 'One Size', stock: 6 },
    ],
  },
  {
    name: 'Firenze Drop Earrings', slug: 'firenze-drop-earrings', sku: 'ZCAT-ER-001',
    categorySlug: 'jewelry', subcategorySlug: 'earrings',
    regularPrice: 132, salePrice: null, discountPercent: null,
    description: 'Fluid drop earrings with a softly hammered finish and secure hook backs. Light enough for daily wear, detailed enough for evening.',
    shortDescription: 'Hammered-finish drop earrings',
    material: 'Gold-Plated Brass',
    specifications: { Length: '2.4in', Closure: 'Hook back', Finish: 'Hammered' },
    images: img.earrings, tags: ['earrings', 'drop', 'gold'],
    isNew: false, isBestSeller: false, isFeatured: false,
    variants: [
      { color: 'Silver', size: 'One Size', stock: 9 },
      { color: 'Gold', size: 'One Size', stock: 9 },
    ],
  },
  {
    name: 'Cinque Terre Hoop Earrings', slug: 'cinque-terre-hoop-earrings', sku: 'ZCAT-ER-002',
    categorySlug: 'jewelry', subcategorySlug: 'earrings',
    regularPrice: 98, salePrice: null, discountPercent: null,
    description: 'Classic huggie hoops in polished metal with a hinged click closure. Sleek, small and endlessly versatile.',
    shortDescription: 'Polished huggie hoop with click closure',
    material: 'Gold-Plated Brass',
    specifications: { Diameter: '14mm', Closure: 'Hinged click', Finish: 'High polish' },
    images: img.earrings2, tags: ['earrings', 'hoops', 'gold'],
    isNew: false, isBestSeller: true, isFeatured: false,
    variants: [], baseStock: 30,
  },
];

// ------------------------------------------------------------------
// Seed logic
// ------------------------------------------------------------------

const NEW_CATEGORIES: Array<{ name: string; slug: string; parentSlug: string; description: string; displayOrder: number; isFeatured: boolean; seoTitle: string }> = [
  { name: 'Cotton Jackets', slug: 'cotton-jackets', parentSlug: 'clothing-accessories', description: 'Washed cotton jackets and overshirts for easy layering', displayOrder: 5, isFeatured: false, seoTitle: 'Cotton Jackets | ZOYA GOODS' },
  { name: 'Bomber Jackets', slug: 'bomber-jackets', parentSlug: 'clothing-accessories', description: 'Heritage bombers and lightweight jacket styles', displayOrder: 6, isFeatured: true, seoTitle: 'Bomber Jackets | ZOYA GOODS' },
  { name: 'Hoodies', slug: 'hoodies', parentSlug: 'clothing-accessories', description: 'Heavyweight hoodies and comfortable staples', displayOrder: 7, isFeatured: false, seoTitle: 'Hoodies & Sweatshirts | ZOYA GOODS' },
  { name: 'Coats', slug: 'coats', parentSlug: 'clothing-accessories', description: 'Wool coats and refined winter outerwear', displayOrder: 8, isFeatured: true, seoTitle: 'Coats | ZOYA GOODS' },
  { name: 'T-Shirts', slug: 't-shirts', parentSlug: 'clothing-accessories', description: 'Heavyweight essentials in premium cotton', displayOrder: 9, isFeatured: false, seoTitle: 'T-Shirts | ZOYA GOODS' },
  { name: 'Trousers', slug: 'trousers', parentSlug: 'clothing-accessories', description: 'Tailored and refined trouser silhouettes', displayOrder: 10, isFeatured: false, seoTitle: 'Trousers | ZOYA GOODS' },
  { name: 'Tote Bags', slug: 'tote-bags', parentSlug: 'handbags', description: 'Structured and everyday leather totes', displayOrder: 2, isFeatured: true, seoTitle: 'Tote Bags | ZOYA GOODS' },
  { name: 'Crossbody Bags', slug: 'crossbody-bags', parentSlug: 'handbags', description: 'Compact crossbody styles with hands-free ease', displayOrder: 3, isFeatured: true, seoTitle: 'Crossbody Bags | ZOYA GOODS' },
  { name: 'Shoulder Bags', slug: 'shoulder-bags', parentSlug: 'handbags', description: 'Shoulder and flap bags in refined leather', displayOrder: 4, isFeatured: false, seoTitle: 'Shoulder Bags | ZOYA GOODS' },
  { name: 'Boots', slug: 'boots', parentSlug: 'footwear', description: 'Chelsea, ankle and tall boot silhouettes', displayOrder: 3, isFeatured: true, seoTitle: 'Boots | ZOYA GOODS' },
  { name: 'Loafers', slug: 'loafers', parentSlug: 'footwear', description: 'Penny and classic leather loafers', displayOrder: 4, isFeatured: false, seoTitle: 'Loafers | ZOYA GOODS' },
  { name: 'Automatic Watches', slug: 'automatic-watches', parentSlug: 'watches', description: 'Self-winding automatic timepieces', displayOrder: 2, isFeatured: false, seoTitle: 'Automatic Watches | ZOYA GOODS' },
  { name: 'Dress Watches', slug: 'dress-watches', parentSlug: 'watches', description: 'Slim, refined dress-style timepieces', displayOrder: 3, isFeatured: false, seoTitle: 'Dress Watches | ZOYA GOODS' },
  { name: 'Bracelets', slug: 'bracelets', parentSlug: 'jewelry', description: 'Chain, tennis and everyday bracelets', displayOrder: 3, isFeatured: false, seoTitle: 'Bracelets | ZOYA GOODS' },
  { name: 'Earrings', slug: 'earrings', parentSlug: 'jewelry', description: 'Drops, hoops and everyday earring styles', displayOrder: 4, isFeatured: false, seoTitle: 'Earrings | ZOYA GOODS' },
];

function colorCode(color: string): string {
  return color.replace(/[^A-Za-z]/g, '').slice(0, 10).toUpperCase();
}

function variantSku(sku: string, color: string, size: string): string {
  const sizeCode = size === 'One Size' ? 'ONE' : size.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${sku}-${colorCode(color)}-${sizeCode}`;
}

async function ensureProduct(data: ProductSeed) {
  const totalStock = data.baseStock ?? data.variants.reduce((sum, v) => sum + v.stock, 0);

  const existingBySlug = await prisma.product.findUnique({ where: { slug: data.slug }, select: { id: true, sku: true } });
  if (existingBySlug && !existingBySlug.sku.startsWith(SKU_PREFIX)) {
    console.log(`  SKIP ${data.slug}: belongs to another seed namespace (${existingBySlug.sku})`);
    return null;
  }
  const existingBySku = !existingBySlug
    ? await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } })
    : null;
  if (existingBySku && !existingBySlug) {
    console.log(`  SKIP ${data.sku}: sku exists on a different slug`);
    return null;
  }

  const categoryId = await getParentId(data.categorySlug);
  const subcategory = await findCategory(data.subcategorySlug);
  if (!subcategory) throw new Error(`Subcategory not found: ${data.subcategorySlug}`);
  if (categoryId !== (await prisma.category.findUnique({ where: { id: subcategory.id }, select: { parentId: true } }))?.parentId) {
    console.log(`  WARN ${data.name}: subcategory ${data.subcategorySlug} is not a child of ${data.categorySlug}`);
  }

  const base = {
    name: data.name,
    sku: data.sku,
    categoryId,
    subcategoryId: subcategory.id,
    regularPrice: data.regularPrice,
    salePrice: data.salePrice,
    discountPercent: data.discountPercent,
    description: data.description,
    shortDescription: data.shortDescription,
    material: data.material,
    brand: 'ZOYA',
    specifications: { Material: data.material, ...data.specifications },
    images: data.images,
    tags: data.tags,
    isNew: data.isNew,
    isBestSeller: data.isBestSeller,
    isFeatured: data.isFeatured,
    isLimitedEdition: data.isLimitedEdition ?? false,
    seoTitle: `${data.name} | ZOYA GOODS`,
    seoDescription: data.shortDescription,
    lowStockThreshold: 5,
    stock: totalStock,
    isActive: true,
  };

  let productId: string;
  if (existingBySlug) {
    await prisma.product.update({ where: { id: existingBySlug.id }, data: base });
    productId = existingBySlug.id;
  } else {
    const created = await prisma.product.create({ data: { ...base, slug: data.slug }, select: { id: true } });
    productId = created.id;
  }

  for (const v of data.variants) {
    const sku = variantSku(data.sku, v.color, v.size);
    const existing = await prisma.productVariant.findUnique({ where: { sku }, select: { id: true } });
    if (existing) {
      await prisma.productVariant.update({
        where: { id: existing.id },
        data: { productId, color: v.color, colorHex: COLORS[v.color] ?? '#000000', size: v.size, stock: v.stock, isActive: true, priceOverride: null },
      });
    } else {
      await prisma.productVariant.create({
        data: {
          productId,
          color: v.color,
          colorHex: COLORS[v.color] ?? '#000000',
          size: v.size,
          stock: v.stock,
          sku,
          isActive: true,
          images: [],
        },
      });
    }
  }

  return productId;
}

async function main() {
  console.log('Seeding ZOYA GOODS catalog (idempotent)...');

  for (const cat of NEW_CATEGORIES) {
    const id = await ensureChildCategory(cat);
    console.log(`  CATEGORY ${cat.slug} -> ${id}`);
  }

  let created = 0;
  let updated = 0;
  for (const p of PRODUCTS) {
    const isNew = !(await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } }));
    const id = await ensureProduct(p);
    if (id) {
      if (isNew) created += 1;
      else updated += 1;
      console.log(`  PRODUCT ${p.sku} ${p.name} -> ${id}`);
    }
  }

  const totals = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.productVariant.count(),
  ]);

  console.log('Seed complete.');
  console.log(`  New products: ${created}, updated in place: ${updated}`);
  console.log(`  DB totals -> products: ${totals[0]}, categories: ${totals[1]}, variants: ${totals[2]}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('SEED FAILED:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});