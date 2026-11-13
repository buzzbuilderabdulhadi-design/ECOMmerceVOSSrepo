'use client';

import React, { memo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

export interface ProductCardData {
  id: string;
  name: string;
  slug: string;
  image: string;
  images?: string[];
  regularPrice: number;
  salePrice?: number;
  discountPercent?: number;
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  colors?: { name: string; hex: string }[];
  stock?: number;
  brand?: string;
  category?: string;
  defaultVariantId?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  variant?: 'default' | 'compact' | 'horizontal';
  /** 'light' sits on cream/beige surfaces, 'dark' on the cinematic storefront sections. */
  tone?: 'light' | 'dark';
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  className?: string;
  index?: number;
  /** Explicitly opt in/out of an eager (priority) image load. Defaults to the
      legacy heuristic (first two cards) when omitted. Holiday/hero sections
      pass false so they never compete with the above-the-fold LCP image. */
  priority?: boolean;
}

export const ProductCard = memo(function ProductCard({
  product,
  variant = 'default',
  tone = 'light',
  onWishlistToggle,
  isWishlisted = false,
  className,
  index = 0,
  priority,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  const isDark = tone === 'dark';

  const eager = priority ?? index < 2;

  const { addItem } = useCart();

  const {
    id,
    name,
    slug,
    image,
    images,
    regularPrice,
    salePrice,
    discountPercent,
    rating,
    isNew,
    isBestSeller,
    colors,
    brand,
    category,
    stock,
  } = product;

  const hasDiscount = typeof salePrice === 'number' && salePrice < regularPrice;
  const isSoldOut = !stock || stock <= 0;

  const onQuickAdd = async () => {
    if (isQuickAdding) return;
    setIsQuickAdding(true);
    try {
      const message = await addItem(
        {
          id,
          name,
          slug,
          regularPrice,
          salePrice,
          images: [image],
          stock: stock ?? 0,
        } as Product,
        1,
        product.defaultVariantId
      );
      if (message === null) {
        toast.success('Added to cart');
      } else {
        toast.error(message);
      }
    } finally {
      setIsQuickAdding(false);
    }
  };

  const motionProps = {
    initial: { opacity: 0, y: 26 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true as const, margin: '-40px' },
    transition: {
      duration: 0.6,
      delay: Math.min(index, 7) * 0.05,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  };

  /* ---------------- Horizontal (cart / wishlist rows) ---------------- */
  if (variant === 'horizontal') {
    return (
      <motion.div
        {...motionProps}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn(
          'group flex gap-5 border-b border-cocoa/15 py-5 transition-colors',
          className
        )}
      >
        <Link
          href={`/products/${slug}`}
          className="relative h-32 w-28 flex-shrink-0 overflow-hidden bg-bone"
        >
          <ProductImage
            image={image}
            images={images}
            alt={name}
            className="h-full w-full"
            sizes="112px"
          />
        </Link>
        <div className="flex flex-1 flex-col justify-between">
          <div>
          {(brand || category) && (
            <p
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.25em]',
                isDark ? 'text-beige' : 'text-navy-mid'
              )}
            >
              {brand || category}
            </p>
          )}
            <Link
              href={`/products/${slug}`}
              className={cn(
                'mt-1.5 block font-display text-xl font-medium leading-snug transition-colors',
                isDark ? 'text-bone hover:text-porcelain' : 'text-onyx hover:text-navy-mid'
              )}
            >
              {name}
            </Link>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={cn('font-display text-lg', isDark ? 'text-bone' : 'text-onyx')}>
                ${(salePrice ?? regularPrice).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className={cn('text-xs line-through', isDark ? 'text-bone/55' : 'text-cocoa/70')}>
                  ${regularPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>
          {typeof rating === 'number' && (
            <div className={cn('flex items-center gap-2 text-xs', isDark ? 'text-bone/70' : 'text-cocoa/70')}>
              <span className={isDark ? 'text-beige' : 'text-navy-mid'} aria-hidden="true">
                ★★★★★
              </span>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={() => onWishlistToggle(id)}
            className="self-start rounded-full p-2 text-cocoa transition-colors hover:text-red-600 active:scale-90"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg
              className={cn('h-5 w-5', isWishlisted && 'text-red-600')}
              fill={isWishlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </button>
        )}
      </motion.div>
    );
  }

  /* ---------------- Compact (sidebars / rails) ---------------- */
  if (variant === 'compact') {
    return (
      <motion.div
        {...motionProps}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn('group', className)}
      >
        <Link
          href={`/products/${slug}`}
          className="relative block overflow-hidden bg-bone"
        >
          <ProductImage
            image={image}
            images={images}
            alt={name}
            className="aspect-square w-full"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1">
            {isNew && <Badge variant="new">NEW</Badge>}
            {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
          </div>
        </Link>
        <div className="mt-3.5">
          {(brand || category) && (
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-navy-mid">
              {brand || category}
            </p>
          )}
          <Link
            href={`/products/${slug}`}
            className="mt-1.5 block font-display text-base font-medium leading-snug text-onyx transition-colors hover:text-navy-mid"
          >
            {name}
          </Link>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="font-display text-onyx">${(salePrice ?? regularPrice).toFixed(2)}</span>
            {hasDiscount && <span className="text-xs text-cocoa/70 line-through">${regularPrice.toFixed(2)}</span>}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ---------------- Default — editorial, image-dominant ---------------- */
  return (
    <motion.div
      {...motionProps}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn('group relative flex flex-col', className)}
    >
      <Link
        href={`/products/${slug}`}
        className="relative block aspect-[3/4] w-full overflow-hidden bg-bone"
      >
        <ProductImage
          image={image}
          images={images}
          alt={name}
          className="aspect-[3/4] w-full"
          tone={isDark ? 'dark' : 'light'}
          priority={eager}
        />

        {/* Bottom scrim keeps the quick-add bar readable over any photo */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t transition-opacity duration-500',
            isDark ? 'from-onyx/85 to-transparent' : 'from-onyx/60 to-transparent',
            isHovered ? 'opacity-100' : 'opacity-0'
          )}
        />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-col items-start gap-1.5">
          {isNew && <Badge variant="new">NEW</Badge>}
          {isBestSeller && <Badge variant="best-seller">BEST SELLER</Badge>}
          {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
          {isSoldOut && <Badge variant="default">SOLD OUT</Badge>}
        </div>

        {/* Wishlist */}
        {onWishlistToggle && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.08 }}
            onClick={(e) => {
              e.preventDefault();
              onWishlistToggle(id);
            }}
            className={cn(
              'absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-sm transition-colors',
              isDark ? 'bg-onyx/55 text-bone hover:bg-onyx' : 'bg-porcelain/85 text-onyx hover:bg-porcelain'
            )}
            aria-label={isWishlisted ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
          >
            <svg
              className={cn('h-4 w-4 transition-colors', isWishlisted && 'text-red-500')}
              fill={isWishlisted ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </motion.button>
        )}

        {/* Quick add — rises on hover, always reachable by keyboard */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-500 ease-out focus-within:translate-y-0',
            isHovered && 'translate-y-0'
          )}
        >
          <div className="flex items-stretch bg-onyx/90 backdrop-blur-md">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                void onQuickAdd();
              }}
              disabled={isQuickAdding || isSoldOut}
              className={cn(
                'flex-1 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-bone transition-colors',
                isQuickAdding ? 'cursor-wait opacity-70' : 'hover:bg-navy-mid'
              )}
            >
              {isSoldOut ? 'Sold Out' : isQuickAdding ? 'Adding…' : 'Quick Add'}
            </button>
            {colors && colors.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-bone/15 px-4">
                {colors.slice(0, 3).map((color) => (
                  <span
                    key={`${id}-color-${color.name}-${color.hex}`}
                    className="h-3 w-3 rounded-full border border-bone/40 transition-transform hover:scale-125"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Info — small eyebrow, name allowed to wrap to two lines, price */}
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {(brand || category) && (
            <p
              className={cn(
                'text-[10px] font-medium uppercase tracking-[0.25em]',
                isDark ? 'text-beige' : 'text-navy-mid'
              )}
            >
              {brand || category}
            </p>
          )}
          <Link
            href={`/products/${slug}`}
            className={cn(
              'mt-1.5 block font-display text-lg font-medium leading-snug transition-colors',
              isDark ? 'text-bone hover:text-porcelain' : 'text-onyx hover:text-navy-mid'
            )}
          >
            {name}
          </Link>
        </div>
        <div className="flex flex-shrink-0 flex-col items-end">
          <span className={cn('font-display text-lg', isDark ? 'text-bone' : 'text-onyx')}>
            ${(salePrice ?? regularPrice).toFixed(2)}
          </span>
          {hasDiscount && (
            <span className={cn('text-xs line-through', isDark ? 'text-bone/50' : 'text-cocoa/60')}>
              ${regularPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});
