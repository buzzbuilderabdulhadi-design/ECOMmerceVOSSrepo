'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

// ============================================================
// Checkout Page — Multi-step checkout flow
// ============================================================

const steps = ['Shipping', 'Payment', 'Review'];

export default function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading] = useState(false);

  const total = 850.0;

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Shipping Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="First Name" placeholder="John" required />
              <Input label="Last Name" placeholder="Doe" required />
              <Input label="Email" type="email" placeholder="john@example.com" required className="sm:col-span-2" />
              <Input label="Phone" type="tel" placeholder="+1 (555) 000-0000" required className="sm:col-span-2" />
              <Input label="Address" placeholder="123 Main Street" required className="sm:col-span-2" />
              <Input label="Apartment (Optional)" placeholder="Apt 4B" />
              <Input label="City" placeholder="New York" required />
              <Input label="State" placeholder="NY" required />
              <Input label="ZIP Code" placeholder="10001" required />
              <Input label="Country" placeholder="United States" required className="sm:col-span-2" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="saveAddress" className="h-4 w-4 rounded border-gray-300" />
              <label htmlFor="saveAddress" className="text-sm text-gray-600">Save this address for future orders</label>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Payment Method</h2>
            <div className="space-y-3">
              {['Credit Card', 'PayPal', 'Bank Transfer'].map((method) => (
                <label key={method} className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-900">
                  <input type="radio" name="payment" defaultChecked={method === 'Credit Card'} className="h-4 w-4 text-gray-900" />
                  <span className="text-sm font-medium text-gray-900">{method}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="Card Number" placeholder="4242 4242 4242 4242" required className="sm:col-span-2" />
              <Input label="Expiry Date" placeholder="MM/YY" required />
              <Input label="CVC" placeholder="123" required />
              <Input label="Cardholder Name" placeholder="John Doe" required className="sm:col-span-2" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Review Your Order</h2>
            <div className="space-y-3 rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image src="https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&q=80" alt="Product" fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Classic Brown Leather Jacket</p>
                  <p className="text-xs text-gray-500">Qty: 1 / Size: M / Color: Brown</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">$395.00</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                  <Image src="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100&q=80" alt="Product" fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Black Suede Bomber Jacket</p>
                  <p className="text-xs text-gray-500">Qty: 1 / Size: L / Color: Black</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">$455.00</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              By placing this order, you agree to our{' '}
              <Link href="/terms" className="underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Cart', href: '/cart' }, { label: 'Checkout' }]} />
          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2">
              {/* Progress Steps */}
              <div className="mb-8 flex items-center gap-2">
                {steps.map((step, index) => (
                  <React.Fragment key={step}>
                    <div className={`flex items-center gap-2 ${index <= currentStep ? 'text-gray-900' : 'text-gray-400'}`}>
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                        index <= currentStep ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="hidden text-sm font-medium sm:inline">{step}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`h-px flex-1 ${index < currentStep ? 'bg-gray-900' : 'bg-gray-200'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="rounded-xl border border-gray-200 p-6">
                {renderStep()}
              </div>
              <div className="mt-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep((s) => Math.max(0, s - 1))} disabled={currentStep === 0}>
                  Back
                </Button>
                <Button variant="dark" onClick={() => { if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1); }} isLoading={isLoading}>
                  {currentStep === steps.length - 1 ? 'Place Order' : 'Continue'}
                </Button>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium text-gray-900">$850.00</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="font-medium text-green-600">FREE</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tax</span><span className="font-medium text-gray-900">$68.00</span></div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between"><span className="text-base font-semibold">Total</span><span className="text-xl font-bold">${total.toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span className="text-xs text-green-800">Secure checkout with SSL encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </PageTransition>
  );
}
