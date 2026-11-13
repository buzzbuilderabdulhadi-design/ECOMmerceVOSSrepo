'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { Button } from '@/components/ui/Button';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageSrc: string;
  imageAlt: string;
  /**
   * Optional background video. Omitted by default, so the section renders the
   * poster image on the server and on the client alike. Passing a path makes
   * the <video> element part of the render on *both* sides — the decision is
   * driven by this prop alone, never by a browser-only check.
   */
  videoSrc?: string;
  marqueeWords?: string[];
  className?: string;
  height?: 'full' | 'large' | 'medium';
}

const defaultMarqueeWords = [
  'Handcrafted',
  'Timeless',
  'Premium Leather',
  'Est. 1991',
  'Worldwide',
  'Artisan Craft',
  'Sustainable',
];

const childVariants = {
  hidden: { opacity: 0, y: 26 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.75, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const maskVariants = {
  hidden: { y: '108%' },
  visible: {
    y: '0%',
    transition: { duration: 0.95, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

export function HeroSection({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
  videoSrc,
  marqueeWords = defaultMarqueeWords,
  className,
  height = 'large',
}: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  /*
   * SSR / client parity.
   *
   * Every value that shapes the first render must be identical on the server
   * and on the client's initial render. This used to read framer-motion's
   * `useReducedMotion()`, which returns `null` while server-rendering and
   * `false`/`true` in the browser — so the server emitted a <video> and
   * `scale(1.05)` that the first client render refused to reproduce.
   *
   * `usePrefersReducedMotion` reads `false` for both the server render and the
   * hydration render, so the preference only ever changes behaviour (no
   * autoplay, no drift) and never the markup.
   */
  const reducedMotion = usePrefersReducedMotion();
  const showVideo = Boolean(videoSrc) && !videoFailed;

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      // Pause and stay on the poster frame. The <video> element is already in
      // the hydrated DOM, so nothing about the markup has to change.
      video.pause();
      return;
    }

    // Autoplay can still be refused (low power mode, data saver). The poster
    // underneath stays visible, so a rejected play() is a graceful no-op.
    void video.play().catch(() => undefined);

    const safety = window.setTimeout(() => {
      if (video.readyState === 0) setVideoFailed(true);
    }, 7000);

    return () => window.clearTimeout(safety);
  }, [showVideo, reducedMotion]);

  const titleLines = title.split('. ');

  return (
    <section
      className={cn(
        'relative flex min-h-[86svh] flex-col justify-end overflow-hidden bg-onyx pb-28 under-nav grain sm:min-h-[92svh] lg:pb-32',
        height === 'full' && 'lg:min-h-[100svh]',
        height === 'medium' && 'sm:min-h-[640px]',
        className
      )}
    >
      {/* ============ Background media ============ */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Poster / cinematic fallback — always rendered so a missing or
            blocked video never leaves a broken frame on screen.

            `initial` is a constant so the server writes transform:scale(1.05)
            into the HTML and the first client render produces the same string.
            It previously read `prefersReducedMotion`, which made the server
            emit scale(1.05) while the browser's first render emitted none.

            Reduced motion cancels the *drift* (duration 0) but never changes
            the markup, so the initial render stays deterministic. */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 8, ease: 'linear' }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-90"
          />
        </motion.div>

        {showVideo && (
          <motion.video
            ref={videoRef}
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out',
              videoReady ? 'opacity-100' : 'opacity-0'
            )}
            src={videoSrc}
            poster={imageSrc}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            tabIndex={-1}
            onCanPlay={() => setVideoReady(true)}
            onLoadedData={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        )}

        {/* Readability overlays — dark enough for AA text contrast, light
            enough that the photography still reads as a photograph. */}
        <div className="absolute inset-0 bg-gradient-to-b from-onyx/78 via-onyx/30 to-onyx/96" />
        <div className="absolute inset-0 bg-gradient-to-r from-onyx/85 via-onyx/35 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-onyx via-onyx/70 to-transparent" />
      </div>

      {/* Vertical label */}
      <div className="pointer-events-none absolute left-5 top-1/2 hidden -translate-y-1/2 items-center gap-4 text-[10px] uppercase tracking-[0.35em] text-bone/55 xl:flex">
        <span className="h-16 w-px bg-bone/25" />
        Est. 1991
      </div>

      {/* ============ Editorial copy ============ */}
      <div className="relative z-10 w-full">
        <div className="mx-auto w-full max-w-[1400px] px-5 sm:px-8 lg:px-12">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } } }}
            className="max-w-3xl"
          >
            {subtitle && (
              <motion.div variants={childVariants} className="flex items-center gap-4">
                <span className="inline-block h-px w-12 bg-mist/70" />
                <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-bone/75">{subtitle}</p>
              </motion.div>
            )}

            {/* Controlled display size — clamp() keeps this inside the layout
                at every viewport, and the mask wrapper carries descender
                padding so g / p / y / j / q are never sliced. */}
            <h1 className="display-hero text-shadow-cinematic mt-7 font-display font-light text-porcelain">
              {titleLines.map((line, i) => (
                <span key={i} className="reveal-box-block">
                  <motion.span variants={maskVariants} className="block will-change-transform">
                    {line.trim()}
                    {i < titleLines.length - 1 ? '.' : ''}
                  </motion.span>
                </span>
              ))}
            </h1>

            {description && (
              <motion.p
                variants={childVariants}
                className="mt-7 max-w-lg font-display text-lg font-light italic leading-relaxed text-bone/85 sm:text-xl lg:text-[1.6rem]"
              >
                {description}
              </motion.p>
            )}

            {(primaryCta || secondaryCta) && (
              <motion.div variants={childVariants} className="mt-9 flex flex-wrap items-center gap-3 sm:gap-4">
                {primaryCta && (
                  <Button
                    href={primaryCta.href}
                    variant="inverse"
                    size="lg"
                    rightIcon={
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    }
                  >
                    {primaryCta.label}
                  </Button>
                )}
                {secondaryCta && (
                  <Button href={secondaryCta.href} variant="onDark" size="lg">
                    {secondaryCta.label}
                  </Button>
                )}
              </motion.div>
            )}

            {/* Quiet single-line commitments instead of a boxed stat grid */}
            <motion.ul
              variants={childVariants}
              className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3 text-[11px] uppercase tracking-[0.2em] text-bone/60"
            >
              {['Since 1991', 'Worldwide Shipping', '30-Day Returns'].map((item, i) => (
                <li key={item} className="flex items-center gap-7">
                  {i > 0 && <span className="hidden h-3 w-px bg-bone/25 sm:block" aria-hidden="true" />}
                  {item}
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>

      {/* ============ Bottom marquee ============ */}
      <div className="absolute inset-x-0 bottom-0 z-10 border-t border-bone/10 bg-onyx/45 backdrop-blur-sm">
        <div className="marquee-track items-center py-3.5">
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={i} className="flex items-center gap-8 px-8 whitespace-nowrap">
              <span className="text-[11px] uppercase tracking-[0.3em] text-bone/60">{word}</span>
              <span className="h-1 w-1 rounded-full bg-mist/70" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
