'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { EmptyState } from '@/components/shared/EmptyState';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import type { Category, Product } from '@/types';
import toast from 'react-hot-toast';

interface CategoryViewProps {
  category: Category;
  initialProducts: ProductCardData[];
}

export function CategoryView({ category, initialProducts }: CategoryViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const products = initialProducts;
  const { wishlistedProductIds, toggleItem } = useWishlist();
  const { isAuthenticated } = useAuth();

  const handleWishlistToggle = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const ok = await toggleItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          images: product.images ?? [product.image],
          stock: product.stock ?? 0,
        } as Product,
        product.defaultVariantId
      );
      if (!ok) toast.error('Could not update your wishlist.');
    },
    [isAuthenticated, products, toggleItem, router, pathname]
  );

  const isWishlistedFor = (id: string) => wishlistedProductIds.has(id);

  return (
    <PageTransition>
      <main className="min-h-screen bg-porcelain">
        <Navbar />

        {/* Category Hero */}
        <section className="relative overflow-hidden bg-walnut">
          {category.image && (
            <div className="absolute inset-0">
              <Image src={category.image} alt={category.name || ''} fill className="object-cover opacity-40" sizes="100vw" priority />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-transparent" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 py-20 sm:px-8 lg:px-12 md:py-28">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/shop' },
                { label: category.name || 'Collection' },
              ]}
              onDark
            />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {category.name || 'Collection'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white sm:text-lg">
              {category.description || 'Browse this collection.'}
            </p>
            <p className="mt-4 text-sm text-white">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </p>
          </div>
        </section>

        {/* Products Grid */}
        <div className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12">
          {products.length === 0 ? (
            <EmptyState
              icon={undefined}
              title="No products in this category"
              description="New products are coming soon. Check back later."
              actionLabel="Browse All Products"
              actionHref="/shop"
            />
          ) : (
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <StaggerItem key={product.id}>
                  <ProductCard
                    product={product}
                    index={index}
                    priority={index === 0}
                    onWishlistToggle={handleWishlistToggle}
                    isWishlisted={isWishlistedFor(product.id)}
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