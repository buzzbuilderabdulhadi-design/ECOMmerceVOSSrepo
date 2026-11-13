'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ProductCard, type ProductCardData } from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { LoadingState } from '@/components/shared/LoadingState';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { fetchProducts } from '@/services/products';
import { getErrorMessage } from '@/services/axios';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { SHOP_PER_PAGE } from '@/lib/catalog';
import { toProductCardData } from '@/lib/catalog';
import type { Product } from '@/types';
import toast from 'react-hot-toast';

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Rated', value: 'rating' },
];

interface ShopViewProps {
  initialProducts: ProductCardData[];
  total: number;
  totalPages: number;
  search: string;
  isSaleView: boolean;
  isBestSellerView: boolean;
  initialSort: string;
}

export function ShopView({
  initialProducts,
  total: initialTotal,
  totalPages: initialTotalPages,
  search,
  isSaleView,
  isBestSellerView,
  initialSort,
}: ShopViewProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [products, setProducts] = useState<ProductCardData[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [total, setTotal] = useState(initialTotal);
  const didMount = useRef(false);

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

  const load = useCallback(
    async (page: number, sort: string, q: string) => {
      setIsLoading(true);
      try {
        const res = await fetchProducts({
          sort,
          page: String(page),
          limit: String(SHOP_PER_PAGE),
          ...(q ? { search: q } : {}),
          ...(isSaleView ? { isSale: 'true' } : {}),
          ...(isBestSellerView ? { isBestSeller: 'true' } : {}),
        });
        setProducts(res.data.map(toProductCardData));
        setTotalPages(res.pagination.totalPages);
        setTotal(res.pagination.total);
        setError(null);
      } catch (err) {
        setError(getErrorMessage(err) || 'Failed to load products.');
      } finally {
        setIsLoading(false);
      }
    },
    [isSaleView, isBestSellerView]
  );

  // The first render is hydrated from the server payload; only fetch when the
  // user actually changes sort / page (or searches), so we never re-request
  // the data that was already in the initial HTML.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    void Promise.resolve().then(() => load(currentPage, sortBy, search));
  }, [currentPage, sortBy, search, load]);

  const handleSort = (value: string) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  const errorStateHeading = isBestSellerView
    ? 'No best sellers right now'
    : isSaleView
      ? 'Nothing on sale right now'
      : search
        ? `No matches for “${search}”`
        : 'No products found';

  const heading = isBestSellerView
    ? 'Best Sellers'
    : isSaleView
      ? 'The Sale Collection'
      : search
        ? `Results for “${search}”`
        : 'All Products';

  const description = isBestSellerView
    ? 'The pieces our customers reach for again and again.'
    : isSaleView
      ? 'Limited-time reductions on selected luxury pieces.'
      : search
        ? 'Hand-picked matches from the complete ZOYA GOODS collection.'
        : 'Browse our complete collection of premium jackets and luxury accessories.';

  if (error) {
    return (
      <main className="min-h-screen bg-porcelain">
        <Navbar />
        <div className="pt-32"><ErrorState message={error} onRetry={() => load(currentPage, sortBy, search)} /></div>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-porcelain">
        <Navbar />

        {/* ============ Editorial header ============ */}
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span aria-hidden="true" className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[13rem]">
            Shop
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <TextReveal
                  as="h1"
                  text={heading}
                  className="font-display text-5xl font-light text-navy sm:text-6xl lg:text-7xl"
                />
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                  {description}
                </p>
              </div>
              <p className="font-display text-2xl font-light text-navy">
                {total} <span className="text-sm uppercase tracking-[0.2em] text-slate">Pieces</span>
              </p>
            </div>
          </div>
        </section>

        {/* ============ Toolbar ============ */}
        <div className="hairline-b hairline-t bg-white/40">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">
              Showing {products.length} of {total}
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-[11px] uppercase tracking-[0.2em] text-slate">Sort by</label>
              <div className="relative">
                <select
                  id="sort" value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="appearance-none rounded-full border border-navy/15 bg-white py-2 pl-4 pr-10 text-xs uppercase tracking-[0.15em] text-navy focus:border-navy-soft focus:outline-none focus:ring-1 focus:ring-navy-soft/40 transition-colors"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ============ Products ============ */}
        <div className="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 lg:px-12">
          {isLoading ? (
            <LoadingState variant="product-grid" count={SHOP_PER_PAGE} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={undefined}
              title={errorStateHeading}
              description="Try a different keyword or browse our categories."
              actionLabel="View All Products" actionHref="/shop"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} delay={(index % 3) * 0.08}>
                    <ProductCard
                      product={product}
                      index={index}
                      onWishlistToggle={handleWishlistToggle}
                      isWishlisted={isWishlistedFor(product.id)}
                    />
                  </ScrollReveal>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-20 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 text-navy transition-all hover:border-sage-dark hover:bg-sage-dark hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Previous page"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  {(() => {
                    const windowStart = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                    const windowEnd = Math.min(totalPages, Math.max(currentPage + 2, 5));
                    const pageButtons: (number | '…')[] = [];
                    if (windowStart > 1) pageButtons.push(1);
                    if (windowStart > 2) pageButtons.push('…');
                    for (let i = windowStart; i <= windowEnd; i++) pageButtons.push(i);
                    if (windowEnd < totalPages - 1) pageButtons.push('…');
                    if (windowEnd < totalPages) pageButtons.push(totalPages);
                    return pageButtons.map((p, idx) => p === '…' ? (
                      <span key={`e-${idx}`} className="px-1 text-slate">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCurrentPage(p)}
                        className={currentPage === p
                          ? 'flex h-11 w-11 items-center justify-center rounded-full bg-navy font-display text-lg text-cream'
                          : 'flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 font-display text-lg text-navy transition-all hover:border-sage hover:bg-sage/15 active:scale-90'}
                      >
                        {String(p).padStart(2, '0')}
                      </button>
                    ));
                  })()}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 text-navy transition-all hover:border-sage-dark hover:bg-sage-dark hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Next page"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <Footer />
      </main>
    </PageTransition>
  );
}