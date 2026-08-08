'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SizeOption {
  label: string;
  value: string;
  disabled?: boolean;
  description?: string;
}

interface SizeSelectorProps {
  sizes: SizeOption[];
  selectedSize?: string;
  onChange?: (size: SizeOption) => void;
  size?: 'sm' | 'md' | 'lg';
  showSizeGuide?: boolean;
  onSizeGuideClick?: () => void;
  className?: string;
}

export function SizeSelector({
  sizes,
  selectedSize,
  onChange,
  size = 'md',
  showSizeGuide = false,
  onSizeGuideClick,
  className,
}: SizeSelectorProps) {
  const sizeClasses = {
    sm: 'h-8 min-w-[2.5rem] text-xs',
    md: 'h-10 min-w-[3rem] text-sm',
    lg: 'h-12 min-w-[3.5rem] text-base',
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-charcoal">Size</span>
        {showSizeGuide && (
          <button
            type="button"
            onClick={onSizeGuideClick}
            className="text-xs text-walnut underline hover:text-walnut-light transition-colors"
          >
            Size Guide
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((sizeOption) => {
          const isSelected = selectedSize === sizeOption.value;
          return (
            <button
              key={sizeOption.value}
              type="button"
              onClick={() => !sizeOption.disabled && onChange?.(sizeOption)}
              disabled={sizeOption.disabled}
              className={cn(
                sizeClasses[size],
                'flex items-center justify-center rounded-md border font-medium transition-all duration-200',
                isSelected
                  ? 'border-sage bg-sage text-white'
                  : 'border-sage-light/50 bg-white text-charcoal hover:border-sage',
                sizeOption.disabled
                  ? 'cursor-not-allowed border-sage-light/30 bg-cream text-slate/50 line-through'
                  : 'cursor-pointer'
              )}
              title={sizeOption.description}
              aria-label={`Size ${sizeOption.label}${sizeOption.disabled ? ' - unavailable' : ''}`}
              aria-pressed={isSelected}
            >
              {sizeOption.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
