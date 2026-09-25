'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import adminApi from '@/services/admin';
import { generateSlug, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Category } from '@/types';
import Modal from '@/components/admin/Modal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';

interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  colorHex?: string | null;
  size: string;
  stock: number;
  priceOverride?: number | null;
  images: Array<{ url: string } | string>;
  isActive: boolean;
  sku: string;
}

interface VariantForm {
  id?: string;
  color: string;
  colorHex: string;
  size: string;
  stock: number;
  priceOverride: string;
  sku: string;
}

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
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('basic');
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantForm, setVariantForm] = useState<VariantForm | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState<string | null>(null);

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
        setVariants(p.variants || []);
      }).catch(err => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) setNotFound(true);
        else toast.error(getErrorMessage(err) || 'Failed to load product');
      }).finally(() => setLoading(false));
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
        salePrice: form.salePrice > 0 ? form.salePrice : null,
        discountPercent: form.discountPercent > 0 ? form.discountPercent : null,
        subcategoryId: form.subcategoryId || undefined,
        specifications: Object.keys(form.specifications).length > 0 ? form.specifications : undefined,
        isActive: asDraft ? false : form.isActive,
      };
      if (isNew) {
        const res = await adminApi.createProduct(data);
        toast.success('Product created');
        router.push(`/admin/products/${res.data?.id || ''}`);
      } else {
        await adminApi.updateProduct(params.id as string, data);
        toast.success('Product updated');
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

  const productId = !isNew ? (params.id as string) : '';

  const handleSaveVariant = async () => {
    if (!productId || !variantForm) return;
    if (!variantForm.color.trim() || !variantForm.size.trim()) {
      toast.error('Color and size are required');
      return;
    }
    setSavingVariant(true);
    try {
      const payload = {
        color: variantForm.color.trim(),
        colorHex: variantForm.colorHex.trim() || undefined,
        size: variantForm.size.trim(),
        stock: variantForm.stock || 0,
        priceOverride: variantForm.priceOverride ? parseFloat(variantForm.priceOverride) : undefined,
        sku: variantForm.sku.trim() || undefined,
      };
      if (variantForm.id) {
        await adminApi.updateVariant(productId, variantForm.id, payload);
        toast.success('Variant updated');
      } else {
        await adminApi.createVariant(productId, payload);
        toast.success('Variant created');
      }
      const p = await adminApi.getProduct(productId);
      setVariants(p.variants || []);
      setVariantForm(null);
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to save variant'); } finally { setSavingVariant(false); }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!productId) return;
    setDeletingVariant(variantId);
    try {
      await adminApi.deleteVariant(productId, variantId);
      setVariants(vs => vs.filter(v => v.id !== variantId));
      toast.success('Variant deleted');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete variant'); } finally { setDeletingVariant(null); }
  };

  const parentCategories = categories.filter((c: Category) => !c.parentId);
  const subcategories = parentCategories.find((c: Category) => c.id === form.categoryId)?.children || [];

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>;

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 py-20 text-center">
        <p className="text-sm font-medium text-red-700">Product not found</p>
        <p className="mt-1 text-xs text-red-500">It may have been deleted or this is an invalid product ID.</p>
        <Link href="/admin/products" className="mt-4 rounded-lg bg-navy px-4 py-2 text-xs font-medium text-ivory hover:bg-navy-light transition-colors">Back to products</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'variants', label: `Variants${variants.length ? ` (${variants.length})` : ''}` },
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

        {activeTab === 'variants' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate">Manage color/size variants with independent stock and pricing.</p>
              {productId ? (
                <button
                  onClick={() => setVariantForm({ color: '', colorHex: '#000000', size: '', stock: 0, priceOverride: '', sku: '' })}
                  className="inline-flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-xs font-medium uppercase tracking-wider text-ivory hover:bg-navy-light transition-colors"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Variant
                </button>
              ) : (
                <p className="text-xs text-slate">Save the product first to add variants.</p>
              )}
            </div>

            {variants.length === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-sage-light/40 px-6 py-12 text-center">
                <p className="text-sm text-slate">No variants yet. Add a variant to track stock and pricing by color/size.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-sage-light/30">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-sage-light/30 bg-sage-light/5 text-left">
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate">Color / Size</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate">SKU</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate">Stock</th>
                      <th className="hidden md:table-cell px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate">Price</th>
                      <th className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate">Status</th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sage-light/20">
                    {variants.map((v) => (
                      <tr key={v.id} className="hover:bg-sage-light/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {v.colorHex && (
                              <span className="h-4 w-4 flex-shrink-0 rounded-full border border-slate/20" style={{ backgroundColor: v.colorHex }} aria-hidden="true" />
                            )}
                            <span className="text-sm font-medium text-navy">{v.color}</span>
                            <span className="text-sm text-slate">/ {v.size}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-xs text-slate">{v.sku}</td>
                        <td className="px-4 py-3">
                          <span className={`text-sm font-medium ${v.stock === 0 ? 'text-red-600' : v.stock <= 5 ? 'text-walnut' : 'text-navy'}`}>{v.stock}</span>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-navy">{v.priceOverride != null ? formatPrice(v.priceOverride) : '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${v.isActive ? 'bg-sage-light/50 text-sage-dark' : 'bg-slate/10 text-slate'}`}>
                            {v.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setVariantForm({ id: v.id, color: v.color, colorHex: v.colorHex || '#000000', size: v.size, stock: v.stock, priceOverride: v.priceOverride != null ? String(v.priceOverride) : '', sku: v.sku })}
                              className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"
                              aria-label={`Edit variant ${v.color} / ${v.size}`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button
                              onClick={() => handleDeleteVariant(v.id)}
                              disabled={deletingVariant === v.id}
                              className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                              aria-label={`Delete variant ${v.color} / ${v.size}`}
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
              <input type="number" min="0" max="99" value={form.discountPercent || ''} onChange={e => update('discountPercent', parseFloat(e.target.value) || 0)}
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

      {/* Variant modal */}
      <Modal open={!!variantForm} title={variantForm?.id ? 'Edit Variant' : 'Add Variant'} onClose={() => setVariantForm(null)}>
        {variantForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Color *</label>
                <input type="text" value={variantForm.color} onChange={e => setVariantForm({ ...variantForm, color: e.target.value })}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Color Hex</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={variantForm.colorHex || '#000000'} onChange={e => setVariantForm({ ...variantForm, colorHex: e.target.value })}
                    className="h-10 w-12 flex-shrink-0 cursor-pointer rounded-lg border border-sage-light/40" />
                  <input type="text" value={variantForm.colorHex} onChange={e => setVariantForm({ ...variantForm, colorHex: e.target.value })} placeholder="#000000"
                    className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Size *</label>
                <input type="text" value={variantForm.size} onChange={e => setVariantForm({ ...variantForm, size: e.target.value })} placeholder="e.g. M, 42, One Size"
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Stock</label>
                <input type="number" min="0" value={variantForm.stock} onChange={e => setVariantForm({ ...variantForm, stock: parseInt(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">Price Override ($)</label>
                <input type="number" min="0" step="0.01" value={variantForm.priceOverride} onChange={e => setVariantForm({ ...variantForm, priceOverride: e.target.value })}
                  placeholder="Leave empty to use product price" className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-navy">SKU</label>
                <input type="text" value={variantForm.sku} onChange={e => setVariantForm({ ...variantForm, sku: e.target.value })}
                  placeholder="Auto-generated if empty" className="w-full rounded-lg border border-sage-light/40 px-3 py-2.5 text-sm focus:border-navy focus:outline-none" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setVariantForm(null)} className="rounded-lg border border-sage-light/40 px-4 py-2 text-sm font-medium text-navy hover:bg-sage-light/10">Cancel</button>
              <button onClick={handleSaveVariant} disabled={savingVariant}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-medium text-ivory hover:bg-navy-light disabled:opacity-50">
                {savingVariant ? 'Saving...' : variantForm.id ? 'Save Variant' : 'Add Variant'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingVariant}
        title="Delete Variant"
        message="Are you sure you want to delete this variant? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deletingVariant && handleDeleteVariant(deletingVariant)}
        onCancel={() => setDeletingVariant(null)}
      />
    </div>
  );
}
