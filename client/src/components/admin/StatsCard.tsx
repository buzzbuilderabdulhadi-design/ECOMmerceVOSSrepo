'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatsCard({ label, value, change, changeLabel, icon, className }: StatsCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <div className={cn('rounded-xl border border-sage-light/30 bg-white p-5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate">{label}</p>
        {icon && <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage-light/20 text-sage-dark">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-display font-semibold text-navy">{value}</p>
      {(change !== undefined || changeLabel) && (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          {change !== undefined && (
            <span className={cn('font-semibold', isPositive ? 'text-green-600' : 'text-red-500')}>
              {isPositive ? '▲' : '▼'} {Math.abs(change)}%
            </span>
          )}
          {changeLabel && <span className="text-slate">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}
