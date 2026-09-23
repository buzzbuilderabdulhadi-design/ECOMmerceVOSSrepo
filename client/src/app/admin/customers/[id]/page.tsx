'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { CustomerDetail } from '@/types/admin';
import { Order, Address } from '@/types';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', emailVerified: false });

  const loadCustomer = useCallback(async () => {
    if (!params.id) return;
    try {
      const c = await adminApi.getCustomer(params.id as string);
      setCustomer(c);
      setEditForm({ name: c.name || '', phone: c.phone || '', emailVerified: Boolean(c.emailVerified) });
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setNotFound(true);
      else toast.error(getErrorMessage(err) || 'Failed to load customer');
    } finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { loadCustomer(); }, [loadCustomer]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await adminApi.updateCustomer(customer.id, {
        name: editForm.name,
        phone: editForm.phone,
        emailVerified: editForm.emailVerified,
      });
      toast.success('Customer updated');
      setEditOpen(false);
      await loadCustomer();
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update customer'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!customer) return;
    setDeleting(true);
    try {
      await adminApi.deleteCustomer(customer.id);
      toast.success('Customer deleted');
      router.push('/admin/customers');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete customer'); } finally { setDeleting(false); }
  };

  if (loading) return <div className="space-y-4"><Skeleton className="h-40 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-20 text-center">
        <p className="text-sm font-medium text-red-700">Customer not found</p>
        <p className="mt-1 text-xs text-red-500">It may have been deleted or this is an invalid customer ID.</p>
        <Link href="/admin/customers" className="mt-4 rounded-lg bg-navy px-4 py-2 text-xs font-medium text-ivory hover:bg-navy-light transition-colors">Back to customers</Link>
      </div>
    );
  }
  if (!customer) return <div className="text-center py-16 text-sm text-slate">Customer not found</div>;

  const totalSpent = customer._stats?.totalSpent ?? (customer.orders?.reduce((sum: number, o: Order) => sum + (o.paymentStatus === 'PAID' ? o.total : 0), 0) || 0);
  const orderCount = customer._stats?.orderCount ?? (customer.orders?.length ?? 0);
  const reviewCount = customer._stats?.reviewCount ?? (customer.reviews?.length ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate hover:text-navy mb-1">&larr; Back to customers</button>
          <h1 className="text-2xl font-display font-semibold text-navy">{customer.name}</h1>
          <p className="text-sm text-slate">{customer.email}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Edit
          </button>
          <button onClick={() => setDeleteOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete
          </button>
        </div>
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

      {/* Edit customer modal */}
      <Modal open={editOpen} title="Edit Customer" onClose={() => setEditOpen(false)}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Name</label>
            <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-navy">Phone</label>
            <input type="text" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={editForm.emailVerified} onChange={e => setEditForm(f => ({ ...f, emailVerified: e.target.checked }))}
              className="h-4 w-4 rounded border-sage-light/60 text-navy" />
            <span className="text-sm text-navy">Email verified</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditOpen(false)} className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Customer"
        message={`Are you sure you want to delete ${customer.name}? Customers with order history cannot be deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
