'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

const sortOptions = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Best Rated', value: 'rating' },
];

function sortFallback(products: any[], sortBy: string) {
  const sorted = [...products];
  switch (sortBy) {
    case 'price_asc': return sorted.sort((a, b) => (a.salePrice ?? a.regularPrice) - (b.salePrice ?? b.regularPrice));
    case 'price_desc': return sorted.sort((a, b) => (b.salePrice ?? b.regularPrice) - (a.salePrice ?? a.regularPrice));
    default: return sorted;
  }
}

function mapFallbackCards(products: any[]) {
  return products.map((p: any) => ({
    id: p.id, name: p.name, slug: p.slug, image: p.image, images: p.images,
    regularPrice: p.regularPrice, salePrice: p.salePrice, discountPercent: p.discountPercent,
    isNew: p.isNew, isBestSeller: p.isBestSeller, stock: p.stock, brand: p.brand, category: p.subcategory,
    colors: p.colors,
  }));
}

function mapProduct(p: any): ProductCardData {
  const firstImage = p.images?.[0];
  return {
    id: p.id, name: p.name, slug: p.slug,
    image: typeof firstImage === 'string' ? firstImage : firstImage?.url || '',
    images: p.images?.map((i: any) => typeof i === 'string' ? i : i.url) || [],
    regularPrice: p.regularPrice, salePrice: p.salePrice, discountPercent: p.discountPercent,
    isNew: p.isNew, isBestSeller: p.isBestSeller, stock: p.stock, brand: p.brand,
    category: p.category?.name,
    colors: p.variants?.map((v: any) => ({ name: v.color, hex: v.colorHex })).filter((v: any) => v.hex),
  };
}

export default function ShopPage() {
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isApi, setIsApi] = useState(true);
  const perPage = 9;

  const load = useCallback(async (page: number, sort: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchProducts({ sort, page: String(page), limit: String(perPage) });
      setProducts(res.data.map(mapProduct));
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
      setIsApi(true);
    } catch {
      setIsApi(false);
      const { allProducts } = await import('@/data/products');
      const fallbackCards = mapFallbackCards(allProducts);
      const sorted = sortFallback(fallbackCards, sort);
      const start = (page - 1) * perPage;
      setProducts(sorted.slice(start, start + perPage));
      setTotalPages(Math.ceil(sorted.length / perPage));
      setTotal(sorted.length);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(currentPage, sortBy); }, [currentPage, sortBy, load]);

  const handleSort = (value: string) => { setSortBy(value); setCurrentPage(1); };

  if (error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-32"><ErrorState message={error} onRetry={() => load(currentPage, sortBy)} /></div>
        <Footer />
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        {/* ============ Editorial header ============ */}
        <section className="relative overflow-hidden pb-8 pt-24 md:pb-14 md:pt-36">
          <span className="display-outline pointer-events-none absolute -right-4 top-10 select-none font-display text-[8rem] leading-none opacity-50 sm:text-[13rem]">
            Shop
          </span>
          <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-sage/10 blur-[100px]" />

          <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-8 lg:px-12">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Shop' }]} />
            <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
              <div>
                <TextReveal
                  as="h1"
                  text="All Products"
                  className="font-display text-5xl font-light text-navy sm:text-6xl lg:text-7xl"
                />
                <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate sm:text-base">
                  Browse our complete collection of premium jackets and luxury accessories.
                </p>
              </div>
              <p className="font-display text-2xl font-light text-navy">
                {isApi ? `${total}` : `${total}`} <span className="text-sm uppercase tracking-[0.2em] text-slate">Pieces</span>
              </p>
            </div>
          </div>
        </section>

        {/* ============ Toolbar ============ */}
        <div className="hairline-b hairline-t bg-white/40">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12">
            <p className="text-xs uppercase tracking-[0.2em] text-slate">
              {isApi ? `Showing ${products.length} of ${total}` : `${total} products`}
            </p>
            <div className="flex items-center gap-3">
              <label htmlFor="sort" className="text-[11px] uppercase tracking-[0.2em] text-slate">Sort by</label>
              <div className="relative">
                <select
                  id="sort" value={sortBy}
                  onChange={(e) => handleSort(e.target.value)}
                  className="appearance-none rounded-full border border-navy/15 bg-white py-2 pl-4 pr-10 text-xs uppercase tracking-[0.15em] text-navy focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 transition-colors"
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
        <div className="mx-auto max-w-[1400px] px-4 py-14 sm:px-8 lg:px-12">
          {isLoading ? (
            <LoadingState variant="product-grid" count={perPage} />
          ) : products.length === 0 ? (
            <EmptyState
              icon={undefined} title="No products found"
              description="Try adjusting your filters or browse our categories."
              actionLabel="View All Products" actionHref="/shop"
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product, index) => (
                  <ScrollReveal key={product.id} delay={(index % 3) * 0.08}>
                    <ProductCard product={product} index={index} />
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
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentPage(i + 1)}
                      className={currentPage === i + 1
                        ? 'flex h-11 w-11 items-center justify-center rounded-full bg-navy font-display text-lg text-cream'
                        : 'flex h-11 w-11 items-center justify-center rounded-full border border-navy/15 font-display text-lg text-navy transition-all hover:border-sage hover:bg-sage/15 active:scale-90'}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </button>
                  ))}
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
