'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { NAV_CATEGORIES } from '@/data/navigation';
import { MegaMenu } from '@/components/layout/MegaMenu';
import { ZoyaGoodsLogo } from '@/components/shared/ZoyaGoodsLogo';

export interface NavbarProps {
  className?: string;
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

/**
 * Keeps the search fields in step with the active `?search=` query. Submitting a
 * search navigates to `/shop?search=…`, so the field has to read the value back
 * out of the URL or a shared/deep-linked search looks like nothing happened.
 * Rendered inside a Suspense boundary because the navbar is statically
 * prerendered on most routes.
 */
function SearchQuerySync({ onSync }: { onSync: (query: string) => void }) {
  const searchParams = useSearchParams();
  const query = searchParams.get('search') ?? '';
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    // Only push into the fields when the URL value actually changed, so an
    // unrelated navigation never wipes what the shopper is typing.
    if (appliedRef.current === query) return;
    appliedRef.current = query;
    onSync(query);
  }, [query, onSync]);

  return null;
}

export function Navbar({ className }: NavbarProps) {
  const { itemCount } = useCart();
  const { items: wishlistItems } = useWishlist();
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inlineQuery, setInlineQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
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
  const inlineSearchRef = useRef<HTMLInputElement>(null);

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

  const goToSearch = (raw: string) => {
    const query = raw.trim();
    if (!query) return;
    setIsSearchOpen(false);
    setSearchQuery('');
    setInlineQuery('');
    router.push(`/shop?search=${encodeURIComponent(query)}`);
  };

  const submitSearch = () => goToSearch(searchQuery);

  const submitInlineSearch = () => goToSearch(inlineQuery);

  const syncQueryFromUrl = useCallback((query: string) => {
    setSearchQuery(query);
    setInlineQuery(query);
  }, []);

  const signOut = async () => {
    await logout();
    setAccountOpen(false);
    router.push('/');
  };

  // The bar stays pinned and simply changes material: solid espresso at the top
  // of the page (so it reads cleanly over the hero) easing into a transparent
  // frosted layer once the page scrolls.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > 24);
        frame = 0;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) mobileCloseRef.current?.focus();
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (e.key === '/' && !isTyping && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
        setAccountOpen(false);
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
              className="bg-cinematic-deep fixed inset-0 z-[90] flex flex-col grain"
              role="dialog"
              aria-modal="true"
              aria-label="Search"
              onKeyDown={trapFocus}
            >
              <div className="flex items-center justify-between px-6 py-5 sm:px-12">
                <ZoyaGoodsLogo
                  variant="white"
                  aria-hidden
                  alt=""
                  className="h-auto w-[176px]"
                />
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(false)}
                  className="rounded-full border border-bone/20 p-3 text-bone transition-all hover:scale-105 hover:border-bone/60 hover:text-porcelain focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
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
                  <label className="eyebrow eyebrow-bright">Search</label>
                  <div className="relative mt-4">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          submitSearch();
                        }
                      }}
                      placeholder="What are you looking for?"
                      className="w-full border-b border-bone/25 bg-transparent pb-4 pr-12 font-display text-3xl font-light text-porcelain placeholder-bone/40 focus:border-bone focus:outline-none sm:text-5xl"
                    />
                    <button
                      type="button"
                      onClick={submitSearch}
                      disabled={!searchQuery.trim()}
                      aria-label="Submit search"
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-clay transition-colors hover:text-porcelain disabled:pointer-events-none disabled:opacity-40"
                    >
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>

                  <div className="mt-10">
                    <p className="eyebrow eyebrow-bright">Popular</p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      {popularSearches.map((term) => (
                        <Link
                          key={term}
                          href={`/shop?search=${encodeURIComponent(term)}`}
                          onClick={() => setIsSearchOpen(false)}
                          className="rounded-full border border-bone/15 px-5 py-2 text-xs text-bone transition-all hover:border-bone/60 hover:text-porcelain"
                        >
                          {term}
                        </Link>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="flex items-center justify-center gap-8 py-8 text-[10px] uppercase tracking-[0.2em] text-clay">
                <span>Press Esc</span>
                <span className="text-clay/60">·</span>
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
              className="bg-cinematic-deep fixed inset-0 z-[80] flex flex-col grain lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              onKeyDown={trapFocus}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <ZoyaGoodsLogo
                  variant="white"
                  aria-hidden
                  alt=""
                  className="h-auto w-[176px]"
                />
                <button
                  ref={mobileCloseRef}
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full border border-bone/20 p-3 text-bone hover:border-bone/60 hover:text-porcelain focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                  aria-label="Close menu"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="border-b border-bone/10 px-6 pb-6">
                <button
                  type="button"
                  onClick={() => { setIsMobileMenuOpen(false); setIsSearchOpen(true); }}
                  className="flex w-full items-center gap-3 border-b border-bone/20 pb-3 text-left"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="eyebrow eyebrow-bright">Search the collection</span>
                </button>
              </div>

              <nav className="flex flex-1 flex-col justify-center overflow-y-auto px-8 py-4">
                <div className="space-y-1">
                  <Link
                    href="/shop"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="group mb-2 flex w-full items-center gap-4 text-left"
                  >
                    <span className="text-xs text-clay">00</span>
                    <span className="flex-1 font-display text-3xl font-light text-porcelain">Shop</span>
                  </Link>
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
                          <span className="text-xs text-clay">0{i + 1}</span>
                          <span className="flex-1 font-display text-3xl font-light text-porcelain transition-colors group-hover:text-bone">
                            {item.label}
                          </span>
                          <svg
                            className={cn(
                              'h-4 w-4 text-clay transition-transform duration-300',
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
                              <div className="ml-8 mt-1 space-y-0.5 border-l border-bone/10 pb-3 pl-6">
                                {item.subcategories.map((sub) => (
                                  <Link
                                    key={sub.href}
                                    href={sub.href}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group/sub flex items-center justify-between py-2"
                                  >
                                    <span className="text-sm text-bone/70 transition-colors group-hover/sub:text-porcelain">
                                      {sub.label}
                                    </span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-cinnamon opacity-0 transition-opacity duration-300 group-hover/sub:opacity-100" />
                                  </Link>
                                ))}
                                <Link
                                  href={item.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className="group/view mt-2 flex items-center gap-2 py-2 text-[11px] font-medium uppercase tracking-[0.2em] text-clay"
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
                className="flex items-center justify-center gap-8 border-t border-bone/10 py-6"
              >
                <Link href="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-bone">Wishlist</Link>
                <Link
                  href={isAuthenticated ? '/dashboard' : '/login'}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-xs uppercase tracking-[0.2em] text-bone"
                >
                  {isAuthenticated ? 'Account' : 'Sign In'}
                </Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase tracking-[0.2em] text-bone">Contact</Link>
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
          'sticky top-0 z-50 transition-[background-color,backdrop-filter,box-shadow] duration-700 ease-out',
          isScrolled
            ? 'border-b border-bone/10 bg-onyx/55 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl'
            : 'border-b border-transparent bg-onyx/90 backdrop-blur-md',
          className
        )}
        data-scrolled={isScrolled}
      >
        {/* Top announcement bar — the long line is hidden on narrow screens
            rather than truncated, so no glyph is ever cut mid-word. */}
        <div className="flex h-9 items-center justify-center gap-3 overflow-hidden bg-espresso px-4">
          <span className="h-1 w-1 flex-shrink-0 rounded-full bg-mist/70" />
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-bone/80 sm:hidden">
            Free worldwide shipping over $200
          </p>
          <p className="hidden text-[11px] font-medium uppercase tracking-[0.12em] text-bone/80 sm:block">
            Complimentary worldwide shipping on orders over $200
          </p>
          <span className="hidden flex-shrink-0 text-[10px] uppercase tracking-[0.2em] text-clay sm:block">
            ZOYA GOODS&nbsp;{new Date().getFullYear()}
          </span>
        </div>

        {/* Main bar */}
        <div>
          <div
            className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                closeDropdownNow();
              }
            }}
          >
            <div className="flex h-[84px] items-center justify-between gap-4 xl:h-[104px]">
              {/* Mobile menu button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center rounded-full p-3 text-bone transition-colors hover:bg-bone/10 xl:hidden"
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
              <Link href="/" className="group relative flex shrink-0 items-center">
                <ZoyaGoodsLogo
                  variant="white"
                  alt="ZOYA GOODS"
                  className="h-auto w-[152px] sm:w-[176px] xl:w-[220px]"
                />
                <span className="absolute -right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-cinnamon transition-transform duration-300 group-hover:scale-150" />
              </Link>

              {/* Desktop nav */}
              <nav
                className="relative hidden shrink-0 items-center gap-4 xl:flex"
                onMouseLeave={closeDropdown}
              >
                <Link
                  href="/shop"
                  onClick={closeDropdownNow}
                  className={cn(
                    'group/link relative text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors duration-300 link-underline',
                    pathname === '/shop'
                      ? 'link-underline-active text-porcelain'
                      : 'text-bone/75 hover:text-porcelain'
                  )}
                >
                  Shop
                </Link>
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
                          ? 'link-underline-active link-underline text-porcelain'
                          : 'link-underline text-bone/75 hover:text-porcelain'
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
                        <span className="absolute -top-1 right-0 h-1 w-1 rounded-full bg-cinnamon" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1 text-bone sm:gap-2">
                {/* Inline search — desktop only; smaller breakpoints use the
                    icon button which opens the full search overlay. */}
                <form
                  role="search"
                  onSubmit={(e) => { e.preventDefault(); submitInlineSearch(); }}
                  className="mr-2 hidden shrink-0 items-center gap-2 rounded-full border border-bone/15 bg-onyx/40 px-4 transition-colors duration-500 focus-within:border-bone/50 focus-within:bg-onyx/70 2xl:flex"
                >
                  <svg className="h-4 w-4 flex-shrink-0 text-clay" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    ref={inlineSearchRef}
                    type="search"
                    value={inlineQuery}
                    onChange={(e) => setInlineQuery(e.target.value)}
                    placeholder="Search"
                    aria-label="Search the collection"
                    className="h-10 w-28 bg-transparent text-xs tracking-[0.08em] text-porcelain placeholder-bone/40 focus:outline-none 2xl:w-32"
                  />
                  <button
                    type="button"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Open full search"
                    className="text-clay transition-colors hover:text-porcelain"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 6v4m0 4v4m4-8H9m8 0l-3-3m3 3l-3 3M6 8v8m0-8l3 3m-3-3l3-3" />
                    </svg>
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="rounded-full p-3 transition-all hover:scale-105 hover:bg-bone/10 active:scale-95 2xl:hidden"
                  aria-label="Search"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                <Link
                  href="/wishlist"
                  className="relative hidden rounded-full p-3 transition-all hover:scale-105 hover:bg-bone/10 active:scale-95 sm:inline-flex"
                  aria-label="Wishlist"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {wishlistItems.length > 0 && (
                    <motion.span
                      key={wishlistItems.length}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-bone text-[10px] font-bold text-onyx"
                    >
                      {wishlistItems.length > 99 ? '99+' : wishlistItems.length}
                    </motion.span>
                  )}
                </Link>

                <Link
                  href="/cart"
                  className="relative rounded-full p-3 transition-all hover:scale-105 hover:bg-bone/10 active:scale-95"
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
                      className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-bone text-[10px] font-bold text-onyx"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </motion.span>
                  )}
                </Link>

                {authLoading ? (
                  <span
                    aria-hidden
                    className="hidden h-9 w-9 animate-pulse rounded-full bg-bone/10 sm:block"
                  />
                ) : isAuthenticated ? (
                  <div ref={accountRef} className="relative hidden sm:block">
                    <button
                      type="button"
                      onClick={() => setAccountOpen((open) => !open)}
                      aria-haspopup="menu"
                      aria-expanded={accountOpen}
                      aria-label="Account menu"
                      className="flex items-center gap-1.5 rounded-full p-2 transition-all hover:bg-bone/10 active:scale-95"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-soft text-[11px] font-semibold text-bone">
                        {((user?.name || 'A').trim().charAt(0) || 'A').toUpperCase()}
                      </span>
                      <svg
                        className={cn(
                          'h-3 w-3 text-clay transition-transform duration-200',
                          accountOpen && 'rotate-180'
                        )}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    <AnimatePresence>
                      {accountOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="glass-cream absolute right-0 top-full z-[70] mt-2 w-60 overflow-hidden rounded-2xl shadow-[0_28px_60px_-24px_rgba(0,0,0,0.9)]"
                        >
                          <div className="border-b border-bone/10 px-4 py-3">
                            <p className="truncate text-sm font-semibold text-porcelain">
                              {user?.name || 'My Account'}
                            </p>
                            <p className="truncate text-xs text-clay">{user?.email}</p>
                          </div>
                          <div className="py-1.5">
                            {[
                              { label: 'Dashboard', href: '/dashboard' },
                              { label: 'My Orders', href: '/dashboard/orders' },
                              { label: 'My Wishlist', href: '/wishlist' },
                              { label: 'Saved Addresses', href: '/dashboard/addresses' },
                            ].map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setAccountOpen(false)}
                                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-bone transition-colors hover:bg-bone/5 hover:text-porcelain"
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                          <div className="border-t border-bone/10 py-1.5">
                            <button
                              type="button"
                              onClick={signOut}
                              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-red-300 transition-colors hover:bg-red-500/10"
                            >
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="hidden rounded-full p-3 transition-all hover:scale-105 hover:bg-bone/10 active:scale-95 sm:inline-flex"
                      aria-label="Sign in"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </Link>
                    <Link
                      href="/login"
                      className="hidden text-[11px] font-semibold uppercase tracking-[0.16em] text-bone/80 transition-colors hover:text-porcelain md:inline-flex 2xl:hidden"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Desktop mega menu — matches the xl nav trigger above */}
            <div className="hidden xl:block">
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
      <Suspense fallback={null}>
        <SearchQuerySync onSync={syncQueryFromUrl} />
      </Suspense>
    </>
  );
}
