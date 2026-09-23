'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';

interface HomepageContent {
  id: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

export default function AdminHomepageContentPage() {
  const [sections, setSections] = useState<HomepageContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formKey, setFormKey] = useState('');
  const [formValue, setFormValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createKey, setCreateKey] = useState('');
  const [createValue, setCreateValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    try {
      const data = await adminApi.getHomepageContent();
      setSections(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load homepage content');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  const stringifyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  };

  const parseValue = (raw: string): unknown => {
    const trimmed = raw.trim();
    if (trimmed === '') return {};
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  };

  const startEdit = (section: HomepageContent) => {
    setEditing(section.id);
    setFormKey(section.key);
    setFormValue(stringifyValue(section.value));
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminApi.updateHomepageContent(editing, { key: formKey, value: parseValue(formValue) });
      toast.success('Section updated');
      setEditing(null);
      loadContent();
    } catch {
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!createKey.trim()) {
      toast.error('Key is required');
      return;
    }
    setSaving(true);
    try {
      await adminApi.createHomepageContent({ key: createKey.trim(), value: parseValue(createValue) });
      toast.success('Section created');
      setShowCreate(false);
      setCreateKey('');
      setCreateValue('');
      loadContent();
    } catch {
      toast.error('Failed to create');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteHomepageContent(id);
      toast.success('Section deleted');
      setSections(prev => prev.filter(s => s.id !== id));
      setDeleteId(null);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Homepage Content</h1>
          <p className="text-sm text-slate mt-1">Manage homepage content blocks by key</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
          Add Section
        </button>
      </div>

      {showCreate && (
        <div className="rounded-xl border border-sage-light/30 bg-white p-6 space-y-4">
          <h3 className="text-lg font-semibold text-navy">New Content Block</h3>
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Key *</label>
              <input type="text" value={createKey} onChange={e => setCreateKey(e.target.value)}
                placeholder="e.g. hero_banner, featured_collections"
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Value (JSON)</label>
              <textarea value={createValue} onChange={e => setCreateValue(e.target.value)} rows={6}
                placeholder="{ &quot;title&quot;: &quot;...&quot;, &quot;subtitle&quot;: &quot;...&quot; }"
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none" />
              <p className="mt-1 text-xs text-slate">Accepts JSON object, array, or plain text</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreate} disabled={saving}
              className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light disabled:opacity-50 transition-colors">
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => setShowCreate(false)} className="rounded-full border border-sage-light/40 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-navy hover:bg-sage-light/10 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {sections.length === 0 ? (
        <div className="rounded-xl border border-sage-light/30 bg-white p-12 text-center">
          <p className="text-slate">No homepage content yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sections.map(section => (
            <div key={section.id} className="rounded-xl border border-sage-light/30 bg-white">
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-navy">{section.key}</p>
                  <p className="text-xs text-slate mt-0.5 truncate max-w-md">{stringifyValue(section.value)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => editing === section.id ? setEditing(null) : startEdit(section)}
                    className="rounded-full border border-sage-light/40 px-3 py-1.5 text-xs font-medium text-navy hover:bg-sage-light/10 transition-colors">
                    {editing === section.id ? 'Cancel' : 'Edit'}
                  </button>
                  <button onClick={() => setDeleteId(section.id)}
                    className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
              {editing === section.id && (
                <div className="border-t border-sage-light/30 px-5 py-4 space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">Key</label>
                    <input type="text" value={formKey} onChange={e => setFormKey(e.target.value)}
                      className="w-full max-w-md rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-navy">Value (JSON)</label>
                    <textarea value={formValue} onChange={e => setFormValue(e.target.value)} rows={8}
                      className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm font-mono focus:border-navy focus:outline-none" />
                  </div>
                  <button onClick={handleUpdate} disabled={saving}
                    className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light disabled:opacity-50 transition-colors">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Section"
        message="Are you sure you want to delete this homepage content section?"
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
