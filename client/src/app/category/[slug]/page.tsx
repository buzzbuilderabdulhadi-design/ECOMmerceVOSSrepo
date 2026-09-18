'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { getProductsBySubcategory, categoryDescriptions } from '@/data/products';

function toProductCard(p: { id: string; name: string; slug: string; image: string; images?: string[]; regularPrice: number; salePrice?: number; discountPercent?: number; rating: number; reviewCount: number; isNew?: boolean; isBestSeller?: boolean; colors?: { name: string; hex: string }[]; stock?: number; brand: string; category: string; subcategory?: string }): ProductCardData {
  return {
    id: p.id, name: p.name, slug: p.slug, image: p.image, images: p.images,
    regularPrice: p.regularPrice, salePrice: p.salePrice, discountPercent: p.discountPercent,
    rating: p.rating, reviewCount: p.reviewCount, isNew: p.isNew, isBestSeller: p.isBestSeller,
    colors: p.colors, stock: p.stock, brand: p.brand, category: p.subcategory ?? p.category,
  };
}

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [wishlistedIds] = useState<Set<string>>(new Set());

  const category = categoryDescriptions[slug];
  const rawProducts = slug ? getProductsBySubcategory(slug) : [];
  const products = rawProducts.map(toProductCard);

  if (!slug || !category) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24">
          <EmptyState
            icon={undefined}
            title="Category not found"
            description="The category you're looking for doesn't exist or has been removed."
            actionLabel="Browse All Products"
            actionHref="/shop"
          />
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* Category Hero */}
        <section className="relative overflow-hidden bg-walnut">
          <div className="absolute inset-0">
            <Image src={category.image} alt={category.name} fill className="object-cover opacity-40" sizes="100vw" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-transparent" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:py-28">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/shop' },
                { label: category.name },
              ]}
              onDark
            />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white sm:text-lg">
              {category.description}
            </p>
            <p className="mt-4 text-sm text-white">
              {products.length} Products
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {isLoading ? (
            <LoadingState variant="product-grid" count={6} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={undefined}
              title="No products in this category"
              description="New products are coming soon. Check back later."
              actionLabel="Browse All Products"
              actionHref="/shop"
            />
          ) : (
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard
                    product={product}
                    isWishlisted={wishlistedIds.has(product.id)}
                  />
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}
