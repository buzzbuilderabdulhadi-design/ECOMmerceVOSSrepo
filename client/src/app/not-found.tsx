'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

// ============================================================
// 404 Not Found Page
// ============================================================

export default function NotFoundPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-8xl font-bold tracking-tight text-gray-200 sm:text-9xl">404</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="mt-4 text-2xl font-semibold text-gray-900 sm:text-3xl">Page not found</h2>
          <p className="mt-2 text-base text-gray-500">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              Return Home
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
