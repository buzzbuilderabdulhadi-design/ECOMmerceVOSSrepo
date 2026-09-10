'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { CustomerDetail } from '@/types/admin';
import { Order, Address } from '@/types';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      adminApi.getCustomer(params.id as string).then(setCustomer).catch(err => toast.error(getErrorMessage(err) || 'Failed to load customer')).finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (!customer) return <div className="text-center py-16 text-sm text-slate">Customer not found</div>;

  const totalSpent = (customer as any)._stats?.totalSpent ?? (customer.orders?.reduce((sum: number, o: Order) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0) || 0);
  const orderCount = (customer as any)._stats?.orderCount ?? (customer.orders?.length ?? 0);
  const reviewCount = (customer as any)._stats?.reviewCount ?? (customer.reviews?.length ?? 0);

  return (
    <div className="space-y-5">
      <div>
        <button onClick={() => router.back()} className="text-sm text-slate hover:text-navy mb-1">&larr; Back to customers</button>
        <h1 className="text-2xl font-display font-semibold text-navy">{customer.name}</h1>
        <p className="text-sm text-slate">{customer.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Orders</p>
          <p className="mt-1 text-2xl font-bold font-display text-navy">{orderCount}</p>
        </div>
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Total Spent</p>
          <p className="mt-1 text-2xl font-bold font-display text-sage-dark">{formatPrice(totalSpent)}</p>
        </div>
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate">Reviews</p>
          <p className="mt-1 text-2xl font-bold font-display text-walnut">{reviewCount}</p>
        </div>
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white p-5">
        <h2 className="text-sm font-semibold text-navy mb-4">Order History</h2>
        {customer.orders?.length === 0 ? (
          <p className="text-sm text-slate">No orders yet</p>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {customer.orders?.map((order: Order) => (
              <div key={order.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-slate">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-navy">{formatPrice(order.total)}</p>
                  <p className={`text-xs font-medium ${order.status === 'DELIVERED' ? 'text-sage-dark' : order.status === 'CANCELLED' ? 'text-red-600' : 'text-walnut'}`}>{order.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {customer.addresses && customer.addresses.length > 0 && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-5">
          <h2 className="text-sm font-semibold text-navy mb-4">Addresses</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customer.addresses?.map((addr: Address) => (
              <div key={addr.id} className="rounded-lg border border-sage-light/20 p-3 text-sm">
                <p className="font-medium text-navy">{addr.label || addr.fullName}</p>
                <p className="text-slate">{addr.line1}</p>
                {addr.line2 && <p className="text-slate">{addr.line2}</p>}
                <p className="text-slate">{addr.city}, {addr.state} {addr.zip}</p>
                <p className="text-slate">{addr.country}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
