import type { Metadata } from 'next';
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from '@/lib/seo';
import { serverGet } from '@/lib/serverApi';

type Props = { params: Promise<{ slug: string }> };

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface ProductMeta {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string | null;
  regularPrice: number;
  salePrice?: number | null;
  stock: number;
  brand?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<string | { url: string }>;
  seoTitle?: string | null;
  seoDescription?: string | null;
}

async function getProductMeta(slug: string): Promise<ProductMeta | null> {
  return serverGet<ProductMeta>(`/products/${slug}`, 60);
}

function imagesOf(product: ProductMeta): string[] {
  return (product.images ?? [])
    .map((i) => (typeof i === 'string' ? i : i.url))
    .filter(Boolean);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductMeta(slug);

  if (!product) {
    return pageMetadata({
      title: titleFromSlug(slug),
      path: `/products/${slug}`,
    });
  }

  return pageMetadata({
    title: product.seoTitle || product.name,
    description: product.seoDescription || product.description || undefined,
    path: `/products/${slug}`,
    images: imagesOf(product),
    type: 'article',
    keywords: [product.name, product.category?.name || 'ZOYA GOODS'].filter(Boolean),
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
  const product = await getProductMeta(slug);

  return (
    <>
      {product && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              productJsonLd({
                name: product.name,
                description: product.description,
                sku: product.sku,
                brand: product.brand,
                category: product.category?.name,
                images: imagesOf(product),
                slug: product.slug,
                stock: product.stock,
                regularPrice: product.regularPrice,
                salePrice: product.salePrice,
              })
            ),
          }}
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