'use client';

import { motion, type Variants } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';

// ============================================================
// ScrollReveal — Section reveal animation on scroll
// ============================================================

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: RevealDirection;
  duration?: number;
  delay?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'aside';
}

export function ScrollReveal({
  children,
  direction = 'up',
  duration = 0.6,
  delay = 0,
  distance = 40,
  once = true,
  className,
  as = 'div',
}: ScrollRevealProps) {
  const variants: Variants = useMemo(() => {
    const offset = { x: 0, y: 0 };
    switch (direction) {
      case 'up':    offset.y = distance; break;
      case 'down':  offset.y = -distance; break;
      case 'left':  offset.x = distance; break;
      case 'right': offset.x = -distance; break;
      case 'scale': return {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1 },
      };
      case 'none': return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };
    }
    return {
      hidden: { opacity: 0, x: offset.x, y: offset.y },
      visible: { opacity: 1, x: 0, y: 0 },
    };
  }, [direction, distance]);

  const MotionComponent = motion[as];

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-80px' }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

// ============================================================
// ParallaxSection — Subtle parallax scrolling effect
// ============================================================

interface ParallaxSectionProps {
  children: ReactNode;
  speed?: number;
  className?: string;
}

export function ParallaxSection({
  children,
  speed = 0.5,
  className,
}: ParallaxSectionProps) {
  return (
    <motion.div
      initial={{ y: 0 }}
      whileInView={{ y: 0 }}
      viewport={{ once: false }}
      transition={{ duration: 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

