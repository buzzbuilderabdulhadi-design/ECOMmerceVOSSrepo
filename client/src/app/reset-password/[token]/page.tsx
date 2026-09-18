'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PageTransition } from '@/components/animations/PageTransition';
import { FadeIn } from '@/components/animations/FadeIn';
import { FiLock, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import axiosInstance, { getErrorMessage } from '@/services/axios';

// ============================================================
// Reset Password Page
// ============================================================

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(password)) newErrors.password = 'Must include an uppercase letter';
    else if (!/[0-9]/.test(password)) newErrors.password = 'Must include a number';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/reset-password', { token, newPassword: password });
      setIsSubmitted(true);
    } catch (err) {
      setErrors({ password: getErrorMessage(err) || 'Failed to reset password. The link may have expired.' });
    } finally {
      setIsLoading(false);
    }
  };

  const strength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const levels = [
      { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' },
      { label: 'Fair', color: 'bg-orange-500', width: 'w-2/4' },
      { label: 'Good', color: 'bg-yellow-500', width: 'w-3/4' },
      { label: 'Strong', color: 'bg-green-500', width: 'w-full' },
    ];
    return levels[Math.max(0, score - 1)] || levels[0];
  })();

  return (
    <PageTransition>
      <main className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-lg flex-col items-center justify-center px-4 py-24">
          <FadeIn>
            <div className="w-full">
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40">
                    <FiCheckCircle className="h-8 w-8 text-sage-dark" />
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-walnut">Password Reset Successful</h1>
                  <p className="mb-6 text-slate">Your password has been updated successfully.</p>
                  <Button variant="walnut" size="lg" onClick={() => router.push('/login')}>
                    Sign In
                  </Button>
                </motion.div>
              ) : (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl font-bold text-walnut">Reset Password</h1>
                    <p className="mt-2 text-slate">Enter your new password below.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                      <Input
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setErrors({});
                        }}
                        error={errors.password}
                        leftIcon={<FiLock className="h-4 w-4" />}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-[38px] text-slate hover:text-walnut-light"
                      >
                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                      {password && (
                        <div className="mt-2">
                          <div className="h-1 w-full overflow-hidden rounded-full bg-sage-light/50">
                            <div className={`h-full rounded-full ${strength.color} ${strength.width} transition-all duration-300`} />
                          </div>
                          <p className="mt-1 text-xs text-slate">Password strength: {strength.label}</p>
                        </div>
                      )}
                    </div>

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setErrors({});
                      }}
                      error={errors.confirmPassword}
                      leftIcon={<FiLock className="h-4 w-4" />}
                      required
                    />

                    <Button type="submit" variant="walnut" size="lg" fullWidth isLoading={isLoading}>
                      Reset Password
                    </Button>
                  </form>

                  <p className="mt-6 text-center text-sm text-slate">
                    <Link href="/login" className="font-medium text-walnut underline transition-colors hover:text-walnut-light">
                      Back to Sign In
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
