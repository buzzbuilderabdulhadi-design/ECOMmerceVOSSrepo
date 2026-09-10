'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { generateSlug } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Category } from '@/types';

interface ProductForm {
  name: string; slug: string; sku: string; description: string; shortDescription: string;
  material: string; brand: string; categoryId: string; subcategoryId: string;
  regularPrice: number; salePrice: number; discountPercent: number;
  stock: number; lowStockThreshold: number;
  images: Array<{ url: string; alt?: string } | string>; tags: string[];
  isNew: boolean; isBestSeller: boolean; isFeatured: boolean; isLimitedEdition: boolean; isActive: boolean;
  seoTitle: string; seoDescription: string;
  specifications: Record<string, string>;
}

type ProductFormValue =
  | string
  | number
  | boolean
  | string[]
  | Array<{ url: string; alt?: string } | string>
  | Record<string, string>;

const emptyForm: ProductForm = {
  name: '', slug: '', sku: '', description: '', shortDescription: '',
  material: '', brand: '', categoryId: '', subcategoryId: '',
  regularPrice: 0, salePrice: 0, discountPercent: 0,
  stock: 0, lowStockThreshold: 5,
  images: [], tags: [],
  isNew: false, isBestSeller: false, isFeatured: false, isLimitedEdition: false, isActive: true,
  seoTitle: '', seoDescription: '',
  specifications: {},
};

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const isNew = params.id === 'new';
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    adminApi.getCategories().then(setCategories).catch(err => toast.error(getErrorMessage(err) || 'Failed to load categories'));
    if (!isNew && params.id) {
      adminApi.getProduct(params.id as string).then(p => {
        setForm({
          name: p.name || '', slug: p.slug || '', sku: p.sku || '', description: p.description || '',
          shortDescription: p.shortDescription || '', material: p.material || '', brand: p.brand || '',
          categoryId: p.categoryId || '', subcategoryId: p.subcategoryId || '',
          regularPrice: p.regularPrice || 0, salePrice: p.salePrice || 0, discountPercent: p.discountPercent || 0,
          stock: p.stock || 0, lowStockThreshold: p.lowStockThreshold || 5,
          images: p.images || [], tags: p.tags || [],
          isNew: p.isNew || false, isBestSeller: p.isBestSeller || false, isFeatured: p.isFeatured || false,
          isLimitedEdition: p.isLimitedEdition || false, isActive: p.isActive ?? true,
          seoTitle: p.seoTitle || '', seoDescription: p.seoDescription || '',
          specifications: p.specifications || {},
        });
      }).catch(err => toast.error(getErrorMessage(err) || 'Failed to load product')).finally(() => setLoading(false));
    }
  }, [isNew, params.id]);

  const update = (key: keyof ProductForm, value: ProductFormValue) => setForm(f => ({ ...f, [key]: value }));

  const handleSave = async (asDraft = false) => {
    if (asDraft) setSavingDraft(true); else setSaving(true);
    try {
      const data = {
        ...form,
        slug: form.slug || generateSlug(form.name),
        images: form.images.length > 0 ? form.images : undefined,
        tags: form.tags.length > 0 ? form.tags : undefined,
        salePrice: form.salePrice || undefined,
        discountPercent: form.discountPercent || undefined,
        subcategoryId: form.subcategoryId || undefined,
        specifications: Object.keys(form.specifications).length > 0 ? form.specifications : undefined,
        isActive: asDraft ? false : form.isActive,
      };
      if (isNew) {
        const res = await adminApi.createProduct(data);
        router.push(`/admin/products/${res.data?.id || ''}`);
      } else {
        await adminApi.updateProduct(params.id as string, data);
      }
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to save product'); } finally { setSaving(false); setSavingDraft(false); }
  };

  const addImage = () => {
    if (imageUrl.trim()) {
      update('images', [...form.images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const removeImage = (index: number) => update('images', form.images.filter((_, i) => i !== index));

  const addSpec = () => {
    if (specKey.trim() && specValue.trim()) {
      update('specifications', { ...form.specifications, [specKey.trim()]: specValue.trim() });
      setSpecKey(''); setSpecValue('');
    }
  };

  const removeSpec = (key: string) => {
    const specs = { ...form.specifications };
    delete specs[key];
    update('specifications', specs);
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags.includes(tagInput.trim())) {
      update('tags', [...form.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const parentCategories = categories.filter((c: Category) => !c.parentId);
  const subcategories = parentCategories.find((c: Category) => c.id === form.categoryId)?.children || [];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>;

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'images', label: 'Images' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-slate hover:text-navy mb-1">&larr; Back to products</button>
          <h1 className="text-2xl font-display font-semibold text-navy">{isNew ? 'New Product' : 'Edit Product'}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleSave(true)} disabled={saving || savingDraft}
            className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10 disabled:opacity-50">
            {savingDraft ? 'Saving...' : 'Save as Draft'}
          </button>
          <button onClick={() => handleSave(false)} disabled={saving || savingDraft}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
            {saving ? 'Saving...' : isNew ? 'Create Product' : 'Save Product'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-sage-light/30">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeTab === tab.id ? 'border-b-2 border-sage text-sage-dark' : 'text-slate hover:text-navy'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white p-6">
        {activeTab === 'basic' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Product Name *</label>
              <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Slug</label>
              <input type="text" value={form.slug} onChange={e => update('slug', e.target.value)} placeholder="auto-generated"
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">SKU *</label>
                <input type="text" required value={form.sku} onChange={e => update('sku', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Brand</label>
                <input type="text" value={form.brand} onChange={e => update('brand', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Category *</label>
                <select required value={form.categoryId} onChange={e => update('categoryId', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                  <option value="">Select category</option>
                  {parentCategories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Subcategory</label>
                <select value={form.subcategoryId} onChange={e => update('subcategoryId', e.target.value)}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none">
                  <option value="">None</option>
                  {subcategories.map((c: Category) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Description</label>
              <textarea value={form.description} onChange={e => update('description', e.target.value)} rows={5}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Short Description</label>
              <textarea value={form.shortDescription} onChange={e => update('shortDescription', e.target.value)} rows={2}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Material</label>
              <input type="text" value={form.material} onChange={e => update('material', e.target.value)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>

            {/* Tags */}
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Tags</label>
              <div className="flex gap-2">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag" className="flex-1 rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                <button type="button" onClick={addTag} className="rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm font-medium text-navy hover:bg-sage-light/10">Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-sage-light/30 px-2.5 py-0.5 text-xs text-navy">
                      {tag}
                      <button onClick={() => update('tags', form.tags.filter(t => t !== tag))} className="text-slate hover:text-red-600">&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Specifications */}
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Specifications</label>
              <div className="flex gap-2">
                <input type="text" value={specKey} onChange={e => setSpecKey(e.target.value)} placeholder="Key"
                  className="w-1/3 rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                <input type="text" value={specValue} onChange={e => setSpecValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpec())} placeholder="Value"
                  className="flex-1 rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                <button type="button" onClick={addSpec} className="rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm font-medium text-navy hover:bg-sage-light/10">Add</button>
              </div>
              {Object.keys(form.specifications).length > 0 && (
                <div className="mt-2 space-y-1">
                  {Object.entries(form.specifications).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between rounded-lg bg-sage-light/10 px-3 py-1.5 text-sm">
                      <span><span className="font-medium text-navy">{k}:</span> <span className="text-slate">{v}</span></span>
                      <button onClick={() => removeSpec(k)} className="text-slate hover:text-red-600 text-xs">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product flags */}
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'isNew', label: 'New Arrival' },
                { key: 'isBestSeller', label: 'Best Seller' },
                { key: 'isFeatured', label: 'Featured' },
                { key: 'isLimitedEdition', label: 'Limited Edition' },
                { key: 'isActive', label: 'Published' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2">
                  <input type="checkbox" checked={Boolean(form[key as keyof ProductForm])} onChange={e => update(key as keyof ProductForm, e.target.checked)}
                    className="h-4 w-4 rounded border-sage-light/60 text-navy" />
                  <span className="text-sm text-navy">{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-5 max-w-md">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Regular Price ($) *</label>
              <input type="number" min="0" step="0.01" required value={form.regularPrice || ''} onChange={e => update('regularPrice', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Sale Price ($)</label>
              <input type="number" min="0" step="0.01" value={form.salePrice || ''} onChange={e => update('salePrice', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Discount Percentage (%)</label>
              <input type="number" min="0" max="100" value={form.discountPercent || ''} onChange={e => update('discountPercent', parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
            </div>
            {form.salePrice > 0 && form.regularPrice > 0 && (
              <div className="rounded-lg bg-sage-light/10 p-3 text-sm text-navy">
                Sale: <span className="font-medium">{form.regularPrice} → {form.salePrice}</span>
                ({Math.round(((form.regularPrice - form.salePrice) / form.regularPrice) * 100)}% off)
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-5 max-w-md">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Stock Quantity *</label>
              <input type="number" min="0" required value={form.stock} onChange={e => update('stock', parseInt(e.target.value) || 0)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              {form.stock === 0 && <p className="mt-1 text-xs text-red-600">Out of stock</p>}
              {form.stock > 0 && form.stock <= form.lowStockThreshold && <p className="mt-1 text-xs text-walnut">Low stock warning</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Low Stock Threshold</label>
              <input type="number" min="0" value={form.lowStockThreshold} onChange={e => update('lowStockThreshold', parseInt(e.target.value) || 5)}
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              <p className="mt-1 text-xs text-slate">Alert when stock falls below this number</p>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">Add Image URL</label>
              <div className="flex gap-2">
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImage())}
                  placeholder="https://..." className="flex-1 rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                <button onClick={addImage} className="rounded-lg bg-navy px-4 py-2.5 text-sm font-medium text-ivory hover:bg-navy-light">Add</button>
              </div>
            </div>
            {form.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {form.images.map((img, i) => {
                  const url = typeof img === 'string' ? img : img.url;
                  return (
                    <div key={i} className="group relative aspect-square rounded-lg border border-sage-light/30 overflow-hidden">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button onClick={() => removeImage(i)}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs">
                        &times;
                      </button>
                      {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-navy/80 px-1.5 py-0.5 text-[9px] font-medium text-ivory">Main</span>}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border-2 border-dashed border-sage-light/40 px-6 py-12 text-center">
                <svg className="mx-auto h-10 w-10 text-sage-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="mt-2 text-sm text-slate">No images yet. Add image URLs above.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'seo' && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">SEO Title</label>
              <input type="text" value={form.seoTitle} onChange={e => update('seoTitle', e.target.value)} placeholder="Leave empty to use product name"
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              <p className="mt-1 text-xs text-slate">{(form.seoTitle || form.name).length}/60 characters</p>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-navy">SEO Description</label>
              <textarea value={form.seoDescription} onChange={e => update('seoDescription', e.target.value)} rows={3} placeholder="Leave empty to use short description"
                className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              <p className="mt-1 text-xs text-slate">{(form.seoDescription || form.shortDescription).length}/160 characters</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
