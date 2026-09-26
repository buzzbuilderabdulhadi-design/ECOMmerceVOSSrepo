const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  try {
    const c = await p.coupon.findMany({ select: { code: true, type: true, value: true, maxDiscount: true, isActive: true, expiresAt: true, minOrderAmount: true, usedCount: true, maxUses: true } });
    console.log('COUPONS', JSON.stringify(c, null, 1));
    const prods = await p.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, _count: { select: { variants: true } } },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
    console.log('PRODUCTS', JSON.stringify(prods, null, 1));
  } catch (e) {
    console.error('ERR', e);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();