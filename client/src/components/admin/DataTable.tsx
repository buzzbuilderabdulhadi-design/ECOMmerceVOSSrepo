'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  emptyMessage = 'No records found',
  page,
  totalPages,
  onPageChange,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-sage-light/30 bg-white p-12 text-center">
        <p className="text-slate">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-sage-light/30 bg-sage-light/10">
              {columns.map(col => (
                <th key={col.key} className={cn('px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate', col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={keyExtractor(row)} className="border-b border-sage-light/20 last:border-0 hover:bg-sage-light/5">
                {columns.map(col => (
                  <td key={col.key} className={cn('px-5 py-3 text-sm', col.className)}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-sage-light/30 px-5 py-3">
          <button onClick={() => onPageChange(Math.max(1, (page || 1) - 1))} disabled={(page || 1) === 1}
            className="text-xs text-navy hover:underline disabled:text-slate disabled:cursor-not-allowed">Previous</button>
          <span className="text-xs text-slate">Page {page} of {totalPages}</span>
          <button onClick={() => onPageChange(Math.min(totalPages, (page || 1) + 1))} disabled={(page || 1) === totalPages}
            className="text-xs text-navy hover:underline disabled:text-slate disabled:cursor-not-allowed">Next</button>
        </div>
      )}
    </div>
  );
}
