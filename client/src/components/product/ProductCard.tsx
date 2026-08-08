'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';

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
}

interface ProductCardProps {
  product: ProductCardData;
  variant?: 'default' | 'compact' | 'horizontal';
  onWishlistToggle?: (productId: string) => void;
  isWishlisted?: boolean;
  className?: string;
  index?: number;
}

export function ProductCard({
  product,
  variant = 'default',
  onWishlistToggle,
  isWishlisted = false,
  className,
  index = 0,
}: ProductCardProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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
  } = product;

  const hasDiscount = salePrice !== undefined && salePrice < regularPrice;
  const hoverImage = images?.find((img) => img !== image) || images?.[0] || image;

  const motionProps = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true as const, margin: '-40px' },
    transition: { duration: 0.6, delay: index * 0.05, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] },
  };

  if (variant === 'horizontal') {
    return (
      <motion.div
        {...motionProps}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn('group flex gap-5 border-b border-navy/10 py-5 transition-colors', className)}
      >
        <Link href={`/products/${slug}`} className="relative h-32 w-28 flex-shrink-0 overflow-hidden">
          <Image src={image} alt={name} fill className="object-cover transition-transform duration-700 group-hover:scale-108" sizes="112px" />
        </Link>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            {brand && <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-sage-dark">{brand}</p>}
            <Link href={`/products/${slug}`} className="mt-1 block font-display text-xl font-medium text-navy transition-colors hover:text-walnut line-clamp-1">
              {name}
            </Link>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-lg text-navy">
                ${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate line-through">${regularPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
          {rating !== undefined && (
            <div className="flex items-center gap-2 text-xs text-slate">
              <span className="text-walnut">★★★★★</span>
              <span>{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={() => onWishlistToggle(id)}
            className="self-start rounded-full p-2 text-slate transition-colors hover:text-red-500 active:scale-90"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="h-5 w-5" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </motion.div>
    );
  }

  if (variant === 'compact') {
    return (
      <motion.div
        {...motionProps}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className={cn('group', className)}
      >
        <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden">
          <Image src={image} alt={name} fill className="object-cover transition-all duration-700" sizes="(max-width: 640px) 50vw, 25vw" style={{ transform: isHovered ? 'scale(1.06)' : 'scale(1)' }} />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {isNew && <Badge variant="new">NEW</Badge>}
            {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
          </div>
        </Link>
        <div className="mt-3">
          {brand && <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-sage-dark">{brand}</p>}
          <Link href={`/products/${slug}`} className="mt-1 block line-clamp-1 font-display text-base font-medium text-navy hover:text-walnut transition-colors">
            {name}
          </Link>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-navy">${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}</span>
            {hasDiscount && <span className="text-xs text-slate line-through">${regularPrice.toFixed(2)}</span>}
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ DEFAULT — editorial card ============
  return (
    <motion.div
      {...motionProps}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn('group relative', className)}
    >
      {/* Index number */}
      <span className="pointer-events-none absolute -left-1 -top-5 z-10 font-display text-5xl font-light text-navy/25 transition-colors duration-500 group-hover:text-sage/60 select-none">
        {String(index + 1).padStart(2, '0')}
      </span>

      <Link href={`/products/${slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-t-full rounded-b-2xl">
        <div className="absolute inset-0 bg-cream-dark">
          <Image
            src={image}
            alt={name}
            fill
            className={cn(
              'object-cover transition-all duration-700',
              isImageLoaded ? 'opacity-100' : 'opacity-0'
            )}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onLoad={() => setIsImageLoaded(true)}
            style={{ transform: isHovered ? 'scale(1.08)' : 'scale(1)' }}
          />
          {/* Hover image swap */}
          {hoverImage !== image && (
            <Image
              src={hoverImage}
              alt={`${name} alternate`}
              fill
              className={cn(
                'object-cover transition-opacity duration-700',
                isHovered ? 'opacity-100' : 'opacity-0'
              )}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          )}
          {!isImageLoaded && <div className="absolute inset-0 animate-shimmer" />}
        </div>

        {/* Hover overlay */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-navy/80 via-transparent to-transparent transition-opacity duration-500',
          isHovered ? 'opacity-100' : 'opacity-0'
        )} />

        {/* Badges */}
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {isNew && <Badge variant="new">NEW</Badge>}
          {isBestSeller && <Badge variant="best-seller">BEST SELLER</Badge>}
          {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
        </div>

        {/* Wishlist */}
        {onWishlistToggle && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.1 }}
            animate={isHovered ? { opacity: 1, scale: 1 } : { opacity: 0.8, scale: 1 }}
            onClick={(e) => { e.preventDefault(); onWishlistToggle(id); }}
            className="absolute right-4 top-4 rounded-full bg-cream/90 p-2.5 shadow-sm backdrop-blur-sm transition-colors hover:bg-white"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className={cn('h-4 w-4 transition-colors', isWishlisted ? 'text-red-500' : 'text-navy')} fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </motion.button>
        )}

        {/* Quick add — slides up on hover */}
        <div className={cn(
          'absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-500 ease-out',
          isHovered && 'translate-y-0'
        )}>
          <div className="flex items-stretch bg-navy/90 backdrop-blur-md">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); }}
              className="flex-1 py-3.5 text-[11px] font-medium uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-sage hover:text-white"
            >
              Quick Add
            </button>
            {colors && colors.length > 0 && (
              <div className="flex items-center gap-1.5 border-l border-cream/10 px-4">
                {colors.slice(0, 3).map((color) => (
                  <span
                    key={color.name}
                    className="h-3 w-3 rounded-full border border-cream/30 transition-transform hover:scale-125"
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="mt-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {brand && (
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-sage-dark">
              {brand}
            </p>
          )}
          <Link
            href={`/products/${slug}`}
            className="mt-1.5 block font-display text-xl font-medium leading-snug text-navy transition-colors hover:text-walnut line-clamp-1"
          >
            {name}
          </Link>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-display text-xl text-navy">
            ${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-slate line-through">${regularPrice.toFixed(2)}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
