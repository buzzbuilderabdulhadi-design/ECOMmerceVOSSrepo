import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductDetailView } from '@/components/product/ProductDetailView';
import { ProductDetailError } from '@/components/product/ProductDetailError';
import { serverGet, serverGetWithStatus } from '@/lib/serverApi';
import { toProductCardData } from '@/lib/catalog';
import type { Product, ProductDetail } from '@/types';

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProductDetailsPage({ params }: Props) {
  const { slug } = await params;

  const [productResult, related] = await Promise.all([
    serverGetWithStatus<ProductDetail>(`/products/${slug}`, 60),
    serverGet<Product[]>(`/products/${slug}/related`, 60),
  ]);

  if (!productResult.ok && productResult.notFound) {
    return (
      <main className="min-h-screen bg-porcelain">
        <Navbar />
        <div className="mx-auto max-w-[1400px] px-5 pt-36 text-center sm:px-8 lg:px-12">
          <h1 className="font-display text-3xl font-light text-navy">Product not found</h1>
          <p className="mt-2 text-slate">The product you&rsquo;re looking for doesn&rsquo;t exist.</p>
          <Link href="/shop" className="mt-4 inline-block text-walnut underline">Back to Shop</Link>
        </div>
        <Footer />
      </main>
    );
  }

  if (!productResult.ok || !productResult.data) {
    return (
      <ProductDetailError message="We couldn't reach the product catalog right now. Please try again." />
    );
  }

  return (
    <ProductDetailView
      key={slug}
      product={productResult.data}
      related={(related ?? []).map(toProductCardData)}
    />
  );
}