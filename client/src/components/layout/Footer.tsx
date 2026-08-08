'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { NewsletterForm } from '@/components/ui/NewsletterForm';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  className?: string;
}

const quickLinks: FooterLink[] = [
  { label: 'Shop All', href: '/shop' },
  { label: 'New Arrivals', href: '/shop?sort=new' },
  { label: 'Best Sellers', href: '/shop?sort=best' },
  { label: 'Sale', href: '/shop?sale=true' },
  { label: 'Wishlist', href: '/wishlist' },
  { label: 'Track Order', href: '/dashboard/orders' },
];

const categories: FooterLink[] = [
  { label: 'Outerwear', href: '/category/outerwear' },
  { label: 'Tailoring', href: '/category/tailoring' },
  { label: 'Knitwear', href: '/category/knitwear' },
  { label: 'Footwear', href: '/category/shoes' },
  { label: 'Leather Goods', href: '/category/bags' },
  { label: 'Accessories', href: '/category/accessories' },
];

const customerService: FooterLink[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Shipping & Delivery', href: '/shipping' },
  { label: 'Returns & Exchanges', href: '/returns' },
  { label: 'Size Guide', href: '/size-guide' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Track Order', href: '/dashboard/orders' },
];

const companyLinks: FooterLink[] = [
  { label: 'About VOSS', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Press', href: '/press' },
  { label: 'Sustainability', href: '/sustainability' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'Affiliates', href: '/affiliates' },
];

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', d: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z' },
  { label: 'Facebook', href: 'https://facebook.com', d: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { label: 'X (Twitter)', href: 'https://twitter.com', d: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
  { label: 'Pinterest', href: 'https://pinterest.com', d: 'M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146 1.124.347 2.317.535 3.554.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z' },
  { label: 'YouTube', href: 'https://youtube.com', d: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
];

const contactItems = [
  {
    icon: (
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    content: (
      <span className="text-sm leading-relaxed text-ivory">
        1200 Madison Avenue
        <br />
        New York, NY 10128
      </span>
    ),
  },
  {
    icon: (
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    content: (
      <a href="tel:+18005550188" className="text-sm text-ivory transition-colors duration-300 hover:text-gold">
        +1 (800) 555-0188
      </a>
    ),
  },
  {
    icon: (
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    content: (
      <a href="mailto:care@voss.com" className="text-sm text-ivory transition-colors duration-300 hover:text-gold">
        care@voss.com
      </a>
    ),
  },
  {
    icon: (
      <svg className="mt-0.5 h-4 w-4 shrink-0 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    content: (
      <span className="text-sm leading-relaxed text-ivory">
        Mon–Sat: 10am – 7pm ET
      </span>
    ),
  },
];

const paymentMethods = ['VISA', 'Mastercard', 'AMEX', 'PayPal', 'Apple Pay'];

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn('relative overflow-hidden bg-gradient-footer grain', className)}>
      {/* Giant watermark */}
      <span className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 select-none font-display text-[24rem] font-light leading-none text-ivory/[0.06] lg:text-[36rem]">
        VOSS
      </span>

      {/* Gold hairline across the very top */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />

      <StaggerChildren className="relative z-10" staggerDelay={0.08}>
        {/* ============ Newsletter strip ============ */}
        <StaggerItem>
          <div className="border-b border-cream/10">
            <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-20">
              <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                <div>
                  <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-sage-light">
                    <span className="inline-block h-px w-10 bg-walnut-light" />
                    Join the VOSS Circle
                  </p>
                  <h3 className="mt-5 font-display text-4xl font-light leading-[1.08] text-ivory sm:text-5xl">
                    The Journal is where <span className="display-italic text-gold">style begins</span>
                  </h3>
                  <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-ivory">
                    Subscribe to receive exclusive offers, early access to new collections, and luxury style inspiration.
                  </p>
                </div>
                <div className="lg:justify-self-end lg:w-full lg:max-w-md">
                  <NewsletterForm variant="dark" />
                  <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-sage-light">
                    No spam. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ============ Main columns ============ */}
        <StaggerItem>
          <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-8 lg:px-12 lg:py-20">
            <div className="grid grid-cols-12 gap-x-8 gap-y-14">
              {/* Brand + contact */}
              <div className="col-span-12 md:col-span-6 xl:col-span-4">
                <Link href="/" className="group inline-flex items-baseline gap-2.5">
                  <span className="font-display text-[28px] font-medium leading-none tracking-[0.3em] text-ivory transition-colors duration-300 group-hover:text-gold">
                    VOSS
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-gold transition-transform duration-300 group-hover:scale-150" />
                </Link>
                <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.35em] text-sage-light">
                  Luxury Fashion House
                </p>

                <p className="mt-6 max-w-xs text-sm leading-relaxed text-ivory">
                  Curating the finest luxury fashion from around the world. Timeless elegance, modern sophistication — since 1991.
                </p>

                <div className="mt-8 flex gap-3">
                  {socialLinks.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/70 hover:bg-gold/10 hover:text-gold active:scale-95"
                      aria-label={social.label}
                    >
                      <svg className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
                        <path d={social.d} />
                      </svg>
                    </a>
                  ))}
                </div>

                {/* Contact */}
                <div className="mt-8 space-y-5 border-t border-cream/10 pt-8">
                  {contactItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-3.5">
                      {item.icon}
                      {item.content}
                    </div>
                  ))}
                </div>
              </div>

              {/* Link columns */}
              <div className="col-span-6 md:col-span-3 xl:col-span-2">
                <FooterColumnBlock title="Quick Links" links={quickLinks} />
              </div>
              <div className="col-span-6 md:col-span-3 xl:col-span-2">
                <FooterColumnBlock title="Categories" links={categories} />
              </div>
              <div className="col-span-6 md:col-span-3 xl:col-span-2">
                <FooterColumnBlock title="Customer Service" links={customerService} />
              </div>
              <div className="col-span-6 md:col-span-3 xl:col-span-2">
                <FooterColumnBlock title="Company" links={companyLinks} />
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* ============ Bottom bar ============ */}
        <StaggerItem>
          <div className="relative border-t border-cream/10">
            <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
            <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-8 lg:px-12">
              <div className="flex flex-col items-center justify-between gap-7 lg:flex-row">
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-6">
                  <p className="text-xs text-sage-light">
                    &copy; {new Date().getFullYear()} VOSS. All rights reserved.
                  </p>
                  <span className="hidden h-3 w-px bg-cream/20 sm:block" />
                  <div className="flex items-center gap-5">
                    <Link href="/privacy" className="link-underline link-underline-walnut text-xs text-ivory transition-colors duration-300 hover:text-gold">
                      Privacy
                    </Link>
                    <Link href="/terms" className="link-underline link-underline-walnut text-xs text-ivory transition-colors duration-300 hover:text-gold">
                      Terms
                    </Link>
                    <Link href="/cookies" className="link-underline link-underline-walnut text-xs text-ivory transition-colors duration-300 hover:text-gold">
                      Cookies
                    </Link>
                  </div>
                </div>

                {/* Payment methods */}
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {paymentMethods.map((mark) => (
                    <PaymentChip key={mark} mark={mark} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StaggerItem>
      </StaggerChildren>

      <BackToTopButton />
    </footer>
  );
}

function FooterColumnBlock({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h4 className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-gold">
        <span className="inline-block h-px w-6 bg-walnut-light" />
        {title}
      </h4>
      <ul className="mt-7 space-y-3.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="group/link link-underline link-underline-walnut inline-flex items-center text-sm text-ivory transition-colors duration-300 hover:text-gold"
            >
              <span className="inline-block w-0 overflow-hidden whitespace-nowrap align-middle text-gold transition-all duration-300 group-hover/link:w-3">
                {'\u203a'}
              </span>
              <span className="inline-block align-middle">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentChip({ mark }: { mark: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-md border border-cream/15 bg-cream/[0.05] px-3 text-[9px] font-semibold tracking-widest text-ivory transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:text-gold">
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h2m-2 3h2m-2-3h2m-2-3h2m4 6h2" />
        <rect x="3" y="5" width="18" height="14" rx="2" strokeWidth={1.5} />
      </svg>
      {mark}
    </span>
  );
}

function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="group fixed bottom-[76px] right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-cream/20 bg-navy/85 text-ivory shadow-xl shadow-black/30 backdrop-blur-md transition-colors duration-300 hover:border-gold/70 hover:text-gold lg:bottom-6"
          aria-label="Back to top"
        >
          <svg className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 15l7-7 7 7" />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
