'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Accessibility
// ============================================================

export default function AccessibilityPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Access
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Accessibility' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Accessibility
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Accessibility</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                We&apos;re working to make ZOYA GOODS usable by everyone, regardless of ability or technology.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>Our Commitment</h2>
          <p>
            We are committed to ensuring our website is accessible to people with disabilities. We
            continually review the store against the Web Content Accessibility Guidelines (WCAG) 2.1
            and aim to meet Level AA criteria.
          </p>
          <h2>What We Do</h2>
          <ul>
            <li>Provide keyboard navigation so all pages and features can be used without a mouse.</li>
            <li>Maintain sufficient colour contrast and support high-contrast reading.</li>
            <li>Label form fields and provide clear error messages, announced to assistive technology.</li>
            <li>Include descriptive text for images and meaningful headings throughout the store.</li>
            <li>Design for a consistent layout that adapts to all screen sizes.</li>
          </ul>
          <h2>Screen Readers &amp; Assistive Tools</h2>
          <p>
            The store is built with semantic HTML so it can be read by popular screen readers
            (VoiceOver, NVDA, TalkBack, and others). We continue to test with these tools as features
            change.
          </p>
          <h2>Feedback</h2>
          <p>
            If you encounter an accessibility barrier on the site, we want to hear about it. Please
            describe the issue and the assistive technology you use, and we&apos;ll work to resolve it.
          </p>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}