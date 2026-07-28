'use client';

import { motion, type Variants } from 'framer-motion';
import { useMemo, type ReactNode } from 'react';

// ============================================================
// FadeIn — Reusable Framer Motion Animation Wrapper
// ============================================================

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';
type AnimationVariant = 'fadeIn' | 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleIn';

const variantMap: Record<AnimationVariant, Variants> = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeDown: {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 },
  },
  fadeLeft: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  },
  fadeRight: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0 },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  },
};

interface FadeInProps {
  children: ReactNode;
  variant?: AnimationVariant;
  duration?: number;
  delay?: number;
  once?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'span';
}

export function FadeIn({
  children,
  variant = 'fadeUp',
  duration = 0.5,
  delay = 0,
  once = true,
  className,
  as = 'div',
}: FadeInProps) {
  const variants = variantMap[variant];
  const MotionComponent = motion[as];

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1], // cubic-bezier ease
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

// ============================================================
// StaggerChildren — For staggered list/ grid animations
// ============================================================

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  once?: boolean;
}

export function StaggerChildren({
  children,
  staggerDelay = 0.1,
  className,
  once = true,
}: StaggerChildrenProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-50px' }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// StaggerItem — Child item for staggered animations
// ============================================================

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}

export function StaggerItem({
  children,
  className,
  direction = 'up',
}: StaggerItemProps) {
  const offset = direction === 'none' ? 0 : 20;
  const xOffset = direction === 'left' ? -offset : direction === 'right' ? offset : 0;
  const yOffset = direction === 'up' ? offset : direction === 'down' ? -offset : 0;

const itemVariants: Variants = {
    hidden: {
      opacity: 0,
      x: xOffset,
      y: yOffset,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
      },
    },
  };

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// ============================================================
// HoverLift — Reusable hover effect wrapper
// ============================================================

interface HoverLiftProps {
  children: ReactNode;
  lift?: number;
  className?: string;
}

export function HoverLift({ children, lift = 4, className }: HoverLiftProps) {
  return (
    <motion.div
      whileHover={{ y: -lift, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// ScaleOnHover — Reusable scale effect wrapper
// ============================================================

interface ScaleOnHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export function ScaleOnHover({ children, scale = 1.02, className }: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale, transition: { duration: 0.2 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

