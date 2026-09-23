'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const imageRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // When a new product's image set arrives, reset any broken-image flags from
  // the previous product.
  useEffect(() => {
    setFailed({});
    setSelectedIndex(0);
    setIsZoomed(false);
    setIsFullscreen(false);
  }, [images]);

  const markFailed = useCallback((index: number) => {
    setFailed((prev) => (prev[index] ? prev : { ...prev, [index]: true }));
  }, []);

  const renderPlaceholder = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-cream to-sage-light/30">
      <div className="flex flex-col items-center gap-3 text-slate/60">
        <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs uppercase tracking-[0.2em]">Image unavailable</span>
      </div>
    </div>
  );

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isZoomed) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  }, [isZoomed]);

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handlePrev();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsFullscreen(true);
    } else if (e.key === 'Escape') {
      setIsZoomed(false);
      setIsFullscreen(false);
    }
  }, [handlePrev, handleNext]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen, handlePrev, handleNext]);

  if (!images || images.length === 0) {
    return (
      <div className={cn('flex aspect-square items-center justify-center rounded-xl bg-sage-light/40', className)}>
        <svg className="h-16 w-16 text-slate/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];
  const selectedFailed = !!failed[selectedIndex];

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Image */}
      <div
        ref={imageRef}
        role="button"
        tabIndex={0}
        aria-label={`${alt} image ${selectedIndex + 1} of ${images.length}. Press Enter to open fullscreen.`}
        className={cn(
          'relative aspect-square overflow-hidden rounded-2xl bg-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
          selectedFailed && 'cursor-default',
          isZoomed && 'cursor-zoom-out',
          !isZoomed && !selectedFailed && 'cursor-zoom-in'
        )}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => !selectedFailed && setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
        onClick={() => !selectedFailed && setIsFullscreen(true)}
      >
        {selectedFailed ? renderPlaceholder() : (
          <Image
            src={selectedImage}
            alt={`${alt} - Image ${selectedIndex + 1}`}
            fill
            onError={() => markFailed(selectedIndex)}
            className={cn(
              'object-cover transition-transform duration-200',
              isZoomed && 'scale-150'
            )}
            style={isZoomed ? { transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%` } : undefined}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={selectedIndex === 0}
          />
        )}
        {/* Navigation arrows on image */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handlePrev(); }}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-all hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Previous image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleNext(); }}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 shadow-md backdrop-blur-sm transition-all hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              aria-label="Next image"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        {/* Image counter */}
        <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {selectedIndex + 1}/{images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div
          role="group"
          aria-label="Product image thumbnails"
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1"
        >
          {images.map((image, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSelectedIndex(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selectedIndex}
              className={cn(
                'relative h-20 w-20 flex-shrink-0 snap-start overflow-hidden rounded-lg border-2 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                index === selectedIndex
                  ? 'border-gold ring-1 ring-gold'
                  : 'border-sage-light/30 hover:border-navy/50'
              )}
            >
              {failed[index] ? (
                <span className="absolute inset-0 flex items-center justify-center bg-sage-light/20 text-slate/50">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              ) : (
                <Image
                  src={image}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  onError={() => markFailed(index)}
                  className="object-cover"
                  sizes="80px"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${alt} image viewer`}
          onClick={() => setIsFullscreen(false)}
          onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;
            const delta = e.changedTouches[0].clientX - touchStartX.current;
            if (Math.abs(delta) > 50) {
              if (delta < 0) handleNext();
              else handlePrev();
            }
            touchStartX.current = null;
          }}
        >
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            aria-label="Close fullscreen"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative h-[90vh] w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {selectedFailed ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-white/60">
                  <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs uppercase tracking-[0.2em]">Image unavailable</span>
                </div>
              </div>
            ) : (
              <Image
                src={selectedImage}
                alt={`${alt} fullscreen`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Previous image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-label="Next image"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-sm font-medium text-white">
                {selectedIndex + 1}/{images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
