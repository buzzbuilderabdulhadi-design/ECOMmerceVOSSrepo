'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { useAuth } from '@/context/AuthContext';
import { fetchOrders } from '@/services/orders';
import type { Order } from '@/types';
import {
  FiShoppingBag,
  FiClock,
  FiHeart,
  FiStar,
  FiUser,
  FiMapPin,
} from 'react-icons/fi';

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    DELIVERED: 'bg-sage-light/50 text-sage-dark',
    SHIPPED: 'bg-navy-light/10 text-navy-light',
    PROCESSING: 'bg-walnut/10 text-walnut',
    PENDING: 'bg-walnut/10 text-walnut',
    CONFIRMED: 'bg-sage-light/50 text-sage-dark',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${colorMap[status] || 'bg-slate/10 text-slate'}`}>
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    fetchOrders({ limit: '3', sort: '-createdAt' })
      .then((res) => {
        setOrders(Array.isArray(res.data) ? res.data : []);
        setTotalOrders(res.pagination?.total ?? 0);
      })
      .catch(() => {});
  }, []);

  const activeOrders = orders.filter(
    (o) => o.status === 'PROCESSING' || o.status === 'SHIPPED' || o.status === 'PENDING' || o.status === 'CONFIRMED'
  ).length;

  const firstName = user?.name?.split(' ')[0] || 'there';

  const statCards = [
    { label: 'Total Orders', value: String(totalOrders), icon: FiShoppingBag, color: 'text-sage-dark bg-sage-light/40' },
    { label: 'Active Orders', value: String(activeOrders), icon: FiClock, color: 'text-walnut bg-walnut/10' },
    { label: 'Wishlist', value: '—', icon: FiHeart, color: 'text-navy-light bg-navy-light/10' },
    { label: 'Reviews', value: '—', icon: FiStar, color: 'text-sage-dark bg-sage-light/40' },
  ];

  return (
    <DashboardLayout title={`Welcome back, ${firstName}`} subtitle="Here is your account overview.">
      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const StatIcon = stat.icon;
          return (
            <ScrollReveal key={stat.label} delay={index * 0.05}>
              <motion.div
                whileHover={{ y: -3 }}
                className="rounded-2xl border border-sage-light/30 bg-white p-6 transition-all hover:border-sage/30 hover:shadow-md"
              >
                <div className={`mb-4 inline-flex rounded-lg p-3 ${stat.color}`}>
                  <StatIcon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-navy">{stat.value}</p>
                <p className="mt-1 text-sm text-slate">{stat.label}</p>
              </motion.div>
            </ScrollReveal>
          );
        })}
      </div>

      {/* Recent Orders */}
      <ScrollReveal>
        <div className="rounded-xl border border-sage-light/30 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl font-light text-navy">Recent Orders</h2>
            <Link href="/dashboard/orders" className="link-underline text-xs font-medium uppercase tracking-[0.15em] text-walnut transition-colors hover:text-walnut-light">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {orders.length === 0 && (
              <p className="py-4 text-center text-sm text-slate">No orders yet. Start shopping to see them here.</p>
            )}
            {orders.map((order) => (
              <div key={order.id} className="flex items-center justify-between border-b border-sage-light/30 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-navy">#{order.orderNumber}</p>
                  <p className="text-xs text-slate">{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">${order.total.toFixed(2)}</p>
                  <StatusBadge status={order.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Quick Links */}
      <ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/dashboard/profile" className="group rounded-xl border border-sage-light/30 bg-white p-6 transition-all hover:border-sage/30 hover:shadow-md">
            <FiUser className="mb-3 h-6 w-6 text-slate transition-colors group-hover:text-sage-dark" />
            <h3 className="font-display text-xl font-light text-navy">Edit Profile</h3>
            <p className="mt-1 text-sm text-slate">Update your personal information</p>
          </Link>
          <Link href="/dashboard/addresses" className="group rounded-xl border border-sage-light/30 bg-white p-6 transition-all hover:border-sage/30 hover:shadow-md">
            <FiMapPin className="mb-3 h-6 w-6 text-slate transition-colors group-hover:text-sage-dark" />
            <h3 className="font-display text-xl font-light text-navy">Manage Addresses</h3>
            <p className="mt-1 text-sm text-slate">Add or update shipping addresses</p>
          </Link>
        </div>
      </ScrollReveal>
    </DashboardLayout>
  );
}
