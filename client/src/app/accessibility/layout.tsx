import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Accessibility',
  description:
    'ZOYA GOODS is committed to making our website accessible to everyone, including people with disabilities. Learn about our accessibility initiatives.',
  path: '/accessibility',
  keywords: ['ZOYA GOODS accessibility', 'WCAG', 'inclusive shopping'],
});

export default function AccessibilityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}