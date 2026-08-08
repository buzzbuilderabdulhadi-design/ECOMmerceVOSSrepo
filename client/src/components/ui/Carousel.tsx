'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CarouselProps {
  items: React.ReactNode[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  infinite?: boolean;
  className?: string;
  itemClassName?: string;
}

export function Carousel({
  items,
  autoPlay = false,
  autoPlayInterval = 4000,
  showArrows = true,
  showDots = true,
  infinite = true,
  className,
  itemClassName,
}: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 300);
    },
    [isTransitioning]
  );

  const goNext = useCallback(() => {
    if (currentIndex === items.length - 1) {
      if (infinite) {
        goTo(0);
      }
    } else {
      goTo(currentIndex + 1);
    }
  }, [currentIndex, items.length, infinite, goTo]);

  const goPrev = useCallback(() => {
    if (currentIndex === 0) {
      if (infinite) {
        goTo(items.length - 1);
      }
    } else {
      goTo(currentIndex - 1);
    }
  }, [currentIndex, items.length, infinite, goTo]);

  useEffect(() => {
    if (autoPlay) {
      intervalRef.current = setInterval(goNext, autoPlayInterval);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoPlay, autoPlayInterval, goNext]);

  if (items.length === 0) return null;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="flex transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            className={cn('min-w-full flex-shrink-0', itemClassName)}
          >
            {item}
          </div>
        ))}
      </div>

      {showArrows && items.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            disabled={!infinite && currentIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Previous slide"
          >
            <svg className="h-5 w-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={!infinite && currentIndex === items.length - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Next slide"
          >
            <svg className="h-5 w-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {showDots && items.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => goTo(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                index === currentIndex
                  ? 'w-6 bg-navy'
                  : 'w-2 bg-sage-light/60 hover:bg-slate/40'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
