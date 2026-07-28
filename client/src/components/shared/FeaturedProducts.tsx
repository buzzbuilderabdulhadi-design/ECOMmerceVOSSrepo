'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { Button } from '@/components/ui/Button';

// ============================================================
// FeaturedProducts — Grid of product cards with section header
// ============================================================

interface FeaturedProductsProps {
  products: ProductCardData[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  columns?: 2 | 3 | 4;
  className?: string;
  onWishlistToggle?: (productId: string) => void;
  wishlistedIds?: Set<string>;
}

export function FeaturedProducts({
  products,
  title,
  description,
  viewAllHref,
  columns = 4,
  className,
  onWishlistToggle,
  wishlistedIds,
}: FeaturedProductsProps) {
  const gridCols = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  };

  if (!products || products.length === 0) return null;

  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {(title || description) && (
          <ScrollReveal>
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <div>
                {title && (
                  <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-2 max-w-2xl text-base text-gray-500">
                    {description}
                  </p>
                )}
              </div>
              {viewAllHref && (
                <Link href={viewAllHref}>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              )}
            </div>
          </ScrollReveal>
        )}

        <StaggerChildren className={cn('mt-10 grid grid-cols-1 gap-6', gridCols[columns])}>
          {products.slice(0, 8).map((product) => (
            <StaggerItem key={product.id}>
              <ProductCard
                product={product}
                variant="default"
                onWishlistToggle={onWishlistToggle}
                isWishlisted={wishlistedIds?.has(product.id) ?? false}
              />
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

