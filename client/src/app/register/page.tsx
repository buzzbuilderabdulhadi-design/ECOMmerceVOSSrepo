'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ============================================================
// Register Page — User registration
// ============================================================

export default function RegisterPage() {
  const [isLoading] = useState(false);

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md items-center justify-center px-4 py-16">
          <div className="w-full">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create your account</h1>
              <p className="mt-2 text-sm text-gray-500">
                Join VOSS and discover luxury fashion.
              </p>
            </div>

            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" placeholder="John" required />
                <Input label="Last Name" placeholder="Doe" required />
              </div>
              <Input label="Email" type="email" placeholder="john@example.com" required />
              <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" required />
              <Input label="Password" type="password" placeholder="Create a password" required />
              <Input label="Confirm Password" type="password" placeholder="Confirm your password" required />

              <label className="flex items-start gap-2">
                <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
                <span className="text-sm text-gray-600">
                  I agree to the{' '}
                  <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
                  <Link href="/privacy" className="underline">Privacy Policy</Link>.
                </span>
              </label>

              <Button variant="dark" size="lg" fullWidth isLoading={isLoading}>
                Create Account
              </Button>

              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-gray-900 underline hover:text-gray-600">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
