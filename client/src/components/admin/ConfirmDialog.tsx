'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={onCancel}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-navy">{title}</h3>
              <p className="mt-2 text-sm text-slate">{message}</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={onCancel}
                  className="rounded-full border border-sage-light/40 px-4 py-2 text-xs font-medium uppercase tracking-wider text-navy hover:bg-sage-light/10 transition-colors">
                  {cancelLabel}
                </button>
                <button onClick={onConfirm} disabled={loading}
                  className={cn(
                    'rounded-full px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors',
                    destructive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-navy text-ivory hover:bg-navy-light',
                    loading && 'opacity-50'
                  )}>
                  {loading ? 'Loading...' : confirmLabel}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
