'use client';

import React, { useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/Button';
import { QuantitySelector } from '@/components/ui/QuantitySelector';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHIPPING_THRESHOLD = 200;

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, isLoading, itemCount, subtotal, updateQuantity, removeItem } = useCart();
  const cartItems = cart?.items || [];

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  const shippingProgress = Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100);
  const isFreeShipping = subtotal >= SHIPPING_THRESHOLD;
  const amountUntilFree = SHIPPING_THRESHOLD - subtotal;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-navy"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onKeyDown={handleKeyDown}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-navy/10 px-6 py-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.3em] text-sage-dark">ZOYA GOODS</p>
                <h2 className="font-display text-2xl font-light text-navy">
                  Your Selection <span className="text-sage-dark">({itemCount})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="group flex h-10 w-10 items-center justify-center rounded-full border border-navy/15 text-navy transition-all hover:border-navy hover:bg-navy hover:text-ivory"
                aria-label="Close cart"
              >
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {isLoading && cartItems.length === 0 ? (
              <div className="flex flex-1 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage [animation-delay:300ms]" />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.3em] text-slate">Loading cart</span>
                </div>
              </div>
            ) : cartItems.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <svg className="h-16 w-16 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <h3 className="font-display text-2xl font-light text-navy">Your cart is empty</h3>
                <p className="max-w-xs text-sm text-slate">
                  Discover pieces crafted for the discerning. Browse our latest collection.
                </p>
                <Button variant="primary" onClick={onClose}>
                  Continue Shopping
                </Button>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-6 py-4">
                  {/* Free shipping progress */}
                  <div className="hairline-b mb-2 pb-4">
                    <p className="text-xs text-navy">
                      {isFreeShipping ? (
                        <>You&apos;ve unlocked <strong className="text-sage-dark">FREE SHIPPING</strong></>
                      ) : (
                        <>
                          Add <strong className="text-sage-dark">${amountUntilFree.toFixed(2)}</strong> more for free shipping
                        </>
                      )}
                    </p>
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-sage-light/40">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${shippingProgress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-sage to-sage-light"
                      />
                    </div>
                  </div>

                  <div>
                    {cartItems.map((item) => {
                      const p = item.product;
                      const v = item.variant;
                      const price = v?.priceOverride ?? p.salePrice ?? p.regularPrice;
                      const firstImage = p.images?.[0];
                      const imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage as { url?: string })?.url || '';
                      return (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: 50 }}
                          className="group flex gap-4 border-b border-navy/10 py-5"
                        >
                          <Link href={`/products/${p.slug}`} onClick={onClose} className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-sage-light/30">
                            <Image src={imageUrl} alt={p.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="80px" />
                          </Link>
                          <div className="flex min-w-0 flex-1 flex-col justify-between">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[9px] uppercase tracking-[0.25em] text-sage-dark">{p.brand || 'ZOYA GOODS'}</p>
                                <Link href={`/products/${p.slug}`} onClick={onClose} className="line-clamp-1 font-display text-base font-medium text-navy hover:text-walnut">
                                  {p.name}
                                </Link>
                                <p className="mt-0.5 text-xs text-slate">
                                  ${price.toFixed(2)}
                                  {v && (
                                    <>
                                      {v.color && <span> &middot; {v.color}</span>}
                                      {v.size && <span> &middot; {v.size}</span>}
                                    </>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="rounded-full p-1.5 text-slate transition-all hover:bg-red-50 hover:text-red-500 active:scale-90"
                                aria-label={`Remove ${p.name}`}
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <QuantitySelector
                                value={item.quantity}
                                onChange={(q) => updateQuantity(item.id, q)}
                                min={1}
                                max={v?.stock ?? p.stock ?? 10}
                                size="sm"
                              />
                              <span className="font-display text-lg text-navy">
                                ${(price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gradient-night grain px-6 pb-6 pt-5">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-sage-light">Subtotal</span>
                      <span className="font-medium text-ivory">${subtotal.toFixed(2)}</span>
                    </div>
                    {cart?.discountAmount && cart.discountAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-sage-light">Discount</span>
                        <span className="font-medium text-sage-light">-${cart.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="hairline-b hairline-gold" />
                    <div className="flex items-baseline justify-between pt-1">
                      <span className="font-display text-lg text-ivory">Total</span>
                      <span className="font-display text-3xl font-light text-ivory">
                        ${(subtotal - (cart?.discountAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <Button href="/checkout" onClick={onClose} className="mt-4 block w-full">
                    <span className="block w-full">
                    Checkout
                    </span>
                  </Button>
                  <Button href="/cart" onClick={onClose} variant="light" size="sm" fullWidth className="mt-2 bg-cream/10 text-ivory hover:bg-cream/20">
                    <span className="block w-full">
                    View Full Cart
                    </span>
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
