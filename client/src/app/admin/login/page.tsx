'use client';

import React, { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/services/axios';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!email || !password) { setLocalError('Please fill in all fields'); return; }
    try {
      await login({ email, password });
      router.push('/admin');
    } catch (err) {
      setLocalError(getErrorMessage(err) || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy">
      <div className="absolute inset-0 bg-gradient-night opacity-80" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm px-4"
      >
        <div className="rounded-2xl border border-sage-light/20 bg-white/95 backdrop-blur-sm p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold tracking-wider text-navy">VOSS</h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-walnut font-medium">Administration</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {(localError || error) && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{localError || error}</div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@voss.com"
                required
                className="w-full rounded-lg border border-sage-light/40 bg-white px-4 py-2.5 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full rounded-lg border border-sage-light/40 bg-white px-4 py-2.5 text-sm text-navy placeholder-slate/50 focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-navy py-3 text-sm font-medium uppercase tracking-[0.16em] text-ivory hover:bg-navy-light focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
