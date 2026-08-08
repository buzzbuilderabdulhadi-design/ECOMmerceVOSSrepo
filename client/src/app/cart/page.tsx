'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { useCart } from '@/context/CartContext';
import toast from 'react-hot-toast';

const SHIPPING_THRESHOLD = 200;
const SHIPPING_COST = 15;
const TAX_RATE = 0.08;

export default function CartPage() {
  const { cart, isLoading, error, updateQuantity, removeItem, clearCart, itemCount, subtotal } = useCart();
  const cartItems = cart?.items || [];

  const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
  const shipping = isFreeShipping ? 0 : SHIPPING_COST;
  const discount = cart?.discountAmount || 0;
  const tax = subtotal * TAX_RATE;
  const total = Math.max(0, subtotal - discount + shipping + tax);
  const shippingProgress = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);
  const amountUntilFree = SHIPPING_THRESHOLD - subtotal;

  const handleClearCart = () => {
    clearCart();
    toast.success('Cart cleared');
  };

  const header = (
    <section className="relative overflow-hidden pb-6 pt-24 md:pb-10 md:pt-36">
      <span className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[12rem]">
        Cart
      </span>
      <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart' }]} />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <TextReveal as="h1" text="Shopping Cart" className="font-display text-5xl font-light text-navy sm:text-6xl" />
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate transition-colors hover:text-red-500"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </section>
  );

  if (isLoading && cartItems.length === 0) {
    return (
      <PageTransition>
        <main className="min-h-screen">
          <Navbar />
          {header}
          <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:px-12">
            <LoadingState variant="cart" />
          </div>
          <Footer />
        </main>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <main className="min-h-screen">
          <Navbar />
          {header}
          <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:px-12 text-center">
            <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-10">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h2 className="mt-4 font-display text-2xl font-light text-red-700">Something went wrong</h2>
              <p className="mt-2 text-sm text-red-600">{error}</p>
              <Link href="/shop">
                <Button variant="primary" className="mt-6">Continue Shopping</Button>
              </Link>
            </div>
          </div>
          <Footer />
        </main>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        {header}

        {cartItems.length === 0 ? (
          <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-8 lg:px-12">
            <EmptyState
              type="cart"
              title="Your cart is empty"
              description="Looks like you haven't added anything to your cart yet."
              actionLabel="Continue Shopping"
              actionHref="/shop"
            />
          </div>
        ) : (
          <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-8 lg:px-12">
            {/* Shipping progress */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 rounded-2xl border border-sage-light/30 bg-white/70 p-6 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-navy">
                    {isFreeShipping ? (
                      <>You&apos;ve unlocked <strong className="text-sage-dark">FREE SHIPPING</strong>!</>
                    ) : (
                      <>Add <strong className="text-sage-dark">${amountUntilFree.toFixed(2)}</strong> more to unlock <strong>FREE SHIPPING</strong></>
                    )}
                </p>
                <span className="hidden font-display text-lg text-sage-dark sm:block">
                  {Math.round(shippingProgress)}%
                </span>
              </div>
              <div className="mt-4 h-[3px] w-full overflow-hidden rounded-full bg-sage-light/40">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${shippingProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-sage to-sage-light"
                />
              </div>
            </motion.div>

            <div className="grid gap-12 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2">
                <div className="hairline-b pb-4">
                  <p className="text-[11px] uppercase tracking-[0.3em] text-slate">Items ({itemCount})</p>
                </div>
                <div>
                  {cartItems.map((item, index) => {
                    const p = item.product;
                    const v = item.variant;
                    const price = v?.priceOverride ?? p.salePrice ?? p.regularPrice;
                    const firstImage = p.images?.[0];
                    const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage as { url?: string })?.url || '';
                    const maxStock = v?.stock ?? p.stock ?? 10;
                    return (
                      <ScrollReveal key={item.id} delay={index * 0.05}>
                        <motion.div
                          layout
                          className="group grid grid-cols-[auto_1fr] gap-5 border-b border-navy/10 py-7 sm:gap-7"
                        >
                          <Link href={`/products/${p.slug}`} className="relative h-32 w-24 flex-shrink-0 overflow-hidden sm:h-40 sm:w-32">
                            <Image src={imageUrl} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-108" sizes="128px" />
                          </Link>

                          <div className="flex flex-col">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.25em] text-sage-dark">{p.brand || 'VOSS'}</p>
                                <Link href={`/products/${p.slug}`} className="mt-1 block font-display text-xl font-medium text-navy transition-colors hover:text-walnut sm:text-2xl">
                                  {p.name}
                                </Link>
                                <p className="mt-1 text-xs text-slate">SKU: {p.sku}</p>
                                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate">
                                  {v?.size && <span className="rounded-full bg-sage-light/30 px-2.5 py-0.5">Size: {v.size}</span>}
                                  {v?.color && <span className="rounded-full bg-sage-light/30 px-2.5 py-0.5">Color: {v.color}</span>}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  removeItem(item.id);
                                  toast.success('Item removed');
                                }}
                                className="rounded-full p-2 text-slate transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                                aria-label={`Remove ${p.name} from cart`}
                              >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>

                            <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
                              <QuantitySelector
                                value={item.quantity}
                                onChange={(q) => updateQuantity(item.id, q)}
                                min={1}
                                max={maxStock}
                              />
                              <div className="text-right">
                                <p className="text-xs text-slate">${price.toFixed(2)} each</p>
                                <p className="font-display text-2xl text-navy">
                                  ${(price * item.quantity).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </ScrollReveal>
                    );
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="bg-gradient-night rounded-3xl p-8 grain lg:sticky lg:top-32">
                  <h2 className="font-display text-2xl font-light text-ivory">Order Summary</h2>
                  <div className="mt-7 space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-light">Subtotal</span>
                      <span className="font-medium text-ivory">${subtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-sage-light">Discount {cart?.couponCode ? `(${cart.couponCode})` : ''}</span>
                        <span className="font-medium text-sage-light">-${discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-light">Shipping</span>
                      <span className={isFreeShipping ? 'font-medium text-sage-light' : 'font-medium text-ivory'}>
                        {isFreeShipping ? 'FREE' : `$${SHIPPING_COST.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-light">Estimated Tax</span>
                      <span className="font-medium text-ivory">${tax.toFixed(2)}</span>
                    </div>
                    <div className="hairline-b hairline-gold pt-2" />
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-xl text-ivory">Total</span>
                      <span className="font-display text-4xl font-light text-ivory">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className="mt-8 block">
                    <Button variant="light" size="lg" fullWidth>
                      Proceed to Checkout
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </Link>
                  <Link href="/shop" className="mt-4 block">
                    <Button variant="light" size="sm" fullWidth className="bg-cream/10 text-ivory hover:bg-cream/20">
                      Continue Shopping
                    </Button>
                  </Link>

                  <p className="mt-6 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-sage-light">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Secure SSL encrypted checkout
                  </p>
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
