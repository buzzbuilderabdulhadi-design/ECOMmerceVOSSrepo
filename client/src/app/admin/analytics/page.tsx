'use client';

import React, { useState, useEffect } from 'react';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { SalesAnalytics, OrderAnalytics, ProductAnalytics, CustomerAnalytics, SalesDataPoint } from '@/types/admin';

export default function AdminAnalyticsPage() {
  const [sales, setSales] = useState<SalesAnalytics | null>(null);
  const [orders, setOrders] = useState<OrderAnalytics | null>(null);
  const [products, setProducts] = useState<ProductAnalytics | null>(null);
  const [customers, setCustomers] = useState<CustomerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminApi.getSalesAnalytics(parseInt(period)),
      adminApi.getOrderAnalytics(),
      adminApi.getProductAnalytics(),
      adminApi.getCustomerAnalytics(),
    ]).then(([s, o, p, c]) => { setSales(s); setOrders(o); setProducts(p); setCustomers(c); })
      .catch(err => toast.error(getErrorMessage(err) || 'Failed to load analytics')).finally(() => setLoading(false));
  }, [period]);

  if (loading) return <div className="space-y-5">{[1,2].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>;

  const revenueByDay: Record<string, number> = {};
  sales?.orders?.forEach((o: SalesDataPoint) => {
    const day = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    revenueByDay[day] = (revenueByDay[day] || 0) + o.total;
  });
  const maxRevenue = Math.max(...Object.values(revenueByDay) as number[], 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Analytics</h1>
          <p className="text-sm text-slate mt-1">Sales performance and insights</p>
        </div>
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="rounded-lg border border-sage-light/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">This Month Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display text-sage-dark">{formatPrice(sales?.revenue?.thisMonth || 0)}</p>
        </div>
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Last Month Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display text-navy">{formatPrice(sales?.revenue?.lastMonth || 0)}</p>
        </div>
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold font-display text-walnut">{formatPrice(orders?.totalRevenue || 0)}</p>
        </div>
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Customers</p>
          <p className="mt-2 text-2xl font-bold font-display text-navy">{customers?.total || 0}</p>
        </div>
      </div>

      {/* Revenue chart (simple bar) */}
      {Object.keys(revenueByDay).length > 0 && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Revenue Over Time</h2>
          <div className="flex items-end gap-1 h-48">
            {Object.entries(revenueByDay).slice(-14).map(([day, rev]) => (
              <div key={day} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full bg-sage/60 rounded-t" style={{ height: `${(rev / maxRevenue) * 100}%`, minHeight: 4 }} />
                <span className="text-[9px] text-slate">{day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order status breakdown */}
      {orders?.byStatus && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Orders by Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {orders.byStatus.map((s) => (
              <div key={s.status} className="rounded-lg border border-sage-light/20 p-3 text-center">
                <p className="text-xl font-bold font-display text-navy">{s._count}</p>
                <p className="text-[10px] uppercase tracking-wider text-slate mt-1">{s.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Product analytics */}
      {products && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Products</p>
            <p className="mt-2 text-2xl font-bold font-display text-navy">{products.total}</p>
          </div>
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">Active</p>
            <p className="mt-2 text-2xl font-bold font-display text-sage-dark">{products.active}</p>
          </div>
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">Low Stock</p>
            <p className="mt-2 text-2xl font-bold font-display text-walnut">{products.lowStock}</p>
          </div>
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">Out of Stock</p>
            <p className="mt-2 text-2xl font-bold font-display text-red-600">{products.outOfStock}</p>
          </div>
        </div>
      )}

      {/* Top products */}
      {sales?.topProducts && sales.topProducts.length > 0 && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Top Products</h2>
          <div className="divide-y divide-sage-light/20">
            {sales.topProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-navy">{p.name}</p>
                  <p className="text-xs text-slate">{p._count?.reviews || 0} reviews · {p._count?.orderItems || 0} orders</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer analytics */}
      {customers && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Customers</p>
            <p className="mt-2 text-2xl font-bold font-display text-navy">{customers.total}</p>
          </div>
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">New This Month</p>
            <p className="mt-2 text-2xl font-bold font-display text-sage-dark">{customers.newThisMonth}</p>
          </div>
          <div className="rounded-xl border border-sage-light/30 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-wider text-slate">With Orders</p>
            <p className="mt-2 text-2xl font-bold font-display text-walnut">{customers.withOrders}</p>
          </div>
        </div>
      )}
    </div>
  );
}
