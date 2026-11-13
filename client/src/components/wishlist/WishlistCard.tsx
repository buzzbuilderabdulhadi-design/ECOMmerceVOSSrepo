'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { ProductImage } from '@/components/product/ProductImage';
import { useCart } from '@/context/CartContext';
import type { WishlistItem, Product } from '@/types';
import toast from 'react-hot-toast';

interface WishlistCardProps {
  item: WishlistItem;
  onRemove: (itemId: string) => Promise<boolean>;
}

export function WishlistCard({ item, onRemove }: WishlistCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { addItem } = useCart();

  const p = item.product;
  const v = item.variant;
  const regularPrice = p.regularPrice;
  const salePrice = p.salePrice ?? p.regularPrice;
  const hasDiscount = typeof p.salePrice === 'number' && p.salePrice < regularPrice;

  const activeVariants = (p.variants ?? []).filter((pv) => pv.isActive);
  const hasVariants = activeVariants.length > 0;
  const addableVariantId = item.variantId ?? activeVariants[0]?.id;
  const unavailable = !p.isActive || (item.variant ? !item.variant.isActive : false) || (v?.stock ?? p.stock ?? 0) < 1;

  const canAdd = !unavailable && (!hasVariants || !!addableVariantId);

  const handleAddToCart = async () => {
    if (isAdding) return;
    setIsAdding(true);
    try {
      const productForCart = {
        id: p.id,
        name: p.name,
        slug: p.slug,
        regularPrice: p.regularPrice,
        salePrice: p.salePrice,
        images: p.images,
        stock: p.stock,
      } as Product;
      const message = await addItem(productForCart, 1, addableVariantId);
      if (message === null) {
        toast.success('Added to cart');
      } else {
        toast.error(message);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async () => {
    if (isRemoving) return;
    setIsRemoving(true);
    try {
      const ok = await onRemove(item.id);
      if (ok) toast.success('Removed from wishlist');
      else toast.error('Could not update your wishlist.');
    } finally {
      setIsRemoving(false);
    }
  };

  const stockLeft = v?.stock ?? p.stock ?? 0;
  const lowStock = stockLeft > 0 && stockLeft <= 5;

  return (
    <div className="group relative flex flex-col">
      <Link href={`/products/${p.slug}`} className="relative block overflow-hidden rounded-t-full rounded-b-2xl bg-cream-dark">
        <ProductImage
          images={p.images}
          alt={p.name}
          className="aspect-[3/4] w-full"
          sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
        />
        <div className="absolute left-4 top-4 flex flex-col gap-1.5">
          {p.isNew && <Badge variant="new">NEW</Badge>}
          {hasDiscount && p.discountPercent != null && <Badge variant="sale">-{p.discountPercent}%</Badge>}
        </div>
      </Link>

      <div className="mt-5 flex-1">
        {p.brand && (
          <p className="text-[9px] font-medium uppercase tracking-[0.25em] text-sage-dark">{p.brand}</p>
        )}
        <Link href={`/products/${p.slug}`} className="mt-1 block font-display text-xl font-medium leading-snug text-navy transition-colors hover:text-walnut line-clamp-2">
          {p.name}
        </Link>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display text-xl text-navy">${salePrice.toFixed(2)}</span>
          {hasDiscount && <span className="text-xs text-slate line-through">${regularPrice.toFixed(2)}</span>}
        </div>

        {v && (v.color || v.size) && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate">
            {v.color && <span className="rounded-full bg-sage-light/30 px-2.5 py-0.5">Color: {v.color}</span>}
            {v.size && <span className="rounded-full bg-sage-light/30 px-2.5 py-0.5">Size: {v.size}</span>}
          </div>
        )}

        <p
          className={cn(
            'mt-2 text-xs font-medium',
            unavailable ? 'text-red-700' : lowStock ? 'text-amber-700' : 'text-sage-dark'
          )}
        >
          {unavailable ? 'Currently unavailable' : lowStock ? `Only ${stockLeft} left` : 'In stock'}
        </p>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!canAdd || isAdding}
          className={cn(
            'flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full bg-navy px-4 text-[11px] font-medium uppercase tracking-[0.16em] text-ivory transition-colors',
            canAdd ? 'hover:bg-sage-dark' : 'cursor-not-allowed opacity-50'
          )}
        >
          {isAdding ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-ivory/30 border-t-ivory" />
          ) : unavailable ? (
            'Unavailable'
          ) : hasVariants && !addableVariantId ? (
            'Choose Options'
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Add to Cart
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={isRemoving}
          className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border border-navy/15 text-slate transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-90 disabled:pointer-events-none disabled:opacity-50"
          aria-label={`Remove ${p.name} from wishlist`}
        >
          {isRemoving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate/30 border-t-slate" />
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}