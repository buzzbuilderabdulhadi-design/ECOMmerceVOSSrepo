'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
  clearable?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  disabled = false,
  required = false,
  className,
  searchable = false,
  clearable = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleToggle = useCallback(() => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setSearchQuery('');
      }
    }
  }, [disabled, isOpen]);

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.('');
      setSearchQuery('');
    },
    [onChange]
  );

  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-navy">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-sage-light/40 focus:border-navy focus:ring-sage/30',
          disabled && 'cursor-not-allowed bg-cream text-slate/60',
          !disabled && 'hover:border-navy/50',
          isOpen && 'border-navy/30 ring-1 ring-sage/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
      >
          <span
            className={cn(
              'truncate',
              !selectedOption && 'text-slate',
              selectedOption && 'text-navy'
            )}
          >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="ml-2 flex items-center gap-1">
          {clearable && selectedOption && (
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full p-0.5 text-slate hover:text-navy focus:outline-none"
              aria-label="Clear selection"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          <svg
            className={cn(
              'h-4 w-4 text-slate transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </span>
      </button>
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-sage-light/30 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {searchable && (
            <div className="border-b border-sage-light/20 p-2">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full rounded-md border border-sage-light/30 px-3 py-1.5 text-sm focus:border-navy/50 focus:outline-none"
              />
            </div>
          )}
          <ul
            role="listbox"
            className="max-h-60 overflow-auto py-1"
            aria-label="Options"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate">
                No options found
              </li>
            ) : (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  role="option"
                  aria-selected={value === option.value}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm transition-colors duration-150',
                    value === option.value
                      ? 'bg-sage-light/40 font-medium text-navy'
                      : 'text-charcoal hover:bg-cream',
                    option.disabled && 'cursor-not-allowed text-slate/50'
                  )}
                >
                  <span className="flex items-center justify-between">
                    {option.label}
                    {value === option.value && (
                      <svg
                        className="h-4 w-4 text-navy"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
      {error && (
        <p className="mt-1 text-xs text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
