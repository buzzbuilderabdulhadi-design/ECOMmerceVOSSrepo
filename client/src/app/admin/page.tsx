'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface DashboardStats {
  stats: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalRevenue: number;
    pendingOrders: number;
    lowStockProducts: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user: { name: string; email: string };
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentReviews: Array<{
    id: string;
    rating: number;
    title?: string;
    text?: string;
    isApproved: boolean;
    createdAt: string;
    user: { name: string };
    product: { name: string };
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-walnut/10 text-walnut',
  CONFIRMED: 'bg-navy-light/10 text-navy-light',
  PROCESSING: 'bg-navy/10 text-navy',
  SHIPPED: 'bg-sage-light/50 text-sage-dark',
  DELIVERED: 'bg-sage/20 text-sage-dark',
  CANCELLED: 'bg-red-100 text-red-700',
  RETURNED: 'bg-red-50 text-red-600',
};

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  const stats = data?.stats;

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats?.totalRevenue || 0), href: '/admin/analytics', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-sage-dark' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, href: '/admin/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2', color: 'text-navy' },
    { label: 'Customers', value: stats?.totalCustomers || 0, href: '/admin/customers', icon: 'M12 4.354a4 4 0 110 7.292 4 4 0 010-7.292zM15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'text-walnut' },
    { label: 'Products', value: stats?.totalProducts || 0, href: '/admin/products', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4', color: 'text-gold' },
  ];

  const quickStats = [
    { label: 'Pending Orders', value: stats?.pendingOrders || 0, href: '/admin/orders?status=PENDING', color: 'text-walnut' },
    { label: 'Low Stock', value: stats?.lowStockProducts || 0, href: '/admin/products?status=lowStock', color: 'text-red-600' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">Dashboard</h1>
        <p className="text-sm text-slate mt-1">Welcome back. Here&apos;s your store overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link href={card.href} className="block rounded-xl border border-sage-light/30 bg-white p-5 hover:shadow-lg hover:shadow-sage/5 transition-all duration-200 group">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate">{card.label}</p>
                  <p className={`mt-2 text-2xl font-bold font-display ${card.color}`}>{card.value}</p>
                </div>
                <div className={`rounded-lg bg-sage-light/20 p-2 ${card.color}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={card.icon} />
                  </svg>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xs text-sage-dark group-hover:text-navy">
                <span>View details</span>
                <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickStats.map((qs) => (
          <Link key={qs.label} href={qs.href} className="flex items-center justify-between rounded-xl border border-sage-light/30 bg-white p-4 hover:shadow-md transition-all">
            <span className="text-sm font-medium text-slate">{qs.label}</span>
            <span className={`text-xl font-bold font-display ${qs.color}`}>{qs.value}</span>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-sage-light/30 bg-white">
        <div className="flex items-center justify-between border-b border-sage-light/30 px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-medium text-sage-dark hover:text-navy">View all</Link>
        </div>
        {data?.recentOrders?.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate">No orders yet</div>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {data?.recentOrders?.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-sage-light/5 transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy truncate">{order.user?.name || 'Unknown'}</p>
                  <p className="text-xs text-slate">{order.orderNumber}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                  <span className="text-sm font-medium text-navy">{formatPrice(order.total)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Reviews */}
      <div className="rounded-xl border border-sage-light/30 bg-white">
        <div className="flex items-center justify-between border-b border-sage-light/30 px-5 py-4">
          <h2 className="text-sm font-semibold text-navy">Recent Reviews</h2>
          <Link href="/admin/reviews" className="text-xs font-medium text-sage-dark hover:text-navy">View all</Link>
        </div>
        {data?.recentReviews?.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate">No reviews yet</div>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {data?.recentReviews?.map((review) => (
              <div key={review.id} className="px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map(s => (
                      <svg key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-gold' : 'text-sage-light/40'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-slate">{review.user?.name}</span>
                  <span className="text-xs text-slate/50">on</span>
                  <span className="text-xs font-medium text-navy">{review.product?.name}</span>
                </div>
                {review.title && <p className="mt-1 text-sm font-medium text-navy">{review.title}</p>}
                {review.text && <p className="mt-0.5 text-xs text-slate line-clamp-2">{review.text}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
