'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';

// ============================================================
// Careers — Join the ZOYA GOODS team
// ============================================================

export default function CareersPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Careers
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Careers' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Careers
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Careers</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                Join the ZOYA GOODS team and help shape the future of considered luxury fashion.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>What We Value</h2>
          <ul>
            <li><strong>Craft and care</strong> — we sweat the details, from a seam to a sentence.</li>
            <li><strong>Honesty</strong> — we say what we do and do what we say.</li>
            <li><strong>Serving people</strong> — great customer experience is everyone&apos;s job.</li>
            <li><strong>Responsibility</strong> — we think about what we make and how we make it.</li>
          </ul>

          <h2>Working With Us</h2>
          <p>
            We&apos;re a growing team working across product, design, engineering, and customer care.
            We value initiative, taste, and clear communication, and we look for people who enjoy
            building things properly.
          </p>

          <h2>Open Roles</h2>
          <p>
            There are no open roles right now, but we&apos;re always interested in hearing from
            exceptional people. Send us your details and what you&apos;d love to do here, and we&apos;ll be
            in touch when something fits.
          </p>
          <div className="mt-6 not-prose">
            <Button href="/contact" variant="walnut" size="md">Send an Open Application</Button>
          </div>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}