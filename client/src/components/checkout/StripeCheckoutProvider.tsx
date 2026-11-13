'use client';

import { ReactNode, createContext, useContext } from 'react';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> | null {
  if (!PUBLISHABLE_KEY) return null;
  if (!stripePromise) {
    stripePromise = loadStripe(PUBLISHABLE_KEY);
  }
  return stripePromise;
}

/**
 * Represents the live Stripe objects, only ever populated inside the
 * <Elements> bridge below. Pages read this context instead of calling
 * useStripe()/useElements() directly so they work even when payments are not
 * configured (no publishable key) and during server-side prerendering.
 */
interface StripeContextValue {
  paymentConfigured: boolean;
  stripe: ReturnType<typeof useStripe>;
  elements: ReturnType<typeof useElements>;
}

const StripeContext = createContext<StripeContextValue>({
  paymentConfigured: false,
  stripe: null,
  elements: null,
});

export function useStripeElements() {
  return useContext(StripeContext);
}

function StripeBridge({ children }: { children: ReactNode }) {
  const stripe = useStripe();
  const elements = useElements();
  return (
    <StripeContext.Provider value={{ paymentConfigured: true, stripe, elements }}>
      {children}
    </StripeContext.Provider>
  );
}

/**
 * Wraps the checkout flow in Stripe Elements so the card form stays mounted
 * across all checkout steps. The publishable key is public by design and can
 * safely be a NEXT_PUBLIC_ variable — never the secret key.
 *
 * When the publishable key is not configured, children are rendered without an
 * Elements provider and payment features must render disabled states.
 */
export function StripeCheckoutProvider({ children }: { children: ReactNode }) {
  const stripe = getStripe();

  if (!stripe) {
    return (
      <StripeContext.Provider value={{ paymentConfigured: false, stripe: null, elements: null }}>
        {children}
      </StripeContext.Provider>
    );
  }

  return (
    <Elements
      stripe={stripe}
      options={{
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0F1B33',
            colorText: '#0B111C',
            borderRadius: '10px',
            fontFamily: 'inherit',
          },
        },
        locale: 'en',
      }}
    >
      <StripeBridge>{children}</StripeBridge>
    </Elements>
  );
}

export function isStripeConfigured(): boolean {
  return Boolean(PUBLISHABLE_KEY);
}