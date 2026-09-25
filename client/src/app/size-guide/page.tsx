'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

// ============================================================
// Size Guide
// ============================================================

const measurements = [
  { size: 'XS', chest: '32–34" (81–86 cm)', waist: '24–26" (61–66 cm)', hips: '34–36" (86–91 cm)' },
  { size: 'S', chest: '34–36" (86–91 cm)', waist: '26–28" (66–71 cm)', hips: '36–38" (91–96 cm)' },
  { size: 'M', chest: '36–38" (91–96 cm)', waist: '28–30" (71–76 cm)', hips: '38–40" (96–101 cm)' },
  { size: 'L', chest: '38–41" (96–104 cm)', waist: '30–33" (76–84 cm)', hips: '40–43" (101–109 cm)' },
  { size: 'XL', chest: '41–44" (104–112 cm)', waist: '33–36" (84–91 cm)', hips: '43–46" (109–117 cm)' },
  { size: 'XXL', chest: '44–47" (112–119 cm)', waist: '36–39" (91–99 cm)', hips: '46–49" (117–124 cm)' },
];

export default function SizeGuidePage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            Fit
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Size Guide' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Fit
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">Size Guide</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                Measure yourself against our standard clothing sizes to find your best fit.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-8 lg:px-12 prose-zoya">
          <h2>How to Measure</h2>
          <p>
            Use a soft measuring tape over light clothing. <strong>Chest/bust</strong>: around the fullest part.
            <strong> Waist</strong>: at your natural waistline. <strong>Hips</strong>: around the fullest part of your hips.
            Keep the tape comfortably snug — not tight.
          </p>

          <div className="overflow-x-auto rounded-2xl border border-sage-light/40 bg-white/60 shadow-sm backdrop-blur-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sage-light/40 text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-dark">
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Chest</th>
                  <th className="px-4 py-3">Waist</th>
                  <th className="px-4 py-3">Hips</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-light/30 text-slate">
                {measurements.map((m) => (
                  <tr key={m.size}>
                    <td className="px-4 py-3 font-semibold text-navy">{m.size}</td>
                    <td className="px-4 py-3">{m.chest}</td>
                    <td className="px-4 py-3">{m.waist}</td>
                    <td className="px-4 py-3">{m.hips}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2>Between Sizes?</h2>
          <p>
            We recommend sizing up if you prefer a relaxed fit or fall between two sizes. For
            stretch knitwear, your usual size is a safe choice.
          </p>
          <h2>Garment Variations</h2>
          <p>
            Some pieces — especially outerwear and tailored items — are cut differently and include
            their own fit notes on the product page. Always check the product description for whether
            an item runs true to size.
          </p>
          <h2>Still Unsure?</h2>
          <p>
            Contact our team through the Contact page with your height and measurements and we&apos;ll
            help you choose. Exchanges for the wrong size are always possible within 30 days.
          </p>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}