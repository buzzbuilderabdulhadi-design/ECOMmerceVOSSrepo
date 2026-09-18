import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact Us',
  description:
    'Get in touch with the ZOYA GOODS concierge team. We respond to every inquiry — order support, product questions, and styling advice.',
  path: '/contact',
  keywords: ['contact ZOYA GOODS', 'customer support', 'luxury shopping help'],
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}