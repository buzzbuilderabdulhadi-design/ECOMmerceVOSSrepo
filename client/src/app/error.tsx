'use client';

import React from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <div className="max-w-md">
        <h1 className="whitespace-nowrap text-3xl font-bold tracking-[0.22em] text-walnut sm:text-5xl md:text-6xl md:tracking-[0.3em]">ZOYA GOODS</h1>
        <div className="mx-auto mt-4 h-[1px] max-w-[120px] bg-navy-soft" />
        <h2 className="mt-8 text-2xl font-semibold text-navy">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-sage-dark px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-walnut"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
