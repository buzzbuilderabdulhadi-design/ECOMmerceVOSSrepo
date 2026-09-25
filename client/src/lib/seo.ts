import type { Metadata } from 'next';

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://zoyagoods.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'ZOYA GOODS';
export const SITE_TAGLINE = 'Luxury Fashion E-Commerce';

export const DEFAULT_TITLE = `${SITE_NAME} — ${SITE_TAGLINE}`;

export const DEFAULT_DESCRIPTION =
  'Discover curated luxury fashion at ZOYA GOODS. Shop premium clothing, leather goods, bags, shoes, and accessories with an unparalleled shopping experience.';

export const DEFAULT_OG_IMAGE =
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=1200&h=630&fit=crop&q=85';

export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

interface PageMetadataOptions {
  title?: string;
  description?: string;
  path: string;
  images?: string[];
  type?: 'website' | 'article';
  keywords?: string[];
  noindex?: boolean;
}

export function pageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  images,
  type = 'website',
  keywords,
  noindex = false,
}: PageMetadataOptions): Metadata {
  const resolvedTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const imageUrls = images && images.length ? images : [DEFAULT_OG_IMAGE];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: resolvedTitle,
      description,
      url: absoluteUrl(path),
      siteName: SITE_NAME,
      type,
      images: imageUrls.map((url) => ({
        url,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${title || SITE_TAGLINE}`,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description,
      images: imageUrls,
    },
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/favicon.ico'),
    description: DEFAULT_DESCRIPTION,
    sameAs: [] as string[],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/shop?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export interface ProductJsonLdInput {
  name: string;
  description?: string | null;
  sku: string;
  brand?: string | null;
  category?: string | null;
  images?: string[];
  image?: string;
  rating?: number;
  reviewCount?: number;
  slug: string;
  stock: number;
  regularPrice: number;
  salePrice?: number | null;
}

export function productJsonLd(product: ProductJsonLdInput) {
  const price = product.salePrice ?? product.regularPrice;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || SITE_NAME },
    category: product.category,
    image: product.images?.length ? product.images : [product.image],
    ...((product.reviewCount ?? 0) > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating ?? 0,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    offers: {
      '@type': 'Offer',
      url: absoluteUrl(`/products/${product.slug}`),
      priceCurrency: 'USD',
      price: price.toFixed(2),
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
