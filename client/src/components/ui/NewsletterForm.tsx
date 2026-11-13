'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface NewsletterFormProps {
  /**
   * Optional submit handler. When provided it must perform a real subscription
   * request; the form only reports success once that request resolves.
   */
  onSubmit?: (email: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  /** Shown instead of a success message when no `onSubmit` handler exists. */
  unavailableMessage?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'banner' | 'dark';
}

export function NewsletterForm({
  onSubmit,
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  successMessage = 'Thank you for subscribing!',
  unavailableMessage = 'Newsletter signup is coming soon.',
  className,
  variant = 'default',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'unavailable'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Please enter your email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email');
      return;
    }

    // No handler means nothing is stored anywhere, so this must not claim a
    // subscription happened. Say so plainly until the endpoint exists.
    if (!onSubmit) {
      setStatus('unavailable');
      return;
    }

    setStatus('loading');
    try {
      await onSubmit(email);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const isDark = variant === 'dark';

  if (status === 'success' || status === 'unavailable') {
    const isConfirmed = status === 'success';
    return (
      <div
        role="status"
        className={cn(
          'flex items-center gap-3 py-2',
          variant === 'banner' && 'justify-center',
          className
        )}
      >
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', isDark ? 'bg-bone text-onyx' : 'bg-cocoa text-bone')}>
          {isConfirmed ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </span>
        <span className={cn('text-sm font-medium', isDark ? 'text-bone' : 'text-onyx')}>
          {isConfirmed ? successMessage : unavailableMessage}
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className={variant === 'banner' ? 'flex flex-col gap-3 sm:flex-row' : 'flex gap-3'}>
        <div className="relative flex-1">
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setStatus((s) => (s === 'error' || s === 'unavailable' ? 'idle' : s));
            }}
            placeholder={placeholder}
            disabled={status === 'loading'}
            aria-invalid={status === 'error'}
            aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
            className={cn(
              'w-full py-3 text-sm transition-all duration-200',
              'focus:outline-none focus-visible:ring-2',
              status === 'error' && 'border-red-500',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isDark
                ? 'input-luxe-dark text-bone placeholder-bone/60 focus-visible:ring-beige/60'
                : 'input-luxe focus-visible:ring-navy-soft'
            )}
            aria-label="Email address"
          />
          {isDark && <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-bone/25" />}
        </div>
        <Button
          type="submit"
          variant={isDark ? 'light' : 'primary'}
          size="md"
          disabled={status === 'loading'}
          isLoading={status === 'loading'}
          className="shrink-0"
        >
          {buttonText}
        </Button>
      </div>
      {status === 'error' && (
        <p id="newsletter-error" className={cn('text-xs', isDark ? 'text-red-300' : 'text-red-700')} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
