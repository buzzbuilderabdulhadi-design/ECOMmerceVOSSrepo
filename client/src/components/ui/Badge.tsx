'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-gray-100 text-gray-800',
  primary: 'bg-black text-white',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  premium: 'bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900',
  exclusive: 'bg-gradient-to-r from-purple-200 to-purple-400 text-purple-900',
  new: 'bg-green-500 text-white',
  'best-seller': 'bg-amber-500 text-white',
  sale: 'bg-red-500 text-white',
};

const badgeSizes = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  className?: string;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        badgeVariants[variant],
        badgeSizes[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            variant === 'default' && 'bg-gray-500',
            variant === 'primary' && 'bg-white',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-yellow-500',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-blue-500',
            variant === 'premium' && 'bg-amber-600',
            variant === 'exclusive' && 'bg-purple-600',
            variant === 'new' && 'bg-green-600',
            variant === 'best-seller' && 'bg-amber-600',
            variant === 'sale' && 'bg-red-600'
          )}
        />
      )}
      {children}
    </span>
  );
}

// Predefined product tags
export const ProductTag = {
  New: () => <Badge variant="primary" size="sm">NEW</Badge>,
  Sale: (discount?: number) => (
    <Badge variant="danger" size="sm">{discount ? `-${discount}%` : 'SALE'}</Badge>
  ),
  BestSeller: () => <Badge variant="warning" size="sm">BEST SELLER</Badge>,
  LimitedEdition: () => <Badge variant="exclusive" size="sm">LIMITED</Badge>,
  Premium: () => <Badge variant="premium" size="sm">PREMIUM</Badge>,
  Exclusive: () => <Badge variant="exclusive" size="sm" dot>EXCLUSIVE</Badge>,
};
