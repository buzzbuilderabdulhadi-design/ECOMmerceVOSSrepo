const fs = require('fs');

const lines = [];

function l(s) { lines.push(s); }

l("'use client';");
l('');
l("import React from 'react';");
l("import Link from 'next/link';");
l("import { motion } from 'framer-motion';");
l("import { Navbar } from '@/components/layout/Navbar';");
l("import { Footer } from '@/components/layout/Footer';");
l("import { PageTransition } from '@/components/animations/PageTransition';");
l("import { ScrollReveal } from '@/components/animations/ScrollReveal';");
l("import { FiPackage, FiHeart, FiMapPin, FiUser, FiSettings, FiLogOut, FiShoppingBag, FiStar, FiClock } from 'react-icons/fi';");
l('');

l('const sidebarLinks = [');
l("  { label: 'Dashboard', href: '/dashboard', icon: FiUser },");
l("  { label: 'My Orders', href: '/dashboard/orders', icon: FiPackage },");
l("  { label: 'Wishlist', href: '/wishlist', icon: FiHeart },");
l("  { label: 'Addresses', href: '/dashboard/addresses', icon: FiMapPin },");
l("  { label: 'Profile', href: '/dashboard/profile', icon: FiUser },");
l("  { label: 'Settings', href: '/dashboard/settings', icon: FiSettings },");
l('];');
l('');

l('const statCards = [');
l("  { label: 'Total Orders', value: '12', icon: FiShoppingBag, color: 'text-blue-600 bg-blue-100' },");
l("  { label: 'Active Orders', value: '2', icon: FiClock, color: 'text-amber-600 bg-amber-100' },");
l("  { label: 'Wishlist', value: '8', icon: FiHeart, color: 'text-rose-600 bg-rose-100' },");
l("  { label: 'Reviews', value: '5', icon: FiStar, color: 'text-emerald-600 bg-emerald-100' },");
l('];');
l('');

l('const orderList = [');
l("  { number: '#VOSS-2024-001', date: 'Dec 15, 2024', status: 'Delivered', total: 395 },");
l("  { number: '#VOSS-2024-002', date: 'Nov 28, 2024', status: 'Shipped', total: 520 },");
l("  { number: '#VOSS-2024-003', date: 'Nov 10, 2024', status: 'Processing', total: 250 },");
l('];');
l('');

l('const statusStyles = {');
l("  Delivered: 'bg-green-100 text-green-700',");
l("  Shipped: 'bg-blue-100 text-blue-700',");
l("  Processing: 'bg-amber-100 text-amber-700',");
l('};');
l('');

l('function StatusBadge({ status }) {');
l('  var color = statusStyles[status] || statusStyles.Processing;');
l("  return React.createElement('span', { className: 'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + color }, status);");
l('}');
l('');

l('export default function DashboardPage() {');
l('  return React.createElement(');
l('    PageTransition,');
l('    null,');

// main
l("    React.createElement('main', { className: 'min-h-screen bg-zinc-50' },");
l('      React.createElement(Navbar, null),');

// main container div
l("      React.createElement('div', { className: 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' },");
l("        React.createElement('div', { className: 'grid gap-8 lg:grid-cols-[280px_1fr]' },");

// aside sidebar
l("          React.createElement('aside', { className: 'hidden lg:block' },");
l("            React.createElement('nav', { className: 'space-y-1' },");
l('              sidebarLinks.map(function(link) {');
l('                var Icon = link.icon;');
l("                var cls = 'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ' + (link.href === '/dashboard' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900');");
l('                return React.createElement(Link, { key: link.href, href: link.href, className: cls },');
l("                  React.createElement(Icon, { className: 'h-5 w-5' }),");
l('                  link.label');
l('                );');
l('              }),');
l("              React.createElement('button', { type: 'button', className: 'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50' },");
l("                React.createElement(FiLogOut, { className: 'h-5 w-5' }),");
l("                'Sign Out'");
l('              )');
l('            )');
l('          ),');

// main content area
l("          React.createElement('div', { className: 'space-y-8' },");

// welcome section
l('            React.createElement(ScrollReveal, null,');
l("              React.createElement('div', null,");
l("                React.createElement('h1', { className: 'text-2xl font-bold text-zinc-900' }, 'Welcome back, James'),");
l("                React.createElement('p', { className: 'mt-1 text-zinc-600' }, 'Here is your account overview.')");
l('              )');
l('            ),');

// stat cards
l("            React.createElement('div', { className: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4' },");
l('              statCards.map(function(stat, index) {');
l('                var Icon = stat.icon;');
l('                return React.createElement(ScrollReveal, { key: stat.label, delay: index * 0.05 },[][1]);');
l('              })');
l('            ),');

l('          )'); // close main content div
l('        )'); // close grid div
l('      )'); // close max-w container div
l('    )'); // close main
l('  );'); // close React.createElement return
l('}'); // close function

const finalContent = lines.join('\n');

// Replace placeholder with actual children
const result = finalContent.replace("[][1]", "React.createElement(motion.div, { whileHover: { y: -2 }, className: 'rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md' },\n                        React.createElement('div', { className: \"mb-4 inline-flex rounded-lg p-3 \" + stat.color },\n                          React.createElement(Icon, { className: 'h-6 w-6' })\n                        ),\n                        React.createElement('p', { className: 'text-2xl font-bold text-zinc-900' }, stat.value),\n                        React.createElement('p', { className: 'mt-1 text-sm text-zinc-500' }, stat.label)\n                      )");

fs.writeFileSync('c:/Users/buzzb/Desktop/project ecom/client/src/app/dashboard/page.tsx', result, 'utf8');
console.log('Done');

// Write a simpler version instead
const simpleContent = [
  "'use client';",
  '',
  "import React from 'react';",
  "import Link from 'next/link';",
  "import { motion } from 'framer-motion';",
  "import { Navbar } from '@/components/layout/Navbar';",
  "import { Footer } from '@/components/layout/Footer';",
  "import { PageTransition } from '@/components/animations/PageTransition';",
  "import { ScrollReveal } from '@/components/animations/ScrollReveal';",
  "import { FiPackage, FiHeart, FiMapPin, FiUser, FiSettings, FiLogOut, FiShoppingBag, FiStar, FiClock } from 'react-icons/fi';",
  '',
  'const sidebarLinks = [',
  "  { label: 'Dashboard', href: '/dashboard', icon: FiUser },",
  "  { label: 'My Orders', href: '/dashboard/orders', icon: FiPackage },",
  "  { label: 'Wishlist', href: '/wishlist', icon: FiHeart },",
  "  { label: 'Addresses', href: '/dashboard/addresses', icon: FiMapPin },",
  "  { label: 'Profile', href: '/dashboard/profile', icon: FiUser },",
  "  { label: 'Settings', href: '/dashboard/settings', icon: FiSettings },",
  '];',
  '',
  'const statCards = [',
  "  { label: 'Total Orders', value: '12', icon: FiShoppingBag, color: 'text-blue-600 bg-blue-100' },",
  "  { label: 'Active Orders', value: '2', icon: FiClock, color: 'text-amber-600 bg-amber-100' },",
  "  { label: 'Wishlist', value: '8', icon: FiHeart, color: 'text-rose-600 bg-rose-100' },",
  "  { label: 'Reviews', value: '5', icon: FiStar, color: 'text-emerald-600 bg-emerald-100' },",
  '];',
  '',
  'const orderList = [',
  "  { number: '#VOSS-2024-001', date: 'Dec 15, 2024', status: 'Delivered', total: 395 },",
  "  { number: '#VOSS-2024-002', date: 'Nov 28, 2024', status: 'Shipped', total: 520 },",
  "  { number: '#VOSS-2024-003', date: 'Nov 10, 2024', status: 'Processing', total: 250 },",
  '];',
  '',
  'function StatusBadge(props) {',
  '  var s = props.status;',
  "  var c = 'bg-amber-100 text-amber-700';",
  "  if (s === 'Delivered') c = 'bg-green-100 text-green-700';",
  "  if (s === 'Shipped') c = 'bg-blue-100 text-blue-700';",
  "  return React.createElement('span', { className: 'inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ' + c }, s);",
  '}',
  '',
  'export default function DashboardPage() {',
  '  return React.createElement(PageTransition, null,',
  "    React.createElement('main', { className: 'min-h-screen bg-zinc-50' },",
  '      React.createElement(Navbar, null),',
  "      React.createElement('div', { className: 'mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8' },",
  "        React.createElement('div', { className: 'grid gap-8 lg:grid-cols-[280px_1fr]' },",
  "          React.createElement('aside', { className: 'hidden lg:block' },",
  "            React.createElement('nav', { className: 'space-y-1' },",
  '              sidebarLinks.map(function(link) {',
  '                var Icon = link.icon;',
  "                var cls = 'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ';",
  "                cls += link.href === '/dashboard' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900';",
  '                return React.createElement(Link, { key: link.href, href: link.href, className: cls },',
  "                  React.createElement(Icon, { className: 'h-5 w-5' }),",
  '                  link.label',
  '                );',
  '              }),',
  "              React.createElement('button', { type: 'button', className: 'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50' },",
  "                React.createElement(FiLogOut, { className: 'h-5 w-5' }),",
  "                'Sign Out'",
  '              )',
  '            )',
  '          ),',
  "          React.createElement('div', { className: 'space-y-8' },",
  '            React.createElement(ScrollReveal, null,',
  "              React.createElement('div', null,",
  "                React.createElement('h1', { className: 'text-2xl font-bold text-zinc-900' }, 'Welcome back, James'),",
  "                React.createElement('p', { className: 'mt-1 text-zinc-600' }, 'Here is your account overview.')",
  '              )',
  '            ),',
  "            React.createElement('div', { className: 'grid gap-6 sm:grid-cols-2 lg:grid-cols-4' },",
  '              statCards.map(function(stat, index) {',
  '                var StatIcon = stat.icon;',
  '                return React.createElement(ScrollReveal, { key: stat.label, delay: index * 0.05 },',
  '                  React.createElement(motion.div, { whileHover: { y: -2 }, className: "rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md" },',
  '                    React.createElement("div", { className: "mb-4 inline-flex rounded-lg p-3 " + stat.color },',
  '                      React.createElement(StatIcon, { className: "h-6 w-6" })',
  '                    ),',
  '                    React.createElement("p", { className: "text-2xl font-bold text-zinc-900" }, stat.value),',
  '                    React.createElement("p", { className: "mt-1 text-sm text-zinc-500" }, stat.label)',
  '                  )',
  '                );',
  '              })',
  '            ),',
  '            React.createElement(ScrollReveal, null,',
  '              React.createElement("div", { className: "rounded-xl border border-zinc-200 bg-white p-6" },',
  '                React.createElement("div", { className: "mb-4 flex items-center justify-between" },',
  '                  React.createElement("h2", { className: "text-lg font-semibold text-zinc-900" }, "Recent Orders"),',
  '                  React.createElement(Link, { href: "/dashboard/orders", className: "text-sm font-medium text-zinc-900 underline transition-colors hover:text-zinc-700" }, "View All")',
  '                ),',
  '                React.createElement("div", { className: "space-y-4" },',
  '                  orderList.map(function(order) {',
  '                    return React.createElement("div", { key: order.number, className: "flex items-center justify-between border-b border-zinc-100 pb-4 last:border-0 last:pb-0" },',
  '                      React.createElement("div", null,',
  '                        React.createElement("p", { className: "text-sm font-medium text-zinc-900" }, order.number),',
  '                        React.createElement("p", { className: "text-xs text-zinc-500" }, order.date)',
  '                      ),',
  '                      React.createElement("div", { className: "text-right" },',
  '                        React.createElement("p", { className: "text-sm font-medium text-zinc-900" }, "$" + order.total.toFixed(2)),',
  '                        React.createElement(StatusBadge, { status: order.status })',
  '                      )',
  '                    );',
  '                  })',
  '                )',
  '              )',
  '            ),',
  '            React.createElement(ScrollReveal, null,',
  '              React.createElement("div", { className: "grid gap-4 sm:grid-cols-2" },',
  '                React.createElement(Link, { href: "/dashboard/profile", className: "group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md" },',
  '                  React.createElement(FiUser, { className: "mb-3 h-6 w-6 text-zinc-400 transition-colors group-hover:text-zinc-900" }),',
  '                  React.createElement("h3", { className: "font-medium text-zinc-900" }, "Edit Profile"),',
  '                  React.createElement("p", { className: "mt-1 text-sm text-zinc-500" }, "Update your personal information")',
  '                ),',
  '                React.createElement(Link, { href: "/dashboard/addresses", className: "group rounded-xl border border-zinc-200 bg-white p-6 transition-all hover:border-zinc-300 hover:shadow-md" },',
  '                  React.createElement(FiMapPin, { className: "mb-3 h-6 w-6 text-zinc-400 transition-colors group-hover:text-zinc-900" }),',
  '                  React.createElement("h3", { className: "font-medium text-zinc-900" }, "Manage Addresses"),',
  '                  React.createElement("p", { className: "mt-1 text-sm text-zinc-500" }, "Add or update shipping addresses")',
  '                )',
  '              )',
  '            )',
  '          )',
  '        )',
  '      ),',
  '      React.createElement("div", { className: "fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white lg:hidden" },',
  '        React.createElement("div", { className: "flex justify-around py-3" },',
  '          sidebarLinks.slice(0, 5).map(function(link) {',
  '            var Icon = link.icon;',
  '            var cls = "flex flex-col items-center gap-1 " + (link.href === "/dashboard" ? "text-zinc-900" : "text-zinc-400");',
  '            return React.createElement(Link, { key: link.href, href: link.href, className: cls },',
  '              React.createElement(Icon, { className: "h-5 w-5" }),',
  '              React.createElement("span", { className: "text-[10px]" }, link.label)',
  '            );',
  '          })',
  '        )',
  '      ),',
  '      React.createElement(Footer, null)',
  '    )',
  '  );',
  '}',
  '',
].join('\n');

fs.writeFileSync('c:/Users/buzzb/Desktop/project ecom/client/src/app/dashboard/page.tsx', simpleContent, 'utf8');
console.log('Dashboard page written successfully!');
