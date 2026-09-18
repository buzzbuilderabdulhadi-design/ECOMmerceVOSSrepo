'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NewsletterForm } from '@/components/ui/NewsletterForm';
import { TextReveal } from '@/components/animations/TextReveal';
import { Parallax } from '@/components/animations/Parallax';

interface NewsletterSectionProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'dark' | 'cream';
}

export function NewsletterSection({
  title = 'Join the ZOYA GOODS Community',
  description = 'Subscribe to receive exclusive offers, early access to new collections, and luxury style inspiration.',
  className,
  variant = 'default',
}: NewsletterSectionProps) {
  const isDark = variant === 'dark';

  return (
    <section className={cn('relative overflow-hidden py-20 md:py-28', isDark && 'bg-gradient-night grain', className)}>
      {/* Editorial watermark */}
      <Parallax amount={90}>
        <span className={cn(
          'pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none font-display text-[9rem] font-light leading-none sm:text-[16rem]',
          isDark ? 'text-cream/[0.05]' : 'text-navy/[0.04]'
        )}>
          ZOYA GOODS
        </span>
      </Parallax>

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
        >
          <p className={cn('flex items-center justify-center gap-3 text-[11px] font-medium uppercase tracking-[0.35em]', isDark ? 'text-sage-light' : 'text-sage-dark')}>
            <span className="inline-block h-px w-10 bg-sage" />
            Stay Connected
            <span className="inline-block h-px w-10 bg-sage" />
          </p>

          <TextReveal
            as="h2"
            text={title}
            className={cn('mt-5 font-display text-4xl font-light leading-tight sm:text-5xl', isDark ? 'text-ivory' : 'text-navy')}
          />

          <p className={cn('mx-auto mt-5 max-w-xl text-sm leading-relaxed sm:text-base', isDark ? 'text-ivory' : 'text-slate')}>
            {description}
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <NewsletterForm variant={isDark ? 'dark' : 'banner'} />
          </div>

          <p className="mt-5 text-[10px] uppercase tracking-[0.25em] text-slate">
            No spam. Unsubscribe anytime.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
