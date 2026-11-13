'use client';

import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ErrorState } from '@/components/shared/ErrorState';

interface ProductDetailErrorProps {
  message: string;
}

export function ProductDetailError({ message }: ProductDetailErrorProps) {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-porcelain">
      <Navbar />
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 lg:px-12">
        <ErrorState
          title="Failed to load product"
          message={message}
          onRetry={() => router.refresh()}
        />
      </div>
      <Footer />
    </main>
  );
}