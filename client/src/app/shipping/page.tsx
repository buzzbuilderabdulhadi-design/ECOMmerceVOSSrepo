'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Shipping Policy Page
// ============================================================

export default function ShippingPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shipping Policy' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Shipping Policy</h1>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 prose prose-sm">
          <h2>Shipping Methods</h2>
          <p>We offer standard and express shipping worldwide. All orders are processed within 1-2 business days.</p>
          <h2>Free Shipping</h2>
          <p>Free standard shipping is available on all orders over $200 USD. This offer is valid for most countries.</p>
          <h2>Delivery Times</h2>
          <p>Standard: 5-10 business days. Express: 2-4 business days. Delivery times may vary based on location and customs clearance.</p>
          <h2>Tracking</h2>
          <p>Once your order ships, you will receive a tracking number via email. You can track your order through your account dashboard.</p>
          <h2>International Shipping</h2>
          <p>Customs duties and taxes may apply to international orders. These charges are the responsibility of the customer.</p>
          <h2>Contact</h2>
          <p>For shipping inquiries, please contact us at shipping@voss.com.</p>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
