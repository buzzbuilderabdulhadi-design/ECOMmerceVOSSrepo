'use client';

import React, { useState, useId } from 'react';
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

function StarPath({ fill }: { fill: string }) {
  return (
    <path
      fill={fill}
      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
    />
  );
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
  const gradientId = useId();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const filledColor = onDark ? 'text-gold' : 'text-walnut';
  const emptyColor = onDark ? '#4B5563' : '#D5D9E0';

  const handleClick = (starValue: number) => {
    if (interactive && onChange) {
      onChange(starValue === value ? 0 : starValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive || !onChange) return;
    if (e.target instanceof HTMLElement) e.target.blur();
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(value + 1, max);
      onChange(next === value ? 0 : next);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const prev = value <= 1 ? 0 : value - 1;
      onChange(prev);
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  };

  // Read-only display: render an accessible text value with decorative stars.
  if (!interactive) {
    return (
      <span className={cn('inline-flex items-center gap-0.5', className)}>
        <span className="sr-only">
          Rated {value.toFixed(1)} out of {max}
        </span>
        <span aria-hidden="true" className="inline-flex items-center gap-0.5">
          {Array.from({ length: max }, (_, i) => {
            const starValue = i + 1;
            const filled = starValue <= displayValue;
            const half = !filled && starValue - 0.5 <= displayValue;
            return (
              <svg
                key={i}
                className={cn(sizeClasses[size], 'transition-colors duration-150', filled || half ? filledColor : onDark ? 'text-sage-light/30' : 'text-slate')}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                {half ? (
                  <>
                    <defs>
                      <linearGradient id={`${gradientId}-${i}`}>
                        <stop offset="50%" stopColor="currentColor" />
                        <stop offset="50%" stopColor={emptyColor} />
                      </linearGradient>
                    </defs>
                    <path
                      fill={`url(#${gradientId}-${i})`}
                      d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                    />
                  </>
                ) : (
                  <StarPath fill="currentColor" />
                )}
              </svg>
            );
          })}
        </span>
        {showValue && (
          <span aria-hidden="true" className="ml-1 text-sm text-slate">
            {(value ?? 0).toFixed(1)}
          </span>
        )}
      </span>
    );
  }

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="radiogroup"
      aria-label="Rating"
      onKeyDown={handleKeyDown}
    >
      {Array.from({ length: max }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayValue;
        const half = !filled && starValue - 0.5 <= displayValue;

        return (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={value === starValue}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
            onClick={() => handleClick(starValue)}
            onMouseEnter={() => setHoverValue(starValue)}
            onMouseLeave={() => setHoverValue(null)}
            className={cn(
              'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage rounded-sm',
              interactive && 'cursor-pointer hover:scale-110'
            )}
          >
            <svg
              className={cn(
                sizeClasses[size],
                'transition-colors duration-150',
                filled || half ? filledColor : onDark ? 'text-sage-light/30' : 'text-slate'
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {half ? (
                <>
                  <defs>
                    <linearGradient id={`${gradientId}-${i}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor={emptyColor} />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#${gradientId}-${i})`}
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </>
              ) : (
                <StarPath fill="currentColor" />
              )}
            </svg>
          </button>
        );
      })}
      {showValue && (
        <span key="value" className="ml-1 text-sm text-slate">
          {(value ?? 0).toFixed(1)}
        </span>
      )}
    </div>
  );
}