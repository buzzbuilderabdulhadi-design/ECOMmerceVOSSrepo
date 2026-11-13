'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';

// ============================================================
// About Page — Brand story and values
// ============================================================

const milestones = [
  { year: '1991', title: 'The Beginning', description: 'ZOYA GOODS was founded in Milan with a vision to create the world\'s finest leather jackets.' },
  { year: '2000', title: 'Global Expansion', description: 'Opened flagship stores in London, Paris, and New York, bringing ZOYA GOODS to the global stage.' },
  { year: '2010', title: 'Digital Transformation', description: 'Launched our e-commerce platform, making luxury accessible worldwide.' },
  { year: '2020', title: 'Sustainable Luxury', description: 'Committed to 100% sustainable sourcing and ethical manufacturing practices.' },
  { year: '2024', title: 'The Future', description: 'Continuing to innovate with cutting-edge design while honoring our heritage of craftsmanship.' },
];

const values = [
  {
    title: 'Artisan Craftsmanship',
    description: 'Every ZOYA GOODS jacket is handcrafted by master artisans with decades of experience, ensuring unparalleled quality and attention to detail.',
    icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  },
  {
    title: 'Premium Materials',
    description: 'We source only the finest full-grain leathers, Italian suedes, and luxury fabrics from the world\'s most renowned tanneries.',
    icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  },
  {
    title: 'Timeless Design',
    description: 'Our designs transcend seasonal trends, creating pieces that remain elegant and relevant for decades to come.',
    icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
  },
  {
    title: 'Ethical Production',
    description: 'We are committed to ethical manufacturing, fair labor practices, and environmentally responsible production methods.',
    icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
];

export default function AboutPage() {
  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="relative overflow-hidden bg-walnut py-24 md:py-32">
          <div className="absolute inset-0">
            <Image src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1920&q=80" alt="ZOYA GOODS Heritage" fill className="object-cover opacity-40" sizes="100vw" priority />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-walnut/80 via-walnut/50 to-walnut/20" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'About' }]} onDark />
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Our Story
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white">
              For over three decades, ZOYA GOODS has been synonymous with uncompromising quality, timeless design, and the art of fine craftsmanship.
            </p>
          </div>
        </section>

        {/* Brand Story */}
        <ScrollReveal>
          <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 md:py-24">
            <div className="grid gap-12 md:grid-cols-2 md:items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-walnut sm:text-4xl">
                  Crafting Excellence Since 1991
                </h2>
                <div className="mt-6 space-y-4 text-base leading-relaxed text-slate">
                  <p>Founded in the heart of Milan, ZOYA GOODS began with a simple mission: to create leather jackets that transcend time. Our founder, Alessandro Vossi, was a master artisan who believed that a jacket should be more than clothing—it should be a legacy.</p>
                  <p>From our atelier in Italy to our workshops around the world, every ZOYA GOODS jacket is a testament to the belief that true luxury lies in the details. The precise stitching, the carefully selected leather, the perfect fit—these are the elements that define us.</p>
                  <p>Today, ZOYA GOODS is worn by those who appreciate the difference that true craftsmanship makes. Our commitment to quality remains as strong as it was on day one.</p>
                </div>
              </div>
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                <Image src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80" alt="ZOYA GOODS Craftsmanship" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>
            </div>
          </section>
        </ScrollReveal>

        {/* Milestones */}
        <section className="bg-cream py-16 md:py-24">
          <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <ScrollReveal>
              <h2 className="text-3xl font-bold tracking-tight text-walnut sm:text-4xl text-center">Our Journey</h2>
            </ScrollReveal>
            <div className="mt-12 space-y-8">
              {milestones.map((milestone, index) => (
                <ScrollReveal key={milestone.year} direction={index % 2 === 0 ? 'left' : 'right'}>
                  <div className="flex items-start gap-6">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-walnut text-white">
                      <span className="text-sm font-bold">{milestone.year}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-walnut">{milestone.title}</h3>
                      <p className="mt-1 text-base text-slate">{milestone.description}</p>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto max-w-[1400px] px-5 py-16 sm:px-8 lg:px-12 md:py-24">
          <ScrollReveal>
            <h2 className="text-3xl font-bold tracking-tight text-walnut sm:text-4xl text-center">What We Stand For</h2>
          </ScrollReveal>
          <StaggerChildren className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {values.map((value) => (
              <StaggerItem key={value.title}>
                <div className="rounded-xl border border-sage-light/30 p-6 transition-shadow hover:shadow-md">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-walnut text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={value.icon} /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-walnut">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate">{value.description}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>
        </section>

        {/* CTA */}
        <section className="bg-walnut py-16 text-center md:py-24">
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <ScrollReveal>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Experience the Difference</h2>
              <p className="mt-4 text-lg text-white">Discover our collection of handcrafted jackets designed for those who appreciate the finest things in life.</p>
              <Link href="/shop" className="mt-8 inline-flex items-center justify-center rounded-lg bg-white px-8 py-3 text-sm font-semibold text-walnut transition-colors hover:bg-cream-dark/50">
                Shop Now
              </Link>
            </ScrollReveal>
          </div>
        </section>

        <Footer />
      </main>
    </PageTransition>
  );
}
