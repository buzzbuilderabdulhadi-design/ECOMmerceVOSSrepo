import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Size Guide',
  description:
    'Find your perfect fit with the ZOYA GOODS size guide. Detailed measurement charts for jackets, clothing, shoes, and accessories.',
  path: '/size-guide',
  keywords: ['ZOYA GOODS size guide', 'measurement chart', 'fit guide'],
});

export default function SizeGuideLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}