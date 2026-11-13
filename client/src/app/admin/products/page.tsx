'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import adminApi from '@/services/admin';
import { formatPrice } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { resolveAssetUrl } from '@/lib/assetUrl';
import { useDebounce } from '@/hooks/useDebounce';
import Image from 'next/image';

interface Product {
  id: string; name: string; slug: string; sku: string; regularPrice: number; salePrice?: number;
  stock: number; isActive: boolean; isNew: boolean; isBestSeller: boolean; isFeatured: boolean;
  images: Array<{ url: string } | string>; category?: { name: string; slug: string };
  _count?: { reviews: number; orderItems: number }; createdAt: string;
}

export default function AdminProductsPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const debouncedSearch = useDebounce(search, 400);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const fetchProducts = useCallback(async (page = 1, searchOverride?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      const q = searchOverride !== undefined ? searchOverride : debouncedSearch;
      if (q) params.search = q;
      if (status) params.status = status;
      const res = await adminApi.getProducts(params);
      setProducts(res.data || []);
      setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { setError(getErrorMessage(err) || 'Failed to load products'); } finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { void Promise.resolve().then(() => fetchProducts(1)); }, [fetchProducts]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      const res = await adminApi.deleteProduct(id);
      setShowDeleteModal(null);
      if (res?.message && /deactivated/i.test(res.message)) {
        setProducts(p => p.map(x => x.id === id ? { ...x, isActive: false } : x));
        toast.success(res.message);
      } else {
        setProducts(p => p.filter(x => x.id !== id));
        setPagination(p => {
          const total = Math.max(0, p.total - 1);
          return { ...p, total, totalPages: Math.max(1, Math.ceil(total / p.limit)) };
        });
        toast.success(res?.message || 'Product deleted');
      }
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete product'); } finally { setDeleting(null); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      await adminApi.updateProduct(id, { isActive: !isActive });
      setProducts(p => p.map(x => x.id === id ? { ...x, isActive: !isActive } : x));
      toast.success(!isActive ? 'Product activated' : 'Product deactivated');
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update product'); } finally { setToggling(null); }
  };

  const handleBulkDelete = async () => {
    try { await adminApi.bulkDeleteProducts(selected); setSelected([]); setShowBulkDelete(false); fetchProducts(pagination.page); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete products'); }
  };

  const handleDuplicate = async (id: string) => {
    try { await adminApi.duplicateProduct(id); fetchProducts(pagination.page); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to duplicate product'); }
  };

  const toggleSelect = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => setSelected(s => s.length === products.length ? [] : products.map(p => p.id));

  const getImageUrl = (img: Product['images'][0]) => resolveAssetUrl(typeof img === 'string' ? img : img?.url || '');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Products</h1>
          <p className="text-sm text-slate mt-1">{pagination.total} products total</p>
        </div>
        <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-navy px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-ivory hover:bg-navy-light transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchProducts(1, search)}
            placeholder="Search products..." className="w-full rounded-lg border border-sage-light/40 bg-white pl-10 pr-4 py-2.5 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="rounded-lg border border-sage-light/40 bg-white px-3 py-2.5 text-sm text-navy focus:border-navy focus:outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="lowStock">Low Stock</option>
          <option value="outOfStock">Out of Stock</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selected.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-navy/5 px-4 py-3">
          <span className="text-sm text-navy">{selected.length} selected</span>
          <button onClick={() => setShowBulkDelete(true)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700">Delete selected</button>
          <button onClick={() => setSelected([])} className="text-xs text-slate hover:text-navy">Clear</button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : error ? (
          <div className="px-5 py-16 text-center">
            <p className="text-sm text-slate">{error}</p>
            <button onClick={() => fetchProducts(pagination.page)}
              className="mt-4 rounded-full border border-sage-light/40 px-5 py-2 text-xs font-medium uppercase tracking-[0.14em] text-navy hover:bg-sage-light/10 transition-colors">
              Retry
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-sage-light/60" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="mt-3 text-sm text-slate">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-sage-light/30 bg-sage-light/5">
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleAll} className="h-4 w-4 rounded border-sage-light/60 text-navy focus:ring-navy" /></th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Product</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Price</th>
                  <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Stock</th>
                  <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate">Status</th>
                  <th className="w-24 px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/20">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-sage-light/5 transition-colors">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} className="h-4 w-4 rounded border-sage-light/60 text-navy focus:ring-navy" /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-sage-light/20 overflow-hidden">
                          {getImageUrl(product.images?.[0]) ? (
                            <Image
                              src={getImageUrl(product.images[0])}
                              alt=""
                              fill
                              unoptimized
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate/40">
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/admin/products/${product.id}`} className="text-sm font-medium text-navy hover:text-sage-dark truncate block">{product.name}</Link>
                          <p className="text-xs text-slate truncate">SKU: {product.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-slate">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        {product.salePrice ? (
                          <><span className="font-medium text-navy">{formatPrice(product.salePrice)}</span><span className="ml-1.5 text-xs text-slate line-through">{formatPrice(product.regularPrice)}</span></>
                        ) : (
                          <span className="font-medium text-navy">{formatPrice(product.regularPrice)}</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3">
                      <span className={`text-sm font-medium ${product.stock === 0 ? 'text-red-600' : product.stock <= 5 ? 'text-walnut' : 'text-navy'}`}>{product.stock}</span>
                    </td>
                    <td className="hidden lg:table-cell px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${product.isActive ? 'bg-sage-light/50 text-sage-dark' : 'bg-slate/10 text-slate'}`}>
                          {product.isActive ? 'Active' : 'Draft'}
                        </span>
                        {product.isNew && <span className="inline-flex rounded-full bg-navy/10 px-1.5 py-0.5 text-[9px] font-medium text-navy">NEW</span>}
                        {product.isBestSeller && <span className="inline-flex rounded-full bg-walnut/10 px-1.5 py-0.5 text-[9px] font-medium text-walnut">TOP</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/products/${product.id}`} aria-label={`Edit ${product.name}`} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></Link>
                        <button onClick={() => handleToggleActive(product.id, product.isActive)} disabled={toggling === product.id} aria-label={product.isActive ? `Deactivate ${product.name}` : `Activate ${product.name}`} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy disabled:opacity-40">{toggling === product.id ? (<svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0l3-3m-3 3l-3-3m6 6H6" /></svg>) : product.isActive ? (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>) : (<svg className="h-4 w-4 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>)}</button>
                        <button onClick={() => handleDuplicate(product.id)} aria-label={`Duplicate ${product.name}`} className="rounded p-1 text-slate hover:bg-sage-light/20 hover:text-navy"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                        <button onClick={() => setShowDeleteModal(product.id)} aria-label={`Delete ${product.name}`} className="rounded p-1 text-slate hover:bg-red-50 hover:text-red-600"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-sage-light/30 px-4 py-3">
            <span className="text-xs text-slate">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => fetchProducts(pagination.page - 1)} disabled={pagination.page <= 1}
                className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40 disabled:cursor-not-allowed">Prev</button>
              <button onClick={() => fetchProducts(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages}
                className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!showDeleteModal}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        loading={!!deleting}
        onConfirm={() => showDeleteModal && handleDelete(showDeleteModal)}
        onCancel={() => setShowDeleteModal(null)}
      />

      <ConfirmDialog
        open={showBulkDelete}
        title={`Delete ${selected.length} Products`}
        message="Are you sure? This action cannot be undone."
        confirmLabel="Delete All"
        destructive
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDelete(false)}
      />
    </div>
  );
}
