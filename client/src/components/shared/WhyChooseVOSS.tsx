'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface WhyChooseVOSSProps {
  title?: string;
  description?: string;
  features?: Feature[];
  className?: string;
}

const defaultFeatures: Feature[] = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Premium Quality',
    description: 'Every jacket is crafted with the finest materials and exceptional attention to detail.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Worldwide Shipping',
    description: 'Free international shipping on orders over $200. Fast and reliable delivery to your doorstep.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure Payments',
    description: 'Your payment information is protected with industry-standard encryption technology.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy Returns',
    description: 'Not satisfied? Return within 30 days for a full refund. No questions asked.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: 'Craftsmanship Since 1991',
    description: 'Over three decades of expertise in creating exceptional leather and outerwear garments.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: 'Luxury Materials',
    description: 'We source only the finest leathers, fabrics, and materials from around the world.',
  },
];

export function WhyChooseVOSS({
  title = 'The VOSS Difference',
  description = 'Experience the difference of true craftsmanship and uncompromising quality.',
  features = defaultFeatures,
  className,
}: WhyChooseVOSSProps) {
  return (
    <section className={cn('bg-gradient-beige-cream relative overflow-hidden py-20 grain md:py-28', className)}>
      {/* Ambient light glows */}
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-sage/15 blur-[110px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-walnut/10 blur-[110px]" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          {/* Left — sticky intro on light background */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <ScrollReveal>
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-walnut">
                <span className="inline-block h-px w-10 bg-walnut" />
                Why VOSS
              </p>
              <TextReveal
                as="h2"
                text={title}
                className="mt-5 font-display text-4xl font-medium leading-tight text-navy sm:text-5xl lg:text-[3.25rem]"
              />
              <p className="mt-6 max-w-md text-base leading-relaxed text-charcoal sm:text-lg">
                {description}
              </p>

              <div className="mt-10 hidden max-w-md lg:block">
                <div className="hairline-b" />
                <div className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-display text-7xl font-light leading-none text-navy">
                      {String(features.length).padStart(2, '0')}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-walnut">
                      Reasons to stay
                    </p>
                  </div>
                  <p className="max-w-[10rem] text-xs italic leading-relaxed text-slate">
                    Crafted with pride, guaranteed without exception.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right — deep navy content container */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-gradient-night grain relative overflow-hidden rounded-3xl p-8 shadow-[0_30px_80px_-20px_rgba(31,42,68,0.4)] sm:p-10 lg:p-14"
          >
            {/* Subtle inner glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sage/15 blur-[100px]" />
            <span className="pointer-events-none absolute right-8 top-8 h-1 w-1 rounded-full bg-gold/70" />

            {/* Card header */}
            <div className="relative">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-light">
                <span className="inline-block h-px w-8 bg-sage" />
                A promise of excellence
              </p>
              <h3 className="mt-4 font-display text-3xl font-light leading-tight text-ivory sm:text-4xl">
                Everything you expect, <span className="display-italic text-sage-light">and more</span>
              </h3>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ivory">
                Six commitments that define every piece that bears the VOSS name.
              </p>
            </div>

            {/* Features grid */}
            <div className="relative mt-10 grid gap-x-10 gap-y-0 sm:grid-cols-2">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: index * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  className="group flex items-start gap-5 border-b border-ivory/10 py-7 first:pt-0 hover:border-sage/40"
                >
                  <div className="relative shrink-0">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-walnut text-ivory shadow-lg shadow-black/20 transition-all duration-500 group-hover:bg-walnut-light group-hover:scale-105">
                      {feature.icon}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-3">
                      <span className="font-display text-sm font-light leading-none text-sage-light transition-colors duration-300 group-hover:text-sage-light">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <h4 className="font-display text-xl font-medium leading-snug text-ivory">
                        {feature.title}
                      </h4>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-ivory">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
