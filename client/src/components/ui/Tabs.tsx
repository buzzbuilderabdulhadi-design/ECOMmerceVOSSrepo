'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  onChange?: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'buttons';
  className?: string;
}

export function Tabs({
  tabs,
  defaultActiveTab,
  onChange,
  variant = 'underline',
  className,
}: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();

    const findEnabledIndex = (from: number, step: 1 | -1): number => {
      let i = from;
      for (let count = 0; count < tabs.length; count++) {
        if (!tabs[i]?.disabled) return i;
        i = (i + step + tabs.length) % tabs.length;
      }
      return -1;
    };

    let nextIndex = index;
    if (e.key === 'ArrowRight') nextIndex = findEnabledIndex((index + 1) % tabs.length, 1);
    if (e.key === 'ArrowLeft') nextIndex = findEnabledIndex((index - 1 + tabs.length) % tabs.length, -1);
    if (e.key === 'Home') nextIndex = findEnabledIndex(0, 1);
    if (e.key === 'End') nextIndex = findEnabledIndex(tabs.length - 1, -1);

    if (nextIndex >= 0) {
      handleTabChange(tabs[nextIndex].id);
      const tabList = e.currentTarget.parentElement;
      const nextButton = tabList?.querySelectorAll<HTMLElement>('[role="tab"]')[nextIndex];
      nextButton?.focus();
    }
  };

  const variantStyles = {
    underline: {
      container: 'flex overflow-x-auto border-b border-sage-light/30',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'flex-shrink-0 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
          isActive
            ? 'border-sage text-sage-dark'
            : 'border-transparent text-slate hover:text-sage-dark hover:border-sage-light',
          isDisabled && 'cursor-not-allowed text-slate/50 hover:border-transparent'
        ),
    },
    pills: {
      container: 'flex gap-1 overflow-x-auto rounded-lg bg-sage-light/30 p-1',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
          isActive
            ? 'bg-white text-navy shadow-sm'
            : 'text-slate hover:text-navy',
          isDisabled && 'cursor-not-allowed text-slate/50'
        ),
    },
    buttons: {
      container: 'flex gap-2 overflow-x-auto',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'flex-shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border',
          isActive
            ? 'bg-sage-dark text-white border-sage-dark'
            : 'bg-white text-charcoal border-sage-light/50 hover:border-sage',
          isDisabled && 'cursor-not-allowed text-slate/50 border-sage-light/30'
        ),
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className={className}>
      <div className={currentVariant.container} role="tablist" aria-label="Tab navigation">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              currentVariant.tab(activeTab === tab.id, !!tab.disabled),
              'inline-flex items-center gap-2'
            )}
          >
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                  activeTab === tab.id
                    ? 'bg-sage text-white'
                    : 'bg-sage-light/40 text-slate'
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          id={`tabpanel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={tab.id}
          hidden={activeTab !== tab.id}
          className="pt-4"
        >
          {activeTab === tab.id && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tab.content}
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
}
