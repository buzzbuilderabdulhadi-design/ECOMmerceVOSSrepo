'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { EditorialImageSlot } from '@/components/home/EditorialImageSlot';

interface LookbookEditorialProps {
  className?: string;
  /**
   * Optional background video. Omitted by default, so the still image slot is
   * rendered on the server and on the client alike. Passing a path makes the
   * <video> part of the render on both sides.
   */
  videoSrc?: string;
}

/**
 * Editorial lookbook: a large cinematic media moment.
 *
 * Plays the video when a path is supplied. Reduced-motion visitors get the
 * poster frame: the <video> is paused from an effect rather than being left
 * out of the render, so the server and client markup always agree.
 */
export function LookbookEditorial({ className, videoSrc }: LookbookEditorialProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const reducedMotion = usePrefersReducedMotion();
  const showVideo = Boolean(videoSrc) && !videoFailed;

  useEffect(() => {
    if (!showVideo) return;
    const video = videoRef.current;
    if (!video) return;

    if (reducedMotion) {
      video.pause();
      return;
    }

    void video.play().catch(() => undefined);

    const safety = window.setTimeout(() => {
      if (video.readyState === 0) setVideoFailed(true);
    }, 7000);

    return () => window.clearTimeout(safety);
  }, [showVideo, reducedMotion]);

  return (
    <section
      id="lookbook"
      className={cn('bg-cinematic scroll-mt-32 overflow-hidden py-20 text-porcelain md:py-28 lg:py-36', className)}
    >
      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
          {/* ---------- Media ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 34 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative order-1 lg:order-2 lg:col-span-7"
          >
            <div className="zoom-parent relative aspect-[4/5] w-full overflow-hidden sm:aspect-[16/11] lg:aspect-[4/5]">
              {/* Fallback art direction — always underneath the video so a
                  missing file never leaves an empty frame. */}
              <div className="absolute inset-0">
                <EditorialImageSlot
                  alt="Lookbook editorial"
                  label="Editorial — Lookbook"
                  tone="dark"
                  className="h-full w-full"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
              </div>

              {showVideo && (
                <video
                  ref={videoRef}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out',
                    videoReady ? 'opacity-100' : 'opacity-0'
                  )}
                  src={videoSrc}
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
                  aria-hidden="true"
                />
              )}

              {/* Dark overlay keeps the caption legible over any footage */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-onyx/75 via-onyx/10 to-onyx/25"
              />

              <span className="pointer-events-none absolute bottom-5 left-5 text-[10px] uppercase tracking-[0.3em] text-bone/80">
                Lookbook — Volume I
              </span>
            </div>
          </motion.div>

          {/* ---------- Copy ---------- */}
          <div className="order-2 lg:order-1 lg:col-span-5">
            <ScrollReveal>
              <p className="eyebrow flex items-center gap-3 text-beige">
                <span className="inline-block h-px w-10 bg-beige/60" />
                The Lookbook
              </p>
              <TextReveal
                as="h2"
                text="Dressed for the hours in between."
                className="display-1 mt-5 font-display font-light text-porcelain"
              />
              <p className="mt-6 max-w-md text-sm leading-relaxed text-bone/70 sm:text-base">
                Quiet leather, sharp shoulders, and the weight of good fabric. Pieces that move
                from late afternoon to wherever the evening takes you.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-3">
                <Link
                  href="/shop?sort=newest"
                  className="group inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-porcelain transition-colors hover:text-beige"
                >
                  <span className="link-underline link-underline-cream">Shop New Arrivals</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-1">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </Link>
                <Link
                  href="/about"
                  className="link-underline link-underline-cream inline-flex items-center text-[11px] font-medium uppercase tracking-[0.22em] text-bone/70 transition-colors hover:text-porcelain"
                >
                  Read the story
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.15} className="mt-12 grid grid-cols-2 gap-4 sm:gap-6">
              <EditorialImageSlot alt="Look 01" label="Look 01" tone="dark" className="aspect-[3/4] w-full" />
              <EditorialImageSlot
                alt="Look 02"
                label="Look 02"
                tone="dark"
                className="mt-8 aspect-[3/4] w-full"
              />
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
