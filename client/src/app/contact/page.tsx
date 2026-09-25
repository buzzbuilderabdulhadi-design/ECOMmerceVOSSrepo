'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { submitContactMessage } from '@/services/contact';

// ============================================================
// Contact Page — Customer support and inquiries
// ============================================================

const contactInfo = [
  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', label: 'Email', value: 'care@zoyagoods.com' },
  { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'Response Time', value: 'Within 24 hours on business days' },
  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', label: 'Location', value: 'Online boutique — worldwide shipping' },
  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: 'Hours', value: 'Mon–Fri, 9:00 AM – 6:00 PM EST' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
    if (status !== 'idle') setStatus('idle');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<keyof typeof form, string>> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (!form.message.trim()) errs.message = 'Message is required';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus('sending');
    try {
      await submitContactMessage(form);
      setStatus('sent');
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <section className="bg-cream py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-walnut sm:text-4xl">Get in Touch</h1>
            <p className="mt-2 text-base text-slate">We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.</p>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-12 md:grid-cols-2">
            {/* Contact Form */}
            <ScrollReveal direction="left">
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="First Name" placeholder="John" required value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} error={errors.firstName} />
                  <Input label="Last Name" placeholder="Doe" required value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} error={errors.lastName} />
                </div>
                <Input label="Email" type="email" placeholder="john@example.com" required value={form.email} onChange={(e) => updateField('email', e.target.value)} error={errors.email} />
                <Input label="Subject" placeholder="How can we help?" required value={form.subject} onChange={(e) => updateField('subject', e.target.value)} error={errors.subject} />
                <div>
                  <label htmlFor="contact-message" className="mb-1 block text-sm font-medium text-charcoal">Message</label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    required
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className={`w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 ${errors.message ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30' : 'border-sage-light/40 focus:border-walnut focus:ring-walnut/30'}`}
                    placeholder="Tell us more about your inquiry..."
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'contact-message-error' : undefined}
                  />
                  {errors.message && <p id="contact-message-error" className="mt-1 text-xs text-red-600" role="alert">{errors.message}</p>}
                  {status === 'sent' && (
                    <p className="mt-1 text-xs text-sage-dark" role="status">Thank you — your message has been sent. We&apos;ll reply as soon as possible.</p>
                  )}
                  {status === 'error' && (
                    <p className="mt-1 text-xs text-red-600" role="alert">Something went wrong sending your message. Please try again in a moment.</p>
                  )}
                </div>
                <Button variant="walnut" size="lg" fullWidth type="submit" disabled={status === 'sending'}>
                  {status === 'sending' ? 'Sending…' : 'Send Message'}
                </Button>
              </form>
            </ScrollReveal>

            {/* Contact Info */}
            <ScrollReveal direction="right">
              <div className="space-y-6">
                {contactInfo.map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-light/40">
                      <svg className="h-6 w-6 text-slate" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-walnut">{item.label}</p>
                      <p className="text-sm text-slate">{item.value}</p>
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
