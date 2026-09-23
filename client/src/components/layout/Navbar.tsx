'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useCartDrawer } from '@/context/CartDrawerContext';
import { NAV_CATEGORIES } from '@/data/navigation';
import { MegaMenu } from '@/components/layout/MegaMenu';

export interface NavbarProps {
  className?: string;
  variant?: 'dark' | 'light';
}

const popularSearches = [
  'Leather Jacket',
  'Bomber',
  'Suede',
  'Cashmere Scarf',
  'Handbag',
  'Boots',
];

const EASE = [0.25, 0.1, 0.25, 1] as const;

const emptySubscribe = () => () => {};

export function Navbar({ className }: NavbarProps) {
  const { itemCount } = useCart();
  const { openCart } = useCartDrawer();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [openMobileCategory, setOpenMobileCategory] = useState<string | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const trapFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const focusables = e.currentTarget.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  useEffect(() => {
    if (isMobileMenuOpen) mobileCloseRef.current?.focus();
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const isCategoryActive = (label: string) => {
    const item = NAV_CATEGORIES.find((c) => c.label === label);
    if (!item) return false;
    if (pathname === item.href) return true;
    return item.subcategories.some((sub) => pathname === sub.href);
  };

  const openDropdown = (label: string) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenCategory(label);
  };

  const cancelClose = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const closeDropdown = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => setOpenCategory(null), 150);
  };

  const closeDropdownNow = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setOpenCategory(null);
  };

  const activeCategory = NAV_CATEGORIES.find((c) => c.label === openCategory);

  const toggleMobileCategory = (label: string) => {
    setOpenMobileCategory((prev) => (prev === label ? null : label));
  };

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen || isSearchOpen ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
        setOpenCategory(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [isMobileMenuOpen, isSearchOpen]);

  const searchOverlay = mounted
    ? createPortal(
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-night fixed inset-0 z-[90] flex flex-col grain"
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              onKeyDown={trapFocus}
            >
              <div className="flex items-center justify-between px-6 py-5 sm:px-12">
                <span className="font-display text-xl tracking-[0.3em] text-ivory">ZOYA GOODS</span>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="rounded-full border border-cream/20 p-3 text-ivory transition-all hover:scale-105 hover:border-sage-light/60 hover:text-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-light"
                  aria-label="Close search"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center px-6">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="w-full max-w-2xl"
                >
                  <label className="text-[11px] uppercase tracking-[0.35em] text-sage-light">Search</label>
                  <div className="relative mt-4">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="What are you looking for?"
                      className="w-full border-b border-cream/25 bg-transparent pb-4 font-display text-3xl font-light text-ivory placeholder-ivory/80 focus:border-sage-light focus:outline-none sm:text-5xl"
                    />
                    <svg className="absolute right-0 top-1/2 h-7 w-7 -translate-y-1/2 text-sage-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <div className="mt-10">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-sage-light">Popular</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {popularSearches.map((term) => (
                        <Link
                          key={term}
                          href={`/shop?search=${encodeURIComponent(term)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="rounded-full border border-cream/15 px-5 py-2 text-xs text-ivory transition-all hover:border-sage-light/60 hover:text-sage-light"
                        >
                          {term}
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-8 py-8 text-[10px] uppercase tracking-[0.2em] text-sage-light">
                <span>Press Esc</span>
                <span className="text-sage-light">·</span>
                <span>to close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  const mobileMenuOverlay = mounted
    ? createPortal(
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-night fixed inset-0 z-[80] flex flex-col grain lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              onKeyDown={trapFocus}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <span className="font-display text-xl tracking-[0.3em] text-ivory">ZOYA GOODS</span>
                <button
                  ref={mobileCloseRef}
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-cream/20 p-3 text-ivory hover:border-sage-light/60 hover:text-ivory focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-light"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex flex-1 flex-col justify-center overflow-y-auto px-8 py-4">
                <div className="space-y-1">
                  {NAV_CATEGORIES.map((item, i) => {
                    const isOpen = openMobileCategory === item.label;
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleMobileCategory(item.label)}
                          aria-expanded={isOpen}
                          className="group flex w-full items-center gap-4 py-3 text-left"
                        >
                          <span className="text-xs text-sage-light">0{i + 1}</span>
                          <span
                            className={cn(
                              'flex-1 font-display text-3xl font-light text-ivory transition-colors group-hover:text-sage-light',
                              item.accent && 'text-walnut-light group-hover:text-walnut-light'
                            )}
                          >
                            {item.label}
                          </span>
                          <svg
                            className={cn(
                              'h-4 w-4 text-sage-light transition-transform duration-300',
                              isOpen && 'rotate-180'
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.32, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <div className="ml-8 mt-1 space-y-0.5 border-l border-cream/10 pb-3 pl-6">
                                {item.subcategories.map((sub) => (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group/sub flex items-center justify-between py-2"
                                  >
                                    <span className="text-sm text-ivory/75 transition-colors group-hover/sub:text-sage-light">
                                      {sub.label}
                                    </span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-sage opacity-0 transition-opacity duration-300 group-hover/sub:opacity-100" />
                                  </Link>
                                ))}
                                <Link
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="group/view mt-2 flex items-center gap-2 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-sage-light"
                                >
                                  View All {item.label}
                                  <svg
                                    className="h-3 w-3 transition-transform duration-300 group-hover/view:translate-x-1"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                  </svg>
                                </Link>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </nav>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-8 border-t border-cream/10 py-6"
              >
                <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-ivory">Account</Link>
                <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-ivory">Wishlist</Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-ivory">Contact</Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )
    : null;

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 bg-cream/85 backdrop-blur-xl shadow-lg shadow-navy/5 transition-all duration-500',
          className
        )}
      >
        {/* Top announcement bar */}
        <div className="flex items-center justify-center gap-3 overflow-hidden bg-walnut px-4 py-2">
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-sage-light animate-pulse-gold" />
          <p className="min-w-0 truncate text-[11px] font-medium tracking-[0.12em] text-ivory uppercase">
            Complimentary worldwide shipping on orders over $200
          </p>
          <span className="hidden flex-shrink-0 text-[10px] uppercase tracking-[0.2em] text-ivory sm:block">ZOYA GOODS&nbsp;2024</span>
        </div>

        {/* Main bar */}
        <div className="border-b border-navy/5">
          <div
            className="relative mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                closeDropdownNow();
              }
            }}
          >
            <div className="flex h-[72px] items-center justify-between">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-full p-3 text-navy transition-colors hover:bg-navy/5 lg:hidden"
                aria-label="Toggle menu"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8h16M4 16h16" />
                  )}
                </svg>
              </button>

              {/* Logo */}
              <Link href="/" className="group relative flex items-center">
                <span className="font-display text-[26px] font-medium tracking-[0.3em] text-navy transition-colors duration-300">
                  ZOYA GOODS
                </span>
                <span className="absolute -right-4 top-0.5 h-1.5 w-1.5 rounded-full bg-sage transition-transform duration-300 group-hover:scale-150" />
              </Link>

              {/* Desktop nav */}
              <nav
                className="relative hidden items-center gap-8 lg:flex"
                onMouseLeave={closeDropdown}
              >
                {NAV_CATEGORIES.map((item) => {
                  const active = isCategoryActive(item.label);
                  const isOpen = openCategory === item.label;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onMouseEnter={() => openDropdown(item.label)}
                      onFocus={() => openDropdown(item.label)}
                      onClick={closeDropdownNow}
                      aria-haspopup="menu"
                      aria-expanded={isOpen}
                      className={cn(
                        'group/link relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300',
                        active || isOpen
                          ? 'link-underline-active link-underline text-walnut'
                          : 'link-underline text-navy hover:text-walnut',
                        item.accent && 'text-walnut hover:text-walnut'
                      )}
                    >
                      {item.label}
                      <svg
                        className={cn(
                          'h-3 w-3 transition-transform duration-300',
                          isOpen && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {item.accent && (
                        <span className="absolute -top-1 right-0 h-1 w-1 rounded-full bg-gold" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex items-center gap-1 text-navy sm:gap-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-3 transition-all hover:scale-105 hover:bg-navy/5 active:scale-95"
                  aria-label="Search"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <Link
                  href="/wishlist"
                  className="relative hidden rounded-full p-3 transition-all hover:scale-105 active:scale-95 sm:inline-flex"
                  aria-label="Wishlist"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>

                <button
                  type="button"
                  onClick={openCart}
                  className="relative rounded-full p-3 transition-all hover:scale-105 active:scale-95"
                  aria-label="Open cart"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {itemCount > 0 && (
                    <motion.span
                      key={itemCount}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-walnut text-[10px] font-bold text-ivory"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </motion.span>
                  )}
                </button>

                <Link
                  href="/dashboard"
                  className="hidden rounded-full p-3 transition-all hover:scale-105 active:scale-95 sm:inline-flex"
                  aria-label="Account"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Desktop mega menu */}
            <div className="hidden lg:block">
              <AnimatePresence>
                {activeCategory && (
                  <MegaMenu
                    category={activeCategory}
                    onMouseEnter={cancelClose}
                    onMouseLeave={closeDropdown}
                    onNavigate={closeDropdownNow}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {searchOverlay}
      {mobileMenuOverlay}
    </>
  );
}
