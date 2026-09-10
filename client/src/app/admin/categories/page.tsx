'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { generateSlug } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Category as BaseCategory } from '@/types';

interface Category extends BaseCategory {
  _count?: { products: number };
  children?: Category[];
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', image: '', displayOrder: 0, isActive: true, parentId: '' });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try { const res = await adminApi.getCategories(); setCategories(res || []); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load categories'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => { setEditing(null); setForm({ name: '', slug: '', description: '', image: '', displayOrder: 0, isActive: true, parentId: '' }); setShowForm(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ name: cat.name, slug: cat.slug, description: cat.description || '', image: cat.image || '', displayOrder: cat.displayOrder, isActive: cat.isActive, parentId: cat.parentId || '' }); setShowForm(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...form, slug: form.slug || generateSlug(form.name), parentId: form.parentId || undefined };
      if (editing) { await adminApi.updateCategory(editing.id, data); }
      else { await adminApi.createCategory(data); }
      setShowForm(false); fetchCategories();
    } catch (err) { toast.error(getErrorMessage(err) || (editing ? 'Failed to update category' : 'Failed to create category')); } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteCategory(id); setShowDelete(null); fetchCategories(); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete category'); }
  };

  const parentCategories = categories.filter(c => !c.parentId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Categories</h1>
          <p className="text-sm text-slate mt-1">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Category
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-sage-light/20 animate-pulse" />)}</div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-sage-light/30 bg-white px-5 py-16 text-center">
          <p className="text-sm text-slate">No categories yet. Create your first category.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-light/30 bg-sage-light/5">
                  <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Category</th>
                  <th className="hidden sm:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Slug</th>
                  <th className="hidden md:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Products</th>
                  <th className="hidden lg:table-cell px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/20">
                {parentCategories.map(cat => (
                  <React.Fragment key={cat.id}>
                    <tr className="hover:bg-sage-light/5">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {cat.image && <img src={cat.image} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                          <span className="text-sm font-medium text-navy">{cat.name}</span>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell px-5 py-3 text-sm text-slate">{cat.slug}</td>
                      <td className="hidden md:table-cell px-5 py-3 text-sm text-navy">{cat._count?.products || 0}</td>
                      <td className="hidden lg:table-cell px-5 py-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${cat.isActive ? 'bg-sage-light/50 text-sage-dark' : 'bg-slate/10 text-slate'}`}>
                          {cat.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(cat)} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                          <button onClick={() => setShowDelete(cat.id)} className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                    {cat.children?.map(child => (
                      <tr key={child.id} className="bg-sage-light/5 hover:bg-sage-light/10">
                        <td className="px-5 py-3 pl-12">
                          <div className="flex items-center gap-2">
                            <svg className="h-3 w-3 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            <span className="text-sm text-navy">{child.name}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-5 py-3 text-sm text-slate">{child.slug}</td>
                        <td className="hidden md:table-cell px-5 py-3 text-sm text-navy">{child._count?.products || 0}</td>
                        <td className="hidden lg:table-cell px-5 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${child.isActive ? 'bg-sage-light/50 text-sage-dark' : 'bg-slate/10 text-slate'}`}>
                            {child.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(child)} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                            <button onClick={() => setShowDelete(child.id)} className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-navy">{editing ? 'Edit Category' : 'New Category'}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated from name"
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Image URL</label>
                <input type="text" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Display Order</label>
                  <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: parseInt(e.target.value) || 0 }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-navy">Parent Category</label>
                  <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                    <option value="">None (Top Level)</option>
                    {parentCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="h-4 w-4 rounded border-sage-light/60 text-navy" />
                <span className="text-sm text-navy">Active (visible on store)</span>
              </label>
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
            <h3 className="text-lg font-semibold text-navy">Delete Category</h3>
            <p className="mt-2 text-sm text-slate">Are you sure? Products in this category will be unlinked.</p>
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
