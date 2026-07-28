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
  animation = 'pulse',
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'h-4 rounded',
        variant === 'rectangular' && 'rounded-lg',
        animation === 'pulse' && 'animate-pulse',
        animation === 'shimmer' && 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200',
        className
      )}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-3/4 w-full" />
      <div className="space-y-2 p-2">
        <Skeleton className="h-4 w-3/4" variant="text" />
        <Skeleton className="h-4 w-1/2" variant="text" />
        <Skeleton className="h-4 w-1/3" variant="text" />
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-4">
        <Skeleton className="aspect-square w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-20 w-20" />
          <Skeleton className="h-20 w-20" />
          <Skeleton className="h-20 w-20" />
          <Skeleton className="h-20 w-20" />
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-1/4" variant="text" />
        <Skeleton className="h-8 w-3/4" variant="text" />
        <Skeleton className="h-6 w-1/3" variant="text" />
        <div className="space-y-2 pt-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
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
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-4 w-1/4" variant="text" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-4 w-1/4" variant="text" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" variant="text" />
          <Skeleton className="h-4 w-1/4" variant="text" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </div>
  );
}
