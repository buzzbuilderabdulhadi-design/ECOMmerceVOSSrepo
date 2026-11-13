import type { Product } from '@/types';
import { serverGetPaginated } from '@/lib/serverApi';
import { SHOP_PER_PAGE, toProductCardData } from '@/lib/catalog';
import { ShopView } from '@/components/shop/ShopView';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

function first(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  const search = first(sp.search);
  const saleParam = first(sp.sale);
  const bestParam = first(sp.isBestSeller);
  const sortParam = first(sp.sort);
  const isSaleView = saleParam === 'true';
  const isBestSellerView = bestParam === 'true' || sortParam === 'best';
  const initialSort = ['newest', 'price_asc', 'price_desc', 'rating'].includes(sortParam)
    ? sortParam
    : 'newest';

  const query = new URLSearchParams();
  query.set('sort', initialSort);
  query.set('page', '1');
  query.set('limit', String(SHOP_PER_PAGE));
  if (search) query.set('search', search);
  if (isSaleView) query.set('isSale', 'true');
  if (isBestSellerView) query.set('isBestSeller', 'true');

  const initial = await serverGetPaginated<Product>(`/products?${query.toString()}`, 60);

  // Keying the island by the full filter context forces a fresh mount when the
  // URL's filters change, so server-rendered data and client state never drift.
  const filterKey = `${search}|${saleParam}|${bestParam}|${sortParam}`;

  return (
    <ShopView
      key={filterKey}
      initialProducts={(initial?.data ?? []).map(toProductCardData)}
      total={initial?.pagination.total ?? 0}
      totalPages={initial?.pagination.totalPages ?? 1}
      search={search}
      isSaleView={isSaleView}
      isBestSellerView={isBestSellerView}
      initialSort={initialSort}
    />
  );
}