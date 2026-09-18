import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Careers',
  description:
    'Join the ZOYA GOODS atelier. Explore open roles in design, craftsmanship, retail, and digital at one of the world’s most loved luxury houses.',
  path: '/careers',
  keywords: ['ZOYA GOODS careers', 'jobs', 'luxury fashion careers'],
});

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}