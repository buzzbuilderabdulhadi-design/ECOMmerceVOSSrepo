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

export const fetchFeaturedCategories = async (): Promise<Category[]> => {
  const response = await axiosInstance.get('/categories/featured');
  return response.data.data;
};
