'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AppProvider';
import {
  FiPackage,
  FiHeart,
  FiMapPin,
  FiUser,
  FiSettings,
  FiLogOut,
  FiMoreHorizontal,
} from 'react-icons/fi';

const sidebarLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: FiUser },
  { label: 'My Orders', href: '/dashboard/orders', icon: FiPackage },
  { label: 'Wishlist', href: '/wishlist', icon: FiHeart },
  { label: 'Addresses', href: '/dashboard/addresses', icon: FiMapPin },
  { label: 'Profile', href: '/dashboard/profile', icon: FiUser },
  { label: 'Settings', href: '/dashboard/settings', icon: FiSettings },
];

const mobilePrimaryLinks = sidebarLinks.filter((link) =>
  ['/dashboard', '/dashboard/orders', '/wishlist', '/dashboard/profile'].includes(link.href)
);

const mobileMenuLinks = sidebarLinks.filter((link) =>
  ['/dashboard/addresses', '/dashboard/settings'].includes(link.href)
);

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function DashboardLayout({ title, subtitle, children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, logout } = useAuth();

  // Account pages are private. Redirect signed-out visitors to the login
  // page and return them here after they sign in.
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, pathname, router]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <PageTransition>
      <main className="min-h-screen bg-cream/40">
        <Navbar />

        <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-8 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <nav className="space-y-1">
                {sidebarLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border-l-2 px-4 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'border-sage bg-navy text-cream'
                          : 'border-transparent text-slate hover:bg-sage-light/30 hover:text-sage-dark'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-walnut transition-colors hover:bg-walnut/5"
                >
                  <FiLogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </nav>
            </aside>

            {/* Main content */}
            <div className="space-y-8 pb-[76px] lg:pb-0">
              <ScrollReveal>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] text-sage-dark">Account</p>
                  <h1 className="mt-2 font-display text-4xl font-light text-navy">{title}</h1>
                  {subtitle && <p className="mt-2 text-sm text-slate">{subtitle}</p>}
                </div>
              </ScrollReveal>

              {children}
            </div>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-sage-light/30 bg-white lg:hidden">
          <div className="flex justify-around py-3">
            {mobilePrimaryLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex flex-col items-center gap-1',
                    active ? 'text-sage-dark' : 'text-slate'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px]">{link.label}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-haspopup="menu"
              className={cn(
                'flex flex-col items-center gap-1',
                isMobileMenuOpen ? 'text-sage-dark' : 'text-slate'
              )}
            >
              <FiMoreHorizontal className="h-5 w-5" />
              <span className="text-[10px]">More</span>
            </button>
          </div>
          {isMobileMenuOpen && (
            <div className="border-t border-sage-light/30 bg-white">
              <nav className="grid grid-cols-2 gap-1 px-4 py-3" aria-label="More dashboard options">
                {mobileMenuLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                        active
                          ? 'bg-sage-light/40 text-sage-dark'
                          : 'text-slate hover:bg-sage-light/30 hover:text-sage-dark'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="truncate">{link.label}</span>
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-medium text-walnut transition-colors hover:bg-walnut/5"
                >
                  <FiLogOut className="h-5 w-5 flex-shrink-0" />
                  Sign Out
                </button>
              </nav>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}
