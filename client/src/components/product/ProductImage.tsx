'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type ImageLike = string | { url?: string | null } | null | undefined;

export interface ProductImageProps {
  /** Raw image list from product data. Order is meaningful: first entry is the image. */
  images?: ImageLike[] | null;
  /** Optional explicit image. Falls back to the first usable entry of `images`. */
  image?: string | null;
  alt: string;
  /** Box sizing for the frame, e.g. `aspect-[3/4]` or `h-32 w-28`. */
  className?: string;
  sizes?: string;
  /** Eager-load the image (above-the-fold LCP cards only). */
  priority?: boolean;
  tone?: 'light' | 'dark';
  emptyLabel?: string;
}

function toUrl(value: ImageLike): string | null {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') {
    const url = value.url;
    return typeof url === 'string' && url.trim() ? url.trim() : null;
  }
  return null;
}

/**
 * Static product image — one frame, no hover behaviour of any kind.
 *
 * There is deliberately no second frame, no cross-fade, no scale/zoom and no
 * opacity or transform transition: the rendered image is identical before,
 * during and after hover. Nothing here reacts to pointer input.
 */
export function ProductImage({
  images,
  image,
  alt,
  className,
  sizes = '(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw',
  priority = false,
  tone = 'light',
  emptyLabel = 'No image',
}: ProductImageProps) {
  const list = (images ?? []).map(toUrl).filter((u): u is string => Boolean(u));
  const src = toUrl(image) ?? list[0] ?? null;

  const dark = tone === 'dark';

  return (
    <div className={cn('relative overflow-hidden', className, !src && 'bg-bone')}>
      {src ? (
        <Image src={src} alt={alt} fill priority={priority} sizes={sizes} className="object-cover" />
      ) : (
        <div
          role="img"
          aria-label={alt}
          className={cn(
            'absolute inset-0 flex items-center justify-center',
            dark ? 'bg-gradient-to-br from-brown to-espresso' : 'bg-gradient-to-br from-bone to-beige'
          )}
        >
          <div className={cn('flex flex-col items-center gap-2', dark ? 'text-bone/70' : 'text-cocoa/80')}>
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a4.5 4.5 0 012.828 0L16 16m-2-2l1.586-1.586a4.5 4.5 0 012.828 0L20 14m-6-6h.01M6 20h12a4.5 4.5 0 004.5-4.5V6a4.5 4.5 0 00-4.5-4.5H6A4.5 4.5 0 001.5 6v12A4.5 4.5 0 006 20z"
              />
            </svg>
            <span className="text-[10px] uppercase tracking-[0.2em]">{emptyLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}