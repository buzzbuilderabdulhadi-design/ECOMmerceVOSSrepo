'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface AccordionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  allowMultiple?: boolean;
  defaultExpanded?: string[];
  className?: string;
}

export function Accordion({
  items,
  allowMultiple = false,
  defaultExpanded = [],
  className,
}: AccordionProps) {
  const [expandedIds, setExpandedIds] = useState<string[]>(defaultExpanded);

  const toggleItem = useCallback(
    (id: string) => {
      setExpandedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((itemId) => itemId !== id);
        }
        if (allowMultiple) {
          return [...prev, id];
        }
        return [id];
      });
    },
    [allowMultiple]
  );

  return (
    <div className={cn('divide-y divide-gray-200 rounded-lg border border-gray-200', className)}>
      {items.map((item) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors duration-150',
                'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-200',
                isExpanded ? 'text-gray-900' : 'text-gray-700'
              )}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${item.id}`}
            >
              <span>{item.title}</span>
              <svg
                className={cn(
                  'h-4 w-4 text-gray-400 transition-transform duration-200',
                  isExpanded && 'rotate-180'
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
            </button>
            <div
              id={`accordion-content-${item.id}`}
              role="region"
              className={cn(
                'overflow-hidden transition-all duration-200',
                isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              )}
            >
              <div className="border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
