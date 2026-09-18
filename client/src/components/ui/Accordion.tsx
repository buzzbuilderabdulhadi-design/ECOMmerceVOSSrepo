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
    <div className={cn('divide-y divide-sage-light/50 rounded-lg border border-sage-light/30', className)}>
      {items.map((item) => {
        const isExpanded = expandedIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggleItem(item.id)}
              className={cn(
                'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium transition-colors duration-150',
                'hover:bg-cream focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sage/30',
                isExpanded ? 'text-navy' : 'text-charcoal'
              )}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${item.id}`}
            >
              <span>{item.title}</span>
              <svg
                className={cn(
                  'h-4 w-4 text-slate transition-transform duration-200',
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
                'grid transition-all duration-200',
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-sage-light/20 px-4 py-3 text-sm text-slate">
                  {item.content}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
