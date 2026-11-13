'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { EditorialImageSlot } from '@/components/home/EditorialImageSlot';

interface BrandIntroProps {
  className?: string;
}

export function BrandIntro({ className }: BrandIntroProps) {
  return (
    <section
      id="brand-intro"
      className={cn('bg-warm-light scroll-mt-32 overflow-hidden py-20 text-onyx md:py-28 lg:py-36', className)}
    >
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <ScrollReveal>
              <p className="eyebrow flex items-center gap-3">
                <span className="inline-block h-px w-10 bg-navy-soft" />
                The House
              </p>
              <TextReveal
                as="h2"
                text="Timeless elegance, modern sophistication."
                className="display-1 mt-6 font-display font-light text-onyx"
              />
            </ScrollReveal>
          </div>

          <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <ScrollReveal delay={0.15}>
              <p className="text-sm leading-relaxed text-cocoa sm:text-base">
                Curating the finest luxury fashion from around the world — leather, outerwear and
                everyday pieces built to be worn, not displayed.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
                <Link
                  href="/about"
                  className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-onyx transition-colors hover:text-navy-mid"
                >
                  <span className="link-underline">Our Story</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/shop"
                  className="link-underline inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-cocoa transition-colors hover:text-onyx"
                >
                  Shop the collection
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Offset editorial image pair */}
        <div className="mt-14 grid grid-cols-12 items-end gap-4 md:mt-20 md:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-9 sm:col-span-8 lg:col-span-7"
          >
            <EditorialImageSlot
              alt="Editorial campaign"
              label="Campaign 01"
              tone="light"
              className="aspect-[4/5] w-full"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 56 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-7 col-start-6 sm:col-span-6 sm:col-start-7 lg:col-span-4 lg:col-start-9"
          >
            <EditorialImageSlot
              alt="Editorial detail"
              label="Detail 01"
              tone="dark"
              className="aspect-[3/4] w-full"
            />
            <div className="mt-5 flex items-center gap-3">
              <span className="font-display text-sm font-light tracking-[0.3em] text-cocoa">ZOYA GOODS</span>
              <span className="h-px flex-1 bg-cocoa/20" />
              <span className="text-[10px] uppercase tracking-[0.25em] text-navy-mid">Est. 1991</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
