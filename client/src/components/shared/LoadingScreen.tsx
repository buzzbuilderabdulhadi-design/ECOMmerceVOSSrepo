'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';

const LOADING_PHRASES = [
  'Preparing Your Luxury Experience...',
  'Crafting Excellence...',
  'Curating the Finest...',
];

const EASE: [number, number, number, number] = [0.25, 0.1, 0.25, 1];

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
      aria-label="Loading VOSS"
      className="bg-gradient-night grain fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#16324F' }}
    >
      {/* Top & bottom gold hairlines */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: 'easeInOut' }}
        className="absolute left-8 right-8 top-10 h-px origin-left bg-gold/50"
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, delay: 0.2, ease: 'easeInOut' }}
        className="absolute bottom-10 left-8 right-8 h-px origin-right bg-gold/50"
      />

      <div className="flex flex-col items-center text-center">
        {/* VOSS logo — subtle fade-in + scale */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, delay: 0.15, ease: EASE }}
          className="font-display text-6xl font-light tracking-[0.3em] text-ivory md:text-7xl"
          style={{ textShadow: '0 2px 32px rgba(22, 50, 79, 0.6)' }}
        >
          VOSS
        </motion.h1>

        {/* Gold rule with walnut diamond */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, delay: 0.5, ease: 'easeInOut' }}
          className="mt-7 flex w-56 items-center justify-center"
        >
          <span aria-hidden className="h-px flex-1 bg-gold/70" />
          <span
            aria-hidden
            className="mx-3 block h-1.5 w-1.5 rotate-45 bg-walnut"
          />
          <span aria-hidden className="h-px flex-1 bg-gold/70" />
        </motion.div>

        {/* Thin gold progress line that fills smoothly */}
        <div className="mt-7 h-[2px] w-56 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, delay: 0.4, ease: 'easeInOut' }}
            className="h-full w-full origin-left rounded-full bg-gradient-to-r from-walnut via-gold to-gold"
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
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="text-[10px] uppercase tracking-[0.38em] text-cream/80"
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
 * in the very first HTML (no flash of unstyled content), stays until the
 * window has fully loaded (and a minimum display time has passed), then fades
 * out smoothly.
 */
export function LoadingScreen({ minDuration = 1900 }: LoadingScreenProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const startedAt = Date.now();
    let dismissTimer: ReturnType<typeof setTimeout> | null = null;

    const dismiss = () => {
      const elapsed = Date.now() - startedAt;
      dismissTimer = setTimeout(
        () => setIsVisible(false),
        Math.max(0, minDuration - elapsed),
      );
    };

    if (document.readyState === 'complete') {
      dismiss();
    } else {
      window.addEventListener('load', dismiss, { once: true });
    }

    // Safety cap so a hung resource can never trap the user behind the loader.
    const safety = setTimeout(dismiss, 8000);

    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      clearTimeout(safety);
      window.removeEventListener('load', dismiss);
    };
  }, [minDuration]);

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="voss-loading-screen"
            initial={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.7, ease: 'easeInOut' },
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
