import type { Metadata } from 'next';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface CategoryMeta {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

async function getCategoryMeta(slug: string): Promise<CategoryMeta | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${API_BASE_URL}/categories/${slug}`, {
        cache: 'force-cache',
        next: { revalidate: 60 },
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json?.data ?? null;
    } finally {
      clearTimeout(timeout);
    }
  } catch {
    return null;
  }
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