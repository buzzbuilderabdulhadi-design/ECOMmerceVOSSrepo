'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Terms & Conditions Page
// ============================================================

export default function TermsPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Terms of Service' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Terms of Service</h1>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 prose-zoya">
          <p>Last updated: September 2026</p>
          <h2>Acceptance of Terms</h2>
          <p>By accessing and using the ZOYA GOODS website, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          <h2>Products & Pricing</h2>
          <p>All prices are listed in USD and are subject to change without notice. We reserve the right to modify or discontinue products at any time.</p>
          <h2>Orders</h2>
          <p>We reserve the right to refuse or cancel any order. In the event of a pricing error, we will notify you and offer the option to cancel or proceed with the corrected price.</p>
          <h2>Intellectual Property</h2>
          <p>All content on this website, including images, text, and designs, is the property of ZOYA GOODS and is protected by applicable copyright laws.</p>
          <h2>Limitation of Liability</h2>
          <p>ZOYA GOODS shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services.</p>
          <h2>Contact</h2>
          <p>For questions about these terms, please contact us at legal@zoyagoods.com.</p>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
