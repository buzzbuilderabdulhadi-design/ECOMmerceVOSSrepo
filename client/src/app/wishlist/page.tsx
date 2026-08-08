'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { EmptyState } from '@/components/shared/EmptyState';
import { TextReveal } from '@/components/animations/TextReveal';
import { useWishlist } from '@/context/WishlistContext';

function toProductCardData(item: any): ProductCardData {
  const p = item.product;
  const firstImage = p.images?.[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i: any) => typeof i === 'string' ? i : i.url) || [],
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    discountPercent: p.discountPercent,
    stock: p.stock,
    brand: p.brand,
    category: p.category?.name,
    colors: p.variants?.map((v: any) => ({ name: v.color, hex: v.colorHex })).filter((v: any) => v.hex),
  };
}

export default function WishlistPage() {
  const { items, isLoading, removeItem, toggleItem, isInWishlist } = useWishlist();

  const handleWishlistToggle = (productId: string) => {
    const wlItem = items.find((i) => i.productId === productId);
    if (wlItem) removeItem(wlItem.id);
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="relative overflow-hidden pb-4 pt-24 md:pt-36">
          <span className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[12rem]">
            Saved
          </span>
          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]} />
            <div className="mt-6">
              <TextReveal as="h1" text="My Wishlist" className="font-display text-5xl font-light text-navy sm:text-6xl" />
            </div>
            <p className="mt-3 text-sm uppercase tracking-[0.25em] text-sage-dark">
              {items.length} {items.length === 1 ? 'piece' : 'pieces'} saved
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 lg:px-12">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[1,2,3,4].map((i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-sage-light/20" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              type="wishlist"
              title="Your wishlist is empty"
              description="Save items you love to your wishlist and come back to them anytime."
              actionLabel="Explore Products"
              actionHref="/shop"
            />
          ) : (
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((item) => (
                <StaggerItem key={item.id}>
                  <ProductCard
                    product={toProductCardData(item)}
                    isWishlisted={true}
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
