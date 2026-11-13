'use client';

import React, { forwardRef, ButtonHTMLAttributes, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';

const variants = {
  primary:
    'bg-onyx text-bone hover:bg-navy-mid hover:border-navy-mid focus:ring-navy-soft shadow-sm shadow-black/20',
  secondary:
    'bg-porcelain text-onyx border border-cocoa/25 hover:bg-bone hover:border-cocoa/40 focus:ring-navy-soft',
  outline:
    'bg-transparent text-onyx border border-cocoa/40 hover:border-onyx hover:bg-cocoa/5 focus:ring-navy-soft',
  ghost: 'bg-transparent text-onyx hover:bg-cocoa/10 focus:ring-navy-soft',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus:ring-red-600',
  gold: 'bg-navy-mid text-bone hover:bg-navy-soft focus:ring-navy-soft',
  walnut: 'bg-navy-mid text-bone hover:bg-navy-soft focus:ring-navy-soft',
  sage: 'bg-beige text-onyx hover:bg-bone focus:ring-navy-soft',
  light: 'bg-bone text-onyx hover:bg-porcelain focus:ring-navy-soft shadow-sm shadow-black/10',
  /* On dark surfaces: light fill, dark text. Hover flips to deep navy. */
  inverse: 'bg-bone text-onyx hover:bg-navy-mid hover:text-bone focus:ring-beige',
  /* Transparent on dark surfaces: light outline + light text, navy hover fill */
  onDark: 'bg-transparent text-bone border border-bone/40 hover:border-navy-mid hover:bg-navy-mid hover:text-bone focus:ring-beige',
};

const sizes = {
  xs: 'min-h-[32px] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]',
  sm: 'min-h-[40px] px-4 py-2 text-xs uppercase tracking-[0.14em]',
  md: 'min-h-[44px] px-6 py-2.5 text-xs uppercase tracking-[0.16em]',
  lg: 'min-h-[52px] px-8 py-3.5 text-sm uppercase tracking-[0.16em]',
  xl: 'min-h-[56px] px-10 py-4 text-sm uppercase tracking-[0.18em]',
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
  href?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

type ButtonElement = HTMLButtonElement | HTMLAnchorElement;

const Button = forwardRef<ButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      isRipple = true,
      magnetic = true,
      fullWidth = false,
      href,
      leftIcon,
      rightIcon,
      disabled,
      type,
      children,
      onClick,
      ...rest
    },
    ref
  ) => {
    const innerRef = useRef<ButtonElement | null>(null);
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 220, damping: 16, mass: 0.2 });
    const sy = useSpring(my, { stiffness: 220, damping: 16, mass: 0.2 });

    const handleMove = (e: React.MouseEvent<ButtonElement>) => {
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

    const handleClick = (e: React.MouseEvent<ButtonElement>) => {
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
      onClick?.(e as React.MouseEvent<HTMLButtonElement, MouseEvent>);
    };

    const sharedClassNames = cn(
      /* overflow-hidden is required here: the click ripple is a 20px circle
         that scales 4x and would otherwise escape the pill. Button text is
         vertically centred inside a min-height box, so it is never clipped. */
      'relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full font-medium tracking-[0.16em] uppercase transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-porcelain disabled:pointer-events-none disabled:opacity-50',
      'group/btn',
      variants[variant],
      sizes[size],
      fullWidth && 'w-full',
      className
    );

    const rippleContent = (
      <>
        <span className="pointer-events-none absolute bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-current opacity-40 transition-all duration-500 group-hover/btn:w-1/2" />

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
      </>
    );

    const motionProps = {
      onMouseMove: handleMove,
      onMouseLeave: handleLeave,
      style: { x: sx, y: sy },
      whileTap: { scale: 0.97 },
      onClick: handleClick,
      className: sharedClassNames,
    };

    const setRefs = (node: ButtonElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<ButtonElement | null>).current = node;
    };

    if (href) {
      return (
        <motion.a
          // ButtonProps is button-shaped; the href variant reinterprets the
          // passthrough props against the anchor element. The animation/drag
          // handlers stay omitted because framer-motion claims those names.
          {...(rest as Omit<
            React.ComponentPropsWithoutRef<'a'>,
            'onAnimationStart' | 'onDragStart' | 'onDragEnd' | 'onDrag'
          >)}
          href={href}
          ref={setRefs as React.Ref<HTMLAnchorElement>}
          {...(motionProps as object)}
          aria-disabled={disabled || isLoading || undefined}
          data-disabled={disabled || isLoading || undefined}
        >
          {rippleContent}
        </motion.a>
      );
    }

    return (
      <motion.button
        {...rest}
        ref={setRefs as React.Ref<HTMLButtonElement>}
        type={type ?? 'button'}
        disabled={disabled || isLoading}
        {...(motionProps as object)}
      >
        {rippleContent}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };