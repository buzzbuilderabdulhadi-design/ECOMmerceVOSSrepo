'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Sustainability
// ============================================================

export default function SustainabilityPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Ethics
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Sustainability' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Ethics
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Sustainability</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                How we approach responsible design, materials, and making.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>Considered Materials</h2>
          <p>
            We favour natural and responsibly sourced fibres, and we share material and origin
            details on every product so you can make informed choices. Wherever an item has a lower
            environmental footprint — recycled, certified, or consciously sourced options — we say so
            plainly.
          </p>
          <h2>Made to Last</h2>
          <p>
            We design classic pieces meant to be worn for years, not seasons. Durability, timeless
            silhouettes, and quality construction reduce the need for constant replacement and the
            waste that comes with it.
          </p>
          <h2>Smaller Footprints</h2>
          <p>
            From packaging to shipping we look for ways to reduce impact: minimal packaging,
            consolidated orders for free shipping, and an efficient returns process that keeps
            products in circulation rather than in landfill.
          </p>
          <h2>Ethical Making</h2>
          <p>
            We work with partners who respect fair working conditions and treat the people who make
            our products with dignity. If a garment is made by a specific atelier or region, we
            credit it.
          </p>
          <h2>Ongoing Work</h2>
          <p>
            Sustainability is a process, not a finish line. We review our supply chain and materials
            regularly and will update this page as our practices evolve.
          </p>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}