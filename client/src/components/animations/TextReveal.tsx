'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

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
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
};

const word = {
  hidden: { opacity: 0, y: '110%', rotate: 4 },
  visible: {
    opacity: 1,
    y: '0%',
    rotate: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  },
};

export function TextReveal({
  text,
  as = 'div',
  className,
  delay = 0,
  stagger = 0.045,
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
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom"
          aria-hidden
        >
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

export function LineReveal({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <span className="block overflow-hidden" aria-hidden>
      <motion.span
        initial={{ y: '110%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1], delay }}
        className="block will-change-transform"
      >
        {children}
      </motion.span>
    </span>
  );
}
