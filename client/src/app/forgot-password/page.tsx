'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/animations/PageTransition';
import { FadeIn } from '@/components/animations/FadeIn';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';

// ============================================================
// Forgot Password Page
// ============================================================

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (value: string) => {
    if (!value) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email address';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-24">
          <FadeIn>
            <div className="w-full">
              <Link
                href="/login"
                className="mb-8 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>

              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <FiCheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-zinc-900">Check Your Email</h1>
                  <p className="mb-6 text-zinc-600">
                    We&apos;ve sent a password reset link to{' '}
                    <span className="font-medium text-zinc-900">{email}</span>
                  </p>
                  <p className="text-sm text-zinc-500">
                    Didn&apos;t receive the email?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubmitted(false);
                        setEmail('');
                      }}
                      className="font-medium text-zinc-900 underline transition-colors hover:text-zinc-700"
                    >
                      Try again
                    </button>
                  </p>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-zinc-900">Forgot Password</h1>
                    <p className="mt-2 text-zinc-600">
                      Enter your email and we&apos;ll send you a link to reset your password.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <Input
                      label="Email Address"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      error={error}
                      leftIcon={<FiMail className="h-4 w-4" />}
                      required
                    />
                    <Button type="submit" variant="dark" size="lg" fullWidth isLoading={isLoading}>
                      Send Reset Link
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm text-zinc-500">
                    Remember your password?{' '}
                    <Link href="/login" className="font-medium text-zinc-900 underline transition-colors hover:text-zinc-700">
                      Sign in
                    </Link>
                  </p>
                </>
              )}
            </div>
          </FadeIn>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
