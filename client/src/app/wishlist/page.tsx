'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { EmptyState } from '@/components/shared/EmptyState';

// ============================================================
// Wishlist Page — User's saved/favorite items
// ============================================================

const wishlistItems: ProductCardData[] = [
  { id: '1', name: 'Classic Brown Leather Jacket', slug: 'classic-brown-leather-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', regularPrice: 450, salePrice: 395, discountPercent: 12, rating: 4.8, reviewCount: 124, isNew: true, brand: 'VOSS', category: 'Leather Jackets', colors: [{ name: 'Brown', hex: '#8B5E3C' }, { name: 'Black', hex: '#000000' }] },
  { id: '5', name: 'Premium Wool Peacoat', slug: 'premium-wool-peacoat', image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=600&q=80', regularPrice: 680, salePrice: 595, discountPercent: 12, rating: 4.9, reviewCount: 67, isNew: true, brand: 'VOSS', category: 'Winter Jackets', colors: [{ name: 'Navy', hex: '#112C47' }, { name: 'Charcoal', hex: '#36454F' }] },
  { id: '10', name: 'Hooded Parka with Fur Trim', slug: 'hooded-parka-fur-trim', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80', regularPrice: 750, rating: 4.9, reviewCount: 45, isBestSeller: true, brand: 'VOSS', category: 'Parkas', colors: [{ name: 'Black', hex: '#000000' }, { name: 'Olive', hex: '#556B2F' }] },
];

export default function WishlistPage() {
  const [items] = useState<ProductCardData[]>(wishlistItems);
  const [wishlistedIds] = useState<Set<string>>(new Set(items.map((i) => i.id)));

  const handleWishlistToggle = (productId: string) => {
    // Will be implemented with API integration
    console.log('Toggle wishlist:', productId);
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              My Wishlist
            </h1>
            <p className="mt-2 text-base text-gray-500">
              {items.length} {items.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {items.length === 0 ? (
            <EmptyState
              icon={undefined}
              title="Your wishlist is empty"
              description="Save items you love to your wishlist and come back to them anytime."
              actionLabel="Explore Products"
              actionHref="/shop"
            />
          ) : (
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard
                    product={product}
                    isWishlisted={wishlistedIds.has(product.id)}
                    onWishlistToggle={handleWishlistToggle}
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
