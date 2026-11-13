'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { fetchFeaturedCategories } from '@/services';
import type { Category } from '@/types';

interface CategoryItem {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

interface FeaturedCategoriesProps {
  categories?: CategoryItem[];
  title?: string;
  eyebrow?: string;
  description?: string;
  className?: string;
}

const CATEGORY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85';

type CategoryWithCount = Category & { _count?: { products: number } };

export function FeaturedCategories({
  categories,
  title = 'Shop by Category',
  eyebrow = 'The Collections',
  description = 'Every silhouette we make, arranged by the way you actually dress — from everyday cotton to the pieces that only come out after dark.',
  className,
}: FeaturedCategoriesProps) {
  const [tiles, setTiles] = useState<CategoryItem[]>(categories ?? []);

  useEffect(() => {
    if (categories) return;
    let active = true;
    fetchFeaturedCategories()
      .then((cats) => {
        if (!active) return;
        setTiles(
          (cats as CategoryWithCount[])
            .slice(0, 8)
            .map((c) => ({
              name: c.name,
              slug: c.slug,
              image: c.image || CATEGORY_FALLBACK_IMAGE,
              productCount: c._count?.products ?? 0,
            }))
        );
      })
      .catch(() => {
        if (active) setTiles([]);
      });
    return () => {
      active = false;
    };
  }, [categories]);

  if (tiles.length === 0) return null;

  return (
    <section
      id="shop-by-category"
      className={cn('bg-warm-beige scroll-mt-32 overflow-hidden py-20 text-onyx md:py-28 lg:py-32', className)}
    >
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="eyebrow flex items-center gap-3 text-navy-soft">
              <span className="inline-block h-px w-10 bg-navy-soft/70" />
              {eyebrow}
            </p>
            <TextReveal
              as="h2"
              text={title}
              className="display-1 mt-5 font-display font-light text-onyx"
            />
          </div>
          <ScrollReveal delay={0.15} className="lg:justify-self-end lg:text-right">
            <p className="max-w-md text-sm leading-relaxed text-cocoa sm:text-base">{description}</p>
            <Link
              href="/shop"
              className="link-underline mt-6 inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-onyx transition-colors hover:text-navy-mid lg:ml-auto"
            >
              View everything
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </ScrollReveal>
        </div>

        {/*
          Uniform campaign tiles. The tile height is a minimum, not a fixed
          value, and the caption sits in normal flow below the media, so a
          long category name grows the tile instead of being clipped.
        */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {tiles.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.65, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={`/category/${category.slug}`}
                className="group relative flex min-h-[280px] flex-col justify-end overflow-hidden sm:min-h-[340px] lg:min-h-[400px]"
              >
                {/* Media — clipped independently of the caption */}
                <span className="absolute inset-0 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="img-cover zoom-child"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </span>

                {/* Readability scrim, deepened subtly on hover */}
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-onyx/90 via-onyx/35 to-onyx/15 transition-opacity duration-700 group-hover:from-onyx group-hover:via-onyx/45"
                />

                <span
                  aria-hidden
                  className="absolute right-4 top-4 font-display text-2xl font-light text-bone/45 transition-colors duration-500 group-hover:text-bone/80"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Caption in normal flow — grows the tile, never clipped */}
                <span className="relative z-10 block p-5 sm:p-6">
                  <span className="block font-display text-xl font-light leading-snug text-porcelain sm:text-2xl">
                    {category.name}
                  </span>
                  <span className="mt-2 flex items-center gap-3">
                    {typeof category.productCount === 'number' && category.productCount > 0 && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-bone/70">
                        {category.productCount} {category.productCount === 1 ? 'Piece' : 'Pieces'}
                      </span>
                    )}
                    <span className="h-px w-8 bg-bone/40 transition-all duration-500 group-hover:w-14" />
                    <span className="translate-x-0 text-[10px] uppercase tracking-[0.2em] text-bone/80 transition-all duration-500 group-hover:translate-x-1 group-hover:text-bone">
                      Shop
                    </span>
                  </span>
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
