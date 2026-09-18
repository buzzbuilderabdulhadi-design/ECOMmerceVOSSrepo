'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { useCart } from '@/context/CartContext';
import { createAddress } from '@/services/addresses';
import { createOrder } from '@/services/orders';
import { getErrorMessage } from '@/services/axios';
import { cn } from '@/lib/utils';

type Step = 'shipping' | 'payment' | 'review';

const SHIPPING_COST = 15;
const TAX_RATE = 0.08;

interface ShippingForm {
  fullName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

const initialShipping: ShippingForm = {
  fullName: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  zip: '',
  country: '',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal } = useCart();
  const [step, setStep] = useState<Step>('shipping');
  const [shippingForm, setShippingForm] = useState<ShippingForm>(initialShipping);
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);

  const steps: { id: Step; label: string }[] = [
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);

  const discount = cart?.discountAmount || 0;
  const shipping = subtotal - discount >= 200 ? 0 : SHIPPING_COST;
  const tax = Math.max(0, subtotal - discount) * TAX_RATE;
  const total = Math.max(0, subtotal - discount + shipping + tax);

  const updateShipping = (field: keyof ShippingForm, value: string) => {
    setShippingForm((prev) => ({ ...prev, [field]: value }));
    setShippingErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateShipping = (): boolean => {
    const errs: Partial<Record<keyof ShippingForm, string>> = {};
    if (!shippingForm.fullName.trim()) errs.fullName = 'Full name is required';
    if (!shippingForm.phone.trim()) errs.phone = 'Phone is required';
    if (!shippingForm.line1.trim()) errs.line1 = 'Address is required';
    if (!shippingForm.city.trim()) errs.city = 'City is required';
    if (!shippingForm.state.trim()) errs.state = 'State is required';
    if (!/^\d{4,10}$/.test(shippingForm.zip.trim())) errs.zip = 'Enter a valid ZIP code';
    if (!shippingForm.country.trim()) errs.country = 'Country is required';
    setShippingErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goToPayment = () => {
    setOrderError('');
    if (validateShipping()) setStep('payment');
  };

  const handlePlaceOrder = async () => {
    setOrderError('');
    setIsPlacing(true);
    try {
      const address = await createAddress({
        label: 'Shipping',
        fullName: shippingForm.fullName,
        phone: shippingForm.phone,
        line1: shippingForm.line1,
        line2: shippingForm.line2 || undefined,
        city: shippingForm.city,
        state: shippingForm.state,
        zip: shippingForm.zip,
        country: shippingForm.country,
        isDefault: true,
      });
      const order = await createOrder({
        shippingAddressId: address.id,
        couponCode: cart?.couponCode,
        paymentMethod: 'card',
      });
      setCompletedOrder(order.orderNumber);
    } catch (error) {
      setOrderError(getErrorMessage(error));
    } finally {
      setIsPlacing(false);
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        <section className="relative overflow-hidden pb-4 pt-24 md:pt-36">
          <span className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[12rem]">
            Order
          </span>
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Checkout' }]} />
            <div className="mt-6">
              <TextReveal as="h1" text="Checkout" className="font-display text-5xl font-light text-navy sm:text-6xl" />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:px-12">
          {/* Progress Steps */}
          <div className="mb-12">
            <div className="flex items-center justify-between">
              {steps.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => i < currentIndex && setStep(s.id)}
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-full font-display text-lg transition-all duration-300',
                        step === s.id
                          ? 'bg-navy text-ivory shadow-lg shadow-navy/20'
                          : i < currentIndex
                            ? 'border-2 border-walnut text-walnut hover:bg-walnut hover:text-ivory'
                            : 'border-2 border-navy/15 text-slate'
                      )}
                    >
                      {i < currentIndex ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        `0${i + 1}`
                      )}
                    </button>
                    <span
                      className={cn(
                        'mt-2 text-[11px] uppercase tracking-[0.2em]',
                        step === s.id ? 'text-navy' : i < currentIndex ? 'text-walnut' : 'text-slate'
                      )}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div
                      className={cn(
                        'mx-4 h-[2px] flex-1 transition-all duration-300',
                        i < currentIndex ? 'bg-sage' : 'bg-navy/10'
                      )}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <ScrollReveal>
            {completedOrder ? (
              <div className="hairline rounded-2xl bg-white/70 p-6 text-center backdrop-blur-sm sm:p-10">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40">
                  <svg className="h-8 w-8 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Thank You</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  Your order <span className="font-medium text-navy">#{completedOrder}</span> has been placed successfully.
                  A confirmation has been sent to your email.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Button href="/dashboard/orders" variant="primary">View My Orders</Button>
                  <Button href="/shop" variant="ghost">Continue Shopping</Button>
                </div>
              </div>
            ) : cart?.items?.length === 0 ? (
              <div className="hairline rounded-2xl bg-white/70 p-6 text-center backdrop-blur-sm sm:p-10">
                <h2 className="font-display text-3xl font-light text-navy">Your cart is empty</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  Add some pieces to your cart before heading to checkout.
                </p>
                <div className="mt-8">
                  <Button href="/shop" variant="primary">Explore the Collection</Button>
                </div>
              </div>
            ) : (
              <>
            {step === 'shipping' && (
              <div className="hairline rounded-2xl bg-white/70 p-6 backdrop-blur-sm sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.3em] text-sage-dark">Step 01 — Delivery Details</p>
                <h2 className="mt-2 font-display text-3xl font-light text-navy">Shipping Address</h2>
                <div className="mt-7 grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Full Name"
                    placeholder="John Doe"
                    required
                    value={shippingForm.fullName}
                    onChange={(e) => updateShipping('fullName', e.target.value)}
                    error={shippingErrors.fullName}
                  />
                  <Input
                    label="Phone"
                    placeholder="+1 555 000 0000"
                    required
                    value={shippingForm.phone}
                    onChange={(e) => updateShipping('phone', e.target.value)}
                    error={shippingErrors.phone}
                  />
                  <div className="sm:col-span-2">
                    <Input
                      label="Address"
                      placeholder="123 Luxury Lane"
                      required
                      value={shippingForm.line1}
                      onChange={(e) => updateShipping('line1', e.target.value)}
                      error={shippingErrors.line1}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Apt / Suite (optional)"
                      placeholder="Apt 4B"
                      value={shippingForm.line2}
                      onChange={(e) => updateShipping('line2', e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    placeholder="New York"
                    required
                    value={shippingForm.city}
                    onChange={(e) => updateShipping('city', e.target.value)}
                    error={shippingErrors.city}
                  />
                  <Input
                    label="State"
                    placeholder="NY"
                    required
                    value={shippingForm.state}
                    onChange={(e) => updateShipping('state', e.target.value)}
                    error={shippingErrors.state}
                  />
                  <Input
                    label="ZIP Code"
                    placeholder="10001"
                    required
                    value={shippingForm.zip}
                    onChange={(e) => updateShipping('zip', e.target.value)}
                    error={shippingErrors.zip}
                  />
                  <Input
                    label="Country"
                    placeholder="United States"
                    required
                    value={shippingForm.country}
                    onChange={(e) => updateShipping('country', e.target.value)}
                    error={shippingErrors.country}
                  />
                </div>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                  <Button href="/cart" variant="ghost">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                      </svg>
                      Back to Cart
                    </Button>
                  <Button variant="primary" onClick={goToPayment}>
                    Continue to Payment
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="hairline rounded-2xl bg-white/70 p-6 backdrop-blur-sm sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.3em] text-sage-dark">Step 02 — Secure Payment</p>
                <h2 className="mt-2 font-display text-3xl font-light text-navy">Payment Information</h2>
                <div className="mt-7 space-y-5">
                  <Input label="Card Number" placeholder="1234 5678 9012 3456" />
                  <div className="grid gap-5 sm:grid-cols-3">
                    <Input label="Expiry Date" placeholder="MM/YY" />
                    <Input label="CVV" placeholder="123" />
                    <Input label="ZIP Code" placeholder="10001" />
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-navy">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-gold"
                    />
                    Save card for future purchases
                  </label>
                  <p className="flex items-center gap-2 text-xs text-slate">
                  <svg className="h-4 w-4 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                    Your payment details are encrypted end-to-end.
                  </p>
                </div>
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                  <Button variant="ghost" onClick={() => setStep('shipping')}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Back to Shipping
                  </Button>
                  <Button variant="primary" onClick={() => setStep('review')}>
                    Review Order
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Button>
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="hairline rounded-2xl bg-white/70 p-6 backdrop-blur-sm sm:p-10">
                <p className="text-[11px] uppercase tracking-[0.3em] text-sage-dark">Step 03 — Final Confirmation</p>
                <h2 className="mt-2 font-display text-3xl font-light text-navy">Review Your Order</h2>
                <div className="mt-7 space-y-8">
                  <div className="grid gap-8 sm:grid-cols-2">
                    <div>
                      <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-sage-dark">
                        <span className="h-px w-6 bg-sage" /> Shipping Address
                      </h3>
                      <p className="mt-2 font-display text-lg text-navy">{shippingForm.fullName}</p>
                      <p className="text-sm leading-relaxed text-slate">
                        {shippingForm.line1}{shippingForm.line2 ? `, ${shippingForm.line2}` : ''}, {shippingForm.city}, {shippingForm.state} {shippingForm.zip}, {shippingForm.country}
                      </p>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-sage-dark">
                        <span className="h-px w-6 bg-sage" /> Payment Method
                      </h3>
                      <p className="mt-2 font-display text-lg text-navy">Card</p>
                      <p className="text-sm text-slate">Charged on order placement</p>
                    </div>
                  </div>

                  <div className="bg-gradient-night grain rounded-2xl p-6 sm:p-8">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sage-light">Subtotal</span>
                        <span className="font-medium text-ivory">${subtotal.toFixed(2)}</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sage-light">Discount</span>
                          <span className="font-medium text-sage-light">-${discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sage-light">Shipping</span>
                        <span className={shipping === 0 ? 'font-medium text-sage-light' : 'font-medium text-ivory'}>
                          {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-light">Estimated Tax</span>
                        <span className="font-medium text-ivory">${tax.toFixed(2)}</span>
                      </div>
                      <div className="hairline-b hairline-gold" />
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="font-display text-xl text-ivory">Total</span>
                        <span className="font-display text-4xl font-light text-ivory">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {orderError && (
                  <div className="mt-6 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
                    {orderError}
                  </div>
                )}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                  <Button variant="ghost" onClick={() => setStep('payment')} disabled={isPlacing}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Back to Payment
                  </Button>
                  <Button variant="primary" size="lg" isLoading={isPlacing} onClick={handlePlaceOrder}>
                    Place Order
                  </Button>
                </div>
              </div>
            )}
              </>
            )}
          </ScrollReveal>
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}
