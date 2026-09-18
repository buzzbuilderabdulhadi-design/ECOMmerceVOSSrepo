'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { Magnetic } from '@/components/animations/Magnetic';

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
  title = 'Featured Products',
  description,
  viewAllHref,
  className,
  onWishlistToggle,
  wishlistedIds,
}: FeaturedProductsProps) {
  const railRef = useRef<HTMLDivElement>(null);

  if (!products || products.length === 0) return null;

  const scrollBy = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <section className={cn('relative overflow-hidden py-20 md:py-28', className)}>
      {/* Section eyebrow */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="flex items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-sage" />
                Curated for you
              </p>
              <TextReveal
                as="h2"
                text={title}
                className="mt-4 font-display text-4xl font-light text-navy sm:text-5xl lg:text-6xl"
              />
              {description && (
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
                  {description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-8">
              {viewAllHref && (
                <Magnetic strength={0.25}>
                  <Link
                    href={viewAllHref}
                    className="group hidden items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-navy transition-colors hover:text-walnut sm:flex"
                  >
                    View All
                    <span className="flex h-10 w-10 items-center justify-center rounded-full border border-navy/20 transition-all group-hover:border-sage-dark group-hover:bg-sage-dark group-hover:text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </Link>
                </Magnetic>
              )}
            </div>
          </div>
        </ScrollReveal>

        {/* Arrows */}
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 text-navy transition-all hover:border-sage-dark hover:bg-sage-dark hover:text-white active:scale-90"
            aria-label="Scroll left"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scrollBy(1)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 text-navy transition-all hover:border-sage-dark hover:bg-sage-dark hover:text-white active:scale-90"
            aria-label="Scroll right"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Horizontal rail */}
      <div className="mt-10">
        <div
          ref={railRef}
          className="rail gap-6 px-4 pb-8 sm:px-8 lg:gap-10 lg:px-12"
        >
          {products.slice(0, 8).map((product, index) => (
            <div
              key={product.id}
              className="w-[72vw] flex-shrink-0 sm:w-[46vw] lg:w-[380px]"
            >
              <ProductCard
                product={product}
                variant="default"
                onWishlistToggle={onWishlistToggle}
                isWishlisted={wishlistedIds?.has(product.id) ?? false}
                index={index}
              />
            </div>
          ))}

          {/* End card */}
          {viewAllHref && (
            <div className="flex w-[60vw] flex-shrink-0 items-center justify-center sm:w-[40vw] lg:w-[300px]">
              <Link
                href={viewAllHref}
                className="group flex flex-col items-center gap-6 text-center"
              >
                <span className="animate-spin-slow flex h-32 w-32 items-center justify-center rounded-full border border-dashed border-sage/50">
                  <span className="font-display text-2xl font-light text-navy transition-transform duration-500 group-hover:scale-110">
                    ZOYA GOODS
                  </span>
                </span>
                <span className="text-[11px] uppercase tracking-[0.3em] text-navy transition-colors group-hover:text-walnut">
                  Explore the full collection
                </span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
