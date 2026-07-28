'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/shared/HeroSection';
import { FeaturedCategories } from '@/components/shared/FeaturedCategories';
import { FeaturedProducts } from '@/components/shared/FeaturedProducts';
import { WhyChooseVOSS } from '@/components/shared/WhyChooseVOSS';
import { NewsletterSection } from '@/components/shared/NewsletterSection';

// ============================================================
// VOSS Home Page — Luxury Fashion E-Commerce
// ============================================================

// Default product data for display (will be replaced by API data)
const defaultProducts = [
  {
    id: '1', name: 'Classic Brown Leather Jacket', slug: 'classic-brown-leather-jacket',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
    regularPrice: 450, salePrice: 395, discountPercent: 12, rating: 4.8, reviewCount: 124,
    isNew: true, brand: 'VOSS', category: 'Leather Jackets',
    colors: [{ name: 'Brown', hex: '#8B5E3C' }, { name: 'Black', hex: '#000000' }],
  },
  {
    id: '2', name: 'Black Suede Bomber Jacket', slug: 'black-suede-bomber-jacket',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    regularPrice: 520, salePrice: 455, discountPercent: 12, rating: 4.9, reviewCount: 89,
    isBestSeller: true, brand: 'VOSS', category: 'Bomber Jackets',
    colors: [{ name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#112C47' }],
  },
  {
    id: '3', name: 'Tan Suede Varsity Jacket', slug: 'tan-suede-varsity-jacket',
    image: 'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=80',
    regularPrice: 380, salePrice: 325, discountPercent: 14, rating: 4.7, reviewCount: 56,
    isNew: true, brand: 'VOSS', category: 'Suede Jackets',
    colors: [{ name: 'Tan', hex: '#D2B48C' }, { name: 'Brown', hex: '#8B5E3C' }],
  },
  {
    id: '4', name: 'Blue Denim Jacket', slug: 'blue-denim-jacket',
    image: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&q=80',
    regularPrice: 250, rating: 4.6, reviewCount: 203,
    isBestSeller: true, brand: 'VOSS', category: 'Denim Jackets',
    colors: [{ name: 'Blue', hex: '#1E3A5F' }, { name: 'Black', hex: '#000000' }],
  },
  {
    id: '5', name: 'Premium Wool Peacoat', slug: 'premium-wool-peacoat',
    image: 'https://images.unsplash.com/photo-1544923246-77307dd270b4?w=600&q=80',
    regularPrice: 680, salePrice: 595, discountPercent: 12, rating: 4.9, reviewCount: 67,
    isNew: true, brand: 'VOSS', category: 'Winter Jackets',
    colors: [{ name: 'Navy', hex: '#112C47' }, { name: 'Charcoal', hex: '#36454F' }],
  },
  {
    id: '6', name: 'Waxed Cotton Field Jacket', slug: 'waxed-cotton-field-jacket',
    image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&q=80',
    regularPrice: 420, rating: 4.7, reviewCount: 98,
    brand: 'VOSS', category: 'Cotton Jackets',
    colors: [{ name: 'Olive', hex: '#556B2F' }, { name: 'Tan', hex: '#D2B48C' }],
  },
  {
    id: '7', name: 'Motorcycle Racer Jacket', slug: 'motorcycle-racer-jacket',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80',
    regularPrice: 590, salePrice: 499, discountPercent: 15, rating: 4.8, reviewCount: 145,
    isBestSeller: true, brand: 'VOSS', category: 'Leather Jackets',
    colors: [{ name: 'Black', hex: '#000000' }, { name: 'Brown', hex: '#8B5E3C' }],
  },
  {
    id: '8', name: 'Lightweight Puffer Vest', slug: 'lightweight-puffer-vest',
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80',
    regularPrice: 195, rating: 4.5, reviewCount: 234,
    isNew: true, brand: 'VOSS', category: 'Vests',
    colors: [{ name: 'Black', hex: '#000000' }, { name: 'Navy', hex: '#112C47' }],
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero Section */}
      <HeroSection
        title="Luxury Redefined."
        subtitle="Premium Leather & Suede Collection"
        description="Discover our curated collection of handcrafted jackets, designed for those who appreciate the finer things in life."
        primaryCta={{ label: 'Shop Now', href: '/shop' }}
        secondaryCta={{ label: 'Explore Collection', href: '/category/new-arrivals' }}
        imageSrc="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1920&q=85"
        imageAlt="VOSS Luxury Collection"
        height="large"
      />

      {/* Featured Categories */}
      <FeaturedCategories />

      {/* Featured Products */}
      <FeaturedProducts
        products={defaultProducts}
        title="Featured Products"
        description="Handpicked selections from our latest collection, crafted with exceptional attention to detail."
        viewAllHref="/shop"
      />

      {/* Why Choose VOSS */}
      <WhyChooseVOSS />

      {/* Newsletter */}
      <NewsletterSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}

