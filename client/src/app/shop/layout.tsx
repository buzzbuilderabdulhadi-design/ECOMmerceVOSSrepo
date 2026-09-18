import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shop All',
  description:
    'Browse the full ZOYA GOODS collection of luxury clothing, leather jackets, bags, shoes, and accessories. Free shipping on orders over $150.',
  path: '/shop',
  keywords: ['luxury fashion', 'designer clothing', 'shop luxury', 'ZOYA GOODS'],
});

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
