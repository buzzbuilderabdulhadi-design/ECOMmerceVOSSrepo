'use client';

import React from 'react';

interface ErrorPageProps {
  unstable_retry: () => void;
}

export default function ErrorPage({ unstable_retry }: ErrorPageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-3xl font-bold tracking-[0.15em] text-walnut sm:text-5xl sm:tracking-[0.22em] md:text-6xl md:tracking-[0.3em]">ZOYA GOODS</h1>
        <div className="mx-auto mt-4 h-[1px] max-w-[120px] bg-navy-soft" />
        <h2 className="mt-8 text-2xl font-semibold text-navy">Something went wrong</h2>
        <p className="mt-2 text-sm text-slate">
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={unstable_retry}
          className="mt-8 inline-flex items-center justify-center rounded-lg bg-sage-dark px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-walnut"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
