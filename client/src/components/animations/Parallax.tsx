'use client';

import { useRef, type ReactNode, type MouseEvent } from 'react';
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  amount?: number;
  direction?: 'vertical' | 'horizontal';
}

export function Parallax({ children, className, amount = 60, direction = 'vertical' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const spring = useSpring(scrollYProgress, { stiffness: 90, damping: 20 });

  const y = useTransform(spring, [0, 1], [amount, -amount]);
  const x = useTransform(spring, [0, 1], [amount, -amount]);

  return (
    <motion.div
      ref={ref}
      style={direction === 'vertical' ? { y } : { x }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TiltTilt({ children, className }: { children: ReactNode; className?: string }) {
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 20 });
  const sry = useSpring(ry, { stiffness: 200, damping: 20 });

  const onMove = (e: MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    ry.set(px * 16);
    rx.set(-py * 16);
  };

  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <motion.div
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d', perspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
