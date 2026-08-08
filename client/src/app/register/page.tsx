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

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();
    if (!firstName || !lastName || !email || !password) { setLocalError('Please fill in all required fields'); return; }
    if (password !== confirmPassword) { setLocalError('Passwords do not match'); return; }
    if (password.length < 8) { setLocalError('Password must be at least 8 characters'); return; }
    try {
      await register({ name: `${firstName} ${lastName}`, email, password });
      router.push('/');
    } catch (err: any) {
      setLocalError(err.message || 'Registration failed');
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
                <h1 className="text-3xl font-bold tracking-tight text-walnut">Create your account</h1>
                <p className="mt-2 text-sm text-slate">
                  Join VOSS and discover luxury fashion.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                {(localError || error) && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{localError || error}</div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" required value={firstName} onChange={e => setFirstName(e.target.value)} />
                  <Input label="Last Name" placeholder="Doe" required value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <Input label="Email" type="email" placeholder="john@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
                <Input label="Password" type="password" placeholder="Create a password" required value={password} onChange={e => setPassword(e.target.value)} />
                <Input label="Confirm Password" type="password" placeholder="Confirm your password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />

                <label className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1 h-4 w-4 rounded border-walnut/40 text-walnut focus:ring-walnut" />
                  <span className="text-sm text-slate">
                    I agree to the{' '}
                    <Link href="/terms" className="underline text-walnut hover:text-walnut-light">Terms of Service</Link> and{' '}
                    <Link href="/privacy" className="underline text-walnut hover:text-walnut-light">Privacy Policy</Link>.
                  </span>
                </label>

                <Button variant="primary" size="lg" fullWidth isLoading={isLoading}>
                  Create Account
                </Button>

                <p className="text-center text-sm text-slate">
                  Already have an account?{' '}
                  <Link href="/login" className="font-medium text-walnut underline hover:text-walnut-light">
                    Sign in
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
