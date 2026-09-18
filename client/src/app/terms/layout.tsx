import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Terms of Service',
  description:
    'The ZOYA GOODS terms of service outline the conditions governing your use of our website and purchases.',
  path: '/terms',
  keywords: ['ZOYA GOODS terms of service', 'terms and conditions'],
});

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}