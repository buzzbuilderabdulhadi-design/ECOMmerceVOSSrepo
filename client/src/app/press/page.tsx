'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

// ============================================================
// Press — Media resources and brand facts
// ============================================================

export default function PressPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Press
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Press' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Media
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Press</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                Brand resources, facts, and contacts for journalists and content creators.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>About the Brand</h2>
          <p>
            ZOYA GOODS creates considered luxury fashion: timeless outerwear and everyday pieces
            built from quality materials and designed to last. We pair classic silhouettes with
            honest product detail so customers know exactly what they&apos;re buying.
          </p>
          <h2>Brand Facts</h2>
          <ul>
            <li>Founded with a focus on durable, classic wardrobe pieces.</li>
            <li>Global shipping with free standard delivery on orders over $200.</li>
            <li>Every product lists its materials, origin, and sizing guidance.</li>
            <li>Secure checkout with card (Stripe), PayPal, and manual payment options.</li>
          </ul>
          <h2>Media Inquiries</h2>
          <p>
            For interviews, product samples, imagery, and brand assets, reach our press desk at
            press@zoyagoods.com. We aim to respond within two business days.
          </p>
          <div className="mt-6 not-prose">
            <Button href="/contact" variant="walnut" size="md">Contact the Press Desk</Button>
          </div>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}