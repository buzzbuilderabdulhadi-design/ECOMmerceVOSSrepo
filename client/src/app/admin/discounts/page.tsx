'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Coupon } from '@/types';
import { CouponForm } from '@/types/admin';

export default function AdminDiscountsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>({ code: '', type: 'PERCENTAGE', value: 0, isActive: true, expiresAt: '' });

  const fetchCoupons = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getCoupons({ page: String(page), limit: '20' });
      setCoupons(res.data || []); setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load discounts'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCoupons(1); }, [fetchCoupons]);

  const openCreate = () => { setEditing(null); setForm({ code: '', type: 'PERCENTAGE', value: 0, isActive: true, expiresAt: '' }); setShowForm(true); };
  const openEdit = (c: Coupon) => { setEditing(c); setForm({ code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount, maxUses: c.maxUses, isActive: c.isActive, expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split('T')[0] : '' }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data: Partial<Coupon> = { ...form, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined, maxUses: form.maxUses || undefined, minOrderAmount: form.minOrderAmount || undefined };
      if (editing) { await adminApi.updateCoupon(editing.id, data); }
      else { await adminApi.createCoupon(data); }
      setShowForm(false); fetchCoupons(pagination.page);
    } catch (err) { toast.error(getErrorMessage(err) || (editing ? 'Failed to update discount' : 'Failed to create discount')); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteCoupon(id); setShowDelete(null); fetchCoupons(pagination.page); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete discount'); }
  };

  const toggleActive = async (coupon: Coupon) => {
    try { await adminApi.updateCoupon(coupon.id, { isActive: !coupon.isActive }); setCoupons(cs => cs.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c)); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update discount status'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Discounts</h1>
          <p className="text-sm text-slate mt-1">{pagination.total} coupon codes</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Discount
        </button>
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No discount codes yet</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-light/30 bg-sage-light/5">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Code</th>
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Discount</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Min Order</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Uses</th>
                  <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Expires</th>
                  <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/20">
                {coupons.map(c => (
                  <tr key={c.id} className="hover:bg-sage-light/5">
                    <td className="px-5 py-3"><span className="font-mono text-sm font-medium text-navy">{c.code}</span></td>
                    <td className="px-5 py-3 text-sm text-navy">{c.type === 'PERCENTAGE' ? `${c.value}%` : formatPrice(c.value)}</td>
                    <td className="hidden sm:table-cell px-5 py-3 text-sm text-slate">{c.minOrderAmount ? formatPrice(c.minOrderAmount) : '-'}</td>
                    <td className="hidden md:table-cell px-5 py-3 text-sm text-slate">{c.usedCount}{c.maxUses ? `/${c.maxUses}` : ''}</td>
                    <td className="hidden lg:table-cell px-5 py-3 text-sm text-slate">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : 'Never'}</td>
                    <td className="hidden lg:table-cell px-5 py-3">
                      <button onClick={() => toggleActive(c)} className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${c.isActive ? 'bg-sage-light/50 text-sage-dark hover:bg-sage-light/70' : 'bg-slate/10 text-slate hover:bg-slate/20'}`}>
                        {c.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                        <button onClick={() => setShowDelete(c.id)} className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-navy">{editing ? 'Edit Discount' : 'New Discount'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Code *</label>
                <input type="text" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm font-mono uppercase focus:border-navy focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Type *</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as CouponForm['type'] }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Value *</label>
                  <input type="number" required min="0" step="0.01" value={form.value} onChange={e => setForm(f => ({ ...f, value: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Min Order Amount</label>
                  <input type="number" min="0" step="0.01" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: parseFloat(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Max Uses</label>
                  <input type="number" min="0" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Expiration Date</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-sage-light/60 text-navy" />
                    <span className="text-sm text-navy">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDelete(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-navy">Delete Discount</h3>
            <p className="mt-2 text-sm text-slate">Are you sure you want to delete this coupon code?</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowDelete(null)} className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10">Cancel</button>
              <button onClick={() => showDelete && handleDelete(showDelete)} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
