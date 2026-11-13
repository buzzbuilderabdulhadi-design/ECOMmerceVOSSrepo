import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryView } from '@/components/category/CategoryView';
import { serverGet, serverGetPaginated } from '@/lib/serverApi';
import { toProductCardData } from '@/lib/catalog';
import type { Category, Product } from '@/types';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const [category, productList] = await Promise.all([
    serverGet<Category>(`/categories/${slug}`, 60),
    serverGetPaginated<Product>(
      `/products?category=${encodeURIComponent(slug)}&page=1&limit=100`,
      60
    ),
  ]);

  if (!category) {
    return (
      <main className="min-h-screen bg-porcelain">
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

  return (
    <CategoryView
      key={slug}
      category={category}
      initialProducts={(productList?.data ?? []).map(toProductCardData)}
    />
  );
}