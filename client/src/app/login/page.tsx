'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
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
      router.push('/');
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <div className="relative min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-warm" />
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `radial-gradient(circle at 30% 20%, rgba(138, 154, 123, 0.15) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(196, 168, 106, 0.1) 0%, transparent 50%)`,
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
                  Sign in to your VOSS account to continue shopping.
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

                <Button variant="primary" size="lg" fullWidth isLoading={isLoading}>
                  Sign In
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-sage-light/30" /></div>
                  <div className="relative flex justify-center text-sm"><span className="bg-white px-4 text-slate">Or continue with</span></div>
                </div>

                <Button variant="outline" size="lg" fullWidth type="button">
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign in with Google
                </Button>

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
