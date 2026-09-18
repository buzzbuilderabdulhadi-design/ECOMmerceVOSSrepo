'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface QuantitySelectorProps {
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuantitySelector({
  value = 1,
  onChange,
  min = 1,
  max = 99,
  disabled = false,
  size = 'md',
  className,
}: QuantitySelectorProps) {
  const [internalValue, setInternalValue] = useState(value);
  const currentValue = onChange ? value : internalValue;

  const handleChange = useCallback(
    (newValue: number) => {
      const clamped = Math.max(min, Math.min(max, newValue));
      if (onChange) {
        onChange(clamped);
      } else {
        setInternalValue(clamped);
      }
    },
    [min, max, onChange]
  );

  const handleIncrement = useCallback(() => {
    handleChange(currentValue + 1);
  }, [currentValue, handleChange]);

  const handleDecrement = useCallback(() => {
    handleChange(currentValue - 1);
  }, [currentValue, handleChange]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseInt(e.target.value, 10);
      if (!isNaN(parsed)) {
        handleChange(parsed);
      }
    },
    [handleChange]
  );

  const handleBlur = useCallback(() => {
    if (isNaN(currentValue) || currentValue < min) {
      handleChange(min);
    }
  }, [currentValue, min, handleChange]);

  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-11 text-base',
    lg: 'h-12 text-lg',
  };

  const buttonSizeClasses = {
    sm: 'w-9',
    md: 'w-11',
    lg: 'w-12',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-lg border border-sage-light/50 overflow-hidden',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || currentValue <= min}
        className={cn(
          buttonSizeClasses[size],
          'flex items-center justify-center text-slate hover:bg-sage-light/30 hover:text-sage-dark transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:text-slate/50 disabled:hover:bg-transparent',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sage'
        )}
        aria-label="Decrease quantity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
        </svg>
      </button>
      <input
        type="number"
        value={currentValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        min={min}
        max={max}
        className={cn(
          sizeClasses[size],
          'w-16 border-x border-sage-light/50 bg-white text-center font-medium text-navy',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sage',
          '[-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
        )}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || currentValue >= max}
        className={cn(
          buttonSizeClasses[size],
          'flex items-center justify-center text-slate hover:bg-sage-light/30 hover:text-sage-dark transition-colors duration-150',
          'disabled:cursor-not-allowed disabled:text-slate/50 disabled:hover:bg-transparent',
          'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sage'
        )}
        aria-label="Increase quantity"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
