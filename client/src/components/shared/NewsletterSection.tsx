'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NewsletterForm } from '@/components/ui/NewsletterForm';

// ============================================================
// NewsletterSection — Premium email subscription section
// ============================================================

interface NewsletterSectionProps {
  title?: string;
  description?: string;
  className?: string;
  variant?: 'default' | 'dark' | 'cream';
}

export function NewsletterSection({
  title = 'Join the VOSS Community',
  description = 'Subscribe to receive exclusive offers, early access to new collections, and luxury style inspiration.',
  className,
  variant = 'default',
}: NewsletterSectionProps) {
  const bgClasses = {
    default: 'bg-gray-50',
    dark: 'bg-gray-900',
    cream: 'bg-amber-50',
  };

  const textClasses = {
    default: 'text-gray-900',
    dark: 'text-white',
    cream: 'text-gray-900',
  };

  const descClasses = {
    default: 'text-gray-500',
    dark: 'text-gray-400',
    cream: 'text-gray-600',
  };

  return (
    <section className={cn('border-b border-gray-100', bgClasses[variant], className)}>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-xl text-center"
        >
          <h2 className={cn('text-2xl font-semibold sm:text-3xl', textClasses[variant])}>
            {title}
          </h2>
          <p className={cn('mt-3 text-sm leading-relaxed sm:text-base', descClasses[variant])}>
            {description}
          </p>
          <div className="mt-8">
            <NewsletterForm variant="banner" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

