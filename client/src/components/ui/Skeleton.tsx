'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'shimmer' | 'none';
}

export function Skeleton({
  className,
  variant = 'rectangular',
  animation = 'shimmer',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-sage-light/40',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rectangular' && 'rounded-xl',
        animation === 'pulse' && 'animate-pulse',
        animation === 'shimmer' && 'animate-shimmer',
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3 rounded-2xl border border-sage-light/30 bg-white/80 overflow-hidden">
      <Skeleton className="aspect-3/4 w-full rounded-none" />
      <div className="space-y-2 p-5">
        <Skeleton className="h-3 w-1/4" variant="text" animation="shimmer" />
        <Skeleton className="h-4 w-3/4" variant="text" animation="shimmer" />
        <Skeleton className="h-5 w-1/3" variant="text" animation="shimmer" />
        <Skeleton className="h-3 w-1/2" variant="text" animation="shimmer" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="flex gap-2">
          <Skeleton className="h-20 w-20 rounded-xl" />
          <Skeleton className="h-20 w-20 rounded-xl" />
          <Skeleton className="h-20 w-20 rounded-xl" />
          <Skeleton className="h-20 w-20 rounded-xl" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" variant="text" />
        <Skeleton className="h-8 w-3/4" variant="text" />
        <Skeleton className="h-6 w-1/3" variant="text" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-1/2 rounded-lg" />
        </div>
        <div className="space-y-2 pt-4">
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-full" variant="text" />
          <Skeleton className="h-4 w-full" variant="text" />
        </div>
      </div>
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-sage-light/30 bg-white/80 p-4">
          <Skeleton className="h-24 w-24 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" variant="text" />
            <Skeleton className="h-4 w-1/4" variant="text" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}
