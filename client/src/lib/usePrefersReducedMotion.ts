'use client';

import { useSyncExternalStore } from 'react';

/**
 * Reduced-motion preference, safe to read during render.
 *
 * `useReducedMotion()` from framer-motion must not be used to decide what a
 * component renders. It returns `null` while server-rendering (see
 * motion-dom's `prefersReducedMotion` initial value) and `false`/`true` in the
 * browser, so a server render and a client's first render disagree whenever
 * the visitor has reduced motion switched on — which React reports as a
 * hydration mismatch.
 *
 * `useSyncExternalStore` fixes this properly. React calls the third argument
 * (`getServerSnapshot`) both for the server render and for the hydration
 * render, so those two always agree. Only after hydration does React begin
 * reading the live media query, so the preference can change behaviour but
 * never the initial markup.
 *
 * Use the value to stop animations and autoplay — never to branch markup.
 */
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Deterministic for the server render and the hydration render alike. */
function getServerSnapshot() {
  return false;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}