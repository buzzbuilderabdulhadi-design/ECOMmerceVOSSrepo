'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface NewsletterFormProps {
  onSubmit?: (email: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'banner' | 'dark';
}

export function NewsletterForm({
  onSubmit,
  placeholder = 'Enter your email',
  buttonText = 'Subscribe',
  successMessage = 'Thank you for subscribing!',
  className,
  variant = 'default',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
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

    setStatus('loading');
    try {
      if (onSubmit) {
        await onSubmit(email);
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const isDark = variant === 'dark';

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 py-2',
          variant === 'banner' && 'justify-center',
          className
        )}
      >
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-full', isDark ? 'bg-gold text-navy' : 'bg-sage-dark text-white')}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className={cn('text-sm font-medium', isDark ? 'text-cream' : 'text-navy')}>{successMessage}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div className={variant === 'banner' ? 'flex flex-col gap-3 sm:flex-row' : 'flex gap-3'}>
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder={placeholder}
            disabled={status === 'loading'}
            className={cn(
              'w-full py-3 text-sm transition-all duration-200',
              'focus:outline-none',
              status === 'error' && 'border-red-400',
              'disabled:cursor-not-allowed disabled:opacity-60',
              isDark
                ? 'input-luxe border-cream/25 text-ivory placeholder-ivory/70 focus:border-gold'
                : 'input-luxe'
            )}
            aria-label="Email address"
          />
          {isDark && <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-cream/25" />}
        </div>
        <Button
          type="submit"
          variant={isDark ? 'light' : 'walnut'}
          size="md"
          disabled={status === 'loading'}
          isLoading={status === 'loading'}
          className="shrink-0"
        >
          {buttonText}
        </Button>
      </div>
      {status === 'error' && (
        <p className={cn('text-xs', isDark ? 'text-red-300' : 'text-red-500')} role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
