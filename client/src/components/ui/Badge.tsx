'use client';

import React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  default: 'bg-cream-dark text-navy',
  primary: 'bg-navy text-ivory',
  success: 'bg-sage-light/50 text-sage-dark',
  warning: 'bg-walnut/10 text-walnut',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-navy-light/10 text-navy-light',
  premium: 'bg-gradient-to-r from-gold/90 to-gold text-navy',
  exclusive: 'bg-gradient-to-r from-walnut-light to-walnut text-ivory',
  new: 'bg-sage-dark text-white',
  'best-seller': 'bg-walnut text-ivory',
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
            variant === 'default' && 'bg-cream-dark',
            variant === 'primary' && 'bg-white',
            variant === 'success' && 'bg-sage-dark',
            variant === 'warning' && 'bg-walnut',
            variant === 'danger' && 'bg-red-500',
            variant === 'info' && 'bg-navy-light',
            variant === 'premium' && 'bg-gold',
            variant === 'exclusive' && 'bg-walnut-light',
            variant === 'new' && 'bg-sage-dark',
            variant === 'best-seller' && 'bg-walnut-light',
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
