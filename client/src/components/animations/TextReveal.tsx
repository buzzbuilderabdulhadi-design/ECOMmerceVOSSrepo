'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TextRevealProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span' | 'div';
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}

const container = {
  hidden: {},
  visible: (stagger: number) => ({
    transition: { staggerChildren: stagger, delayChildren: 0.05 },
  }),
};

const word = {
  hidden: { opacity: 0, y: '105%' },
  visible: {
    opacity: 1,
    y: '0%',
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

/**
 * Word-by-word reveal.
 *
 * The mask wrapper uses `reveal-box`, which adds vertical padding and pulls
 * it back with an equal negative margin. Without that padding the mask is
 * exactly one line-box tall, so any heading with a tight line-height slices
 * the ascenders and the descenders of g / p / y / j / q.
 */
export function TextReveal({
  text,
  as = 'div',
  className,
  delay = 0,
  stagger = 0.04,
  once = true,
}: TextRevealProps) {
  const words = text.split(' ');
  const MotionTag = motion[as];

  return (
    <MotionTag
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: '-40px' }}
      variants={container}
      custom={stagger}
      transition={{ delayChildren: delay }}
      className={className}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="reveal-box" aria-hidden>
          <motion.span
            variants={word}
            transition={{ delay: delay + i * stagger }}
            className="inline-block will-change-transform"
          >
            {w}
          </motion.span>
          {i < words.length - 1 && <span>&nbsp;</span>}
        </span>
      ))}
    </MotionTag>
  );
}

/**
 * Line-by-line reveal. Same clipping-safe treatment as TextReveal.
 */
export function LineReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <span className={cn('reveal-box-block', className)} aria-hidden>
      <motion.span
        initial={{ y: '105%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay }}
        className="block will-change-transform"
      >
        {children}
      </motion.span>
    </span>
  );
}
