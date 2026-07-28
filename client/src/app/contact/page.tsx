'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

// ============================================================
// Contact Page — Customer support and inquiries
// ============================================================

const contactInfo = [
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'hello@voss.com' },
  { icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', label: 'Phone', value: '+1 (555) 000-0000' },
  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Address', value: '123 Luxury Row, Milan, Italy' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM EST' },
];

export default function ContactPage() {
  const [isLoading] = useState(false);

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Get in Touch</h1>
            <p className="mt-2 text-base text-gray-500">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Contact Form */}
            <ScrollReveal direction="left">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" required />
                  <Input label="Last Name" placeholder="Doe" required />
                </div>
                <Input label="Email" type="email" placeholder="john@example.com" required />
                <Input label="Subject" placeholder="How can we help?" required />
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Message</label>
                  <textarea rows={5} className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900" placeholder="Tell us more about your inquiry..." />
                </div>
                <Button variant="dark" size="lg" fullWidth isLoading={isLoading}>Send Message</Button>
              </div>
            </ScrollReveal>

            {/* Contact Info */}
            <ScrollReveal direction="right">
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
