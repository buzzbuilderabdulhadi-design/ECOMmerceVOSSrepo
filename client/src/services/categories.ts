import axiosInstance from './axios';
import type { Category } from '@/types';

export const fetchCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories');
  return response.data.data;
};

export const fetchCategory = async (slug: string): Promise<Category> => {
  const response = await axiosInstance.get(`/categories/${slug}`);
  return response.data.data;
};

// Module-level in-flight dedupe: several sections can request the featured
// category set during the same render pass (and dev StrictMode double-mounts
// effects). Sharing the in-flight promise means one HTTP request covers them
// all; the cache clears as soon as the request settles.
let featuredPromise: Promise<Category[]> | null = null;

export const fetchFeaturedCategories = (): Promise<Category[]> => {
  if (!featuredPromise) {
    featuredPromise = axiosInstance
      .get('/categories/featured')
      .then((response) => response.data.data as Category[])
      .finally(() => {
        featuredPromise = null;
      });
  }
  return featuredPromise;
};
