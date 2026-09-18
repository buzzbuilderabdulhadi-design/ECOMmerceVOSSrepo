'use client';

import { FiPackage, FiArrowRight } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';

export default function OrdersPage() {
  return (
    <DashboardLayout title="My Orders" subtitle="View and track your orders.">
      <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
          <FiPackage className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-light text-navy">No orders yet</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
          When you place an order, it will appear here with live tracking and delivery updates.
        </p>
        <Button href="/shop" className="mt-8" variant="walnut" size="md" rightIcon={<FiArrowRight className="h-4 w-4" />}>
            Explore the Collection
          </Button>
      </div>
    </DashboardLayout>
  );
}
