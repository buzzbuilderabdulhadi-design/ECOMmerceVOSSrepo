var fs = require('fs');
var path = require('path');
var base = 'c:/Users/buzzb/Desktop/project ecom';

// 1. Fix Navbar: change /account to /dashboard
var navbarPath = base + '/client/src/components/layout/Navbar.tsx';
var navbarContent = fs.readFileSync(navbarPath, 'utf8');
navbarContent = navbarContent.replace('href="/account"', 'href="/dashboard"');
fs.writeFileSync(navbarPath, navbarContent);
console.log('1. Navbar fixed: /account -> /dashboard');

// 2. Fix Footer: update broken links to point to real routes
var footerPath = base + '/client/src/components/layout/Footer.tsx';
var footerContent = fs.readFileSync(footerPath, 'utf8');
var footerFixes = {
  '/products?sort=new': '/shop?sort=new',
  '/products?sale=true': '/shop?sale=true',
  '/categories/clothing': '/category/clothing',
  '/categories/accessories': '/category/accessories',
  '/categories/bags': '/category/bags',
  '/categories/shoes': '/category/shoes',
};
for (var oldHref in footerFixes) {
  footerContent = footerContent.replace(oldHref, footerFixes[oldHref]);
}
// Keep Footer hrefs for pages we'll create as catch-all pages
fs.writeFileSync(footerPath, footerContent);
console.log('2. Footer links fixed');

// 3. Create missing page stubs for Footer-linked pages
var pageTemplate = function(title, description) {
  return "'use client';\n\nimport React from 'react';\nimport Link from 'next/link';\nimport { Navbar } from '@/components/layout/Navbar';\nimport { Footer } from '@/components/layout/Footer';\nimport { PageTransition } from '@/components/animations/PageTransition';\nimport { Breadcrumb } from '@/components/ui/Breadcrumb';\nimport { ScrollReveal } from '@/components/animations/ScrollReveal';\nimport { FiArrowLeft } from 'react-icons/fi';\n\nexport default function " + title.replace(/[^a-zA-Z]/g, '') + "Page() {\n  return React.createElement(PageTransition, null,\n    React.createElement('main', { className: 'min-h-screen bg-zinc-50' },\n      React.createElement(Navbar, null),\n      React.createElement('section', { className: 'bg-white py-12 md:py-16' },\n        React.createElement('div', { className: 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8' },\n          React.createElement(Breadcrumb, { items: [{ label: 'Home', href: '/' }, { label: '" + title + "' }] }),\n          React.createElement('h1', { className: 'mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl' }, '" + title + "'),\n          React.createElement('p', { className: 'mt-2 text-base text-gray-500' }, '" + description + "')\n        )\n      ),\n      React.createElement('div', { className: 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' },\n        React.createElement('div', { className: 'prose prose-sm max-w-none' },\n          React.createElement('p', { className: 'text-gray-600' }, 'This page is coming soon. Content about " + description.toLowerCase() + " will be available shortly.')\n        )\n      ),\n      React.createElement(Footer, null)\n    )\n  );\n}\n";
};

var missingPages = {
  '/faq/page.tsx': { title: 'FAQ', desc: 'Frequently asked questions about our products and services.' },
  '/size-guide/page.tsx': { title: 'Size Guide', desc: 'Find your perfect fit with our comprehensive size guide.' },
  '/sustainability/page.tsx': { title: 'Sustainability', desc: 'Our commitment to sustainable and ethical fashion.' },
  '/careers/page.tsx': { title: 'Careers', desc: 'Join the VOSS team and help shape the future of luxury fashion.' },
  '/press/page.tsx': { title: 'Press', desc: 'Press releases, media resources, and brand assets.' },
  '/affiliates/page.tsx': { title: 'Affiliates', desc: 'Join our affiliate program and earn commissions.' },
  '/cookies/page.tsx': { title: 'Cookie Policy', desc: 'How we use cookies and similar technologies.' },
  '/accessibility/page.tsx': { title: 'Accessibility', desc: 'Our commitment to digital accessibility.' },
  '/dashboard/orders/page.tsx': { title: 'My Orders', desc: 'View and track your orders.' },
  '/dashboard/addresses/page.tsx': { title: 'Addresses', desc: 'Manage your shipping and billing addresses.' },
  '/dashboard/profile/page.tsx': { title: 'Profile', desc: 'Update your personal information.' },
  '/dashboard/settings/page.tsx': { title: 'Settings', desc: 'Manage your account settings and preferences.' },
};

for (var route in missingPages) {
  var fullPath = base + '/client/src/app' + route;
  var dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  var info = missingPages[route];
  var content = pageTemplate(info.title, info.desc);
  fs.writeFileSync(fullPath, content);
  console.log('3. Created page: ' + route);
}


dashContent = dashContent.replace(/const s = props.status;/g, 'var s = props.status;');
dashContent = dashContent.replace(/let c =/g, 'var c =');
// Replace const inside map callbacks
dashContent = dashContent.replace(/const StatIcon =/g, 'var StatIcon =');
dashContent = dashContent.replace(/const Icon =/g, 'var Icon =');
dashContent = dashContent.replace(/let cls =/g, 'var cls =');
fs.writeFileSync(dashPath, dashContent);
console.log('4. Dashboard page fixed (var instead of const/let)');

console.log('\n=== ALL ROUTING FIXES APPLIED ===');
