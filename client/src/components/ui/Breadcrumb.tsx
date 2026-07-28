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
}

export function Breadcrumb({
  items,
  className,
  separator = 'chevron',
}: BreadcrumbProps) {
  const separatorIcon = {
    chevron: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    slash: <span className="text-gray-300">/</span>,
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
                <span className="text-gray-400" aria-hidden="true">
                  {separatorIcon[separator]}
                </span>
              )}
              {isLast ? (
                <span
                  className="text-sm font-medium text-gray-900"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <Link
                  href={item.href}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-150"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-sm text-gray-500">{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
