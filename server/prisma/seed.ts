import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.productQuestion.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.address.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.media.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.seoEntry.deleteMany();
  await prisma.homepageContent.deleteMany();
  await prisma.user.deleteMany();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.error('❌ ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for seeding the admin account.');
    console.error('   Set them before running: npx prisma db seed');
    console.error('   Example: ADMIN_EMAIL=admin@voss.com ADMIN_PASSWORD=your_secure_password npx prisma db seed');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  const userHash = await bcrypt.hash('user123', 12);

  const admin = await prisma.user.create({
    data: { name: 'Admin VOSS', email: adminEmail.toLowerCase(), passwordHash, role: 'ADMIN', emailVerified: true },
  });

  const customer = await prisma.user.create({
    data: { name: 'Jane Doe', email: 'jane@example.com', passwordHash: userHash, role: 'CUSTOMER', phone: '+1-555-0100', emailVerified: true },
  });

  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Clothing & Accessories', slug: 'clothing-accessories', description: 'Luxury apparel and accessories', displayOrder: 1, isFeatured: true, seoTitle: 'Luxury Clothing & Accessories | VOSS' } }),
    prisma.category.create({ data: { name: 'Handbags', slug: 'handbags', description: 'Exquisite handbags and clutches', displayOrder: 2, isFeatured: true, seoTitle: 'Designer Handbags | VOSS' } }),
    prisma.category.create({ data: { name: 'Footwear', slug: 'footwear', description: 'Premium footwear collection', displayOrder: 3, isFeatured: true, seoTitle: 'Luxury Shoes & Footwear | VOSS' } }),
    prisma.category.create({ data: { name: 'Jewelry', slug: 'jewelry', description: 'Fine jewelry and accessories', displayOrder: 4, isFeatured: true, seoTitle: 'Fine Jewelry Collection | VOSS' } }),
    prisma.category.create({ data: { name: 'Watches', slug: 'watches', description: 'Luxury timepieces', displayOrder: 5, isFeatured: true, seoTitle: 'Luxury Watches | VOSS' } }),
    prisma.category.create({ data: { name: 'Beauty & Fragrance', slug: 'beauty-fragrance', description: 'Premium beauty and fragrance', displayOrder: 6, isFeatured: false, seoTitle: 'Beauty & Fragrance | VOSS' } }),
  ]);

  const [clothing, handbags, footwear, jewelry, watches, beauty] = categories;

  const subcategories = await Promise.all([
    prisma.category.create({ data: { name: 'Dresses', slug: 'dresses', parentId: clothing.id, displayOrder: 1, isFeatured: true, seoTitle: 'Designer Dresses | VOSS' } }),
    prisma.category.create({ data: { name: 'Suits & Blazers', slug: 'suits-blazers', parentId: clothing.id, displayOrder: 2, isFeatured: true, seoTitle: 'Suits & Blazers | VOSS' } }),
    prisma.category.create({ data: { name: 'Tops & Shirts', slug: 'tops-shirts', parentId: clothing.id, displayOrder: 3 } }),
    prisma.category.create({ data: { name: 'Bags', slug: 'bags', parentId: handbags.id, displayOrder: 1, isFeatured: true } }),
    prisma.category.create({ data: { name: 'Heels', slug: 'heels', parentId: footwear.id, displayOrder: 1, isFeatured: true } }),
    prisma.category.create({ data: { name: 'Sneakers', slug: 'sneakers', parentId: footwear.id, displayOrder: 2 } }),
    prisma.category.create({ data: { name: 'Necklaces', slug: 'necklaces', parentId: jewelry.id, displayOrder: 1, isFeatured: true } }),
    prisma.category.create({ data: { name: 'Rings', slug: 'rings', parentId: jewelry.id, displayOrder: 2 } }),
    prisma.category.create({ data: { name: 'Mechanical', slug: 'mechanical-watches', parentId: watches.id, displayOrder: 1, isFeatured: true } }),
    prisma.category.create({ data: { name: 'Perfume', slug: 'perfume', parentId: beauty.id, displayOrder: 1, isFeatured: true } }),
  ]);

  const productsData = [
    { name: 'Silk Evening Gown', slug: 'silk-evening-gown', sku: 'VSS-DRS-001', description: 'Exquisite silk evening gown with hand-beaded embroidery. Features a flattering A-line silhouette with a deep V-neckline and open back.', shortDescription: 'Hand-beaded silk evening gown with A-line silhouette', brand: 'Valentino', regularPrice: 3890, salePrice: 3100, discountPercent: 20, stock: 15, material: 'Silk', categoryId: clothing.id, subcategoryId: subcategories[0].id, isNew: true, isFeatured: true, isBestSeller: true, tags: ['evening', 'formal', 'silk'], images: ['https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800', 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800'] },
    { name: 'Tailored Wool Blazer', slug: 'tailored-wool-blazer', sku: 'VSS-BLZ-001', description: 'Italian wool blazer with notched lapels and silk lining. Double-breasted front with gold-tone buttons.', shortDescription: 'Italian wool blazer with silk lining', brand: 'Armani', regularPrice: 2450, stock: 20, material: 'Wool', categoryId: clothing.id, subcategoryId: subcategories[1].id, isNew: true, isFeatured: true, tags: ['blazer', 'formal', 'wool'], images: ['https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=800'] },
    { name: 'Cashmere Turtleneck', slug: 'cashmere-turtleneck', sku: 'VSS-TOP-001', description: 'Pure cashmere turtleneck sweater with ribbed cuffs and hem. Ultra-soft and luxurious.', shortDescription: 'Pure cashmere turtleneck sweater', brand: 'Loro Piana', regularPrice: 1890, salePrice: 1500, discountPercent: 21, stock: 30, material: 'Cashmere', categoryId: clothing.id, subcategoryId: subcategories[2].id, isBestSeller: true, tags: ['cashmere', 'winter', 'luxury'], images: ['https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800'] },
    { name: 'Leather Tote Bag', slug: 'leather-tote-bag', sku: 'VSS-HB-001', description: 'Grained calfskin leather tote with gold hardware. Spacious interior with zip pocket and detachable shoulder strap.', shortDescription: 'Calfskin leather tote with gold hardware', brand: 'Gucci', regularPrice: 3200, stock: 10, material: 'Leather', categoryId: handbags.id, subcategoryId: subcategories[3].id, isFeatured: true, isBestSeller: true, tags: ['tote', 'leather', 'everyday'], images: ['https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800', 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800'] },
    { name: 'Stiletto Heels', slug: 'stiletto-heels', sku: 'VSS-SH-001', description: 'Patent leather stiletto pumps with pointed toe. 105mm heel with leather sole.', shortDescription: 'Patent leather stiletto pumps, 105mm', brand: 'Christian Louboutin', regularPrice: 1495, stock: 25, material: 'Patent Leather', categoryId: footwear.id, subcategoryId: subcategories[4].id, isFeatured: true, isNew: true, tags: ['heels', 'stiletto', 'evening'], images: ['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'] },
    { name: 'Diamond Pendant Necklace', slug: 'diamond-pendant-necklace', sku: 'VSS-JWL-001', description: '18K white gold necklace with pear-shaped diamond pendant. Diamond weight: 2.5 carats.', shortDescription: '18K white gold with 2.5ct diamond pendant', brand: 'Cartier', regularPrice: 18500, stock: 3, material: '18K White Gold', categoryId: jewelry.id, subcategoryId: subcategories[6].id, isFeatured: true, isLimitedEdition: true, tags: ['diamond', 'necklace', 'limited'], images: ['https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800'] },
    { name: 'Automatic Chronograph Watch', slug: 'automatic-chronograph-watch', sku: 'VSS-WT-001', description: 'Stainless steel automatic chronograph with blue dial. Sapphire crystal, water-resistant to 100m.', shortDescription: 'Stainless steel automatic chronograph', brand: 'Rolex', regularPrice: 12500, stock: 5, material: 'Stainless Steel', categoryId: watches.id, subcategoryId: subcategories[8].id, isFeatured: true, isBestSeller: true, tags: ['watch', 'automatic', 'luxury'], images: ['https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800'] },
    { name: 'Eau de Parfum', slug: 'eau-de-parfum', sku: 'VSS-BTY-001', description: 'Floral-oriental eau de parfum with notes of jasmine, rose, and vanilla. Long-lasting fragrance.', shortDescription: 'Floral-oriental eau de parfum, 100ml', brand: 'Chanel', regularPrice: 395, stock: 50, material: 'Fragrance', categoryId: beauty.id, subcategoryId: subcategories[9].id, isBestSeller: true, tags: ['perfume', 'floral', 'luxury'], images: ['https://images.unsplash.com/photo-1541643600914-78b084683601?w=800'] },
    { name: 'Leather Crossbody Bag', slug: 'leather-crossbody-bag', sku: 'VSS-HB-002', description: 'Quilted lambskin leather crossbody bag with chain strap and turn-lock closure.', shortDescription: 'Quilted lambskin leather crossbody bag', brand: 'Chanel', regularPrice: 5600, stock: 8, material: 'Lambskin Leather', categoryId: handbags.id, subcategoryId: subcategories[3].id, isFeatured: true, isNew: true, tags: ['crossbody', 'chanel', 'quilted'], images: ['https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800'] },
    { name: 'Linen Blazer', slug: 'linen-blazer', sku: 'VSS-BLZ-002', description: 'Lightweight linen blazer perfect for summer. Unlined construction with patch pockets.', shortDescription: 'Lightweight linen unlined blazer', brand: 'Hermès', regularPrice: 2800, salePrice: 2200, discountPercent: 21, stock: 12, material: 'Linen', categoryId: clothing.id, subcategoryId: subcategories[1].id, isNew: true, tags: ['linen', 'summer', 'blazer'], images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800'] },
  ];

  const products = await Promise.all(
    productsData.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          specifications: { fit: 'Regular', care: 'Dry clean only', origin: 'Italy' },
          variants: {
            create: [
              ...(p.slug === 'silk-evening-gown' ? [{ color: 'Black', colorHex: '#000000', size: 'S', stock: 3, sku: `${p.sku}-BLK-S` }, { color: 'Black', colorHex: '#000000', size: 'M', stock: 5, sku: `${p.sku}-BLK-M` }, { color: 'Black', colorHex: '#000000', size: 'L', stock: 4, sku: `${p.sku}-BLK-L` }, { color: 'Burgundy', colorHex: '#800020', size: 'S', stock: 2, sku: `${p.sku}-BRG-S` }, { color: 'Burgundy', colorHex: '#800020', size: 'M', stock: 1, sku: `${p.sku}-BRG-M` }] : []),
              ...(p.slug === 'tailored-wool-blazer' ? [{ color: 'Navy', colorHex: '#000080', size: 'S', stock: 3, sku: `${p.sku}-NVY-S` }, { color: 'Navy', colorHex: '#000080', size: 'M', stock: 5, sku: `${p.sku}-NVY-M` }, { color: 'Navy', colorHex: '#000080', size: 'L', stock: 4, sku: `${p.sku}-NVY-L` }, { color: 'Charcoal', colorHex: '#36454F', size: 'M', stock: 3, sku: `${p.sku}-CHR-M` }, { color: 'Charcoal', colorHex: '#36454F', size: 'L', stock: 2, sku: `${p.sku}-CHR-L` }] : []),
              ...(p.slug === 'cashmere-turtleneck' ? [{ color: 'Camel', colorHex: '#C19A6B', size: 'S', stock: 5, sku: `${p.sku}-CML-S` }, { color: 'Camel', colorHex: '#C19A6B', size: 'M', stock: 8, sku: `${p.sku}-CML-M` }, { color: 'Camel', colorHex: '#C19A6B', size: 'L', stock: 6, sku: `${p.sku}-CML-L` }, { color: 'Black', colorHex: '#000000', size: 'M', stock: 7, sku: `${p.sku}-BLK-M` }, { color: 'Black', colorHex: '#000000', size: 'L', stock: 4, sku: `${p.sku}-BLK-L` }] : []),
              ...(p.slug === 'leather-tote-bag' ? [{ color: 'Black', colorHex: '#000000', size: 'One Size', stock: 5, sku: `${p.sku}-BLK` }, { color: 'Tan', colorHex: '#D2B48C', size: 'One Size', stock: 3, sku: `${p.sku}-TAN` }, { color: 'Burgundy', colorHex: '#800020', size: 'One Size', stock: 2, sku: `${p.sku}-BRG` }] : []),
              ...(p.slug === 'stiletto-heels' ? [{ color: 'Black', colorHex: '#000000', size: '36', stock: 4, sku: `${p.sku}-BLK-36` }, { color: 'Black', colorHex: '#000000', size: '37', stock: 6, sku: `${p.sku}-BLK-37` }, { color: 'Black', colorHex: '#000000', size: '38', stock: 8, sku: `${p.sku}-BLK-38` }, { color: 'Black', colorHex: '#000000', size: '39', stock: 5, sku: `${p.sku}-BLK-39` }, { color: 'Red', colorHex: '#FF0000', size: '37', stock: 2, sku: `${p.sku}-RED-37` }, { color: 'Red', colorHex: '#FF0000', size: '38', stock: 3, sku: `${p.sku}-RED-38` }] : []),
              ...(p.slug === 'leather-crossbody-bag' ? [{ color: 'Black', colorHex: '#000000', size: 'One Size', stock: 4, sku: `${p.sku}-BLK` }, { color: 'White', colorHex: '#FFFFFF', size: 'One Size', stock: 2, sku: `${p.sku}-WHT` }, { color: 'Beige', colorHex: '#F5F5DC', size: 'One Size', stock: 2, sku: `${p.sku}-BGE` }] : []),
              ...(p.slug === 'linen-blazer' ? [{ color: 'Beige', colorHex: '#F5F5DC', size: 'S', stock: 3, sku: `${p.sku}-BGE-S` }, { color: 'Beige', colorHex: '#F5F5DC', size: 'M', stock: 4, sku: `${p.sku}-BGE-M` }, { color: 'Beige', colorHex: '#F5F5DC', size: 'L', stock: 2, sku: `${p.sku}-BGE-L` }, { color: 'White', colorHex: '#FFFFFF', size: 'M', stock: 3, sku: `${p.sku}-WHT-M` }] : []),
            ],
          },
        },
      })
    )
  );

  await Promise.all([
    prisma.review.create({
      data: { productId: products[0].id, userId: customer.id, rating: 5, title: 'Stunning gown', text: 'Absolutely breathtaking. The quality and craftsmanship are unmatched. Fits perfectly.', isApproved: true, isVerifiedPurchase: true, helpfulCount: 12 },
    }),
    prisma.review.create({
      data: { productId: products[3].id, userId: customer.id, rating: 5, title: 'Best tote ever', text: 'Spacious, elegant, and the leather is divine. Worth every penny.', isApproved: true, isVerifiedPurchase: true, helpfulCount: 8 },
    }),
    prisma.review.create({
      data: { productId: products[4].id, userId: customer.id, rating: 4, title: 'Beautiful but tight', text: 'Gorgeous shoes but run small. Would recommend sizing up.', isApproved: true, isVerifiedPurchase: true, helpfulCount: 15 },
    }),
    prisma.review.create({
      data: { productId: products[6].id, userId: customer.id, rating: 5, title: 'Masterpiece', text: 'An incredible timepiece. The craftsmanship is exceptional.', isApproved: true, helpfulCount: 6 },
    }),
    prisma.review.create({
      data: { productId: products[7].id, userId: customer.id, rating: 5, title: 'Signature scent', text: 'Received so many compliments. The fragrance lasts all day.', isApproved: true, isVerifiedPurchase: true, helpfulCount: 20 },
    }),
  ]);

  await Promise.all([
    prisma.coupon.create({ data: { code: 'WELCOME20', type: 'PERCENTAGE', value: 20, minOrderAmount: 200, maxDiscount: 500, maxUses: 100, isActive: true, expiresAt: new Date('2026-12-31') } }),
    prisma.coupon.create({ data: { code: 'VOSS50', type: 'FIXED', value: 50, minOrderAmount: 500, maxUses: 50, isActive: true, expiresAt: new Date('2026-09-30') } }),
    prisma.coupon.create({ data: { code: 'FREESHIP', type: 'PERCENTAGE', value: 100, minOrderAmount: 150, maxDiscount: 15, maxUses: 200, isActive: true, expiresAt: new Date('2026-08-31') } }),
    prisma.coupon.create({ data: { code: 'VIP300', type: 'FIXED', value: 300, minOrderAmount: 1500, maxUses: 20, isActive: true, expiresAt: new Date('2026-12-31') } }),
  ]);

  await Promise.all([
    prisma.siteSetting.create({ data: { key: 'site_name', value: 'VOSS' } }),
    prisma.siteSetting.create({ data: { key: 'site_description', value: 'Luxury Fashion E-Commerce' } }),
    prisma.siteSetting.create({ data: { key: 'currency', value: 'USD' } }),
    prisma.siteSetting.create({ data: { key: 'free_shipping_threshold', value: 150 } }),
    prisma.siteSetting.create({ data: { key: 'default_shipping_cost', value: 15 } }),
    prisma.siteSetting.create({ data: { key: 'tax_rate', value: 0.08 } }),
    prisma.siteSetting.create({ data: { key: 'contact_email', value: 'hello@voss.com' } }),
    prisma.siteSetting.create({ data: { key: 'social_instagram', value: 'https://instagram.com/voss' } }),
    prisma.siteSetting.create({ data: { key: 'social_pinterest', value: 'https://pinterest.com/voss' } }),
  ]);

  await Promise.all([
    prisma.seoEntry.create({ data: { page: 'home', metaTitle: 'VOSS — Luxury Fashion & Accessories', metaDescription: 'Discover the finest luxury fashion at VOSS. Explore our curated collections of designer clothing, handbags, accessories, and more.', keywords: 'luxury fashion, designer clothing, voss' } }),
    prisma.seoEntry.create({ data: { page: 'products', metaTitle: 'Shop All Products | VOSS', metaDescription: 'Browse our complete collection of luxury products.', keywords: 'luxury products, shop, voss' } }),
    prisma.seoEntry.create({ data: { page: 'categories', metaTitle: 'Categories | VOSS' } }),
  ]);

  await Promise.all([
    prisma.homepageContent.create({ data: { key: 'hero_banner', value: { title: 'Define Your Elegance', subtitle: 'Discover the season\'s most coveted pieces, curated for those who demand the extraordinary.', buttonText: 'Shop Now', buttonLink: '/products', backgroundImage: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920' } } }),
    prisma.homepageContent.create({ data: { key: 'featured_collections', value: { title: 'Featured Collections' } } }),
    prisma.homepageContent.create({ data: { key: 'banner_middle', value: { title: 'New Season Arrivals', subtitle: 'Explore the latest from top designers', buttonText: 'Discover', buttonLink: '/products/new-arrivals', backgroundImage: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920' } } }),
  ]);

  await prisma.address.create({
    data: { userId: customer.id, label: 'Home', fullName: 'Jane Doe', phone: '+1-555-0100', line1: '123 Luxury Lane', city: 'New York', state: 'NY', zip: '10001', country: 'United States', isDefault: true },
  });

  console.log('✅ Seed completed successfully');
}

main()
  .catch((e) => { console.error('❌ Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
