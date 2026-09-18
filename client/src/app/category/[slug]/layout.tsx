import type { Metadata } from 'next';
import { categoryDescriptions } from '@/data/products';
import { breadcrumbJsonLd, pageMetadata } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = categoryDescriptions[slug];

  if (!category) {
    return pageMetadata({
      title: 'Shop Collection',
      path: `/category/${slug}`,
    });
  }

  return pageMetadata({
    title: category.name,
    description: category.description,
    path: `/category/${slug}`,
    images: [category.image],
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
  const category = categoryDescriptions[slug];

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
