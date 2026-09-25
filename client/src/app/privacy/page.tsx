'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Privacy Policy Page
// ============================================================

export default function PrivacyPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-navy sm:text-4xl">Privacy Policy</h1>
          </div>
        </section>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 prose-zoya">
          <p>Last updated: September 2026</p>
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly to us, including name, email address, phone number, shipping address, and payment information when you make a purchase or create an account.</p>
          <h2>How We Use Your Information</h2>
          <p>We use your information to process orders, provide customer support, send marketing communications (with your consent), and improve our services.</p>
          <h2>Data Protection</h2>
          <p>We implement industry-standard security measures to protect your personal information. All payment transactions are encrypted using SSL technology.</p>
          <h2>Your Rights</h2>
          <p>You have the right to access, update, or delete your personal information at any time. Contact us at privacy@zoyagoods.com for assistance.</p>
          <h2>Cookies</h2>
          <p>We use cookies to enhance your browsing experience and analyze site traffic. You can control cookie preferences in your browser settings.</p>
          <h2>Contact</h2>
          <p>For privacy-related inquiries, please contact us at privacy@zoyagoods.com.</p>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
