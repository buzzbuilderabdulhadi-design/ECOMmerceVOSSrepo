'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Accordion } from '@/components/ui/Accordion';
import { Button } from '@/components/ui/Button';

// ============================================================
// FAQ — Frequently asked questions
// ============================================================

const faqItems = [
  {
    id: 'orders',
    title: 'How do I place an order?',
    content: (
      <p>
        Browse the catalog, choose your size and color, and add items to your bag. Proceed to
        checkout where you can pay by card (Stripe), PayPal, or a manual method (bank transfer or
        Payoneer) where enabled. After ordering, you&apos;ll receive an email confirmation with your
        order number.
      </p>
    ),
  },
  {
    id: 'payment',
    title: 'Which payment methods do you accept?',
    content: (
      <p>
        We accept major credit and debit cards processed by Stripe, PayPal, and (at checkout) bank
        transfer or Payoneer. Available methods are shown during checkout and depend on your
        location. Card and PayPal payments settle instantly; manual methods are confirmed once we
        receive and verify the funds.
      </p>
    ),
  },
  {
    id: 'shipping-time',
    title: 'How long does shipping take?',
    content: (
      <p>
        Standard shipping takes 5–10 business days; express takes 2–4 business days. Orders are
        processed within 1–2 business days and you&apos;ll receive a tracking number by email once
        your order ships.
      </p>
    ),
  },
  {
    id: 'free-shipping',
    title: 'When do I get free shipping?',
    content: (
      <p>
        Free standard shipping is applied automatically to orders over $200. If your bag qualifies,
        you&apos;ll see free shipping reflected in your checkout totals.
      </p>
    ),
  },
  {
    id: 'status',
    title: 'How do I track my order?',
    content: (
      <p>
        Sign in and open the Orders page in your dashboard. Each order shows its current status
        (pending, confirmed, processing, shipped, delivered, or cancelled) and shipping updates
        arrive by email with tracking details.
      </p>
    ),
  },
  {
    id: 'cancel',
    title: 'Can I cancel my order?',
    content: (
      <p>
        Orders can be cancelled while they are still awaiting payment. Once payment has been
        received the order moves into processing and can no longer be cancelled from your account —
        contact support and we&apos;ll help you arrange a return instead.
      </p>
    ),
  },
  {
    id: 'returns',
    title: 'What is your return policy?',
    content: (
      <p>
        We accept returns within 30 days of delivery. Items must be unworn, unwashed, and in
        original condition with tags attached. See our Returns &amp; Refunds page for full details.
      </p>
    ),
  },
  {
    id: 'exchanges',
    title: 'What is your size and fit policy?',
    content: (
      <p>
        Use the Size Guide to find your fit. If an item doesn&apos;t fit, you can exchange it within
        30 days — contact support and we&apos;ll arrange the return and size swap.
      </p>
    ),
  },
  {
    id: 'account',
    title: 'How do I update my account details or address?',
    content: (
      <p>
        Sign in and visit your dashboard. You can update your profile, phone number, saved shipping
        addresses, and password at any time.
      </p>
    ),
  },
  {
    id: 'support',
    title: 'Something else — how do I reach you?',
    content: (
      <p>
        Use the Contact page to send us a message. Our team responds during business hours (Mon–Fri,
        9:00 AM – 6:00 PM EST) and we reply as quickly as we can.
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <PageTransition>
      <main className="min-h-screen bg-gradient-warm grain">
        <Navbar />
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none whitespace-nowrap font-display text-[5rem] leading-none opacity-50 sm:text-[8rem] lg:text-[13rem]">
            FAQ
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />
          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]} />
            <div className="mt-8 max-w-2xl">
              <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-dark">
                <span className="inline-block h-px w-10 bg-walnut" />
                Support
              </p>
              <h1 className="mt-5 font-display text-5xl font-light text-navy sm:text-6xl">FAQ</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                Answers to the questions we hear most often about ordering, payments, shipping, and returns.
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 pb-24 sm:px-8 lg:px-12">
          <Accordion items={faqItems} allowMultiple defaultExpanded={['orders']} />
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sage-light/40 bg-white/60 p-6 backdrop-blur-sm">
            <div>
              <p className="font-display text-xl font-light text-navy">Still have questions?</p>
              <p className="mt-1 text-sm text-slate">Our team is happy to help you find the answer.</p>
            </div>
            <Button href="/contact" variant="walnut" size="md">Contact Us</Button>
          </div>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}