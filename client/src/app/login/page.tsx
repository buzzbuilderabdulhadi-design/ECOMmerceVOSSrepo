'use client';

import React, { useState, FormEvent, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GoogleButton } from '@/components/ui/GoogleButton';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/services/axios';

function safeRedirect(value: string | null): string {
  if (!value) return '/';
  if (!value.startsWith('/') || value.startsWith('//')) return '/';
  return value;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-cream">
          <Navbar />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get('redirect'));
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
      toast.success('Signed in successfully');
      router.push(redirect);
    } catch (err) {
      setLocalError(getErrorMessage(err) || 'Login failed');
    }
  };

  useEffect(() => {
    if (searchParams.get('google') === 'not_configured') {
      toast.error("Google sign-in isn't configured yet — please use email & password.");
    }
    if (searchParams.get('error')) {
      toast.error('Google sign-in failed. Please try again.');
    }
  }, [searchParams]);

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-warm" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(15, 27, 51, 0.07) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(24, 42, 74, 0.09) 0%, transparent 50%)`,
          }} />
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 w-full max-w-md"
          >
            <div className="rounded-2xl border border-sage-light/30 bg-white/80 backdrop-blur-sm p-8 shadow-xl shadow-sage/5">
              <div className="text-center">
                <h1 className="text-3xl font-bold tracking-tight text-walnut">Welcome back</h1>
                <p className="mt-2 text-sm text-slate">
                  Sign in to your ZOYA GOODS account to continue shopping.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {(localError || error) && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{localError || error}</div>
                )}
                <div className="space-y-4">
                  <Input label="Email" type="email" placeholder="john@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                  <Input label="Password" type="password" placeholder="Enter your password" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-walnut/40 text-walnut focus:ring-walnut" />
                    <span className="text-sm text-slate">Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="text-sm text-walnut underline hover:text-walnut-light">
                    Forgot password?
                  </Link>
                </div>

                <Button variant="primary" size="lg" fullWidth isLoading={isLoading} type="submit">
                  Sign In
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sage-light/30" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-slate">Or continue with</span></div>
                </div>

                <GoogleButton label="Sign in with Google" />

                <p className="text-center text-sm text-slate">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="font-medium text-walnut underline hover:text-walnut-light">
                    Create one
                  </Link>
                </p>
              </form>
            </div>
          </motion.div>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
