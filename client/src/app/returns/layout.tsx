import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Returns & Exchanges',
  description:
    'ZOYA GOODS makes returns simple. Review our 30-day returns and exchange policy for luxury purchases made online.',
  path: '/returns',
  keywords: ['ZOYA GOODS returns', 'exchange policy', 'refunds'],
});

export default function ReturnsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}