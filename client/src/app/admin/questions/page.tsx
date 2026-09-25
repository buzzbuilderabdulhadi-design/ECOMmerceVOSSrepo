'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { AdminQuestion } from '@/types/admin';
import { useDebounce } from '@/hooks/useDebounce';

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [answerTo, setAnswerTo] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (status) params.status = status;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await adminApi.getQuestions(params);
      setQuestions(res.data || []);
      setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [status, debouncedSearch]);

  useEffect(() => { fetchQuestions(1); }, [status, debouncedSearch]);

  const handleAnswer = async (id: string) => {
    if (!answerText.trim()) { toast.error('Please write an answer first'); return; }
    try {
      await adminApi.answerQuestion(id, answerText.trim());
      setQuestions(qs => qs.map(q => q.id === id ? { ...q, answer: answerText.trim(), isPublished: true, adminAnsweredAt: new Date().toISOString() } : q));
      setAnswerTo(null); setAnswerText('');
      toast.success('Answer published');
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to publish answer');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteQuestion(id);
      setQuestions(qs => qs.filter(q => q.id !== id));
      setDeleteId(null);
      toast.success('Question deleted');
    } catch (err) {
      toast.error(getErrorMessage(err) || 'Failed to delete question');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-display font-semibold text-navy">Product Questions</h1>
        <p className="text-sm text-slate mt-1">{pagination.total} questions</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        {[{ v: '', l: 'All' }, { v: 'unanswered', l: 'Unanswered' }, { v: 'answered', l: 'Answered' }].map(({ v, l }) => (
          <button key={v} onClick={() => setStatus(v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${status === v ? 'bg-navy text-ivory' : 'border border-sage-light/40 text-slate hover:bg-sage-light/20'}`}>{l}</button>
        ))}
        <div className="relative flex-1 sm:max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by question, product, or customer..." className="w-full rounded-lg border border-sage-light/40 bg-white pl-10 pr-4 py-2 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20" />
        </div>
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        ) : questions.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No questions found</p></div>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {questions.map((q) => (
              <div key={q.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${q.answer ? 'bg-sage-light/50 text-sage-dark' : 'bg-walnut/10 text-walnut'}`}>
                        {q.answer ? 'Answered' : 'Unanswered'}
                      </span>
                      {q.helpfulCount > 0 && (
                        <span className="text-[10px] text-slate">{q.helpfulCount} helpful</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate">{q.user?.name} on <span className="font-medium text-navy">{q.product?.name}</span></p>
                    <p className="mt-0.5 text-sm font-medium text-navy">{q.question}</p>
                    {q.answer && (
                      <div className="mt-2 rounded-lg bg-sage-light/10 p-3 text-sm text-navy">
                        <span className="text-xs font-medium text-sage-dark">Answer:</span> {q.answer}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => { setAnswerTo(q.id); setAnswerText(q.answer || ''); }} className="rounded-lg border border-sage-light/40 px-2.5 py-1.5 text-[10px] font-medium text-slate hover:bg-sage-light/20">Answer</button>
                    <button onClick={() => setDeleteId(q.id)} className="rounded-lg border border-red-200 px-2.5 py-1.5 text-[10px] font-medium text-red-600 hover:bg-red-50">Delete</button>
                  </div>
                </div>

                {answerTo === q.id && (
                  <div className="mt-3 flex gap-2">
                    <input type="text" value={answerText} onChange={e => setAnswerText(e.target.value)} placeholder="Write an answer..."
                      className="flex-1 rounded-lg border border-sage-light/40 px-3 py-2 text-sm focus:border-navy focus:outline-none" />
                    <button onClick={() => handleAnswer(q.id)} className="rounded-lg bg-navy px-3 py-2 text-xs font-medium text-ivory hover:bg-navy-light">Publish</button>
                    <button onClick={() => setAnswerTo(null)} className="rounded-lg border border-sage-light/40 px-3 py-2 text-xs font-medium text-slate hover:bg-sage-light/20">Cancel</button>
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
              <button onClick={() => fetchQuestions(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Prev</button>
              <button onClick={() => fetchQuestions(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Question"
        message="Are you sure you want to delete this question? The customer will no longer see it. This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteId && handleDelete(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}