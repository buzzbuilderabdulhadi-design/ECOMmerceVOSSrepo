'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ColorOption {
  name: string;
  hex: string;
  image?: string;
  disabled?: boolean;
}

interface ColorSwatchProps {
  colors: ColorOption[];
  selectedColor?: string;
  onChange?: (color: ColorOption) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ColorSwatch({
  colors,
  selectedColor,
  onChange,
  size = 'md',
  showLabel = false,
  className,
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const borderSize = {
    sm: 'ring-1',
    md: 'ring-2',
    lg: 'ring-2',
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {colors.map((color) => {
        const isSelected = selectedColor === color.name;
        return (
          <button
            key={`${color.name}-${color.hex}`}
            type="button"
            onClick={() => !color.disabled && onChange?.(color)}
            disabled={color.disabled}
            className={cn(
              'group relative flex items-center justify-center rounded-full transition-all duration-200',
              sizeClasses[size],
              isSelected && `${borderSize[size]} ring-sage ring-offset-2`,
              !isSelected && !color.disabled && 'hover:scale-110',
              color.disabled && 'cursor-not-allowed opacity-40'
            )}
            aria-label={color.name}
            title={color.name}
          >
            {color.image ? (
              <img
                src={color.image}
                alt={color.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <span
                className="h-full w-full rounded-full"
                style={{ backgroundColor: color.hex }}
              />
            )}
            {color.disabled && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            )}
            {isSelected && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg className="h-3 w-3 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
      {showLabel && selectedColor && (
        <span className="ml-1 self-center text-sm text-slate">
          {selectedColor}
        </span>
      )}
    </div>
  );
}
