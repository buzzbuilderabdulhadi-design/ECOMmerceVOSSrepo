'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { AdminOrder } from '@/types/admin';

const statusColors: Record<string, string> = {
  PENDING: 'bg-walnut/10 text-walnut', CONFIRMED: 'bg-navy-light/10 text-navy-light', PROCESSING: 'bg-navy/10 text-navy',
  SHIPPED: 'bg-sage-light/50 text-sage-dark', DELIVERED: 'bg-sage/20 text-sage-dark', CANCELLED: 'bg-red-100 text-red-700', RETURNED: 'bg-red-50 text-red-600',
};
const paymentColors: Record<string, string> = {
  PENDING: 'bg-walnut/10 text-walnut', PAID: 'bg-sage-light/50 text-sage-dark', FAILED: 'bg-red-100 text-red-700', REFUNDED: 'bg-slate/10 text-slate',
  PROCESSING: 'bg-navy-light/10 text-navy-light', CANCELLED: 'bg-slate/10 text-slate', AWAITING_VERIFICATION: 'bg-walnut/10 text-walnut',
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentStatus, setPaymentStatus] = useState(searchParams.get('paymentStatus') || '');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  const fetchOrders = useCallback(async (page = 1, searchOverride?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (status) params.status = status;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      const q = searchOverride !== undefined ? searchOverride : debouncedSearch;
      if (q) params.search = q;
      const res = await adminApi.getOrders(params);
      setOrders(res.data || []); setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load orders'); } finally { setLoading(false); }
  }, [status, paymentStatus, debouncedSearch]);

  useEffect(() => { void Promise.resolve().then(() => fetchOrders(1)); }, [fetchOrders]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">Orders</h1>
        <p className="text-sm text-slate mt-1">{pagination.total} orders total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchOrders(1, search)}
            placeholder="Search by order number..." className="w-full rounded-lg border border-sage-light/40 bg-white pl-10 pr-4 py-2.5 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="rounded-lg border border-sage-light/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PROCESSING">Processing</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)}
          className="rounded-lg border border-sage-light/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
          <option value="">All Payment</option>
          <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : orders.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No orders found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-light/30 bg-sage-light/5">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Order</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Customer</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Status</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Payment</th>
                  <th className="w-16 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/20">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-sage-light/5 transition-colors">
                    <td className="px-4 py-3"><Link href={`/admin/orders/${order.id}`} className="text-sm font-medium text-navy hover:text-sage-dark">{order.orderNumber}</Link></td>
                    <td className="hidden sm:table-cell px-4 py-3 text-sm text-slate">{order.user?.name || 'Unknown'}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-slate">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-navy">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status] || ''}`}>{order.status}</span></td>
                    <td className="hidden lg:table-cell px-4 py-3"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentColors[order.paymentStatus] || ''}`}>{order.paymentStatus}</span></td>
                    <td className="px-4 py-3 text-right"><Link href={`/admin/orders/${order.id}`} className="text-xs font-medium text-sage-dark hover:text-navy">View</Link></td>
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
              <button onClick={() => fetchOrders(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Prev</button>
              <button onClick={() => fetchOrders(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
