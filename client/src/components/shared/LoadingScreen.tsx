'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { ZoyaGoodsLogo } from '@/components/shared/ZoyaGoodsLogo';

const LOADING_PHRASES = [
  'Preparing Your Luxury Experience...',
  'Crafting Excellence...',
  'Curating the Finest...',
];

/**
 * Pure visual for the premium loading screen. Stateless apart from the
 * cycling loading copy — used both by the global initial loader and by the
 * root `loading.tsx` route fallback during page transitions.
 */
export function LoadingScreenVisual() {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setPhraseIndex((i) => (i + 1) % LOADING_PHRASES.length),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div
      role="status"
      aria-label="Loading ZOYA GOODS"
      className="bg-cinematic grain fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#05070A' }}
    >
      {/* Top & bottom cinnamon hairlines */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.65, delay: 0.05, ease: 'easeInOut' }}
        className="absolute left-8 right-8 top-10 h-px origin-left bg-cinnamon/60"
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.65, delay: 0.05, ease: 'easeInOut' }}
        className="absolute bottom-10 left-8 right-8 h-px origin-right bg-cinnamon/60"
      />

      <div className="flex flex-col items-center text-center">
        {/* ZOYA GOODS logo — subtle fade-in + scale. Decorative wordmark: the
            surrounding role="status" region carries the accessible name, so
            this must not be a heading (it would add a second <h1> mid-load). */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, delay: 0.05, ease: [0.25, 0.1, 0.25, 1] }}
          className="pointer-events-none"
        >
          <ZoyaGoodsLogo
            variant="white"
            aria-hidden
            alt=""
            className="h-auto w-[290px] sm:w-[330px] md:w-[360px]"
          />
        </motion.div>

        {/* Cinnamon rule with clay diamond */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.55, delay: 0.15, ease: 'easeInOut' }}
          className="mt-7 flex w-56 items-center justify-center"
        >
          <span aria-hidden className="h-px flex-1 bg-cinnamon/80" />
          <span
            aria-hidden
            className="mx-3 block h-1.5 w-1.5 rotate-45 bg-clay"
          />
          <span aria-hidden className="h-px flex-1 bg-cinnamon/80" />
        </motion.div>

        {/* Thin progress line that fills smoothly */}
        <div className="mt-7 h-[2px] w-56 overflow-hidden rounded-full bg-bone/10">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeInOut' }}
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-cinnamon via-clay to-porcelain"
          />
        </div>

        {/* Elegant loading copy — crossfades between phrases */}
        <div className="mt-6 flex h-5 items-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={phraseIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="text-[10px] uppercase tracking-[0.38em] text-bone/80"
            >
              {LOADING_PHRASES[phraseIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

interface LoadingScreenProps {
  /** Minimum time (ms) the loader stays visible before fading out. */
  minDuration?: number;
}

/**
 * Global initial-load loader. Rendered from the root layout so it is present
 * in the very first HTML (no flash of unstyled content), stays until the page
 * has hydrated and the minimum display time has elapsed, then fades out
 * smoothly. Does **not** wait for heavy images / full window load.
 */
export function LoadingScreen({ minDuration = 500 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // When the user prefers reduced motion, the loader should disappear
    // immediately so the page content is not blocked behind an animation.
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const delay = motionQuery.matches ? 0 : minDuration;

    const timer = setTimeout(() => setIsVisible(false), delay);
    return () => clearTimeout(timer);
  }, [minDuration]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="zoya-loading-screen"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.45, ease: 'easeInOut' },
            }}
            className="fixed inset-0 z-[9999]"
          >
            <LoadingScreenVisual />
          </motion.div>
        )}
      </AnimatePresence>
    </MotionConfig>
  );
}
