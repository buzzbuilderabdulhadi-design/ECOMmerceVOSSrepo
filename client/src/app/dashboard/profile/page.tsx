'use client';

import { FiUser } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function ProfilePage() {
  return (
    <DashboardLayout title="Profile" subtitle="Update your personal information.">
      <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
          <FiUser className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-light text-navy">Refining your profile</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
          Profile management is being refined to match the VOSS standard. It will be available shortly.
        </p>
      </div>
    </DashboardLayout>
  );
}
