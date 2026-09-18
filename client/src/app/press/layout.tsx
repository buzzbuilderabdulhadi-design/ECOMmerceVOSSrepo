import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Press',
  description:
    'ZOYA GOODS press center — the latest news, campaigns, collections, and media assets from the luxury house.',
  path: '/press',
  keywords: ['ZOYA GOODS press', 'media', 'press releases', 'luxury news'],
});

export default function PressLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}