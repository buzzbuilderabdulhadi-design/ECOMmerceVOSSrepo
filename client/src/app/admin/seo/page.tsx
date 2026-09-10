'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import toast from 'react-hot-toast';

interface SeoEntry {
  id: string;
  page: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  noindex: boolean;
}

interface SeoForm {
  metaTitle: string;
  metaDescription: string;
  keywords: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
  noindex: boolean;
}

export default function AdminSeoPage() {
  const [entries, setEntries] = useState<SeoEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<SeoForm>({
    metaTitle: '',
    metaDescription: '',
    keywords: '',
    canonicalUrl: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: '',
    noindex: false,
  });
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    try {
      const data = await adminApi.getSeoEntries();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load SEO entries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const startEdit = (entry: SeoEntry) => {
    setEditing(entry.page);
    setForm({
      metaTitle: entry.metaTitle || '',
      metaDescription: entry.metaDescription || '',
      keywords: entry.keywords || '',
      canonicalUrl: entry.canonicalUrl || '',
      ogTitle: entry.ogTitle || '',
      ogDescription: entry.ogDescription || '',
      ogImage: entry.ogImage || '',
      twitterCard: entry.twitterCard || '',
      noindex: entry.noindex || false,
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.updateSeoEntry(editing, form as unknown as Record<string, unknown>);
      toast.success('SEO updated');
      setEditing(null);
      loadEntries();
    } catch {
      toast.error('Failed to update SEO');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">SEO Management</h1>
        <p className="text-sm text-slate mt-1">Manage meta tags and SEO for each page</p>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-sage-light/30 bg-white p-12 text-center">
          <p className="text-slate">No SEO entries yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <div key={entry.page} className="rounded-xl border border-sage-light/30 bg-white">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-navy capitalize">{entry.page}</p>
                  <p className="text-xs text-slate mt-0.5">{entry.metaTitle || 'No meta title set'}</p>
                </div>
                <button onClick={() => editing === entry.page ? setEditing(null) : startEdit(entry)}
                  className="rounded-full border border-sage-light/40 px-4 py-1.5 text-xs font-medium text-navy hover:bg-sage-light/10 transition-colors">
                  {editing === entry.page ? 'Cancel' : 'Edit'}
                </button>
              </div>
              {editing === entry.page && (
                <div className="border-t border-sage-light/30 px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">Meta Title</label>
                      <input type="text" value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">Keywords</label>
                      <input type="text" value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                        placeholder="comma, separated" className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">Meta Description</label>
                    <textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} rows={2}
                      className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">Canonical URL</label>
                      <input type="url" value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))}
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">OG Image URL</label>
                      <input type="url" value={form.ogImage} onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))}
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">OG Title</label>
                      <input type="text" value={form.ogTitle} onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))}
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">OG Description</label>
                      <input type="text" value={form.ogDescription} onChange={e => setForm(f => ({ ...f, ogDescription: e.target.value }))}
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-navy">Twitter Card</label>
                      <input type="text" value={form.twitterCard} onChange={e => setForm(f => ({ ...f, twitterCard: e.target.value }))}
                        placeholder="summary_large_image"
                        className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                    </div>
                    <div className="flex items-end pb-1">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={form.noindex} onChange={e => setForm(f => ({ ...f, noindex: e.target.checked }))} className="h-4 w-4 rounded border-sage-light/60 text-navy" />
                        <span className="text-sm text-navy">No Index</span>
                      </label>
                    </div>
                  </div>
                  <button onClick={handleSave} disabled={saving}
                    className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light disabled:opacity-50 transition-colors">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
