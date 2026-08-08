'use client';

import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: 'chevron' | 'slash' | 'arrow';
  onDark?: boolean;
}

export function Breadcrumb({
  items,
  className,
  separator = 'chevron',
  onDark = false,
}: BreadcrumbProps) {
  const separatorIcon = {
    chevron: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    slash: <span className="text-slate">/</span>,
    arrow: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    ),
  };

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center', className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center space-x-2">
              {index > 0 && (
                <span
                  className={onDark ? 'text-sage-light' : 'text-slate'}
                  aria-hidden="true"
                >
                  {separatorIcon[separator]}
                </span>
              )}
              {isLast ? (
                <span
                  className={cn(
                    'text-sm font-medium',
                    onDark ? 'text-white' : 'text-navy'
                  )}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    'text-sm transition-colors duration-150',
                    onDark
                      ? 'text-ivory hover:text-gold'
                      : 'text-slate hover:text-sage-dark'
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={cn('text-sm', onDark ? 'text-ivory' : 'text-slate')}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
