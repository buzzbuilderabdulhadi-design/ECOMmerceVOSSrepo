import type { Metadata } from 'next';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';
import { serverGet } from '@/lib/serverApi';

type Props = { params: Promise<{ slug: string }> };

interface CategoryMeta {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

async function getCategoryMeta(slug: string): Promise<CategoryMeta | null> {
  return serverGet<CategoryMeta>(`/categories/${slug}`, 60);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryMeta(slug);

  if (!category) {
    return pageMetadata({
      title: 'Shop Collection',
      path: `/category/${slug}`,
    });
  }

  return pageMetadata({
    title: category.name,
    description: category.description || undefined,
    path: `/category/${slug}`,
    images: category.image ? [category.image] : undefined,
    keywords: [category.name, 'luxury fashion', 'ZOYA GOODS'],
  });
}

export default async function CategoryLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryMeta(slug);

  const jsonLd = breadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: category?.name || 'Collection', path: `/category/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}