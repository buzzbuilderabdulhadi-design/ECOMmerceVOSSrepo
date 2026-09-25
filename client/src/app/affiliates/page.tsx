'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

// ============================================================
// Affiliates — Partner program
// ============================================================

export default function AffiliatesPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Partners
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Affiliates' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Partnerships
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Affiliates</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                Earn commission by sharing ZOYA GOODS with your audience.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>How It Works</h2>
          <p>
            Our affiliate program rewards creators, bloggers, and influencers who introduce new
            customers to ZOYA GOODS. Share your tracked link; when someone purchases through it, you
            earn a commission on qualifying orders.
          </p>
          <h2>What We Offer</h2>
          <ul>
            <li>Commission on qualifying sales made through your link.</li>
            <li>Tracked, real-time performance from your dashboard.</li>
            <li>Creative assets including product imagery and brand banners.</li>
            <li>Early access to new collections and seasonal drops.</li>
          </ul>
          <h2>Who We Look For</h2>
          <p>
            We work best with partners who genuinely love considered, quality fashion and whose
            audience aligns with our brand. Authenticity matters more than audience size.
          </p>
          <h2>Apply</h2>
          <p>
            Applications are reviewed in small batches. Tell us about your platform, audience, and
            why ZOYA GOODS fits, and we&apos;ll come back to you.
          </p>
          <div className="mt-6 not-prose">
            <Button href="/contact" variant="walnut" size="md">Apply to the Program</Button>
          </div>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}