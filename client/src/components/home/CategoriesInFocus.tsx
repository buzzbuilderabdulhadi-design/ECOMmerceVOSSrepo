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

interface CategoryTile {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

interface CategoriesInFocusProps {
  categories?: CategoryTile[];
  className?: string;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85';

type CategoryWithCount = Category & { _count?: { products: number } };

export function CategoriesInFocus({ categories, className }: CategoriesInFocusProps) {
  const [tiles, setTiles] = useState<CategoryTile[]>(categories ?? []);

  useEffect(() => {
    if (categories) return;
    let active = true;
    fetchFeaturedCategories()
      .then((cats) => {
        if (!active) return;
        setTiles(
          (cats as CategoryWithCount[]).slice(0, 8).map((c) => ({
            name: c.name,
            slug: c.slug,
            image: c.image || FALLBACK_IMAGE,
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
      id="categories-in-focus"
      className={cn('bg-warm-light scroll-mt-32 overflow-hidden pb-20 text-onyx md:pb-28', className)}
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <ScrollReveal>
          <div className="flex flex-col gap-6 border-t border-cocoa/20 pt-14 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="eyebrow flex items-center gap-3 text-navy-soft">
                <span className="inline-block h-px w-10 bg-navy-soft/70" />
                Categories in focus
              </p>
              <TextReveal
                as="h2"
                text="Find your silhouette"
                className="display-1 mt-5 font-display font-light text-onyx"
              />
            </div>
            <Link
              href="/shop"
              className="link-underline group inline-flex items-center gap-3 self-start text-[11px] font-medium uppercase tracking-[0.25em] text-cocoa transition-colors hover:text-onyx lg:self-auto"
            >
              Browse everything
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>

      <div className="mt-12 md:mt-16">
        <div className="rail gap-3 px-5 pb-4 sm:gap-4 sm:px-8 lg:gap-6 lg:px-12">
          {tiles.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="w-[62vw] flex-shrink-0 sm:w-[38vw] lg:w-[280px]"
            >
              <Link
                href={`/category/${category.slug}`}
                className="group relative flex min-h-[340px] flex-col justify-end overflow-hidden sm:min-h-[400px]"
              >
                <span className="absolute inset-0 overflow-hidden">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="img-cover zoom-child"
                    sizes="(max-width: 640px) 62vw, (max-width: 1024px) 38vw, 280px"
                  />
                </span>
                <span
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-onyx/90 via-onyx/30 to-transparent transition-opacity duration-700 group-hover:via-onyx/45"
                />

                <span className="relative z-10 block p-5">
                  <span className="block font-display text-2xl font-light leading-snug text-porcelain">
                    {category.name}
                  </span>
                  <span className="mt-2 flex items-center gap-2.5">
                    {typeof category.productCount === 'number' && category.productCount > 0 && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-bone/70">
                        {category.productCount} pieces
                      </span>
                    )}
                    <span className="h-px w-6 bg-bone/40 transition-all duration-500 group-hover:w-12" />
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
