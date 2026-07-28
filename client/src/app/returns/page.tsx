'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Returns & Refunds Policy Page
// ============================================================

export default function ReturnsPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Returns & Refunds' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Returns & Refunds</h1>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 prose prose-sm">
          <h2>Return Policy</h2>
          <p>We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in original condition with all tags attached.</p>
          <h2>How to Return</h2>
          <p>Contact our customer service team to initiate a return. We will provide you with a return shipping label and instructions.</p>
          <h2>Refunds</h2>
          <p>Refunds will be processed within 5-7 business days after we receive your return. The refund will be issued to your original payment method.</p>
          <h2>Exchanges</h2>
          <p>We offer free size exchanges for all domestic orders. Contact us for assistance with exchanges.</p>
          <h2>Non-Returnable Items</h2>
          <p>Sale items, personalized products, and gift cards are not eligible for return unless defective.</p>
          <h2>Contact</h2>
          <p>For return inquiries, please contact us at returns@voss.com.</p>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
