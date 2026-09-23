'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';

interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: unknown;
  user: { id: string; name: string } | null;
  createdAt: string;
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [showClear, setShowClear] = useState(false);
  const limit = 20;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entity = entityFilter;
      const res = await adminApi.getActivityLogs(params);
      setLogs(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleClear = async () => {
    try {
      await adminApi.clearActivityLogs();
      toast.success('Activity logs cleared');
      setLogs([]);
      setTotal(0);
      setShowClear(false);
    } catch {
      toast.error('Failed to clear logs');
    }
  };

  const formatAction = (action: string) => action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Activity Logs</h1>
          <p className="text-sm text-slate mt-1">{total} total entries</p>
        </div>
        <button onClick={() => setShowClear(true)}
          className="rounded-full border border-red-200 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.14em] text-red-600 hover:bg-red-50 transition-colors">
          Clear All
        </button>
      </div>

      <div className="flex gap-3">
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none">
          <option value="">All Actions</option>
          <option value="CREATE_PRODUCT">Create Product</option>
          <option value="UPDATE_PRODUCT">Update Product</option>
          <option value="DELETE_PRODUCT">Delete Product</option>
          <option value="CREATE_CATEGORY">Create Category</option>
          <option value="UPDATE_CATEGORY">Update Category</option>
          <option value="DELETE_CATEGORY">Delete Category</option>
          <option value="UPDATE_ORDER_STATUS">Update Order Status</option>
          <option value="DELETE_ORDER">Delete Order</option>
          <option value="UPDATE_CUSTOMER">Update Customer</option>
          <option value="DELETE_CUSTOMER">Delete Customer</option>
          <option value="UPDATE_REVIEW">Update Review</option>
          <option value="DELETE_REVIEW">Delete Review</option>
          <option value="CREATE_COUPON">Create Coupon</option>
          <option value="UPDATE_COUPON">Update Coupon</option>
          <option value="DELETE_COUPON">Delete Coupon</option>
          <option value="UPDATE_SETTINGS">Update Settings</option>
          <option value="UPDATE_SEO">Update SEO</option>
          <option value="UPLOAD_MEDIA">Upload Media</option>
          <option value="DELETE_MEDIA">Delete Media</option>
          <option value="CREATE_HOMEPAGE_CONTENT">Create Homepage Content</option>
          <option value="UPDATE_HOMEPAGE_CONTENT">Update Homepage Content</option>
          <option value="DELETE_HOMEPAGE_CONTENT">Delete Homepage Content</option>
        </select>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none">
          <option value="">All Entities</option>
          <option value="Product">Product</option>
          <option value="Category">Category</option>
          <option value="Order">Order</option>
          <option value="Customer">Customer</option>
          <option value="Review">Review</option>
          <option value="Coupon">Coupon</option>
          <option value="SiteSetting">Settings</option>
          <option value="SeoEntry">SEO</option>
          <option value="Media">Media</option>
          <option value="HomepageContent">Homepage Content</option>
          <option value="ActivityLog">Activity Log</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="h-8 w-8 animate-spin rounded-full border-2 border-sage border-t-transparent" /></div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-sage-light/30 bg-white p-12 text-center">
          <p className="text-slate">No activity logs</p>
        </div>
      ) : (
        <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sage-light/30 bg-sage-light/10">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Entity</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-sage-light/20 last:border-0 hover:bg-sage-light/5">
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-navy">
                      {formatAction(log.action)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-navy">
                    {log.entity}
                    {log.entityId && <span className="ml-1 text-[10px] text-slate">({log.entityId.slice(0, 8)}...)</span>}
                  </td>
                  <td className="px-5 py-3 text-sm text-slate">{log.user?.name || 'System'}</td>
                  <td className="px-5 py-3 text-xs text-slate">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-sage-light/30 px-5 py-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="text-xs text-navy hover:underline disabled:text-slate disabled:cursor-not-allowed">Previous</button>
              <span className="text-xs text-slate">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="text-xs text-navy hover:underline disabled:text-slate disabled:cursor-not-allowed">Next</button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showClear}
        title="Clear Activity Logs"
        message="Are you sure you want to clear all activity logs? This cannot be undone."
        confirmLabel="Clear All Logs"
        destructive
        onConfirm={handleClear}
        onCancel={() => setShowClear(false)}
      />
    </div>
  );
}
