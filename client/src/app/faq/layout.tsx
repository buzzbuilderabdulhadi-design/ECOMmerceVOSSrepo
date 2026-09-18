import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Frequently Asked Questions',
  description:
    'Answers to the most common questions about ZOYA GOODS — ordering, shipping, returns, sizing, and caring for your luxury pieces.',
  path: '/faq',
  keywords: ['ZOYA GOODS FAQ', 'ordering help', 'shipping questions', 'returns policy'],
});

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}