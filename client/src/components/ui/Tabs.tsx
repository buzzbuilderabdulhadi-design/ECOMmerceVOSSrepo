'use client';

import React, { useState } from 'react';
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

  const variantStyles = {
    underline: {
      container: 'border-b border-gray-200',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'px-4 py-2.5 text-sm font-medium transition-all duration-200 border-b-2 -mb-px',
          isActive
            ? 'border-gray-900 text-gray-900'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
          isDisabled && 'cursor-not-allowed text-gray-300 hover:border-transparent'
        ),
    },
    pills: {
      container: 'flex gap-1 p-1 bg-gray-100 rounded-lg',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'px-4 py-2 text-sm font-medium rounded-md transition-all duration-200',
          isActive
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
          isDisabled && 'cursor-not-allowed text-gray-300'
        ),
    },
    buttons: {
      container: 'flex gap-2',
      tab: (isActive: boolean, isDisabled: boolean) =>
        cn(
          'px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border',
          isActive
            ? 'bg-gray-900 text-white border-gray-900'
            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
          isDisabled && 'cursor-not-allowed text-gray-300 border-gray-200'
        ),
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <div className={className}>
      <div className={currentVariant.container} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
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
                    ? 'bg-gray-200 text-gray-900'
                    : 'bg-gray-100 text-gray-500'
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
          {tab.content}
        </div>
      ))}
    </div>
  );
}
