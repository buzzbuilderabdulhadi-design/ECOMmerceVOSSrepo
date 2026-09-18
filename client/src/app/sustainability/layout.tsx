import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Sustainability',
  description:
    'ZOYA GOODS is committed to sustainable luxury — ethical manufacturing, responsible sourcing, and a reduced environmental footprint.',
  path: '/sustainability',
  keywords: ['ZOYA GOODS sustainability', 'ethical fashion', 'sustainable luxury'],
});

export default function SustainabilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}