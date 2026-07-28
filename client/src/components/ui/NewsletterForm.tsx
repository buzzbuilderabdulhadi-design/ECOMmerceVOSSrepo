'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface NewsletterFormProps {
  onSubmit?: (email: string) => Promise<void>;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'banner';
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

  if (status === 'success') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-green-600',
          variant === 'banner' && 'justify-center py-4',
          className
        )}
      >
        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span className="text-sm font-medium">{successMessage}</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <div
        className={cn(
          variant === 'banner' ? 'flex flex-col sm:flex-row gap-2' : 'space-y-2'
        )}
      >
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
              'w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              status === 'error'
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400'
            )}
            aria-label="Email address"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200',
            'bg-gray-900 text-white hover:bg-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1',
            'disabled:cursor-not-allowed disabled:opacity-50'
          )}
        >
          {status === 'loading' ? (
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            buttonText
          )}
        </button>
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500" role="alert">
          {errorMessage}
        </p>
      )}
    </form>
  );
}
