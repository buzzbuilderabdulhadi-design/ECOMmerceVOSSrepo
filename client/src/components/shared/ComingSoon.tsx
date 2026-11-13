'use client';

import React from 'react';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { FadeIn } from '@/components/animations/FadeIn';
import { Button } from '@/components/ui/Button';

interface ComingSoonProps {
  title: string;
  eyebrow: string;
  description: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export function ComingSoon({ title, eyebrow, description, icon, children }: ComingSoonProps) {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />

        {/* Editorial header */}
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            {title}
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: title }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                {eyebrow}
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">{title}</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">{description}</p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12">
          <FadeIn variant="fadeUp">
            {children || (
              <div className="rounded-3xl border border-sage-light/40 bg-white/60 px-8 py-16 text-center shadow-sm backdrop-blur-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40 text-sage-dark">
                  {icon || (
                    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.25} d="M12 3v2m0 14v2M5.6 5.6l1.4 1.4m10.4 10.4l1.4 1.4M3 12h2m14 0h2M5.6 18.4l1.4-1.4M17.6 7.6l1.4-1.4M9 12a3 3 0 116 0 3 3 0 01-6 0z" />
                    </svg>
                  )}
                </div>
                <h2 className="mt-6 font-display text-3xl font-light text-navy">Crafting this space</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  {description} Our atelier is curating this page to the ZOYA GOODS standard. It will be unveiled shortly.
                </p>
                <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                  <Button href="/" variant="walnut" size="md">Back to Home</Button>
                  <Button href="/contact" variant="outline" size="md">Contact Us</Button>
                </div>
              </div>
            )}
          </FadeIn>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}
