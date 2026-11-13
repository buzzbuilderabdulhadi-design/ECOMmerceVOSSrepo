'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NewsletterForm } from '@/components/ui/NewsletterForm';
import { TextReveal } from '@/components/animations/TextReveal';

interface NewsletterSectionProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: 'beige' | 'dark';
}

/**
 * Newsletter band. Sits directly above the espresso footer so the two read as
 * a single stacked block, with exactly one opt-in form on the page.
 */
export function NewsletterSection({
  title = 'Join the ZOYA GOODS Circle',
  description = 'Receive early access to new collections, private offers and notes from the studio — sent sparingly.',
  className,
  variant = 'beige',
}: NewsletterSectionProps) {
  const isDark = variant === 'dark';

  return (
    <section
      className={cn(
        'relative overflow-hidden py-20 md:py-28',
        isDark ? 'bg-cinematic text-porcelain' : 'bg-warm-beige text-onyx',
        className
      )}
    >
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={cn('eyebrow flex items-center gap-3', isDark ? 'text-beige' : 'text-navy-mid')}>
              <span className={cn('inline-block h-px w-10', isDark ? 'bg-beige/60' : 'bg-navy-soft/70')} />
              Stay Connected
            </p>
            <TextReveal
              as="h2"
              text={title}
              className={cn('display-2 mt-5 font-display font-light', isDark ? 'text-porcelain' : 'text-onyx')}
            />
            <p
              className={cn(
                'mt-5 max-w-lg text-sm leading-relaxed sm:text-base',
                isDark ? 'text-bone/70' : 'text-cocoa'
              )}
            >
              {description}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:w-full"
          >
            <NewsletterForm variant={isDark ? 'dark' : 'banner'} />
            <p
              className={cn(
                'mt-3 text-[10px] uppercase tracking-[0.25em]',
                isDark ? 'text-bone/70' : 'text-cocoa/80'
              )}
            >
              No spam. Unsubscribe anytime.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
