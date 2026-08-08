'use client';

import React, { forwardRef, ButtonHTMLAttributes, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-navy text-ivory hover:bg-navy-light focus:ring-navy shadow-lg shadow-navy/15',
  secondary:
    'bg-white text-navy border border-navy/30 hover:bg-navy/5 focus:ring-navy',
  outline:
    'bg-transparent text-navy border border-navy/40 hover:border-navy focus:ring-navy',
  ghost: 'bg-transparent text-navy hover:bg-navy/5 focus:ring-navy',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  gold: 'bg-gold text-navy hover:bg-gold/85 focus:ring-gold',
  walnut: 'bg-walnut text-ivory hover:bg-walnut-light focus:ring-walnut',
  sage: 'bg-sage text-navy hover:bg-sage-dark hover:text-white focus:ring-sage',
  light:
    'bg-cream text-navy hover:bg-white focus:ring-cream shadow-lg shadow-black/10',
};

const sizes = {
  xs: 'px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]',
  sm: 'px-4 py-2 text-xs uppercase tracking-[0.14em]',
  md: 'px-6 py-2.5 text-xs uppercase tracking-[0.16em]',
  lg: 'px-8 py-3.5 text-sm uppercase tracking-[0.16em]',
  xl: 'px-10 py-4 text-sm uppercase tracking-[0.18em]',
};

export interface ButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
  > {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  isLoading?: boolean;
  isRipple?: boolean;
  magnetic?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isRipple = true,
      magnetic = true,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const innerRef = useRef<HTMLButtonElement | null>(null);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 220, damping: 16, mass: 0.2 });
    const sy = useSpring(my, { stiffness: 220, damping: 16, mass: 0.2 });

    const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = innerRef.current;
      if (!el || !magnetic) return;
      const rect = el.getBoundingClientRect();
      mx.set((e.clientX - (rect.left + rect.width / 2)) * 0.22);
      my.set((e.clientY - (rect.top + rect.height / 2)) * 0.22);
    };

    const handleLeave = () => {
      mx.set(0);
      my.set(0);
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isRipple && !disabled && !isLoading) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = Date.now();
        setRipples((prev) => [...prev, { x, y, id }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
      onClick?.(e);
    };

    return (
      <motion.button
        ref={(node) => {
          innerRef.current = node;
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{ x: sx, y: sy }}
        whileTap={{ scale: 0.97 }}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          'relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          'group/btn',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {/* Underline accent */}
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-sage/70 transition-all duration-500 group-hover/btn:w-1/2" />

        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="pointer-events-none absolute animate-ripple rounded-full bg-white/25"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
