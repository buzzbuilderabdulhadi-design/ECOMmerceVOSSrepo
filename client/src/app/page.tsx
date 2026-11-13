import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/shared/HeroSection';
import { FeaturedCategories } from '@/components/shared/FeaturedCategories';
import { FeaturedProducts } from '@/components/shared/FeaturedProducts';
import { WhyChooseZoya } from '@/components/shared/WhyChooseZoya';
import { NewsletterSection } from '@/components/shared/NewsletterSection';
import { BrandIntro } from '@/components/home/BrandIntro';
import { CategoriesInFocus } from '@/components/home/CategoriesInFocus';
import { LookbookEditorial } from '@/components/home/LookbookEditorial';
import { BrandStory } from '@/components/home/BrandStory';
import { pageMetadata } from '@/lib/seo';
import { serverGet } from '@/lib/serverApi';
import { toCategoryTiles, toProductCardData, type CategoryTile } from '@/lib/catalog';
import type { Metadata } from 'next';
import type { ApiResponse, Category, Product } from '@/types';
import type { ProductCardData } from '@/components/product/ProductCard';

export const metadata: Metadata = pageMetadata({ path: '/' });

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

async function getProductList(path: string, revalidate: number, limit?: number): Promise<ProductCardData[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const query = limit ? `?limit=${limit}` : '';
      const res = await fetch(`${API_BASE_URL}${path}${query}`, {
        cache: 'force-cache',
        next: { revalidate },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Homepage product fetch failed (${path}): ${res.status}`);
      const json: ApiResponse<Product[]> = await res.json();
      const items: Product[] = Array.isArray(json?.data) ? json.data : [];
      return items.map(toProductCardData);
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return [];
  }
}

async function getCategoryTiles(): Promise<CategoryTile[]> {
  const categories = await serverGet<Category[]>('/categories/featured', 120);
  return categories ? toCategoryTiles(categories) : [];
}

export default async function HomePage() {
  const [featured, newArrivals, bestSellers, categoryTiles] = await Promise.all([
    getProductList('/products/featured', 60, 8),
    getProductList('/products/new-arrivals', 120, 4),
    getProductList('/products/best-sellers', 300, 4),
    getCategoryTiles(),
  ]);

  // The signature edit should never duplicate the new-arrivals rail.
  const seen = new Set(newArrivals.map((p) => p.id));
  const edit = [...featured, ...bestSellers]
    .filter((p) => !seen.has(p.id))
    .filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i)
    .slice(0, 8);

  return (
    <main className="flex min-h-screen flex-col bg-onyx">
      <Navbar />

      {/* 01 — Cinematic hero · onyx */}
      <HeroSection
        title="Luxury Redefined"
        subtitle="Premium Leather & Suede Collection"
        description="Discover our curated collection of handcrafted jackets, designed for those who appreciate the finer things in life."
        primaryCta={{ label: 'Shop Now', href: '/shop' }}
        secondaryCta={{ label: 'Explore Collection', href: '/shop?sort=newest' }}
        imageSrc="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85"
        imageAlt="ZOYA GOODS Luxury Collection"
        height="full"
      />

      {/* 02 — Brand introduction · warm light */}
      <BrandIntro />

      {/* 03 — Shop by category · warm beige */}
      <FeaturedCategories categories={categoryTiles} />

      {/* 04 — Featured collection (horizontal rail) · onyx */}
      <FeaturedProducts
        products={featured}
        title="The Featured Edit"
        eyebrow="Curated for you"
        description="Handpicked selections from our latest collection, crafted with exceptional attention to detail."
        viewAllHref="/shop"
        viewAllLabel="View all"
        layout="rail"
        limit={8}
        tone="dark"
      />

      {/* 05 — Categories in focus · warm light */}
      <CategoriesInFocus categories={categoryTiles} />

      {/* 06 — Lookbook editorial (optional editorial.mp4) · onyx */}
      <LookbookEditorial />

      {/* 07 — New arrivals · warm beige */}
      <FeaturedProducts
        products={newArrivals}
        title="New Arrivals"
        eyebrow="Just landed"
        description="The newest pieces to enter the house — small batches, released as soon as they are ready."
        viewAllHref="/shop?sort=newest"
        layout="grid"
        limit={4}
        tone="light"
      />

      {/* 08 — Brand story · espresso */}
      <BrandStory />

      {/* 09 — Why ZOYA GOODS · warm beige */}
      <WhyChooseZoya />

      {/* 10 — The signature edit (best sellers + featured, no repeats) · onyx */}
      <FeaturedProducts
        products={edit}
        title="The Signature Edit"
        eyebrow="Most wanted"
        description="The pieces our customers return to, ranked by what actually leaves the studio."
        viewAllHref="/shop?sort=best"
        layout="grid"
        limit={8}
        tone="dark"
      />

      {/* 11 — Newsletter · warm beige */}
      <NewsletterSection />

      {/* 12 — Footer · espresso / onyx */}
      <Footer />
    </main>
  );
}