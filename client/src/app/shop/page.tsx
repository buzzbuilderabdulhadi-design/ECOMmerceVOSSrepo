'use client';

import React, { useState } from 'react';
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
// Shop Page — Browse all products
// ============================================================

const allProducts: ProductCardData[] = [
  { id: '1', name: 'Classic Brown Leather Jacket', slug: 'classic-brown-leather-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 450, salePrice: 395, discountPercent: 12, rating: 4.8, reviewCount: 124, isNew: true, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Brown', hex: '#8B5E3C' }, { name: 'Black', hex: '#000000' }] },
  { id: '2', name: 'Black Suede Bomber Jacket', slug: 'black-suede-bomber-jacket', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', regularPrice: 520, salePrice: 455, discountPercent: 12, rating: 4.9, reviewCount: 89, isBestSeller: true, brand: 'VOSS', category: 'Bomber Jackets', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#112C47' }] },
  { id: '3', name: 'Tan Suede Varsity Jacket', slug: 'tan-suede-varsity-jacket', image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80', regularPrice: 380, salePrice: 325, discountPercent: 14, rating: 4.7, reviewCount: 56, isNew: true, brand: 'VOSS', category: 'Suede Jackets', colors: [{ name: 'Tan', hex: '#D2B48C' }, { name: 'Brown', hex: '#8B5E3C' }] },
  { id: '4', name: 'Blue Denim Jacket', slug: 'blue-denim-jacket', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80', regularPrice: 250, rating: 4.6, reviewCount: 203, isBestSeller: true, brand: 'VOSS', category: 'Denim Jackets', colors: [{ name: 'Blue', hex: '#1E3A5F' }, { name: 'Black', hex: '#000000' }] },
  { id: '5', name: 'Premium Wool Peacoat', slug: 'premium-wool-peacoat', image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=600&q=80', regularPrice: 680, salePrice: 595, discountPercent: 12, rating: 4.9, reviewCount: 67, isNew: true, brand: 'VOSS', category: 'Winter Jackets', colors: [{ name: 'Navy', hex: '#112C47' }, { name: 'Charcoal', hex: '#36454F' }] },
  { id: '6', name: 'Waxed Cotton Field Jacket', slug: 'waxed-cotton-field-jacket', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80', regularPrice: 420, rating: 4.7, reviewCount: 98, brand: 'VOSS', category: 'Cotton Jackets', colors: [{ name: 'Olive', hex: '#556B2F' }, { name: 'Tan', hex: '#D2B48C' }] },
  { id: '7', name: 'Motorcycle Racer Jacket', slug: 'motorcycle-racer-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 590, salePrice: 499, discountPercent: 15, rating: 4.8, reviewCount: 145, isBestSeller: true, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Brown', hex: '#8B5E3C' }] },
  { id: '8', name: 'Lightweight Puffer Vest', slug: 'lightweight-puffer-vest', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', regularPrice: 195, rating: 4.5, reviewCount: 234, isNew: true, brand: 'VOSS', category: 'Vests', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#112C47' }] },
  { id: '9', name: 'Cropped Leather Biker Jacket', slug: 'cropped-leather-biker', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 350, salePrice: 299, rating: 4.6, reviewCount: 78, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Black', hex: '#000000' }] },
  { id: '10', name: 'Hooded Parka with Fur Trim', slug: 'hooded-parka-fur-trim', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80', regularPrice: 750, rating: 4.9, reviewCount: 45, isBestSeller: true, brand: 'VOSS', category: 'Parkas', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Olive', hex: '#556B2F' }] },
  { id: '11', name: 'Classic Trench Coat', slug: 'classic-trench-coat', image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=600&q=80', regularPrice: 580, rating: 4.7, reviewCount: 112, brand: 'VOSS', category: 'Winter Jackets', colors: [{ name: 'Beige', hex: '#F5F5DC' }, { name: 'Black', hex: '#000000' }] },
  { id: '12', name: 'Quilted Bomber Jacket', slug: 'quilted-bomber-jacket', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', regularPrice: 480, salePrice: 399, discountPercent: 17, rating: 4.8, reviewCount: 156, isNew: true, brand: 'VOSS', category: 'Bomber Jackets', colors: [{ name: 'Navy', hex: '#112C47' }, { name: 'Green', hex: '#2E8B57' }] },
];

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Best Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

export default function ShopPage() {
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [wishlistedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9;

  const sortedProducts = [...allProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc': return (a.salePrice ?? a.regularPrice) - (b.salePrice ?? b.regularPrice);
      case 'price-desc': return (b.salePrice ?? b.regularPrice) - (a.salePrice ?? a.regularPrice);
      case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
      case 'popular': return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      default: return 0;
    }
  });

  const totalPages = Math.ceil(sortedProducts.length / productsPerPage);
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage
  );

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

        {/* Page Header */}
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb
              items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]}
            />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              All Products
            </h1>
            <p className="mt-2 text-base text-gray-500">
              Browse our complete collection of premium jackets and luxury outerwear.
            </p>
          </div>
        </section>

        {/* Controls Bar */}
        <div className="border-b border-gray-200">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Showing {paginatedProducts.length} of {sortedProducts.length} products
              </p>
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-sm text-gray-500">Sort by:</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setCurrentPage(1); }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {isLoading ? (
            <LoadingState variant="product-grid" count={productsPerPage} />
          ) : paginatedProducts.length === 0 ? (
            <EmptyState
              icon={undefined}
              title="No products found"
              description="Try adjusting your filters or browse our categories."
              actionLabel="View All Products"
              actionHref="/shop"
            />
          ) : (
            <>
              <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedProducts.map((product) => (
                  <StaggerItem key={product.id}>
                    <ProductCard
                      product={product}
                      isWishlisted={wishlistedIds.has(product.id)}
                    />
                  </StaggerItem>
                ))}
              </StaggerChildren>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i + 1 ? 'dark' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}

