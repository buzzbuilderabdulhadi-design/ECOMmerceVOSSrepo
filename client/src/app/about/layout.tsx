import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'About Us',
  description:
    'Discover the ZOYA GOODS story — founded in Milan in 1991, handcrafted luxury leather goods defined by timeless design, premium materials, and artisan craftsmanship.',
  path: '/about',
  keywords: ['about ZOYA GOODS', 'luxury brand story', 'handcrafted leather', 'Milan fashion'],
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}