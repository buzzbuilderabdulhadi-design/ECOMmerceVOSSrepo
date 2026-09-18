'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Skeleton, ProductCardSkeleton, CartSkeleton, ProductDetailSkeleton } from '@/components/ui/Skeleton';

// ============================================================
// LoadingState — Reusable loading state with skeleton variants
// ============================================================

type LoadingVariant = 'default' | 'product-grid' | 'product-detail' | 'cart' | 'list' | 'text';

interface LoadingStateProps {
  variant?: LoadingVariant;
  count?: number;
  className?: string;
  message?: string;
}

export function LoadingState({
  variant = 'default',
  count = 4,
  className,
  message,
}: LoadingStateProps) {
  return (
    <div className={cn('w-full', className)}>
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 text-sm text-slate"
        >
          {message}
        </motion.p>
      )}

      {variant === 'product-grid' && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ProductCardSkeleton />
            </motion.div>
          ))}
        </div>
      )}

      {variant === 'product-detail' && <ProductDetailSkeleton />}

      {variant === 'cart' && <CartSkeleton />}

      {variant === 'list' && (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 rounded-lg border border-sage-light/30 p-4"
            >
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" variant="text" />
                <Skeleton className="h-3 w-1/3" variant="text" />
                <Skeleton className="h-3 w-1/4" variant="text" />
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {variant === 'text' && (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton
              key={i}
              className={cn('h-4', i === 0 ? 'w-3/4' : i === 1 ? 'w-1/2' : 'w-2/3')}
              variant="text"
            />
          ))}
        </div>
      )}

      {variant === 'default' && (
        <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
          <motion.div
            aria-hidden="true"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <svg className="h-8 w-8 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </motion.div>
        </div>
      )}
    </div>
  );
}

