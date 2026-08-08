'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { Parallax } from '@/components/animations/Parallax';

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
  { name: 'Leather Jackets', slug: 'leather-jackets', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85', productCount: 24 },
  { name: 'Bomber Jackets', slug: 'bomber-jackets', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=900&q=85', productCount: 18 },
  { name: 'Suede Jackets', slug: 'suede-jackets', image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=900&q=85', productCount: 12 },
  { name: 'Denim Jackets', slug: 'denim-jackets', image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=900&q=85', productCount: 15 },
  { name: 'Puffer Jackets', slug: 'puffer-jackets', image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=900&q=85', productCount: 20 },
  { name: 'Winter Parkas', slug: 'winter-parkas', image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=900&q=85', productCount: 10 },
];

const spanClasses = [
  'col-span-2 lg:col-span-3 lg:row-span-2',
  'lg:col-span-2',
  'lg:col-span-1',
  'lg:col-span-2',
  'lg:col-span-1',
  'col-span-2 lg:col-span-3',
];

export function FeaturedCategories({
  categories = defaultCategories,
  title = 'Shop by Category',
  description = 'Explore our curated collections of premium jackets and luxury outerwear.',
  className,
}: FeaturedCategoriesProps) {
  return (
    <section className={cn('section-divider-top relative overflow-hidden py-20 md:py-28', className)}>
      {/* Editorial watermark */}
      <Parallax amount={120}>
        <span className="display-outline pointer-events-none absolute -right-8 top-8 select-none font-display text-[11rem] leading-none opacity-60">
          Collections
        </span>
      </Parallax>

      <div className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em] text-sage-dark">
              <span className="inline-block h-px w-10 bg-sage" />
              Collections
            </p>
            <TextReveal
              as="h2"
              text={title}
              className="mt-4 font-display text-4xl font-light text-navy sm:text-5xl lg:text-6xl"
            />
          </div>
          <ScrollReveal delay={0.15} className="lg:justify-self-end">
            <p className="max-w-md text-sm leading-relaxed text-slate sm:text-base lg:text-right">
              {description}
            </p>
          </ScrollReveal>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-6 lg:auto-rows-[220px] xl:auto-rows-[260px]">
          {categories.map((category, index) => (
            <motion.div
              key={category.slug}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: (index % 3) * 0.1, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(spanClasses[index % spanClasses.length], index === 0 && 'h-[440px] lg:h-auto')}
            >
              <Link
                href={`/category/${category.slug}`}
                className="group relative block h-full w-full overflow-hidden"
              >
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover transition-transform duration-1000 ease-out group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-navy/25 to-navy/15" />
                <div className="absolute inset-0 bg-navy/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                {/* Sage hairline grows on hover */}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-sage-light transition-all duration-700 group-hover:w-full" />

                {/* Index */}
                <span className="absolute right-4 top-3 font-display text-4xl font-light text-ivory transition-colors duration-500 group-hover:text-sage-light">
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Label */}
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                  <p className="font-display text-2xl font-light leading-tight text-ivory sm:text-[1.6rem]">
                    {category.name}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ivory">
                      {category.productCount ?? ''} {category.productCount ? 'Pieces' : ''}
                    </span>
                    <span className="h-px w-8 bg-sage-light/70 transition-all duration-500 group-hover:w-14" />
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-cream/30 text-ivory transition-all duration-300 group-hover:border-sage-light group-hover:bg-sage-light group-hover:text-navy">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
