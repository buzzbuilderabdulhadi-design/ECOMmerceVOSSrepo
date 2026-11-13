import axiosInstance from './axios';
import type { Product, ProductDetail } from '@/types';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

export const fetchProducts = async (params?: Record<string, string>): Promise<PaginatedResult<Product>> => {
  const response = await axiosInstance.get('/products', { params });
  return response.data;
};

// Module-level in-flight dedupe keyed by slug: the product page effect, dev
// StrictMode double-mounts, and any co-mounted consumer share one request for
// the same product instead of firing duplicates. Clears as soon as it settles.
const productRequests = new Map<string, Promise<ProductDetail>>();

export const fetchProduct = (slug: string): Promise<ProductDetail> => {
  let request = productRequests.get(slug);
  if (!request) {
    request = axiosInstance
      .get(`/products/${slug}`)
      .then((response) => response.data.data as ProductDetail)
      .finally(() => {
        productRequests.delete(slug);
      });
    productRequests.set(slug, request);
  }
  return request;
};

export const fetchFeaturedProducts = async (): Promise<Product[]> => {
  const response = await axiosInstance.get('/products/featured');
  return response.data.data;
};

export const fetchNewArrivals = async (): Promise<Product[]> => {
  const response = await axiosInstance.get('/products/new-arrivals');
  return response.data.data;
};

export const fetchBestSellers = async (): Promise<Product[]> => {
  const response = await axiosInstance.get('/products/best-sellers');
  return response.data.data;
};

export const fetchRelatedProducts = async (slug: string): Promise<Product[]> => {
  const response = await axiosInstance.get(`/products/${slug}/related`);
  return response.data.data;
};

export const searchProducts = async (q: string): Promise<Partial<Product>[]> => {
  const response = await axiosInstance.get('/products/search', { params: { q } });
  return response.data.data;
};
