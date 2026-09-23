'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import adminApi from '@/services/admin';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Customer } from '@/types/admin';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchCustomers = useCallback(async (page = 1, searchOverride?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const q = searchOverride !== undefined ? searchOverride : debouncedSearch;
      if (q) params.search = q;
      const res = await adminApi.getCustomers(params);
      setCustomers(res.data || []); setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load customers'); } finally { setLoading(false); }
  }, [debouncedSearch]);

  useEffect(() => { fetchCustomers(1); }, [fetchCustomers]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">Customers</h1>
        <p className="text-sm text-slate mt-1">{pagination.total} customers</p>
      </div>

      <div className="relative max-w-md">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchCustomers(1, search)}
          placeholder="Search customers..." className="w-full rounded-lg border border-sage-light/40 bg-white pl-10 pr-4 py-2.5 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : customers.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No customers found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-light/30 bg-sage-light/5">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Customer</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Orders</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Reviews</th>
                  <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Joined</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/20">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-sage-light/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 flex-shrink-0 rounded-full bg-navy flex items-center justify-center text-xs font-bold text-ivory">
                          {c.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-navy">{c.name}</p>
                          <p className="text-xs text-slate">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-5 py-3 text-sm text-navy">{c._count?.orders || 0}</td>
                    <td className="hidden md:table-cell px-5 py-3 text-sm text-navy">{c._count?.reviews || 0}</td>
                    <td className="hidden lg:table-cell px-5 py-3 text-sm text-slate">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right"><Link href={`/admin/customers/${c.id}`} className="text-xs font-medium text-sage-dark hover:text-navy">View</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-sage-light/30 px-4 py-3">
            <span className="text-xs text-slate">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => fetchCustomers(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Prev</button>
              <button onClick={() => fetchCustomers(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
