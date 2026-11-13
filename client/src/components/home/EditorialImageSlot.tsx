'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface EditorialImageSlotProps {
  /** Drop an asset path (e.g. '/images/editorial/look-01.jpg') into the slot when ready. */
  src?: string;
  alt: string;
  /** Small editorial caption. Rendered under a real image, and used as the
   *  placeholder's typographic anchor when the slot is still empty. */
  label?: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  /** Adds a readability gradient over real images. */
  overlay?: boolean;
  /** Surface the slot sits on, so the empty state stays in the palette. */
  tone?: 'dark' | 'light';
}

/**
 * Editorial image frame used by the homepage story sections.
 *
 * Renders the asset when a `src` is provided. When it is not, it renders a
 * deliberate "awaiting photography" panel — warm gradient lighting, film grain
 * and a framed typographic mark — so the layout holds its shape and still looks
 * composed rather than broken.
 */
export function EditorialImageSlot({
  src,
  alt,
  label,
  className,
  imageClassName,
  sizes = '(max-width: 1024px) 100vw, 50vw',
  priority = false,
  overlay = true,
  tone = 'dark',
}: EditorialImageSlotProps) {
  if (src) {
    return (
      <div className={cn('zoom-parent group relative overflow-hidden bg-ink-700', className)}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn('img-cover zoom-child', imageClassName)}
        />
        {overlay && (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx/70 via-transparent to-onyx/10" />
        )}
        {label && (
          <span className="pointer-events-none absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.3em] text-bone/80">
            {label}
          </span>
        )}
      </div>
    );
  }

  const dark = tone === 'dark';

  return (
    <div
      role="img"
      aria-label={alt}
      className={cn(
        'grain relative flex flex-col items-center justify-center gap-4 overflow-hidden p-6 text-center',
        dark
          ? 'bg-gradient-to-br from-brown via-espresso to-onyx'
          : 'bg-gradient-to-br from-soft-white via-mist to-navy-soft/25',
        className
      )}
    >
      {/* Gradient lighting */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -left-1/4 -top-1/3 h-[70%] w-[90%] rounded-full blur-[90px]',
          dark ? 'bg-cinnamon/25' : 'bg-porcelain/70'
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute -bottom-1/4 -right-1/4 h-[60%] w-[80%] rounded-full blur-[80px]',
          dark ? 'bg-caramel/20' : 'bg-bone/60'
        )}
      />

      {/* Framed mark — reads as a composed art-direction board */}
      <span
        aria-hidden
        className={cn(
          'relative flex h-16 w-16 items-center justify-center border',
          dark ? 'border-bone/25' : 'border-onyx/20'
        )}
      >
        <span className={cn('h-px w-7', dark ? 'bg-bone/45' : 'bg-onyx/40')} />
        <span
          className={cn(
            'absolute h-7 w-px',
            dark ? 'bg-bone/45' : 'bg-onyx/40'
          )}
        />
      </span>

      <p
        className={cn(
          'relative text-[10px] uppercase leading-relaxed tracking-[0.32em]',
          dark ? 'text-bone/80' : 'text-onyx/85'
        )}
      >
        Photography pending
      </p>

      {label && (
        <p
          className={cn(
            'relative max-w-[22ch] font-display text-lg font-light leading-snug',
            dark ? 'text-bone/85' : 'text-onyx/80'
          )}
        >
          {label}
        </p>
      )}
    </div>
  );
}
