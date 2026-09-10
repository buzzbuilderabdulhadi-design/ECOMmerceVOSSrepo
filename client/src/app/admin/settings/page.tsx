'use client';

import React, { useState, useEffect } from 'react';
import adminApi from '@/services/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string | number | boolean | undefined>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('store');

  useEffect(() => {
    adminApi.getSettings().then(setSettings).catch(() => toast.error('Failed to load settings')).finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string | number | boolean) => setSettings(s => ({ ...s, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSettings(settings);
      setSaved(true);
      toast.success('Settings saved successfully');
      setTimeout(() => setSaved(false), 2000);
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  const tabs = [
    { id: 'store', label: 'Store' },
    { id: 'currency', label: 'Currency' },
    { id: 'tax', label: 'Tax' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'social', label: 'Social' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Settings</h1>
          <p className="text-sm text-slate mt-1">Configure your store settings</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light disabled:opacity-50 transition-colors">
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex gap-1 border-b border-sage-light/30">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-b-2 border-sage text-sage-dark' : 'text-slate hover:text-navy'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white p-6">
        {activeTab === 'store' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Store Name</label>
              <input type="text" value={(settings.storeName as string) || ''} onChange={e => update('storeName', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Store Description</label>
              <textarea value={(settings.storeDescription as string) || ''} onChange={e => update('storeDescription', e.target.value)} rows={3}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Logo URL</label>
              <input type="text" value={(settings.storeLogo as string) || ''} onChange={e => update('storeLogo', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Contact Email</label>
              <input type="email" value={(settings.contactEmail as string) || ''} onChange={e => update('contactEmail', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Contact Phone</label>
              <input type="text" value={(settings.contactPhone as string) || ''} onChange={e => update('contactPhone', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="space-y-5 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Currency</label>
                <input type="text" value={(settings.currency as string) || 'USD'} onChange={e => update('currency', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Currency Symbol</label>
                <input type="text" value={(settings.currencySymbol as string) || '$'} onChange={e => update('currencySymbol', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tax' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Tax Percentage (%)</label>
              <input type="number" min="0" max="100" step="0.1" value={(settings.taxPercentage as number) || 0} onChange={e => update('taxPercentage', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={Boolean(settings.taxEnabled)} onChange={e => update('taxEnabled', e.target.checked)} className="h-4 w-4 rounded border-sage-light/60 text-navy" />
              <span className="text-sm text-navy">Enable tax calculation</span>
            </label>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Free Shipping Threshold ($)</label>
              <input type="number" min="0" step="0.01" value={(settings.freeShippingThreshold as number) || 150} onChange={e => update('freeShippingThreshold', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              <p className="mt-1 text-xs text-slate">Orders above this amount get free shipping</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Default Shipping Rate ($)</label>
              <input type="number" min="0" step="0.01" value={(settings.defaultShippingRate as number) || 0} onChange={e => update('defaultShippingRate', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
          </div>
        )}

        {activeTab === 'social' && (
          <div className="space-y-5 max-w-2xl">
            {['instagram', 'facebook', 'tiktok', 'youtube', 'twitter'].map(platform => (
              <div key={platform}>
                <label className="mb-1 block text-sm font-medium text-navy capitalize">{platform}</label>
                <input type="url" value={(settings[`social_${platform}`] as string) || ''} onChange={e => update(`social_${platform}`, e.target.value)}
                  placeholder={`https://${platform}.com/...`}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
