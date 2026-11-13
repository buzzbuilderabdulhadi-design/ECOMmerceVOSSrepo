'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { EditorialImageSlot } from '@/components/home/EditorialImageSlot';

interface BrandStoryProps {
  className?: string;
}

const pillars = [
  {
    title: 'Craftsmanship',
    description: 'Over three decades of expertise in creating exceptional leather and outerwear garments.',
  },
  {
    title: 'Materials',
    description: 'We source only the finest leathers, fabrics, and materials from around the world.',
  },
  {
    title: 'Detail',
    description: 'Every piece is finished with exceptional attention to detail, from first cut to final stitch.',
  },
];

export function BrandStory({ className }: BrandStoryProps) {
  return (
    <section
      id="brand-story"
      className={cn('bg-cinematic-soft scroll-mt-32 overflow-hidden py-20 text-porcelain md:py-28 lg:py-36', className)}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-8 left-4 hidden select-none font-display text-[9rem] font-light leading-none text-porcelain/[0.05] lg:block"
      >
        1991
      </span>

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <ScrollReveal>
              <p className="eyebrow flex items-center gap-3 text-beige">
                <span className="inline-block h-px w-10 bg-beige/60" />
                Since 1991
              </p>
              <TextReveal
                as="h2"
                text="Three decades of making things properly."
                className="display-1 mt-5 font-display font-light text-porcelain"
              />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-bone/70 sm:text-base">
                ZOYA GOODS is a house built on restraint — a small wardrobe of leather, cotton and
                outerwear designed to stay in rotation for a decade, not a season.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-porcelain transition-colors hover:text-beige"
                >
                  <span className="link-underline link-underline-cream">Our Story</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/sustainability"
                  className="link-underline link-underline-cream inline-flex items-center text-[11px] font-medium uppercase tracking-[0.22em] text-bone/70 transition-colors hover:text-porcelain"
                >
                  Sustainability
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <motion.div
              initial={{ opacity: 0, y: 34 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <EditorialImageSlot
                alt="ZOYA GOODS atelier"
                label="Atelier"
                tone="dark"
                className="aspect-[5/4] w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Hairline-divided pillars — no boxed cards */}
              <dl className="mt-10 grid gap-y-8 sm:grid-cols-3 sm:gap-x-8">
                {pillars.map((pillar, index) => (
                  <motion.div
                    key={pillar.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                    className="border-t border-bone/15 pt-5"
                  >
                    <dt className="flex items-baseline gap-3">
                      <span className="font-display text-base font-light tracking-[0.2em] text-beige/70">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="font-display text-xl font-light text-porcelain">
                        {pillar.title}
                      </span>
                    </dt>
                    <dd className="mt-3 text-[13px] leading-relaxed text-bone/60">{pillar.description}</dd>
                  </motion.div>
                ))}
              </dl>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
