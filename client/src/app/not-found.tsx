'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="relative flex min-h-[calc(100vh-200px)] flex-col items-center justify-center px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-warm" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, rgba(138, 154, 123, 0.15) 0%, transparent 60%)`,
        }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          className="relative z-10"
        >
          <h1 className="text-8xl font-bold tracking-tight text-walnut sm:text-9xl">404</h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative z-10"
        >
          <h2 className="mt-4 text-2xl font-semibold text-navy sm:text-3xl">Page not found</h2>
          <p className="mt-2 text-base text-slate">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
          <div className="mt-8">
            <Link href="/">
              <Button variant="primary" size="lg">
                Return Home
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
      <Footer />
    </main>
  );
}
