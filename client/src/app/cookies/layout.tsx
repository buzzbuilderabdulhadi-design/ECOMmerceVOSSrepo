import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Cookie Policy',
  description:
    'Learn how ZOYA GOODS uses cookies and similar technologies to improve your shopping experience and personalize content.',
  path: '/cookies',
  keywords: ['ZOYA GOODS cookie policy', 'cookies', 'tracking'],
});

export default function CookiesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}