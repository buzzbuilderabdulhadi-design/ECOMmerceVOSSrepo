'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PaymentElement } from '@stripe/react-stripe-js';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { createAddress } from '@/services/addresses';
import { createOrder } from '@/services/orders';
import {
  fetchCheckoutPreview,
  fetchCheckoutMethods,
  createOrderPaymentIntent,
  createPayPalOrder,
} from '@/services/checkout';
import { getErrorMessage } from '@/services/axios';
import { computeTotals } from '@/lib/pricing';
import { StripeCheckoutProvider, useStripeElements } from '@/components/checkout/StripeCheckoutProvider';
import type { Cart, CheckoutMethod, CheckoutPreview, PaymentMethod } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { ProductImage } from '@/components/product/ProductImage';

type Step = 'shipping' | 'payment' | 'review';

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

interface ManualResult {
  orderNumber: string;
  reference: string;
  methodLabel: string;
  instructions: string[];
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

const FALLBACK_LABELS: Record<string, string> = {
  STRIPE: 'Card (Stripe)',
  PAYPAL: 'PayPal',
  BANK_TRANSFER: 'Direct Bank Transfer',
  PAYONEER: 'Payoneer',
};

function methodLabel(methods: CheckoutMethod[], id: PaymentMethod | null | undefined): string {
  if (!id) return 'Not selected';
  const found = methods.find((m) => m.id === id);
  return found?.label ?? FALLBACK_LABELS[id] ?? String(id);
}

interface ReviewLine {
  key: string;
  name: string;
  slug: string;
  variant: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  images: string[];
}

/**
 * Order lines for the review step. The server preview is authoritative when it
 * has loaded; until then the cart is mirrored for display only, the same way
 * `fallbackTotals` mirrors the totals.
 */
function buildReviewLines(preview: CheckoutPreview | null, cart: Cart | null | undefined): ReviewLine[] {
  if (preview?.items?.length) {
    return preview.items.map((item, i) => ({
      key: `${item.productId}-${item.variantId ?? 'default'}-${i}`,
      name: item.name,
      slug: item.slug,
      variant: [item.color, item.size].filter(Boolean).join(' / '),
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      images: item.image ? [item.image] : [],
    }));
  }
  return (cart?.items ?? []).map((item) => {
    const unitPrice =
      item.variant?.priceOverride ?? item.product?.salePrice ?? item.product?.regularPrice ?? 0;
    return {
      key: item.id,
      name: item.product?.name ?? '',
      slug: item.product?.slug ?? '',
      variant: [item.variant?.color, item.variant?.size].filter(Boolean).join(' / '),
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
      images:
        item.product?.images?.map((i) => (typeof i === 'string' ? i : i.url)).filter(Boolean) || [],
    };
  });
}

export default function CheckoutPage() {
  return (
    <StripeCheckoutProvider>
      <CheckoutContent />
    </StripeCheckoutProvider>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const { stripe, elements } = useStripeElements();
  const { cart, subtotal, refreshCart } = useCart();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>('shipping');
  const [shippingForm, setShippingForm] = useState<ShippingForm>(initialShipping);
  const [shippingErrors, setShippingErrors] = useState<Partial<Record<keyof ShippingForm, string>>>({});
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [completedOrder, setCompletedOrder] = useState<string | null>(null);
  const [manualResult, setManualResult] = useState<ManualResult | null>(null);
  const [paypalRedirecting, setPaypalRedirecting] = useState(false);
  const [methods, setMethods] = useState<CheckoutMethod[]>([]);
  const [methodsError, setMethodsError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const [idempotencyKey] = useState(() =>
    typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `zg-order-${Date.now()}`
  );

  const steps: { id: Step; label: string }[] = [
    { id: 'shipping', label: 'Shipping' },
    { id: 'payment', label: 'Payment' },
    { id: 'review', label: 'Review' },
  ];
  const currentIndex = steps.findIndex((s) => s.id === step);

  const enabledMethods = methods.filter((m) => m.enabled);
  const anyMethodAvailable = enabledMethods.length > 0;
  const selectedMethod = methods.find((m) => m.id === paymentMethod);
  const selectedIsManual = paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'PAYONEER';

  const discount = cart?.discountAmount || 0;
  // Display-only mirror; the server recomputes all totals authoritatively.
  const fallbackTotals = computeTotals(subtotal, discount);
  const totals = preview ? preview.totals : fallbackTotals;
  const reviewLines = buildReviewLines(preview, cart);

  // Orders are tied to an account, and every checkout endpoint below is
  // authenticated. Send signed-out visitors to sign in and return them here
  // instead of leaving them on a checkout that cannot load.
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=%2Fcheckout');
    }
  }, [authLoading, isAuthenticated, router]);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let active = true;
    fetchCheckoutPreview()
      .then((data) => {
        if (active) {
          setPreview(data);
          setPreviewError('');
        }
      })
      .catch((error) => {
        if (active) setPreviewError(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated]);

  React.useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let active = true;
    fetchCheckoutMethods()
      .then((data) => {
        if (!active) return;
        setMethods(data.methods || []);
        setMethodsError('');
        setPaymentMethod((prev) => {
          if (prev) return prev;
          const first = data.methods?.find((m) => m.enabled);
          return first?.id ?? null;
        });
      })
      .catch((error) => {
        if (active) setMethodsError(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated]);

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
      if (!paymentMethod || !selectedMethod?.enabled) {
        throw new Error('Please choose a payment method.');
      }

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
        paymentMethod,
        idempotencyKey,
      });

      if (paymentMethod === 'STRIPE' || paymentMethod === 'card') {
        if (!stripe || !elements) {
          throw new Error('Payment is not fully configured yet. Please try again.');
        }
        const paymentIntent = await createOrderPaymentIntent(order.id);
        const { error } = await stripe.confirmPayment({
          elements,
          clientSecret: paymentIntent.clientSecret,
          confirmParams: { return_url: window.location.href },
        });
        if (error) {
          throw new Error(error.message || 'Payment could not be completed.');
        }
        await refreshCart();
        setCompletedOrder(order.orderNumber);
        return;
      }

      if (paymentMethod === 'PAYPAL') {
        const origin = window.location.origin;
        const paypal = await createPayPalOrder({
          orderId: order.id,
          returnUrl: `${origin}/checkout/paypal?orderId=${order.id}`,
          cancelUrl: `${origin}/checkout?cancelled=paypal`,
        });
        await refreshCart();
        if (paypal.alreadyCaptured) {
          setCompletedOrder(order.orderNumber);
          return;
        }
        if (!paypal.approvalUrl) {
          throw new Error('PayPal could not start your payment. Please try again.');
        }
        setPaypalRedirecting(true);
        // Full-page navigation to PayPal's approval URL. assign is deliberate:
        // it must leave the SPA, which router.push cannot do cross-origin.
        window.location.assign(paypal.approvalUrl);
        return;
      }

      // Manual methods (bank transfer / Payoneer) settle offline and are
      // verified by an admin. No payment is captured on the client.
      await refreshCart();
      setManualResult({
        orderNumber: order.orderNumber,
        reference: order.orderNumber,
        methodLabel: methodLabel(methods, paymentMethod),
        instructions: selectedMethod?.instructions ?? [],
      });
    } catch (error) {
      setOrderError(getErrorMessage(error));
    } finally {
      setIsPlacing(false);
    }
  };

  const noMethodsBanner = !anyMethodAvailable && !methodsError ? (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
      <svg className="mt-0.5 h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>Payments are not configured yet. Please check back soon or contact support.</span>
    </div>
  ) : null;

  // Hold the page while the session is being resolved or while the signed-out
  // visitor is on their way to the login page.
  if (authLoading || !isAuthenticated) {
    return (
      <main className="min-h-screen bg-warm-beige">
        <Navbar />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy/20 border-t-navy" />
        </div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-warm-beige">
        <Navbar />

        <section className="relative overflow-hidden pb-4 pt-24 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[12rem]">
            Order
          </span>
          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Checkout' }]} />
            <div className="mt-6">
              <TextReveal as="h1" text="Checkout" className="font-display text-5xl font-light text-navy sm:text-6xl" />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:px-12">
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
            {manualResult ? (
              <div className="hairline rounded-2xl bg-white/70 p-6 text-center backdrop-blur-sm sm:p-10">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-walnut/10">
                  <svg className="h-8 w-8 text-walnut" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Order Placed — Payment Pending</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  Your order <span className="font-medium text-navy">#{manualResult.orderNumber}</span> has been placed and is{' '}
                  <span className="font-medium text-walnut">awaiting payment verification</span>. Please complete your{' '}
                  <span className="font-medium text-navy">{manualResult.methodLabel}</span> payment as described below.
                </p>
                <div className="mx-auto mt-6 max-w-md rounded-xl border border-sage-light/30 bg-sage-light/10 p-5 text-left">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-sage-dark">Payment Reference</p>
                  <p className="mt-1 font-mono text-lg font-medium text-navy">{manualResult.reference}</p>
                  {manualResult.instructions.length > 0 ? (
                    <ul className="mt-4 space-y-2">
                      {manualResult.instructions.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage-dark" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-slate">Please include your order number as the payment reference.</p>
                  )}
                </div>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Button href="/dashboard/orders" variant="primary">View My Orders</Button>
                  <Button href="/shop" variant="ghost">Continue Shopping</Button>
                </div>
              </div>
            ) : completedOrder ? (
              <div className="hairline rounded-2xl bg-white/70 p-6 text-center backdrop-blur-sm sm:p-10">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40">
                  <svg className="h-8 w-8 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Thank You</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  Your order <span className="font-medium text-navy">#{completedOrder}</span> has been placed successfully.
                  A confirmation email will be sent once your payment is fully processed.
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
                {previewError && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
                    {previewError}
                  </div>
                )}
                {methodsError && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800">
                    {methodsError}
                  </div>
                )}
                <div className="mt-7">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {methods.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        disabled={!m.enabled}
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          'rounded-xl border p-4 text-left transition-all duration-200',
                          m.enabled
                            ? paymentMethod === m.id
                              ? 'border-navy bg-navy/[0.04] shadow-sm'
                              : 'border-sage-light/40 bg-white hover:border-navy/40 hover:bg-sage-light/5'
                            : 'cursor-not-allowed border-sage-light/20 bg-slate-50 opacity-60'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className={cn('text-sm font-semibold', paymentMethod === m.id ? 'text-navy' : 'text-navy')}>
                              {m.label}
                            </span>
                            <span
                              className={cn(
                                'ml-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
                                m.kind === 'manual'
                                  ? 'bg-walnut/10 text-walnut'
                                  : 'bg-sage-dark/10 text-sage-dark'
                              )}
                            >
                              {m.kind === 'manual' ? 'Manual · Verified after you pay' : 'Instant'}
                            </span>
                          </div>
                          {paymentMethod === m.id && m.enabled && (
                            <svg className="h-5 w-5 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-slate">{m.description}</p>
                        {!m.enabled && <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-slate">Unavailable</p>}
                      </button>
                    ))}
                  </div>

                  <div className="mt-7">
                    {paymentMethod === 'STRIPE' || paymentMethod === 'card' ? (
                      <>
                        <PaymentElement />
                        <p className="mt-5 flex items-center gap-2 text-xs text-slate">
                          <svg className="h-4 w-4 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          Your card details are handled securely by Stripe and are never sent to our servers.
                        </p>
                      </>
                    ) : paymentMethod === 'PAYPAL' ? (
                      <div className="rounded-xl border border-sage-light/30 bg-sage-light/10 p-5">
                        <p className="text-sm leading-relaxed text-slate">
                          You&rsquo;ll be redirected to PayPal to approve the payment securely.
                          You will return to ZOYA GOODS once the payment is complete.
                        </p>
                        <p className="mt-3 text-xs text-slate">
                          No card details are shared with us — PayPal handles everything on their secure site.
                        </p>
                      </div>
                    ) : (paymentMethod === 'BANK_TRANSFER' || paymentMethod === 'PAYONEER') && selectedMethod ? (
                      <div className="rounded-xl border border-sage-light/30 bg-sage-light/10 p-5">
                        <p className="text-sm font-medium text-navy">How it works</p>
                        <ol className="mt-3 space-y-2 text-sm text-slate">
                          <li>1. Place your order now — you will not be charged today.</li>
                          <li>2. Transfer the order total to our {selectedMethod.label} account using the details below.</li>
                          <li>3. Include your order number as the payment reference.</li>
                          <li>4. Your order stays <span className="font-medium text-walnut">awaiting verification</span> until ZOYA GOODS confirms the payment.</li>
                        </ol>
                        {selectedMethod.instructions.length > 0 && (
                          <ul className="mt-3 space-y-1 border-t border-sage-light/40 pt-3 text-xs text-slate">
                            {selectedMethod.instructions.map((line, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage-dark" />
                                {line}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="mt-3 text-xs text-walnut">
                          No payment is taken from you here. We verify the transfer before your order is confirmed.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
                {noMethodsBanner}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                  <Button variant="ghost" onClick={() => setStep('shipping')}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Back to Shipping
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep('review')}
                    disabled={!paymentMethod || !selectedMethod?.enabled}
                  >
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
                      <p className="mt-2 font-display text-lg text-navy">{methodLabel(methods, paymentMethod)}</p>
                      <p className="text-sm text-slate">
                        {selectedIsManual
                          ? 'Pay by this method after placing the order. Payment awaits verification before the order is confirmed.'
                          : 'Charged securely when you place the order'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-sage-dark">
                      <span className="h-px w-6 bg-sage" /> Order Items
                    </h3>
                    <ul className="mt-4">
                      {reviewLines.map((line) => (
                        <li key={line.key} className="grid grid-cols-[auto_1fr_auto] items-start gap-4 border-b border-navy/10 py-4 last:border-b-0">
                          <Link
                            href={`/products/${line.slug}`}
                            className="relative h-20 w-16 flex-shrink-0 overflow-hidden bg-bone"
                          >
                            <ProductImage images={line.images} alt={line.name} className="h-full w-full" sizes="64px" />
                          </Link>
                          <div className="min-w-0">
                            <Link href={`/products/${line.slug}`} className="block font-display text-lg font-medium text-navy transition-colors hover:text-walnut">
                              {line.name}
                            </Link>
                            {line.variant && <p className="mt-1 text-xs text-slate">{line.variant}</p>}
                            <p className="mt-1 text-xs text-slate">
                              Qty: {line.quantity} &middot; {formatPrice(line.unitPrice)} each
                            </p>
                          </div>
                          <p className="font-display text-lg text-navy">{formatPrice(line.lineTotal)}</p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-slate">
                      {reviewLines.length} {reviewLines.length === 1 ? 'item' : 'items'}
                    </p>
                  </div>

                  <div className="bg-gradient-night grain rounded-2xl p-6 sm:p-8">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-sage-light">Subtotal</span>
                        <span className="font-medium text-ivory">${totals.subtotal.toFixed(2)}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sage-light">Discount</span>
                          <span className="font-medium text-sage-light">-${totals.discount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sage-light">Shipping</span>
                        <span className={totals.shipping === 0 ? 'font-medium text-sage-light' : 'font-medium text-ivory'}>
                          {totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sage-light">Estimated Tax</span>
                        <span className="font-medium text-ivory">${totals.tax.toFixed(2)}</span>
                      </div>
                      <div className="hairline-b hairline-gold" />
                      <div className="flex items-baseline justify-between pt-1">
                        <span className="font-display text-xl text-ivory">Total</span>
                        <span className="font-display text-4xl font-light text-ivory">${totals.total.toFixed(2)}</span>
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
                  <Button variant="ghost" onClick={() => setStep('payment')} disabled={isPlacing || paypalRedirecting}>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Back to Payment
                  </Button>
                  <Button
                    variant="primary"
                    size="lg"
                    isLoading={isPlacing}
                    disabled={
                      isPlacing ||
                      paypalRedirecting ||
                      !paymentMethod ||
                      !selectedMethod?.enabled ||
                      ((paymentMethod === 'STRIPE' || paymentMethod === 'card') && (!stripe || !elements))
                    }
                    onClick={handlePlaceOrder}
                  >
                    {paypalRedirecting
                      ? 'Redirecting to PayPal...'
                      : selectedIsManual
                        ? 'Place Order'
                        : paymentMethod === 'PAYPAL'
                          ? `Continue to PayPal`
                          : `Pay $${totals.total.toFixed(2)}`}
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