'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
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
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const triggerId = useId();
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const selectedIndex = filteredOptions.findIndex((opt) => opt.value === value);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) {
      setSearchQuery('');
      // Highlight the current value, else the first selectable option. Done here
      // rather than in the open-effect so no state is set from an effect body.
      setActiveIndex(
        selectedIndex >= 0
          ? selectedIndex
          : options.findIndex((opt) => !opt.disabled)
      );
    }
  }, [disabled, isOpen, selectedIndex, options]);

  // DOM-only concern of an open listbox: move focus and scroll the highlight
  // into view. State that depends on `isOpen` is set by the toggle above.
  useEffect(() => {
    if (!isOpen) return;
    if (searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    requestAnimationFrame(() => {
      listboxRef.current
        ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
        ?.scrollIntoView?.({ block: 'nearest' });
    });
  }, [isOpen, searchable, activeIndex]);

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

  const moveActive = useCallback(
    (direction: 1 | -1) => {
      const enabledCount = filteredOptions.filter((opt) => !opt.disabled).length;
      if (enabledCount === 0) return;
      let next = activeIndex;
      for (let i = 0; i < filteredOptions.length; i++) {
        next = (next + direction + filteredOptions.length) % filteredOptions.length;
        if (!filteredOptions[next].disabled) break;
      }
      setActiveIndex(next);
      listboxRef.current
        ?.querySelector<HTMLElement>(`[data-index="${next}"]`)
        ?.scrollIntoView?.({ block: 'nearest' });
    },
    [activeIndex, filteredOptions]
  );

  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        moveActive(e.key === 'ArrowDown' ? 1 : -1);
        break;
      }
      case 'Home': {
        if (!isOpen) return;
        e.preventDefault();
        const first = filteredOptions.findIndex((opt) => !opt.disabled);
        if (first >= 0) {
          setActiveIndex(first);
          listboxRef.current?.querySelector<HTMLElement>(`[data-index="${first}"]`)?.scrollIntoView?.({ block: 'nearest' });
        }
        break;
      }
      case 'End': {
        if (!isOpen) return;
        e.preventDefault();
        const last = filteredOptions.map((opt) => !opt.disabled).lastIndexOf(true);
        if (last >= 0) {
          setActiveIndex(last);
          listboxRef.current?.querySelector<HTMLElement>(`[data-index="${last}"]`)?.scrollIntoView?.({ block: 'nearest' });
        }
        break;
      }
      case 'Enter':
      case ' ': {
        if (!isOpen) break;
        e.preventDefault();
        const option = filteredOptions[activeIndex];
        if (option && !option.disabled) handleSelect(option.value);
        break;
      }
      case 'Escape': {
        if (!isOpen) break;
        e.preventDefault();
        setIsOpen(false);
        setSearchQuery('');
        break;
      }
      default:
        break;
    }
  };

  const handleListboxKeyDown = (e: React.KeyboardEvent) => {
    if (searchable) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        moveActive(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const option = filteredOptions[activeIndex];
        if (option && !option.disabled) handleSelect(option.value);
      } else if (e.key === 'Home') {
        e.preventDefault();
        const first = filteredOptions.findIndex((opt) => !opt.disabled);
        if (first >= 0) setActiveIndex(first);
      } else if (e.key === 'End') {
        e.preventDefault();
        const last = filteredOptions.map((opt) => !opt.disabled).lastIndexOf(true);
        if (last >= 0) setActiveIndex(last);
      }
    }
  };

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
        <label htmlFor={triggerId} className="mb-1.5 block text-sm font-medium text-navy">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}
      <button
        id={triggerId}
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
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={!!error}
        aria-controls={isOpen ? listboxId : undefined}
        aria-activedescendant={
          isOpen && activeIndex >= 0
            ? `option-${listboxId}-${filteredOptions[activeIndex]?.value}`
            : undefined
        }
        onKeyDown={handleTriggerKeyDown}
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
      {clearable && selectedOption && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-9 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate hover:bg-cream hover:text-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-sage/40"
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
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-sage-light/30 bg-white shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
          {searchable && (
            <div className="border-b border-sage-light/20 p-2">
              <label htmlFor={`${triggerId}-search`} className="sr-only">
                Search options
              </label>
              <input
                id={`${triggerId}-search`}
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleListboxKeyDown}
                placeholder="Search..."
                className="w-full rounded-md border border-sage-light/30 px-3 py-1.5 text-sm focus:border-navy/50 focus:outline-none"
              />
            </div>
          )}
          <ul
            id={listboxId}
            ref={listboxRef}
            role="listbox"
            aria-label={label || 'Options'}
            className="max-h-60 overflow-auto py-1"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate">
                No options found
              </li>
            ) : (
              filteredOptions.map((option, index) => (
                <li
                  key={option.value}
                  id={`option-${listboxId}-${option.value}`}
                  role="option"
                  aria-selected={value === option.value}
                  aria-disabled={option.disabled || undefined}
                  data-index={index}
                  onClick={() => !option.disabled && handleSelect(option.value)}
                  onMouseMove={() => !option.disabled && setActiveIndex(index)}
                  className={cn(
                    'cursor-pointer px-3 py-2 text-sm transition-colors duration-150',
                    value === option.value
                      ? 'bg-sage-light/40 font-medium text-navy'
                      : 'text-charcoal hover:bg-cream',
                    index === activeIndex && 'bg-cream',
                    value === option.value && index === activeIndex && 'bg-sage-light/60',
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