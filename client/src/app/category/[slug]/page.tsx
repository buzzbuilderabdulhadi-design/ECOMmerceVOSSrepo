'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { StaggerChildren, StaggerItem } from '@/components/animations/FadeIn';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { fetchCategory, fetchProducts } from '@/services';
import { getErrorMessage } from '@/services/axios';
import { variantsToColors } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import type { Category, Product } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85';

function toProductCard(p: Product): ProductCardData {
  const firstImage = p.images?.[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i) => (typeof i === 'string' ? i : i.url)) || [],
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
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

export default function CategoryPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const { wishlistedProductIds, toggleItem } = useWishlist();
  const { isAuthenticated } = useAuth();

  const handleWishlistToggle = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      const product = products.find((p) => p.id === productId);
      if (!product) return;
      const ok = await toggleItem(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          regularPrice: product.regularPrice,
          salePrice: product.salePrice,
          images: product.images ?? [product.image],
          stock: product.stock ?? 0,
        } as Product,
        product.defaultVariantId
      );
      if (!ok) toast.error('Could not update your wishlist.');
    },
    [isAuthenticated, products, toggleItem, router, pathname]
  );

  const isWishlistedFor = (id: string) => wishlistedProductIds.has(id);

  const load = useCallback(async () => {
    if (!slug) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cat, list] = await Promise.all([
        fetchCategory(slug),
        fetchProducts({ category: slug, page: '1', limit: '100' }),
      ]);
      if (!cat) {
        setError('Category not found');
        return;
      }
      setCategory(cat);
      setProducts(list.data.map(toProductCard));
    } catch (err) {
      setError(getErrorMessage(err) || 'Failed to load this category. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => { void load(); }, [load, reloadKey]);

  if (error === 'Category not found') {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-24">
          <EmptyState
            icon={undefined}
            title="Category not found"
            description="The category you're looking for doesn't exist or has been removed."
            actionLabel="Browse All Products"
            actionHref="/shop"
          />
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 pt-24 sm:px-6 lg:px-8">
          <ErrorState
            title="Failed to load category"
            message={error}
            onRetry={() => setReloadKey((k) => k + 1)}
          />
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* Category Hero */}
        <section className="relative overflow-hidden bg-walnut">
          {category?.image && (
            <div className="absolute inset-0">
              <Image src={category.image} alt={category.name || ''} fill className="object-cover opacity-40" sizes="100vw" priority />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-navy/70 via-navy/40 to-transparent" />
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 md:py-28">
            <Breadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/shop' },
                { label: category?.name || 'Collection' },
              ]}
              onDark
            />
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {category?.name || 'Collection'}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white sm:text-lg">
              {category?.description || 'Browse this collection.'}
            </p>
            {!isLoading && (
              <p className="mt-4 text-sm text-white">
                {products.length} {products.length === 1 ? 'Product' : 'Products'}
              </p>
            )}
          </div>
        </section>

        {/* Products Grid */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {isLoading ? (
            <LoadingState variant="product-grid" count={6} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={undefined}
              title="No products in this category"
              description="New products are coming soon. Check back later."
              actionLabel="Browse All Products"
              actionHref="/shop"
            />
          ) : (
            <StaggerChildren className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard
                    product={product}
                    onWishlistToggle={handleWishlistToggle}
                    isWishlisted={isWishlistedFor(product.id)}
                  />
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}