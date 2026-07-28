'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';

// ============================================================
// Category Page — Browse products by category
// ============================================================

const categoryData: Record<string, { name: string; description: string; image: string }> = {
  'leather-jackets': {
    name: 'Leather Jackets',
    description: 'Discover our premium collection of handcrafted leather jackets. Each piece is meticulously crafted from the finest full-grain leather, offering timeless style and exceptional durability.',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&q=80',
  },
  'bomber-jackets': {
    name: 'Bomber Jackets',
    description: 'Classic bomber jackets reimagined for the modern wardrobe. From sleek MA-1 styles to luxurious suede iterations, find your perfect layer.',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200&q=80',
  },
  'suede-jackets': {
    name: 'Suede Jackets',
    description: 'Luxuriously soft suede jackets that elevate any outfit. Our suede collection features both timeless silhouettes and contemporary designs.',
    image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=1200&q=80',
  },
  'denim-jackets': {
    name: 'Denim Jackets',
    description: 'Premium denim jackets crafted from Japanese selvedge denim and heavyweight cotton. Each jacket is built to last a lifetime.',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1200&q=80',
  },
};

const categoryProducts: Record<string, ProductCardData[]> = {
  'leather-jackets': [
    { id: '1', name: 'Classic Brown Leather Jacket', slug: 'classic-brown-leather-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 450, salePrice: 395, discountPercent: 12, rating: 4.8, reviewCount: 124, isNew: true, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Brown', hex: '#8B5E3C' }, { name: 'Black', hex: '#000000' }] },
    { id: '7', name: 'Motorcycle Racer Jacket', slug: 'motorcycle-racer-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 590, salePrice: 499, discountPercent: 15, rating: 4.8, reviewCount: 145, isBestSeller: true, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Brown', hex: '#8B5E3C' }] },
    { id: '9', name: 'Cropped Leather Biker Jacket', slug: 'cropped-leather-biker', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 350, salePrice: 299, rating: 4.6, reviewCount: 78, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Black', hex: '#000000' }] },
  ],
  'bomber-jackets': [
    { id: '2', name: 'Black Suede Bomber Jacket', slug: 'black-suede-bomber-jacket', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', regularPrice: 520, salePrice: 455, discountPercent: 12, rating: 4.9, reviewCount: 89, isBestSeller: true, brand: 'VOSS', category: 'Bomber Jackets', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#112C47' }] },
    { id: '12', name: 'Quilted Bomber Jacket', slug: 'quilted-bomber-jacket', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', regularPrice: 480, salePrice: 399, discountPercent: 17, rating: 4.8, reviewCount: 156, isNew: true, brand: 'VOSS', category: 'Bomber Jackets', colors: [{ name: 'Navy', hex: '#112C47' }, { name: 'Green', hex: '#2E8B57' }] },
  ],
  'suede-jackets': [
    { id: '3', name: 'Tan Suede Varsity Jacket', slug: 'tan-suede-varsity-jacket', image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80', regularPrice: 380, salePrice: 325, discountPercent: 14, rating: 4.7, reviewCount: 56, isNew: true, brand: 'VOSS', category: 'Suede Jackets', colors: [{ name: 'Tan', hex: '#D2B48C' }, { name: 'Brown', hex: '#8B5E3C' }] },
  ],
  'denim-jackets': [
    { id: '4', name: 'Blue Denim Jacket', slug: 'blue-denim-jacket', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80', regularPrice: 250, rating: 4.6, reviewCount: 203, isBestSeller: true, brand: 'VOSS', category: 'Denim Jackets', colors: [{ name: 'Blue', hex: '#1E3A5F' }, { name: 'Black', hex: '#000000' }] },
  ],
};

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [wishlistedIds] = useState<Set<string>>(new Set());

  const category = categoryData[slug];
  const products = categoryProducts[slug] || [];

  if (!category) {
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
        <section className="relative overflow-hidden bg-gray-900">
          <div className="absolute inset-0">
            <Image src={category.image} alt={category.name} fill className="object-cover opacity-60" sizes="100vw" priority />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:py-28">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/shop' },
                { label: category.name },
              ]}
              className="text-white/70 [&_svg]:text-white/50"
            />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              {category.description}
            </p>
            <p className="mt-4 text-sm text-white/60">
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

