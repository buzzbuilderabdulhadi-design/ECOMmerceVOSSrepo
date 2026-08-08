'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TrustBadgeItem {
  icon: React.ReactNode;
  label: string;
  description?: string;
}

interface TrustBadgeProps {
  items?: TrustBadgeItem[];
  variant?: 'row' | 'grid';
  className?: string;
}

const defaultBadges: TrustBadgeItem[] = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    label: 'Secure Checkout',
    description: 'SSL encrypted payment',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    label: 'Premium Quality',
    description: 'Handpicked luxury items',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    label: 'Easy Returns',
    description: '30-day return policy',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Worldwide Shipping',
    description: 'Free over $200',
  },
];

export function TrustBadge({
  items = defaultBadges,
  variant = 'row',
  className,
}: TrustBadgeProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-navy/10 bg-cream/50 p-4',
        variant === 'row'
          ? 'flex flex-wrap items-center justify-center gap-6'
          : 'grid grid-cols-2 gap-4 sm:grid-cols-4',
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex items-center gap-3',
            variant === 'row' && 'flex-row',
            variant === 'grid' && 'flex-col text-center'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center rounded-full bg-white p-2 shadow-sm',
              variant === 'grid' && 'mx-auto'
            )}
          >
            <span className="text-charcoal">{item.icon}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-navy">{item.label}</p>
            {item.description && (
              <p className="text-xs text-slate">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
