import axiosInstance from './axios';
import type { Product } from '@/types';

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

export const fetchProduct = async (slug: string): Promise<Product> => {
  const response = await axiosInstance.get(`/products/${slug}`);
  return response.data.data;
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
