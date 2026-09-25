import type { Metadata } from 'next';
import { breadcrumbJsonLd, pageMetadata, productJsonLd } from '@/lib/seo';

type Props = { params: Promise<{ slug: string }> };

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
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