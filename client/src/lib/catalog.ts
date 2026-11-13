import { variantsToColors } from '@/lib/utils';
import type { Category, Product } from '@/types';
import type { ProductCardData } from '@/components/product/ProductCard';

export const DEFAULT_CATEGORY_IMAGE =
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85';

export const SHOP_PER_PAGE = 9;

export interface CategoryTile {
  name: string;
  slug: string;
  image: string;
  productCount?: number;
}

type CategoryWithCount = Category & { _count?: { products: number } };

/**
 * Maps a raw API product to the shape consumed by <ProductCard />. Shared by
 * the server components (initial SSR payload) and the client islands (later
 * pages / sort changes) so both render an identical card tree — important for
 * hydration.
 */
export function toProductCardData(p: Product): ProductCardData {
  const firstImage = p.images?.[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i) => (typeof i === 'string' ? i : i.url)) || [],
    regularPrice: p.regularPrice,
    salePrice: p.salePrice ?? undefined,
    discountPercent: p.discountPercent,
    isNew: p.isNew,
    isBestSeller: p.isBestSeller,
    stock: p.stock,
    brand: p.brand,
    category: p.category?.name,
    colors: variantsToColors(p.variants),
    defaultVariantId: p.variants?.find((v) => v.isActive !== false)?.id,
  };
}

export function toCategoryTiles(categories: Category[]): CategoryTile[] {
  return (categories as CategoryWithCount[]).slice(0, 8).map((c) => ({
    name: c.name,
    slug: c.slug,
    image: c.image || DEFAULT_CATEGORY_IMAGE,
    productCount: c._count?.products ?? 0,
  }));
}
