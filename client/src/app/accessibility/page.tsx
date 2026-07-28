// @ts-nocheck
'use client';

import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { FiArrowLeft } from 'react-icons/fi';

export default function AccessibilityPage() {
  return React.createElement(PageTransition, null,
    React.createElement('main', { className: 'min-h-screen bg-zinc-50' },
      React.createElement(Navbar, null),
      React.createElement('section', { className: 'bg-white py-12 md:py-16' },
        React.createElement('div', { className: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8' },
          React.createElement(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: 'Accessibility' }] }),
          React.createElement('h1', { className: 'mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl' }, 'Accessibility'),
          React.createElement('p', { className: 'mt-2 text-base text-gray-500' }, 'Our commitment to digital accessibility.')
        )
      ),
      React.createElement('div', { className: 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' },
        React.createElement('div', { className: 'prose prose-sm max-w-none' },
          React.createElement('p', { className: 'text-gray-600' }, 'This page is coming soon. Content about our commitment to digital accessibility. will be available shortly.')
        )
      ),
      React.createElement(Footer, null)
    )
  );
}
