'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { AdminReview } from '@/types/admin';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchReviews = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await adminApi.getReviews(params);
      setReviews(res.data || []); setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load reviews'); } finally { setLoading(false); }
  }, [status, debouncedSearch]);

  useEffect(() => { void Promise.resolve().then(() => fetchReviews(1)); }, [fetchReviews]);

  const handleApprove = async (id: string, isApproved: boolean) => {
    try { await adminApi.updateReview(id, { isApproved }); setReviews(r => r.map(x => x.id === id ? { ...x, isApproved } : x)); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to update review status'); }
  };

  const handleReply = async (id: string) => {
    try { await adminApi.updateReview(id, { adminReply: replyText }); setReviews(r => r.map(x => x.id === id ? { ...x, adminReply: replyText } : x)); setReplyTo(null); setReplyText(''); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to send reply'); }
  };

  const handleDelete = async (id: string) => {
    try { await adminApi.deleteReview(id); setReviews(r => r.filter(x => x.id !== id)); setDeleteId(null); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to delete review'); }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">Reviews</h1>
        <p className="text-sm text-slate mt-1">{pagination.total} reviews</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {[{ v: '', l: 'All' }, { v: 'pending', l: 'Pending' }, { v: 'approved', l: 'Approved' }].map(({ v, l }) => (
          <button key={v} onClick={() => setStatus(v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${status === v ? 'bg-navy text-ivory' : 'border border-sage-light/40 text-slate hover:bg-sage-light/20'}`}>{l}</button>
        ))}
        <div className="relative flex-1 sm:max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by text, product, or customer..." className="w-full rounded-lg border border-sage-light/40 bg-white pl-10 pr-4 py-2 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
        </div>
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No reviews found</p></div>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {reviews.map((review) => (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">{[1,2,3,4,5].map(s => (
                        <svg key={s} className={`h-3.5 w-3.5 ${s <= review.rating ? 'text-walnut' : 'text-sage-light'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}</div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${review.isApproved ? 'bg-sage-light/50 text-sage-dark' : 'bg-walnut/10 text-walnut'}`}>
                        {review.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate">{review.user?.name} on <span className="font-medium text-navy">{review.product?.name}</span></p>
                    {review.title && <p className="mt-1 text-sm font-medium text-navy">{review.title}</p>}
                    {review.text && <p className="mt-0.5 text-sm text-slate">{review.text}</p>}
                    {review.adminReply && (
                      <div className="mt-2 rounded-lg bg-sage-light/10 p-3 text-sm text-navy">
                        <span className="text-xs font-medium text-sage-dark">Admin reply:</span> {review.adminReply}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    {!review.isApproved && (
                      <button onClick={() => handleApprove(review.id, true)} className="rounded-lg bg-sage-dark px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-sage-dark/90">Approve</button>
                    )}
                    {review.isApproved && (
                      <button onClick={() => handleApprove(review.id, false)} className="rounded-lg border border-sage-light/40 px-2.5 py-1.5 text-[10px] font-medium text-slate hover:bg-sage-light/20">Reject</button>
                    )}
                    <button onClick={() => { setReplyTo(review.id); setReplyText(review.adminReply || ''); }} className="rounded-lg border border-sage-light/40 px-2.5 py-1.5 text-[10px] font-medium text-slate hover:bg-sage-light/20">Reply</button>
                    <button onClick={() => setDeleteId(review.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>

                {replyTo === review.id && (
                  <div className="mt-3 flex gap-2">
                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write a reply..."
                      className="flex-1 rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                    <button onClick={() => handleReply(review.id)} className="rounded-lg bg-navy px-3 py-2 text-xs font-medium text-ivory hover:bg-navy-light">Send</button>
                    <button onClick={() => setReplyTo(null)} className="rounded-lg border border-sage-light/40 px-3 py-2 text-xs font-medium text-slate hover:bg-sage-light/20">Cancel</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-sage-light/30 px-4 py-3">
            <span className="text-xs text-slate">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => fetchReviews(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Prev</button>
              <button onClick={() => fetchReviews(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
