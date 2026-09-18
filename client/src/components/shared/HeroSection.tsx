'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { motion, useMotionValue, useSpring, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Magnetic } from '@/components/animations/Magnetic';

interface HeroSectionProps {
  title: string;
  subtitle?: string;
  description?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  imageSrc: string;
  imageAlt: string;
  showcaseImages?: string[];
  className?: string;
  overlay?: boolean;
  height?: 'full' | 'large' | 'medium';
}

const marqueeWords = [
  'Handcrafted',
  'Timeless',
  'Premium Leather',
  'Est. 1991',
  'Milano',
  'Artisan Craft',
  'Sustainable',
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.3 } },
};

const childVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

const maskVariants = {
  hidden: { y: '112%' },
  visible: { y: '0%', transition: { duration: 0.9, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
};

export function HeroSection({
  title,
  subtitle,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt,
  showcaseImages = [],
  className,
  overlay = true,
  height = 'large',
}: HeroSectionProps) {
  const mainRef = useRef<HTMLDivElement>(null);

  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 140, damping: 18 });
  const sry = useSpring(ry, { stiffness: 140, damping: 18 });

  const { scrollYProgress } = useScroll({ target: mainRef, offset: ['start start', 'end start'] });
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '22%']);
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%']);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 14);
    rx.set(-py * 14);
  };

  const handleMouseLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  const mainImage = imageSrc;
  const accentOne = showcaseImages[0] || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&q=80';
  const accentTwo = showcaseImages[1] || 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80';

  const heightClasses = {
    full: 'min-h-screen',
    large: 'min-h-[calc(100vh-24px)] md:min-h-[calc(100vh-36px)]',
    medium: 'min-h-[600px]',
  };

  const titleLines = title.split('. ');

  return (
    <section
      ref={mainRef}
      className={cn(
        'bg-gradient-night relative -mt-[36px] flex flex-col overflow-hidden grain',
        heightClasses[height],
        className
      )}
    >
      {/* Dark backdrop image + overlay for guaranteed text contrast */}
      {overlay && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <Image src={imageSrc} alt="" fill className="object-cover opacity-40" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-navy/45" />
          <div className="absolute inset-0 bg-gradient-to-t from-navy/85 via-transparent to-navy/55" />
        </div>
      )}

      {/* Parallax background glow */}
      <motion.div style={{ y: bgY }} className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-1/4 h-[480px] w-[480px] rounded-full bg-sage/10 blur-[140px] animate-pulse-gold" />
        <div className="absolute -right-32 bottom-0 h-[420px] w-[420px] rounded-full bg-sage/10 blur-[130px]" />
      </motion.div>

      {/* Outlined watermark */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1, duration: 1.4 }}
        className="display-outline-light pointer-events-none absolute right-6 top-24 hidden select-none font-display text-[16rem] leading-none xl:block"
        style={{ y: bgY }}
      >
        ZOYA GOODS
      </motion.span>

      {/* Vertical label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        className="writing-vertical absolute left-6 top-1/2 hidden -translate-y-1/2 items-center gap-4 text-[10px] uppercase tracking-[0.35em] text-sage-light lg:flex"
      >
        <span className="h-16 w-px bg-sage-light/40" />
        Est. 1991 — Milano
      </motion.div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-4 pb-24 pt-16 sm:px-8 lg:px-12">
        <motion.div
          style={{ y: contentY }}
          className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-8"
        >
          {/* ============ LEFT — Editorial copy ============ */}
          <motion.div variants={containerVariants} initial="hidden" animate="visible">
            {subtitle && (
              <motion.div variants={childVariants} className="flex items-center gap-4">
                <span className="inline-block h-px w-12 bg-sage" />
                <p className="text-[11px] font-medium uppercase tracking-[0.35em] text-sage-light">
                  {subtitle}
                </p>
              </motion.div>
            )}

            <h1 className="text-shadow-luxe mt-8 font-display text-[13vw] font-light leading-[0.98] text-ivory sm:text-7xl lg:text-[5.2rem] xl:text-[6.2rem]">
              {titleLines.map((line, i) => (
                <span key={i} className="block overflow-hidden">
                  <motion.span
                    variants={maskVariants}
                    custom={i}
                    className={cn('block will-change-transform', i === titleLines.length - 1 && 'display-italic text-gold')}
                  >
                    {line.trim()}
                    {i < titleLines.length - 1 ? '.' : ''}
                  </motion.span>
                </span>
              ))}
            </h1>

            {description && (
              <motion.p
                variants={childVariants}
                className="text-shadow-luxe mt-8 max-w-md text-base leading-relaxed text-ivory sm:text-lg"
              >
                {description}
              </motion.p>
            )}

            {(primaryCta || secondaryCta) && (
              <motion.div variants={childVariants} className="mt-10 flex flex-wrap items-center gap-5">
                {primaryCta && (
                  <Magnetic>
                    <Button href={primaryCta.href} variant="light" size="lg">
                      {primaryCta.label}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Button>
                  </Magnetic>
                )}
                {secondaryCta && (
                  <Magnetic>
                    <Button
                      href={secondaryCta.href}
                      variant="outline"
                      size="lg"
                      className="border-cream/30 text-ivory hover:border-sage-light hover:bg-sage/10 hover:text-sage-light"
                    >
                      {secondaryCta.label}
                    </Button>
                  </Magnetic>
                )}
              </motion.div>
            )}

            {/* Stats */}
            <motion.div variants={childVariants} className="mt-14 flex items-center gap-10">
              {[
                { value: '30+', label: 'Years of Craft' },
                { value: '120k', label: 'Global Clients' },
                { value: '4.9', label: 'Average Rating' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-3xl font-light text-ivory">{stat.value}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-sage-light">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* ============ RIGHT — 3D Product Showcase ============ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ perspective: 1400 }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <div className="relative mx-auto aspect-[3/4] max-w-sm">
              {/* Rotating gold ring */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 1 }}
                className="animate-spin-slow absolute -inset-10 -z-10 sm:-inset-14"
              >
                <svg viewBox="0 0 400 400" className="h-full w-full text-sage-light/30">
                  <defs>
                    <path id="heroCircle" d="M200,200 m-160,0 a160,160 0 1,1 320,0 a160,160 0 1,1 -320,0" />
                  </defs>
                  <circle cx="200" cy="200" r="198" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 6" opacity="0.5" />
                  <text className="fill-sage-light/70" fontSize="13" letterSpacing="5">
                    <textPath href="#heroCircle">
                      HANDCRAFTED IN MILANO • ZOYA GOODS LUXURY FASHION •
                    </textPath>
                  </text>
                </svg>
              </motion.div>

              {/* Main tilt card */}
              <motion.div
                style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
                className="absolute inset-0"
              >
                <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] border border-cream/15 shadow-2xl shadow-black/50">
                  <Image
                    src={mainImage}
                    alt={imageAlt}
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 40vw"
                    className="object-cover"
                    style={{ transform: 'translateZ(20px)' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy/60 via-transparent to-transparent" />
                  <div className="absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/10" />

                  {/* Floating price chip */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                    className="glass absolute bottom-6 left-6 flex items-center gap-3 rounded-full py-2 pl-2 pr-5"
                    style={{ transform: 'translateZ(50px)' }}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-dark text-white">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-xs font-medium text-navy">Signature Collection</p>
                      <p className="text-[10px] text-navy">Crafted to endure</p>
                    </div>
                  </motion.div>

                  {/* Floating rating chip */}
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.45, duration: 0.6 }}
                    className="absolute right-6 top-6 flex items-center gap-2 rounded-full bg-navy/60 px-4 py-2 backdrop-blur-md border border-sage-light/20"
                    style={{ transform: 'translateZ(60px)' }}
                  >
                    <svg className="h-3.5 w-3.5 text-gold" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                    <span className="text-xs font-medium text-ivory">4.9 / 5.0</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Floating accent image — top left */}
              <motion.div
                initial={{ opacity: 0, x: -40, rotate: -8 }}
                animate={{ opacity: 1, x: 0, rotate: -6 }}
                transition={{ delay: 1.1, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                className="animate-float absolute -left-14 top-2 hidden w-36 overflow-hidden rounded-2xl border border-cream/20 shadow-xl shadow-black/40 sm:block lg:-left-24 lg:w-44"
                style={{ transform: 'translateZ(80px)' }}
              >
                <div className="relative aspect-[3/4]">
                  <Image src={accentOne} alt="ZOYA GOODS look" fill sizes="176px" className="object-cover" />
                </div>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
              </motion.div>

              {/* Floating accent image — bottom right */}
              <motion.div
                initial={{ opacity: 0, x: 40, rotate: 8 }}
                animate={{ opacity: 1, x: 0, rotate: 6 }}
                transition={{ delay: 1.25, duration: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
                className="animate-float absolute -bottom-6 -right-10 hidden w-32 overflow-hidden rounded-2xl border border-cream/20 shadow-xl shadow-black/40 sm:block lg:-right-20 lg:w-40"
                style={{ transform: 'translateZ(70px)', animationDelay: '1.2s' }}
              >
                <div className="relative aspect-[3/4]">
                  <Image src={accentTwo} alt="ZOYA GOODS detail" fill sizes="160px" className="object-cover" />
                </div>
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl" />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ============ Bottom marquee ============ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="relative z-10 border-t border-cream/10"
      >
        <div className="marquee-track items-center py-5">
          {[...marqueeWords, ...marqueeWords].map((word, i) => (
            <span key={i} className="flex items-center gap-8 px-8 whitespace-nowrap">
              <span className="text-xs uppercase tracking-[0.3em] text-sage-light">{word}</span>
              <span className="h-1 w-1 rounded-full bg-sage-light/50" />
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
