import type { Metadata } from 'next';
import { allProducts } from '@/data/products';
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = allProducts.find((item) => item.slug === slug);

  if (!product) {
    return pageMetadata({
      title: titleFromSlug(slug),
      path: `/products/${slug}`,
    });
  }

  return pageMetadata({
    title: product.name,
    description: product.description,
    path: `/products/${slug}`,
    images: product.images.length ? product.images : [product.image],
    type: 'article',
    keywords: [product.name, product.category, product.subcategory, 'ZOYA GOODS'],
  });
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = allProducts.find((item) => item.slug === slug);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: 'Home', path: '/' },
              { name: 'Shop', path: '/shop' },
              { name: product?.name || titleFromSlug(slug), path: `/products/${slug}` },
            ])
          ),
        }}
      />
      {children}
    </>
  );
}
