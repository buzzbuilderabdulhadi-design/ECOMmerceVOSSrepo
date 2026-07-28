'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ImageGallery } from '@/components/product/ImageGallery';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { SizeSelector } from '@/components/ui/SizeSelector';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Tabs } from '@/components/ui/Tabs';
import { ReviewCard } from '@/components/product/ReviewCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { type SizeOption } from '@/components/ui/SizeSelector';
import { LoadingState } from '@/components/shared/LoadingState';
import { ErrorState } from '@/components/shared/ErrorState';

// ============================================================
// Product Details Page — Full product view with purchase options
// ============================================================

const sampleProduct = {
  id: '1',
  name: 'Classic Brown Leather Jacket',
  slug: 'classic-brown-leather-jacket',
  sku: 'VOSS-LJ-001',
  description: 'Crafted from premium full-grain Italian leather, this classic brown leather jacket embodies timeless sophistication. Features include a soft satin lining, YKK zippers, and meticulous hand-stitched detailing throughout.',
  regularPrice: 450,
  salePrice: 395,
  discountPercent: 12,
  images: [
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85&fit=facearea',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&q=85&fit=facearea&facepad=2',
  ],
  brand: 'VOSS',
  category: 'Leather Jackets',
  rating: 4.8,
  reviewCount: 124,
  colors: [
    { name: 'Brown', hex: '#8B5E3C' },
    { name: 'Black', hex: '#000000' },
    { name: 'Tan', hex: '#D2B48C' },
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((s) => ({ label: s, value: s })),
  stock: 15,
  material: 'Full-Grain Italian Leather',
  specifications: {
    Material: '100% Full-Grain Leather',
    Lining: 'Satin',
    Closure: 'YKK Zipper Front',
    Pockets: '4 (2 exterior, 2 interior)',
    Collar: 'Notched Lapel',
    Fit: 'Regular Fit',
    Origin: 'Italy',
    Season: 'All Season',
  },
  careInstructions: 'Professional leather clean only. Store in a cool, dry place away from direct sunlight. Use a leather conditioner every 6 months.',
  isNew: true,
};

const sampleReviews = [
  { id: '1', customerName: 'James Mitchell', rating: 5, date: '2024-12-15', text: 'Exceptional quality. The leather is incredibly soft and the fit is perfect. Worth every penny.', isVerifiedPurchase: true, helpfulCount: 23, country: 'United States' },
  { id: '2', customerName: 'Alexandre Dubois', rating: 4, date: '2024-11-28', text: 'Beautiful jacket with excellent craftsmanship. The brown color is richer in person.', isVerifiedPurchase: true, helpfulCount: 12, country: 'France' },
  { id: '3', customerName: 'David Chen', rating: 5, date: '2024-11-10', text: 'My third VOSS jacket. The quality consistency is remarkable. This brown leather is a standout piece.', isVerifiedPurchase: true, helpfulCount: 8, country: 'Singapore' },
];

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(sampleProduct.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(sampleProduct.sizes[1].value);
  const [quantity, setQuantity] = useState(1);

  const hasDiscount = sampleProduct.salePrice !== undefined;
  const savings = hasDiscount ? sampleProduct.regularPrice - sampleProduct.salePrice! : 0;

  if (error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24">
          <ErrorState message={error} onRetry={() => window.location.reload()} />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* Breadcrumb */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: sampleProduct.category, href: `/category/${sampleProduct.category.toLowerCase().replace(/\s+/g, '-')}` },
              { label: sampleProduct.name },
            ]}
          />
        </div>

        {isLoading ? (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <LoadingState variant="product-detail" />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
              {/* Product Images */}
              <ScrollReveal direction="left">
                <ImageGallery images={sampleProduct.images} alt={sampleProduct.name} />
              </ScrollReveal>

              {/* Product Info */}
              <ScrollReveal direction="right" delay={0.1}>
                <div className="space-y-6">
                  {/* Brand & Category */}
                  <div>
                    <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
                      {sampleProduct.brand}
                    </p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      {sampleProduct.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-400">SKU: {sampleProduct.sku}</p>
                  </div>

                  {/* Pricing */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-gray-900">
                      ${(sampleProduct.salePrice ?? sampleProduct.regularPrice).toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-gray-400 line-through">
                          ${sampleProduct.regularPrice.toFixed(2)}
                        </span>
                        <Badge variant="sale" size="sm">
                          -{sampleProduct.discountPercent}%
                        </Badge>
                      </>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-sm text-green-600">You save ${savings.toFixed(2)}</p>
                  )}

                  {/* Rating */}
                  <div className="flex items-center gap-2">
                    <Rating value={sampleProduct.rating} />
                    <span className="text-sm text-gray-500">
                      {sampleProduct.rating} ({sampleProduct.reviewCount} reviews)
                    </span>
                  </div>

                  {/* Short Description */}
                  <p className="text-sm leading-relaxed text-gray-600">
                    {sampleProduct.description}
                  </p>

                  {/* Stock Status */}
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      In Stock ({sampleProduct.stock} available)
                    </span>
                  </div>

                  {/* Color Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-900">Color: {selectedColor.name}</label>
                    <div className="mt-2">
                      <ColorSwatch
                        colors={sampleProduct.colors}
                        selectedColor={selectedColor.name}
                        onChange={(color) => setSelectedColor(color)}
                      />
                    </div>
                  </div>

                  {/* Size Selection */}
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-900">Size</label>
                      <button type="button" className="text-xs text-gray-500 underline hover:text-gray-900">
                        Size Guide
                      </button>
                    </div>
                    <div className="mt-2">
                      <SizeSelector
                        sizes={sampleProduct.sizes}
                        selectedSize={selectedSize}
                        onChange={(size) => setSelectedSize(size.value)}
                      />
                    </div>
                  </div>

                  {/* Quantity & Actions */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-900">Quantity</label>
                      <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={sampleProduct.stock} />
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button variant="dark" size="lg" fullWidth>
                        Add to Cart
                      </Button>
                      <Button variant="outline" size="lg" fullWidth>
                        Buy Now
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" fullWidth>
                      <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Add to Wishlist
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 p-4">
                    {[
                      { label: 'Free Shipping', desc: 'On orders over $200' },
                      { label: 'Easy Returns', desc: '30-day return policy' },
                      { label: 'Secure Checkout', desc: 'SSL encrypted' },
                      { label: 'Worldwide', desc: 'International shipping' },
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <p className="text-xs font-semibold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Details Tabs */}
            <div className="mt-16">
              <Tabs
                tabs={[
                  {
                    id: 'description',
                    label: 'Description',
                    content: (
                      <div className="prose prose-sm max-w-none">
                        <p>{sampleProduct.description}</p>
                      </div>
                    ),
                  },
                  {
                    id: 'specifications',
                    label: 'Specifications',
                    content: (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {Object.entries(sampleProduct.specifications).map(([key, value]) => (
                          <div key={key} className="flex justify-between border-b border-gray-100 py-2">
                            <span className="text-sm text-gray-500">{key}</span>
                            <span className="text-sm font-medium text-gray-900">{value}</span>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  {
                    id: 'care',
                    label: 'Care Instructions',
                    content: (
                      <div className="prose prose-sm max-w-none">
                        <p>{sampleProduct.careInstructions}</p>
                      </div>
                    ),
                  },
                  {
                    id: 'reviews',
                    label: `Reviews (${sampleProduct.reviewCount})`,
                    content: (
                      <div className="space-y-6">
                        {sampleReviews.map((review) => (
                          <ReviewCard key={review.id} review={review} />
                        ))}
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>
        )}

        <Footer />
      </main>
    </PageTransition>
  );
}

