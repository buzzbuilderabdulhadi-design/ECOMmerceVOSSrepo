const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../server/.env') });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: process.env.MONGODB_URI });

(async () => {
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    variants: await prisma.productVariant.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
    reviews: await prisma.review.count(),
    questions: await prisma.productQuestion.count(),
    notifications: await prisma.notification.count(),
  };
  console.log('COUNTS:', JSON.stringify(counts, null, 2));

  const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true, parentId: true } });
  console.log('CATEGORIES:', JSON.stringify(cats.map(c => ({ slug: c.slug, name: c.name, parent: c.parentId ? 'yes' : null }) ), null, 2));

  const prods = await prisma.product.findMany({ select: { slug: true, name: true, sku: true, stock: true, variants: { select: { stock: true, sku: true, color: true, size: true } } } });
  console.log('PRODUCTS(' + prods.length + '):');
  prods.forEach(p => console.log(`  ${p.slug} | stock=${p.stock} | variants=${p.variants.length}`));
  await prisma.$disconnect();
})().catch(e => { console.error('FAIL', e); process.exit(1); });