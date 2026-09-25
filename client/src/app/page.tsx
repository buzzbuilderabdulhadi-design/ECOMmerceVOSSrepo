import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/shared/HeroSection';
import { FeaturedCategories } from '@/components/shared/FeaturedCategories';
import { FeaturedProducts } from '@/components/shared/FeaturedProducts';
import { WhyChooseZoya } from '@/components/shared/WhyChooseZoya';
import { NewsletterSection } from '@/components/shared/NewsletterSection';
import { pageMetadata } from '@/lib/seo';
import { variantsToColors } from '@/lib/utils';
import type { Metadata } from 'next';
import type { ApiResponse, Product } from '@/types';
import type { ProductCardData } from '@/components/product/ProductCard';

export const metadata: Metadata = pageMetadata({ path: '/' });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

function mapApiProduct(p: Product): ProductCardData {
  const firstImage = p.images?.[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i) => (typeof i === 'string' ? i : i.url)) || [],
    regularPrice: p.regularPrice,
    salePrice: p.salePrice ?? undefined,
    discountPercent: p.discountPercent,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    brand: p.brand,
    category: p.category?.name,
    colors: variantsToColors(p.variants),
    defaultVariantId: p.variants?.find((v) => v.isActive !== false)?.id,
  };
}

async function getFeaturedProducts(): Promise<ProductCardData[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${API_BASE_URL}/products/featured`, {
        cache: 'force-cache',
        next: { revalidate: 60 },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Featured products fetch failed: ${res.status}`);
      const json: ApiResponse<Product[]> = await res.json();
      const items: Product[] = Array.isArray(json?.data) ? json.data : [];
      return items.map(mapApiProduct);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts();

  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      <HeroSection
        title="Luxury Redefined"
        subtitle="Premium Leather & Suede Collection"
        description="Discover our curated collection of handcrafted jackets, designed for those who appreciate the finer things in life."
        primaryCta={{ label: 'Shop Now', href: '/shop' }}
        secondaryCta={{ label: 'Explore Collection', href: '/shop?sort=newest' }}
        imageSrc="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85"
        imageAlt="ZOYA GOODS Luxury Collection"
        showcaseImages={[
          'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=85',
          'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=85',
        ]}
        height="large"
      />

      <FeaturedCategories />

      <FeaturedProducts
        products={products}
        title="The Featured Edit"
        description="Handpicked selections from our latest collection, crafted with exceptional attention to detail."
        viewAllHref="/shop"
      />

      <WhyChooseZoya />

      <NewsletterSection variant="dark" />

      <Footer />
    </main>
  );
}