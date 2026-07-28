'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';

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
}

export function ProductCard({
  product,
  variant = 'default',
  onWishlistToggle,
  isWishlisted = false,
  className,
}: ProductCardProps) {
  const {
    id,
    name,
    slug,
    image,
    regularPrice,
    salePrice,
    discountPercent,
    rating,
    reviewCount,
    isNew,
    isBestSeller,
    colors,
    brand,
  } = product;

  const hasDiscount = salePrice !== undefined && salePrice < regularPrice;

  if (variant === 'horizontal') {
    return (
      <div className={cn('group flex gap-4 rounded-lg border border-gray-200 bg-white p-3 transition-all duration-200 hover:shadow-md', className)}>
        <Link href={`/products/${slug}`} className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-md">
          <Image src={image} alt={name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="112px" />
        </Link>
        <div className="flex flex-1 flex-col justify-between">
          <div>
            {brand && <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{brand}</p>}
            <Link href={`/products/${slug}`} className="mt-0.5 block text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors">
              {name}
            </Link>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900">
                ${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">${regularPrice.toFixed(2)}</span>
              )}
            </div>
          </div>
          {rating !== undefined && (
            <div className="flex items-center gap-1">
              <Rating value={rating} size="sm" />
              {reviewCount !== undefined && <span className="text-xs text-gray-400">({reviewCount})</span>}
            </div>
          )}
        </div>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={() => onWishlistToggle(id)}
            className="flex-shrink-0 self-start rounded-full p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className="h-4 w-4" fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('group rounded-lg border border-gray-200 bg-white transition-all duration-200 hover:shadow-md', className)}>
        <Link href={`/products/${slug}`} className="relative block aspect-square overflow-hidden rounded-t-lg">
          <Image src={image} alt={name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw" />
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {isNew && <Badge variant="new">NEW</Badge>}
            {isBestSeller && <Badge variant="best-seller">BEST SELLER</Badge>}
            {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
          </div>
        </Link>
        <div className="p-3">
          {brand && <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{brand}</p>}
          <Link href={`/products/${slug}`} className="mt-0.5 line-clamp-1 text-sm font-medium text-gray-900 hover:text-gray-600">
            {name}
          </Link>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              ${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}
            </span>
            {hasDiscount && <span className="text-xs text-gray-400 line-through">${regularPrice.toFixed(2)}</span>}
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Rating value={rating || 0} size="sm" />
            {reviewCount !== undefined && <span className="text-xs text-gray-400">({reviewCount})</span>}
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('group relative rounded-xl border border-gray-200 bg-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5', className)}>
      <Link href={`/products/${slug}`} className="relative block aspect-[3/4] overflow-hidden rounded-t-xl">
        <Image src={image} alt={name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {isNew && <Badge variant="new">NEW</Badge>}
          {isBestSeller && <Badge variant="best-seller">BEST SELLER</Badge>}
          {hasDiscount && discountPercent && <Badge variant="sale">-{discountPercent}%</Badge>}
        </div>
        {onWishlistToggle && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onWishlistToggle(id); }}
            className="absolute right-3 top-3 rounded-full bg-white/80 p-2 backdrop-blur-sm transition-all duration-200 hover:bg-white hover:shadow-md"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <svg className={cn('h-5 w-5 transition-colors', isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-400')} fill={isWishlisted ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}
        {hasDiscount && (
          <div className="absolute bottom-3 left-3 rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-semibold text-white">
            -{discountPercent}%
          </div>
        )}
      </Link>
      <div className="p-4">
        {brand && <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">{brand}</p>}
        <Link href={`/products/${slug}`} className="block text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors line-clamp-2">
          {name}
        </Link>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-gray-900">
            ${salePrice !== undefined ? salePrice.toFixed(2) : regularPrice.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-gray-400 line-through">${regularPrice.toFixed(2)}</span>
          )}
        </div>
        {rating !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <Rating value={rating} size="sm" />
            {reviewCount !== undefined && (
              <span className="text-xs text-gray-400">({reviewCount})</span>
            )}
          </div>
        )}
        {colors && colors.length > 0 && (
          <div className="mt-3 flex items-center gap-1">
            {colors.slice(0, 4).map((color) => (
              <span
                key={color.name}
                className="inline-block h-3.5 w-3.5 rounded-full border border-gray-300"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
            {colors.length > 4 && (
              <span className="text-xs text-gray-400 ml-1">+{colors.length - 4}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
