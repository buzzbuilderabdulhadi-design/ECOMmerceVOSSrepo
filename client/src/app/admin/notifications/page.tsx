'use client';

import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '@/services/admin';
import { Skeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/services/axios';
import { Notification } from '@/types/admin';

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminApi.getNotifications({ page: String(page), limit: '20' });
      setNotifications(res.data || []); setPagination(res.pagination || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (err) { toast.error(getErrorMessage(err) || 'Failed to load notifications'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void Promise.resolve().then(() => fetchNotifications(1)); }, [fetchNotifications]);

  const markRead = async (id: string) => {
    try { await adminApi.markNotificationRead(id); setNotifications(ns => ns.map(n => n.id === id ? { ...n, isRead: true } : n)); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to mark notification as read'); }
  };

  const markAllRead = async () => {
    try { await adminApi.markAllNotificationsRead(); setNotifications(ns => ns.map(n => ({ ...n, isRead: true }))); } catch (err) { toast.error(getErrorMessage(err) || 'Failed to mark all as read'); }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-navy">Notifications</h1>
          <p className="text-sm text-slate mt-1">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="rounded-lg border border-sage-light/40 px-4 py-2 text-xs font-medium text-navy hover:bg-sage-light/10">
            Mark all as read
          </button>
        )}
      </div>

      <div className="rounded-xl border border-sage-light/30 bg-white overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}</div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-16 text-center"><p className="text-sm text-slate">No notifications</p></div>
        ) : (
          <div className="divide-y divide-sage-light/20">
            {notifications.map((n) => (
              <div key={n.id} className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.isRead ? 'bg-sage-light/5' : ''}`}>
                <div className={`mt-1 h-2 w-2 flex-shrink-0 rounded-full ${!n.isRead ? 'bg-sage-dark' : 'bg-transparent'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.isRead ? 'font-medium text-navy' : 'text-slate'}`}>{n.title}</p>
                  <p className="text-xs text-slate mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-slate/60 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.isRead && (
                  <button onClick={() => markRead(n.id)} className="text-[10px] font-medium text-sage-dark hover:text-navy whitespace-nowrap">
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-sage-light/30 px-4 py-3">
            <span className="text-xs text-slate">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => fetchNotifications(pagination.page - 1)} disabled={pagination.page <= 1} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Prev</button>
              <button onClick={() => fetchNotifications(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="rounded px-3 py-1.5 text-xs font-medium text-slate border border-sage-light/30 hover:bg-sage-light/20 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
