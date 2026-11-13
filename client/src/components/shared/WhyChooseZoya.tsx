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

interface WhyChooseZoyaProps {
  title?: string;
  description?: string;
  features?: Feature[];
  className?: string;
}

const defaultFeatures: Feature[] = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Premium Quality',
    description: 'Every jacket is crafted with the finest materials and exceptional attention to detail.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Worldwide Shipping',
    description: 'Free international shipping on orders over $200. Fast and reliable delivery to your doorstep.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a4 4 0 004-4v-6a4 4 0 00-4-4H6a4 4 0 00-4 4v6a4 4 0 004 4zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure Payments',
    description: 'Your payment information is protected with industry-standard encryption technology.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: 'Easy Returns',
    description: 'Not satisfied? Return within 30 days for a full refund. No questions asked.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    title: 'Craftsmanship Since 1991',
    description: 'Over three decades of expertise in creating exceptional leather and outerwear garments.',
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a4 4 0 002-2v-4a4 4 0 00-2-2h-2.343M11 7.343l1.657-1.657a4 4 0 012.828 0l2.829 2.829a4 4 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: 'Luxury Materials',
    description: 'We source only the finest leathers, fabrics, and materials from around the world.',
  },
];

export function WhyChooseZoya({
  title = 'The ZOYA GOODS Difference',
  description = 'Experience the difference of true craftsmanship and uncompromising quality.',
  features = defaultFeatures,
  className,
}: WhyChooseZoyaProps) {
  return (
    <section
      id="why-zoya-goods"
      className={cn('bg-warm-beige scroll-mt-32 overflow-hidden py-20 text-onyx md:py-28 lg:py-32', className)}
    >
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Intro */}
          <div className="lg:col-span-4">
            <ScrollReveal>
              <p className="eyebrow flex items-center gap-3 text-navy-soft">
                <span className="inline-block h-px w-10 bg-navy-soft/70" />
                Why ZOYA GOODS
              </p>
              <TextReveal
                as="h2"
                text={title}
                className="display-2 mt-5 font-display font-light text-onyx"
              />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-cocoa sm:text-base">{description}</p>
            </ScrollReveal>
          </div>

          {/* Six commitments — hairline grid, no boxes */}
          <div className="lg:col-span-8">
            <div className="grid gap-x-10 sm:grid-cols-2 sm:gap-x-12">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.55, delay: (index % 2) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex items-start gap-4 border-t border-cocoa/20 py-7 transition-colors duration-500 hover:border-navy-soft"
                >
                  <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-cocoa/20 text-navy-soft transition-colors duration-500 group-hover:border-navy-soft group-hover:bg-navy-soft group-hover:text-bone">
                    {feature.icon}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-xl font-light leading-snug text-onyx">
                      {feature.title}
                    </h3>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-cocoa">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
