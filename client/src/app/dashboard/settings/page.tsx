'use client';

import React, { useState } from 'react';
import { FiShield, FiAlertTriangle, FiUserX } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { deleteAccount } from '@/services/profile';
import { useAuth } from '@/context/AuthContext';

// ============================================================
// Settings — account preferences & account deletion
// ============================================================

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
      await logout();
      router.push('/');
      toast.success('Your account has been deleted.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  return (
    <DashboardLayout title="Settings" subtitle="Manage your account settings and preferences.">
      <div className="space-y-6">
        {/* Account summary */}
        <div className="rounded-2xl border border-sage-light/30 bg-white p-6">
          <h2 className="font-display text-2xl font-light text-navy">Account</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate">Name</p>
              <p className="mt-1 text-sm font-medium text-navy">{user?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate">Email</p>
              <p className="mt-1 text-sm font-medium text-navy">{user?.email ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-slate">Member Since</p>
              <p className="mt-1 text-sm font-medium text-navy">{memberSince}</p>
            </div>
          </div>
        </div>

        {/* Account security notice */}
        <div className="flex items-start gap-3 rounded-2xl border border-sage-light/30 bg-sage-light/20 p-6">
          <FiShield className="mt-0.5 h-5 w-5 flex-shrink-0 text-sage-dark" />
          <div>
            <h2 className="font-display text-lg font-medium text-navy">Security</h2>
            <p className="mt-1 text-sm text-slate">
              You can change your password and update your contact details from the Profile page. We store your password
              securely and never share your information.
            </p>
          </div>
        </div>

        {/* Danger zone */}
        <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-100 p-2.5 text-red-600">
              <FiAlertTriangle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-xl font-medium text-navy">Delete Account</h2>
              <p className="mt-1 max-w-xl text-sm text-slate">
                Permanently delete your account and all associated data. This action cannot be undone, including access
                to your order history, saved addresses, and wishlist.
              </p>
              <Button
                type="button"
                variant="danger"
                size="md"
                className="mt-4"
                onClick={() => setConfirmOpen(true)}
                leftIcon={<FiUserX className="h-4 w-4" />}
              >
                Delete My Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete your account?"
        message="This permanently removes your account, orders, addresses and wishlist. This cannot be undone."
        confirmLabel="Delete Account"
        cancelLabel="Cancel"
        destructive
        loading={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmOpen(false)}
      />
    </DashboardLayout>
  );
}