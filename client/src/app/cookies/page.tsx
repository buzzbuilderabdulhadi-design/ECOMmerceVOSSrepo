'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Cookie Policy
// ============================================================

export default function CookiePolicyPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Cookies
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cookie Policy' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Privacy
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Cookie Policy</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                How we use cookies and similar technologies to keep the store running and improve your experience.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <p>Last updated: September 2026</p>
          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device when you visit a website. They help us
            remember your preferences, keep you signed in, understand how the store is used, and
            process essential operations such as keeping items in your bag.
          </p>
          <h2>Cookies We Use</h2>
          <h3>Essential</h3>
          <p>
            These cookies are required for the site to function. They include session tokens that keep
            you signed in and session identifiers that carry your guest shopping bag between pages.
            They cannot be switched off in our services.
          </p>
          <h3>Functional &amp; Preferences</h3>
          <p>
            These remember choices you make — such as saved addresses, recently viewed products, and
            display preferences — so you don&apos;t need to re-enter them.
          </p>
          <h3>Analytics</h3>
          <p>
            We use analytics to understand how visitors navigate the store (pages visited, time on
            site, popular products). The data is aggregated and does not identify you personally.
          </p>
          <h2>Managing Cookies</h2>
          <p>
            You can control or delete cookies through your browser&apos;s settings at any time. Note
            that disabling essential cookies may prevent the store — including your shopping bag —
            from working correctly.
          </p>
          <h2>Third-Party Services</h2>
          <p>
            Payment providers (Stripe, PayPal) may set cookies as part of processing your payment.
            These are controlled by those providers and governed by their own privacy policies.
          </p>
          <h2>Contact</h2>
          <p>
            For questions about this policy, contact us at privacy@zoyagoods.com or through the
            Contact page.
          </p>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}