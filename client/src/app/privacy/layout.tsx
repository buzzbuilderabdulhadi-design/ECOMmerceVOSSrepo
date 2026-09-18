import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Privacy Policy',
  description:
    'Read the ZOYA GOODS privacy policy to understand how we collect, use, and protect your personal information.',
  path: '/privacy',
  keywords: ['ZOYA GOODS privacy policy', 'data protection', 'GDPR'],
});

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}