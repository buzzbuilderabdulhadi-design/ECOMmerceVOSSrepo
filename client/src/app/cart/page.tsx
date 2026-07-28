'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { EmptyState } from '@/components/shared/EmptyState';

// ============================================================
// Cart Page — Shopping cart with live calculations
// ============================================================

interface CartItemData {
  id: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  size: string;
  color: string;
  sku: string;
  maxQuantity: number;
}

const sampleCartItems: CartItemData[] = [
  { id: '1', name: 'Classic Brown Leather Jacket', slug: 'classic-brown-leather-jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200&q=80', price: 395, originalPrice: 450, quantity: 1, size: 'M', color: 'Brown', sku: 'VOSS-LJ-001', maxQuantity: 10 },
  { id: '2', name: 'Black Suede Bomber Jacket', slug: 'black-suede-bomber-jacket', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200&q=80', price: 455, quantity: 1, size: 'L', color: 'Black', sku: 'VOSS-SB-002', maxQuantity: 5 },
];

const SHIPPING_THRESHOLD = 200;
const SHIPPING_COST = 15;
const TAX_RATE = 0.08;

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItemData[]>(sampleCartItems);
  const [isLoading] = useState(false);

  const updateQuantity = (id: string, newQuantity: number) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = cartItems.reduce(
    (sum, item) => sum + ((item.originalPrice ?? item.price) - item.price) * item.quantity,
    0
  );
  const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
  const shipping = isFreeShipping ? 0 : SHIPPING_COST;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + shipping + tax;
  const shippingProgress = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);
  const amountUntilFree = SHIPPING_THRESHOLD - subtotal;

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* Page Header */}
        <section className="bg-gray-50 py-12 md:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Shopping Cart
            </h1>
          </div>
        </section>

        {cartItems.length === 0 ? (
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <EmptyState
              icon={undefined}
              title="Your cart is empty"
              description="Looks like you haven't added anything to your cart yet."
              actionLabel="Continue Shopping"
              actionHref="/shop"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Free Shipping Progress */}
            {!isFreeShipping && (
              <div className="mb-8 rounded-lg bg-amber-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-800">
                    Add ${amountUntilFree.toFixed(2)} more to unlock <strong>FREE SHIPPING</strong>
                  </p>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${shippingProgress}%` }}
                  />
                </div>
              </div>
            )}
            {isFreeShipping && (
              <div className="mb-8 rounded-lg bg-green-50 p-4">
                <p className="text-sm font-medium text-green-800">
                  You&apos;ve unlocked <strong>FREE SHIPPING</strong>!
                </p>
              </div>
            )}

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Cart Items */}
              <div className="space-y-4 lg:col-span-2">
                {cartItems.map((item) => (
                  <ScrollReveal key={item.id}>
                    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:gap-6 sm:p-6">
                      {/* Product Image */}
                      <Link href={`/products/${item.slug}`} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg sm:h-32 sm:w-32">
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="128px" />
                      </Link>

                      {/* Product Details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <Link href={`/products/${item.slug}`} className="text-sm font-semibold text-gray-900 hover:text-gray-600 sm:text-base">
                            {item.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-gray-500">SKU: {item.sku}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                            <span>Size: {item.size}</span>
                            <span>Color: {item.color}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <QuantitySelector
                            value={item.quantity}
                            onChange={(q) => updateQuantity(item.id, q)}
                            min={1}
                            max={item.maxQuantity}
                          />
                          <div className="flex items-center gap-3">
                            <span className="text-base font-semibold text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-24 rounded-xl border border-gray-200 bg-white p-6">
                  <h2 className="text-lg font-semibold text-gray-900">Order Summary</h2>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-600">Discount</span>
                        <span className="font-medium text-green-600">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shipping</span>
                      <span className={isFreeShipping ? 'font-medium text-green-600' : 'font-medium text-gray-900'}>
                        {isFreeShipping ? 'FREE' : `$${SHIPPING_COST.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Estimated Tax</span>
                      <span className="font-medium text-gray-900">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-base font-semibold text-gray-900">Total</span>
                        <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Link href="/checkout">
                    <Button variant="dark" size="lg" fullWidth className="mt-6">
                      Proceed to Checkout
                    </Button>
                  </Link>
                  <Link href="/shop">
                    <Button variant="ghost" size="sm" fullWidth className="mt-2">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </main>
    </PageTransition>
  );
}

