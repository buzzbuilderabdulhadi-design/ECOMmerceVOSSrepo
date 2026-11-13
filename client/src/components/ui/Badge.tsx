'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-beige text-onyx',
  primary: 'bg-onyx text-bone',
  success: 'bg-cocoa/15 text-cocoa',
  warning: 'bg-navy-mid/12 text-navy-mid',
  danger: 'bg-red-100 text-red-900',
  info: 'bg-cocoa/10 text-cocoa',
  premium: 'bg-navy-mid text-bone',
  exclusive: 'bg-cocoa text-bone',
  new: 'bg-cocoa text-bone',
  'best-seller': 'bg-espresso text-bone',
  sale: 'bg-red-700 text-white',
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
            variant === 'default' && 'bg-cocoa',
            variant === 'primary' && 'bg-bone',
            variant === 'success' && 'bg-cocoa',
            variant === 'warning' && 'bg-navy-mid',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-cocoa',
            variant === 'premium' && 'bg-bone',
            variant === 'exclusive' && 'bg-bone',
            variant === 'new' && 'bg-bone',
            variant === 'best-seller' && 'bg-bone',
            variant === 'sale' && 'bg-white'
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
