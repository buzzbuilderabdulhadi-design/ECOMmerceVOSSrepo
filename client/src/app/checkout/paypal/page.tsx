'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Button } from '@/components/ui/Button';
import { capturePayPalOrder } from '@/services/checkout';
import { getErrorMessage } from '@/services/axios';

type CaptureState =
  | { phase: 'capturing' }
  | { phase: 'success' }
  | { phase: 'error'; message: string };

export default function PayPalCapturePage() {
  return (
    <React.Suspense fallback={<ProcessingState />}>
      <CaptureContent />
    </React.Suspense>
  );
}

function ProcessingState() {
  return <div className="flex min-h-screen items-center justify-center text-sm text-slate">Processing your PayPal payment…</div>;
}

function CaptureContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';
  const token = searchParams.get('token') || '';

  const [state, setState] = useState<CaptureState>(() =>
    orderId && token ? { phase: 'capturing' } : { phase: 'error', message: 'We could not find your payment approval.' }
  );

  const runCapture = useCallback(async () => {
    if (!orderId || !token) {
      setState({ phase: 'error', message: 'We could not find your payment approval.' });
      return;
    }
    setState({ phase: 'capturing' });
    try {
      await capturePayPalOrder({ orderId, paypalOrderId: token });
      setState({ phase: 'success' });
    } catch (error) {
      setState({ phase: 'error', message: getErrorMessage(error) });
    }
  }, [orderId, token]);

  useEffect(() => {
    if (orderId && token) {
      void Promise.resolve().then(runCapture);
    }
  }, [orderId, token, runCapture]);

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-24 sm:px-8">
          <div className="hairline rounded-2xl bg-white/70 p-6 text-center backdrop-blur-sm sm:p-10">
            {state.phase === 'capturing' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-walnut/10">
                  <svg className="h-8 w-8 text-walnut" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Confirming Payment</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  We&rsquo;re verifying your payment with PayPal. This usually takes just a moment.
                </p>
              </>
            )}

            {state.phase === 'success' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light/40">
                  <svg className="h-8 w-8 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Payment Successful</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">
                  Your payment has been confirmed. Thank you for your order — you can track it from your orders page.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <Button onClick={() => router.push('/dashboard/orders')} variant="primary">View My Orders</Button>
                  <Button href="/shop" variant="ghost">Continue Shopping</Button>
                </div>
              </>
            )}

            {state.phase === 'error' && (
              <>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="font-display text-3xl font-light text-navy">Payment Not Completed</h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate">{state.message}</p>
                <p className="mx-auto mt-2 max-w-md text-xs text-slate">
                  Your order was not charged. You can try again or pick another payment method.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  {orderId && (
                    <Button onClick={runCapture} variant="primary">Try Again</Button>
                  )}
                  <Button href="/dashboard/orders" variant="ghost">View My Orders</Button>
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}