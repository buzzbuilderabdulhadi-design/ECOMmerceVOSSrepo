import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Affiliate Program',
  description:
    'Join the ZOYA GOODS affiliate program and earn commission by sharing luxury fashion with your audience.',
  path: '/affiliates',
  keywords: ['ZOYA GOODS affiliates', 'affiliate program', 'earn commission'],
});

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}