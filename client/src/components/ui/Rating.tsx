'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface RatingProps {
  value?: number;
  onChange?: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  showValue?: boolean;
  onDark?: boolean;
  className?: string;
}

export function Rating({
  value = 0,
  onChange,
  max = 5,
  size = 'md',
  interactive = false,
  showValue = false,
  onDark = false,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue === value ? 0 : starValue);
    }
  };

  return (
    <div className={cn('inline-flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;
        const half = !filled && starValue - 0.5 <= displayValue;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => interactive && setHoverValue(starValue)}
            onMouseLeave={() => interactive && setHoverValue(null)}
            className={cn(
              'transition-all duration-150',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <svg
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                filled
                  ? onDark ? 'text-gold' : 'text-walnut'
                  : half
                  ? onDark ? 'text-gold' : 'text-walnut'
                  : 'text-slate'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`half-${i}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor={onDark ? '#4E5A68' : '#C7BBA4'} />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${i})`}
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </>
              ) : (
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              )}
            </svg>
          </button>
        );
      })}
      {showValue && (
        <span className="ml-1 text-sm text-slate">{value.toFixed(1)}</span>
      )}
    </div>
  );
}
