'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageTransition } from '@/components/animations/PageTransition';
import { ImageGallery } from '@/components/product/ImageGallery';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { SizeSelector } from '@/components/ui/SizeSelector';
import { QuantitySelector } from '@/components/ui/QuantitySelector';
import { Tabs } from '@/components/ui/Tabs';
import { ReviewCard } from '@/components/product/ReviewCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextReveal } from '@/components/animations/TextReveal';
import { Magnetic } from '@/components/animations/Magnetic';
import { LoadingState } from '@/components/shared/LoadingState';
import { fetchProduct } from '@/services/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';

interface DetailProduct {
  id: string; name: string; slug: string; sku: string;
  description: string; regularPrice: number; salePrice?: number;
  discountPercent?: number; images: string[]; brand: string;
  category: string; subcategoryName: string;
  rating: number; reviewCount: number;
  colors: { name: string; hex: string }[];
  sizes: string[]; stock: number; material: string;
  specifications: Record<string, string>;
  isNew?: boolean; isBestSeller?: boolean;
}

function mapToDetail(p: any, reviews?: any[]): DetailProduct | null {
  if (!p) return null;
  const variants = p.variants || [];
  const colorsMap = new Map<string, string>();
  const sizesSet = new Set<string>();
  variants.forEach((v: any) => { colorsMap.set(v.color, v.colorHex); sizesSet.add(v.size); });
  return {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku,
    description: p.description || '',
    regularPrice: p.regularPrice, salePrice: p.salePrice, discountPercent: p.discountPercent,
    images: p.images?.map((i: any) => typeof i === 'string' ? i : i.url) || [],
    brand: p.brand || '', category: p.category?.name || '', subcategoryName: p.category?.name || '',
    rating: reviews?.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : 0,
    reviewCount: reviews?.length || 0,
    colors: Array.from(colorsMap.entries()).map(([name, hex]) => ({ name, hex })),
    sizes: Array.from(sizesSet), stock: p.stock || 0,
    material: p.material || '',
    specifications: { Material: p.material || 'N/A', Origin: 'Imported' },
    isNew: p.isNew, isBestSeller: p.isBestSeller,
  };
}

function fallbackDetail(slug: string, products: any[]): DetailProduct | null {
  const p = products.find((x: any) => x.slug === slug);
  if (!p) return null;
  return {
    id: p.id, name: p.name, slug: p.slug, sku: p.sku,
    description: p.description,
    regularPrice: p.regularPrice, salePrice: p.salePrice, discountPercent: p.discountPercent,
    images: p.images, brand: p.brand,
    category: p.category, subcategoryName: p.subcategory,
    rating: p.rating, reviewCount: p.reviewCount,
    colors: p.colors, sizes: p.sizes,
    stock: p.stock, material: p.material,
    specifications: { Material: p.material, Fit: p.sizes.length > 4 ? 'Regular Fit' : 'Standard', Origin: 'Imported' },
    isNew: p.isNew, isBestSeller: p.isBestSeller,
  };
}

export default function ProductDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();
  const { addItem } = useCart();
  const { items: wishlistItems, isInWishlist, addItem: addWishlist, removeItem: removeWishlist } = useWishlist();

  const [detailProduct, setDetailProduct] = useState<DetailProduct | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string }>({ name: '', hex: '' });
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchProduct(slug)
      .then((data: any) => {
        const mapped = mapToDetail(data, data.reviews);
        setDetailProduct(mapped);
        setVariants(data.variants || []);
        setReviews(data.reviews || []);
        if (mapped) {
          setSelectedColor(mapped.colors[0] || { name: '', hex: '' });
          setSelectedSize(mapped.sizes[1] || mapped.sizes[0] || '');
        }
      })
      .catch(async () => {
        const { allProducts } = await import('@/data/products');
        const fb = fallbackDetail(slug, allProducts);
        if (fb) {
          setDetailProduct(fb);
          setSelectedColor(fb.colors[0] || { name: '', hex: '' });
          setSelectedSize(fb.sizes[1] || fb.sizes[0] || '');
        } else {
          setError('Product not found');
        }
      })
      .finally(() => setIsLoading(false));
  }, [slug]);

  const matchingVariant =
    variants.find(
      (v: any) =>
        v.color === selectedColor.name &&
        v.size === selectedSize &&
        v.isActive !== false
    ) || null;

  const handleAddToCart = async () => {
    if (!detailProduct) return;
    const variantId = matchingVariant?.id;
    const productForCart = {
      id: detailProduct.id,
      name: detailProduct.name,
      slug: detailProduct.slug,
      regularPrice: detailProduct.regularPrice,
      salePrice: detailProduct.salePrice,
      images: detailProduct.images,
      stock: detailProduct.stock,
    } as any;
    const ok = await addItem(productForCart, quantity, variantId);
    if (ok) toast.success('Added to cart');
    else toast.error('Could not add this item to your cart.');
  };

  const handleBuyNow = async () => {
    if (!detailProduct) return;
    const variantId = matchingVariant?.id;
    const productForCart = {
      id: detailProduct.id,
      name: detailProduct.name,
      slug: detailProduct.slug,
      regularPrice: detailProduct.regularPrice,
      salePrice: detailProduct.salePrice,
      images: detailProduct.images,
      stock: detailProduct.stock,
    } as any;
    const ok = await addItem(productForCart, quantity, variantId);
    if (ok) router.push('/checkout');
    else toast.error('Could not add this item to your cart.');
  };

  const handleWishlistToggle = async () => {
    if (!detailProduct) return;
    const productId = detailProduct.id;
    const variantId = matchingVariant?.id;
    if (isInWishlist(productId, variantId)) {
      const item = wishlistItems.find(
        (i) => i.productId === productId && (variantId ? i.variantId === variantId : true)
      );
      const ok = item ? await removeWishlist(item.id) : true;
      if (ok) toast.success('Removed from wishlist');
      else toast.error('Could not update your wishlist.');
    } else {
      const ok = await addWishlist({ id: productId, name: detailProduct.name, slug: detailProduct.slug, regularPrice: detailProduct.regularPrice, salePrice: detailProduct.salePrice, images: detailProduct.images, stock: detailProduct.stock, variantId } as any);
      if (ok) toast.success('Added to wishlist');
      else toast.error('Could not update your wishlist.');
    }
  };

  if (error) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="pt-36">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="font-display text-3xl font-light text-navy">Product not found</h1>
            <p className="mt-2 text-slate">The product you're looking for doesn't exist.</p>
            <Link href="/shop" className="mt-4 inline-block text-walnut underline">Back to Shop</Link>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (isLoading || !detailProduct) {
    return (
      <main className="min-h-screen">
        <Navbar />
        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 lg:px-12">
          <LoadingState variant="product-detail" />
        </div>
        <Footer />
      </main>
    );
  }

  const hasDiscount = typeof detailProduct.salePrice === 'number' && detailProduct.salePrice < detailProduct.regularPrice;
  const savings = hasDiscount && typeof detailProduct.salePrice === 'number'
    ? detailProduct.regularPrice - detailProduct.salePrice
    : 0;

  return (
    <PageTransition>
      <main className="min-h-screen">
        <Navbar />

        <div className="mx-auto max-w-[1400px] px-4 pt-24 sm:px-8 lg:px-12">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Shop', href: '/shop' },
              { label: detailProduct.subcategoryName || detailProduct.category, href: `/category/${(detailProduct.subcategoryName || detailProduct.category).toLowerCase().replace(/\s+/g, '-')}` },
              { label: detailProduct.name },
            ]}
          />
        </div>

        <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
            {/* ============ Gallery ============ */}
            <ScrollReveal direction="left">
              <ImageGallery images={detailProduct.images} alt={detailProduct.name} />
            </ScrollReveal>

            {/* ============ Info ============ */}
            <ScrollReveal direction="right" delay={0.1}>
              <div className="lg:sticky lg:top-32">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-sage-dark">{detailProduct.brand}</p>
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  <p className="text-xs text-slate">SKU: {detailProduct.sku}</p>
                </div>

                <TextReveal
                  as="h1"
                  text={detailProduct.name}
                  className="mt-4 font-display text-4xl font-light leading-[1.05] text-navy sm:text-5xl lg:text-6xl"
                />

                <div className="mt-6 flex flex-wrap items-center gap-5">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-4xl font-light text-walnut">
                      ${(detailProduct.salePrice ?? detailProduct.regularPrice).toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <>
                        <span className="text-lg text-slate line-through">${detailProduct.regularPrice.toFixed(2)}</span>
                        {detailProduct.discountPercent != null && (
                          <Badge variant="sale" size="sm">-{detailProduct.discountPercent}%</Badge>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-walnut">★★★★★</span>
                    <span className="text-sm text-slate">{detailProduct.rating.toFixed(1)} ({detailProduct.reviewCount} reviews)</span>
                  </div>
                </div>
                {savings > 0 && <p className="mt-2 text-sm text-sage-dark font-medium">You save ${savings.toFixed(2)}</p>}

                <p className="mt-7 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
                  {detailProduct.description}
                </p>

                <div className="mt-6 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sage animate-pulse" />
                  <span className="text-sm font-medium text-sage-dark">In Stock ({detailProduct.stock} available)</span>
                </div>

                {/* Color */}
                {detailProduct.colors.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium uppercase tracking-[0.25em] text-navy">
                        Color — <span className="text-sage-dark">{selectedColor.name || 'Select'}</span>
                      </label>
                    </div>
                    <div className="mt-3">
                      <ColorSwatch colors={detailProduct.colors} selectedColor={selectedColor.name} onChange={(c) => setSelectedColor({ name: c.name, hex: c.hex })} />
                    </div>
                  </div>
                )}

                {/* Size */}
                {detailProduct.sizes.length > 0 && (
                  <div className="mt-7">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-medium uppercase tracking-[0.25em] text-navy">Size</label>
                      <button type="button" onClick={() => setIsSizeGuideOpen(true)} className="link-underline text-xs text-walnut transition-colors hover:text-walnut-light">Size Guide</button>
                    </div>
                    <div className="mt-3">
                      <SizeSelector
                        sizes={detailProduct.sizes.map((s) => ({ label: s, value: s }))}
                        selectedSize={selectedSize}
                        onChange={(size) => setSelectedSize(size.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Qty + CTAs */}
                <div className="mt-9 space-y-5">
                  <div className="flex items-center gap-5">
                    <label className="text-[11px] font-medium uppercase tracking-[0.25em] text-navy">Quantity</label>
                    <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={detailProduct.stock} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Magnetic className="flex-1">
                      <Button variant="primary" size="lg" fullWidth onClick={handleAddToCart}>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Add to Cart
                      </Button>
                    </Magnetic>
                    <Magnetic className="flex-1">
                      <Button variant="gold" size="lg" fullWidth onClick={handleBuyNow}>
                        Buy Now
                      </Button>
                    </Magnetic>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    className="text-walnut hover:text-walnut-light"
                    onClick={handleWishlistToggle}
                  >
                    <svg className="mr-2 h-4 w-4" fill={isInWishlist(detailProduct.id, matchingVariant?.id) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {isInWishlist(detailProduct.id, matchingVariant?.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  </Button>
                </div>

                {/* Trust strip */}
                <div className="mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-sage-light/30 bg-sage-light/30">
                  {[
                    { label: 'Free Shipping', desc: 'On orders over $200' },
                    { label: 'Easy Returns', desc: '30-day return policy' },
                    { label: 'Secure Checkout', desc: 'SSL encrypted' },
                    { label: 'Worldwide', desc: 'International shipping' },
                  ].map((item) => (
                    <div key={item.label} className="bg-cream/70 px-5 py-4">
                      <p className="font-display text-base text-walnut">{item.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* ============ Tabs ============ */}
          <div className="mt-24">
            <Tabs
              tabs={[
                {
                  id: 'description', label: 'Description',
                  content: <div className="max-w-none"><p className="font-display text-2xl font-light leading-relaxed text-navy">{detailProduct.description}</p></div>,
                },
                {
                  id: 'specifications', label: 'Specifications',
                  content: (
                    <div className="grid max-w-3xl grid-cols-1 gap-x-10 sm:grid-cols-2">
                      {Object.entries(detailProduct.specifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between border-b border-sage-light/40 py-4">
                          <span className="text-[11px] uppercase tracking-[0.2em] text-slate">{key}</span>
                          <span className="font-display text-lg text-navy">{value}</span>
                        </div>
                      ))}
                    </div>
                  ),
                },
                {
                  id: 'reviews', label: `Reviews (${detailProduct.reviewCount})`,
                  content: (
                    <div className="max-w-3xl space-y-6">
                      {reviews.length === 0 ? (
                        <p className="text-sm text-slate">No reviews yet.</p>
                      ) : (
                        reviews.map((review: any) => (
                          <ReviewCard key={review.id} review={{
                            id: review.id,
                            customerName: review.user?.name || 'Anonymous',
                            rating: review.rating,
                            date: review.createdAt,
                            text: review.text || '',
                            isVerifiedPurchase: review.isVerifiedPurchase,
                            helpfulCount: review.helpfulCount,
                          }} />
                        ))
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <Footer />
      </main>

      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Guide"
        size="md"
      >
        {detailProduct?.sizes.length ? (
          <div className="space-y-4">
            <p className="text-sm text-slate">
              Measurements are in inches. For a relaxed fit, size up.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-sage-light/40 text-left">
                    <th className="py-2 pr-4 font-medium text-navy">Size</th>
                    <th className="py-2 pr-4 font-medium text-navy">Chest</th>
                    <th className="py-2 font-medium text-navy">Length</th>
                  </tr>
                </thead>
                <tbody>
                  {detailProduct.sizes.map((size, idx) => (
                    <tr key={size} className="border-b border-sage-light/20">
                      <td className="py-2 pr-4 text-navy">{size}</td>
                      <td className="py-2 pr-4 text-slate">{38 + idx * 2}</td>
                      <td className="py-2 text-slate">{26 + idx * 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate">Size information is not available for this product.</p>
        )}
      </Modal>
    </PageTransition>
  );
}
