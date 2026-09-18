'use client';

import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  size = 'md',
  className,
}: PaginationProps) {
  const getPageNumbers = useCallback(() => {
    const totalNumbers = siblingCount * 2 + 5;
    const totalBlocks = totalNumbers + 2;

    if (totalPages <= totalBlocks) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftDots = leftSiblingIndex > 2;
    const showRightDots = rightSiblingIndex < totalPages - 2;

    if (!showLeftDots && showRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (showLeftDots && !showRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, '...', ...middleRange, '...', totalPages];
  }, [currentPage, totalPages, siblingCount]);

  const sizeClasses = {
    sm: 'h-8 min-w-[2rem] text-xs',
    md: 'h-10 min-w-[2.5rem] text-sm',
    lg: 'h-12 min-w-[3rem] text-base',
  };

  const iconSize = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  if (totalPages <= 1) return null;

  const pages = getPageNumbers();

  return (
    <nav aria-label="Pagination" className={cn('flex flex-wrap items-center justify-center gap-1', className)}>
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className={cn(
            sizeClasses[size],
            'flex items-center justify-center rounded-md border border-sage-light/30 bg-white text-slate transition-colors duration-150',
            'hover:bg-sage-light/30 hover:text-sage-dark',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="First page"
        >
          <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
      )}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            sizeClasses[size],
            'flex items-center justify-center rounded-md border border-sage-light/30 bg-white text-slate transition-colors duration-150',
            'hover:bg-sage-light/30 hover:text-sage-dark',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Previous page"
        >
          <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      {pages.map((page, index) => {
        if (page === '...') {
          return (
            <span
              key={`ellipsis-${index}`}
              className={cn(
                sizeClasses[size],
                'flex items-center justify-center text-slate'
              )}
            >
              ...
            </span>
          );
        }
        const isActive = page === currentPage;
        return (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page as number)}
            className={cn(
              sizeClasses[size],
              'flex items-center justify-center rounded-md font-medium transition-all duration-150',
              isActive
                ? 'bg-sage text-white shadow-sm'
                : 'border border-sage-light/30 bg-white text-charcoal hover:bg-sage-light/30 hover:text-sage-dark'
            )}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`Page ${page}`}
          >
            {page}
          </button>
        );
      })}
      {showPrevNext && (
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            sizeClasses[size],
            'flex items-center justify-center rounded-md border border-sage-light/30 bg-white text-slate transition-colors duration-150',
            'hover:bg-sage-light/30 hover:text-sage-dark',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Next page"
        >
          <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}
      {showFirstLast && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className={cn(
            sizeClasses[size],
            'flex items-center justify-center rounded-md border border-sage-light/30 bg-white text-slate transition-colors duration-150',
            'hover:bg-sage-light/30 hover:text-sage-dark',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
          aria-label="Last page"
        >
          <svg className={iconSize[size]} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      )}
    </nav>
  );
}
