'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import { consumeGoogleState } from '@/lib/google';
import { getErrorMessage } from '@/services/axios';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { completeGoogleLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [errorParam] = useState(() => searchParams.get('error') || searchParams.get('google'));

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    let cancelled = false;
    (async () => {
      if (errorParam) {
        setError('Google sign-in could not be completed. Please try again or use email & password.');
        return;
      }
      if (!code || !state) {
        setError('Google sign-in could not be completed. Please try again.');
        return;
      }
      if (!consumeGoogleState(state)) {
        setError('Google sign-in session expired. Please try again.');
        return;
      }
      try {
        await completeGoogleLogin(code, state);
        if (!cancelled) router.replace('/dashboard');
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err) || 'Google sign-in failed. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, completeGoogleLogin, router, errorParam]);

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="relative flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-sage-light/30 bg-white/80 p-8 text-center shadow-xl shadow-sage/5 backdrop-blur-sm"
        >
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-walnut">Sign-in incomplete</h1>
              <p className="mt-3 text-sm text-slate">{error}</p>
              <div className="mt-6 flex gap-3">
                <Link
                  href="/login"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-navy px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-ivory transition-colors hover:bg-navy-light"
                >
                  Back to Sign In
                </Link>
                <Link
                  href="/"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-navy/30 px-6 py-3 text-xs font-medium uppercase tracking-[0.16em] text-navy transition-colors hover:border-walnut hover:text-walnut"
                >
                  Home
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-navy border-t-transparent" />
              <h1 className="mt-5 text-2xl font-bold text-walnut">Completing sign-in…</h1>
              <p className="mt-3 text-sm text-slate">Confirming your Google account. One moment.</p>
            </>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-cream"><Navbar /></main>}>
      <GoogleCallbackContent />
    </Suspense>
  );
}