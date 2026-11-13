'use client';

import React, { useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

interface FeaturedProductsProps {
  products: ProductCardData[];
  title?: string;
  eyebrow?: string;
  description?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  layout?: 'rail' | 'grid';
  limit?: number;
  /** Surface the section sits on. Drives heading, link and card styling. */
  tone?: 'dark' | 'light';
  className?: string;
  onWishlistToggle?: (productId: string) => void;
  wishlistedIds?: Set<string>;
  /** Number of leading cards to load eagerly. Defaults to 0 so below-the-fold
      section images never steal preload bandwidth from the hero LCP image. */
  priorityCount?: number;
}

export function FeaturedProducts({
  products,
  title = 'The Collection',
  eyebrow = 'Curated for you',
  description,
  viewAllHref,
  viewAllLabel = 'View all',
  layout = 'rail',
  limit = 8,
  tone = 'dark',
  className,
  onWishlistToggle,
  wishlistedIds,
  priorityCount = 0,
}: FeaturedProductsProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { wishlistedProductIds, toggleItem } = useWishlist();
  const { isAuthenticated } = useAuth();

  // When no external handler is wired (e.g. the homepage sections), the rail
  // manages its own wishlist hearts so every browse surface has an entry point.
  const handleWishlistToggle = useCallback(
    async (productId: string) => {
      if (onWishlistToggle) {
        onWishlistToggle(productId);
        return;
      }
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
    [products, isAuthenticated, onWishlistToggle, router, pathname, toggleItem]
  );

  const isWishlistedFor = (id: string) =>
    onWishlistToggle ? wishlistedIds?.has(id) ?? false : wishlistedProductIds.has(id);

  if (!products || products.length === 0) return null;

  const scrollBy = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * railRef.current.clientWidth * 0.8, behavior: 'smooth' });
  };

  const visible = products.slice(0, limit);
  const dark = tone === 'dark';

  const header = (
    <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-2xl">
        <p className={cn('eyebrow flex items-center gap-3', dark ? 'text-beige' : 'text-navy-mid')}>
          <span className={cn('inline-block h-px w-10', dark ? 'bg-beige/60' : 'bg-navy-soft/70')} />
          {eyebrow}
        </p>
        <TextReveal
          as="h2"
          text={title}
          className={cn('display-1 mt-5 font-display font-light', dark ? 'text-porcelain' : 'text-onyx')}
        />
        {description && (
          <p
            className={cn(
              'mt-5 max-w-xl text-sm leading-relaxed sm:text-base',
              dark ? 'text-bone/70' : 'text-cocoa'
            )}
          >
            {description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {layout === 'rail' && (
          <div className="flex items-center gap-2.5">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scrollBy(dir)}
                className={cn(
                  'flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-300 active:scale-90',
                  dark
                    ? 'border-bone/20 text-bone hover:border-beige hover:bg-beige hover:text-onyx'
                    : 'border-cocoa/20 text-cocoa hover:border-onyx hover:bg-onyx hover:text-bone'
                )}
                aria-label={dir === -1 ? 'Scroll left' : 'Scroll right'}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d={dir === -1 ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}
                  />
                </svg>
              </button>
            ))}
          </div>
        )}

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className={cn(
              'group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] transition-colors',
              dark ? 'text-bone hover:text-porcelain' : 'text-cocoa hover:text-onyx'
            )}
          >
            {viewAllLabel}
            <span
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500',
                dark
                  ? 'border-bone/20 group-hover:border-beige group-hover:bg-beige group-hover:text-onyx'
                  : 'border-cocoa/20 group-hover:border-onyx group-hover:bg-onyx group-hover:text-bone'
              )}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <section
      className={cn(
        'relative scroll-mt-32 overflow-hidden py-20 md:py-28',
        dark ? 'bg-cinematic-deep text-porcelain' : 'bg-warm-beige text-onyx',
        className
      )}
    >
      {dark && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-40 top-1/3 h-[26rem] w-[26rem] rounded-full bg-navy-mid/[0.16] blur-[130px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-32 bottom-0 h-[22rem] w-[22rem] rounded-full bg-porcelain/[0.04] blur-[130px]"
          />
        </>
      )}

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal>{header}</ScrollReveal>

        {layout === 'rail' ? (
          <div className="mt-12">
            <div
              ref={railRef}
              className={cn(
                'rail gap-4 pb-6 sm:gap-6 lg:gap-8',
                dark ? 'px-5 sm:px-8 lg:px-12' : 'px-5 sm:px-8 lg:px-12'
              )}
            >
              {visible.map((product, index) => (
                <div key={product.id} className="w-[78vw] flex-shrink-0 sm:w-[46vw] lg:w-[380px]">
                  <ProductCard
                    product={product}
                    variant="default"
                    tone={tone}
                    onWishlistToggle={handleWishlistToggle}
                    isWishlisted={isWishlistedFor(product.id)}
                    index={index}
                    priority={index < priorityCount}
                  />
                </div>
              ))}

              {viewAllHref && (
                <div className="flex w-[68vw] flex-shrink-0 items-center sm:w-[38vw] lg:w-[300px]">
                  <Link
                    href={viewAllHref}
                    className={cn(
                      'group flex h-full min-h-[320px] w-full flex-col items-center justify-center gap-6 border p-8 text-center transition-colors duration-500',
                      dark
                        ? 'border-bone/15 hover:border-bone/35'
                        : 'border-cocoa/20 hover:border-cocoa/45'
                    )}
                  >
                    <span
                      className={cn(
                        'font-display text-2xl font-light tracking-[0.18em]',
                        dark ? 'text-porcelain/85' : 'text-onyx/85'
                      )}
                    >
                      ZOYA
                    </span>
                    <span
                      className={cn(
                        'h-px w-12 transition-all duration-500 group-hover:w-20',
                        dark ? 'bg-bone/25' : 'bg-cocoa/30'
                      )}
                    />
                    <span
                      className={cn(
                        'text-[11px] uppercase leading-relaxed tracking-[0.25em]',
                        dark ? 'text-bone/60' : 'text-cocoa/75'
                      )}
                    >
                      Explore the full collection
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {visible.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
              >
                <ProductCard
                  product={product}
                  variant="default"
                  tone={tone}
                  onWishlistToggle={handleWishlistToggle}
                  isWishlisted={isWishlistedFor(product.id)}
                  index={index}
                  priority={index < priorityCount}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
