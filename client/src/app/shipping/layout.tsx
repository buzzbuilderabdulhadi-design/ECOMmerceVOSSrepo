import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Shipping & Delivery',
  description:
    'Learn about ZOYA GOODS shipping and delivery options. Complimentary worldwide shipping on orders over $200, with express delivery available.',
  path: '/shipping',
  keywords: ['ZOYA GOODS shipping', 'delivery', 'worldwide shipping', 'express delivery'],
});

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}