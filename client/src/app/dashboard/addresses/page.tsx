'use client';

import Link from 'next/link';
import { FiMapPin, FiArrowRight } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';

export default function AddressesPage() {
  return (
    <DashboardLayout title="Addresses" subtitle="Manage your shipping and billing addresses.">
      <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
          <FiMapPin className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-light text-navy">No saved addresses</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
          Add a shipping address to enjoy a swifter, more seamless checkout experience.
        </p>
        <Link href="/contact" className="mt-8 inline-block">
          <Button variant="walnut" size="md" rightIcon={<FiArrowRight className="h-4 w-4" />}>
            Add an Address
          </Button>
        </Link>
      </div>
    </DashboardLayout>
  );
}
