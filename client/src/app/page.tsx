'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/shared/HeroSection';
import { FeaturedCategories } from '@/components/shared/FeaturedCategories';
import { FeaturedProducts } from '@/components/shared/FeaturedProducts';
import { WhyChooseVOSS } from '@/components/shared/WhyChooseVOSS';
import { NewsletterSection } from '@/components/shared/NewsletterSection';
import { fetchFeaturedProducts } from '@/services/products';
import { allProducts } from '@/data/products';

function mapProduct(p: any): any {
  const firstImage = p.images?.[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i: any) => typeof i === 'string' ? i : i.url) || [],
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    discountPercent: p.discountPercent,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    brand: p.brand,
    category: p.category?.name,
    colors: p.variants?.map((v: any) => ({ name: v.color, hex: v.colorHex })).filter((v: any) => v.hex),
  };
}

const fallbackProducts = allProducts.slice(0, 8).map(mapProduct);

export default function HomePage() {
  const [products, setProducts] = useState<any[] | null>(null);

  useEffect(() => {
    fetchFeaturedProducts()
      .then((data) => setProducts(data.map(mapProduct)))
      .catch(() => setProducts(fallbackProducts));
  }, []);

  const displayProducts = products || fallbackProducts;

  return (
    <>
      <main className="flex min-h-screen flex-col">
        <Navbar />

        <HeroSection
          title="Luxury Redefined"
          subtitle="Premium Leather & Suede Collection"
          description="Discover our curated collection of handcrafted jackets, designed for those who appreciate the finer things in life."
          primaryCta={{ label: 'Shop Now', href: '/shop' }}
          secondaryCta={{ label: 'Explore Collection', href: '/category/new-arrivals' }}
          imageSrc="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85"
          imageAlt="VOSS Luxury Collection"
          showcaseImages={[
            'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=85',
            'https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=600&q=85',
          ]}
          height="large"
        />

        <FeaturedCategories />

        <FeaturedProducts
          products={displayProducts}
          title="The Featured Edit"
          description="Handpicked selections from our latest collection, crafted with exceptional attention to detail."
          viewAllHref="/shop"
        />

        <WhyChooseVOSS />

        <NewsletterSection variant="dark" />

        <Footer />
      </main>
    </>
  );
}
