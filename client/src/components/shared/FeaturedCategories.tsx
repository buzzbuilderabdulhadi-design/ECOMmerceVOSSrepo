'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';

// ============================================================
// FeaturedCategories — Premium category showcase grid
// ============================================================

interface CategoryItem {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

interface FeaturedCategoriesProps {
  categories?: CategoryItem[];
  title?: string;
  description?: string;
  className?: string;
}

const defaultCategories: CategoryItem[] = [
  { name: 'Leather Jackets', slug: 'leather-jackets', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80', productCount: 24 },
  { name: 'Bomber Jackets', slug: 'bomber-jackets', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80', productCount: 18 },
  { name: 'Suede Jackets', slug: 'suede-jackets', image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80', productCount: 12 },
  { name: 'Denim Jackets', slug: 'denim-jackets', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80', productCount: 15 },
  { name: 'Puffer Jackets', slug: 'puffer-jackets', image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=600&q=80', productCount: 20 },
  { name: 'Winter Parkas', slug: 'winter-parkas', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80', productCount: 10 },
];

export function FeaturedCategories({
  categories = defaultCategories,
  title = 'Shop by Category',
  description = 'Explore our curated collections of premium jackets and luxury outerwear.',
  className,
}: FeaturedCategoriesProps) {
  return (
    <section className={cn('py-16 md:py-24', className)}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-500">
              {description}
            </p>
          </div>
        </ScrollReveal>

        <StaggerChildren className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-6">
          {categories.map((category) => (
            <StaggerItem key={category.slug}>
              <Link
                href={`/category/${category.slug}`}
                className="group relative block overflow-hidden rounded-xl bg-gray-100"
              >
                <div className="aspect-[3/4]">
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-sm font-semibold text-white sm:text-base">
                    {category.name}
                  </h3>
                  {category.productCount !== undefined && (
                    <p className="mt-1 text-xs text-white/70">
                      {category.productCount} Products
                    </p>
                  )}
                </div>
              </Link>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

