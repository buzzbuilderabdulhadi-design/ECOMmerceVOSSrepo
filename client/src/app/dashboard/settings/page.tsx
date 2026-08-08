'use client';

import { FiSettings } from 'react-icons/fi';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default function SettingsPage() {
  return (
    <DashboardLayout title="Settings" subtitle="Manage your account settings and preferences.">
      <div className="rounded-2xl border border-sage-light/30 bg-white p-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
          <FiSettings className="h-7 w-7" />
        </div>
        <h2 className="mt-6 font-display text-3xl font-light text-navy">Refining your settings</h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
          Notification controls and preferences are being refined. They will be available shortly.
        </p>
      </div>
    </DashboardLayout>
  );
}
