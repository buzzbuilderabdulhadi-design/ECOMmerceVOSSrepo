import axiosInstance from './axios';
import type { Review } from '@/types';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const fetchProductReviews = async (slug: string, params?: Record<string, string>): Promise<{ data: Review[]; pagination: PaginationMeta }> => {
  const response = await axiosInstance.get(`/reviews/product/${slug}`, { params });
  return response.data;
};

export const createReview = async (data: {
  productId: string;
  rating: number;
  title?: string;
  text?: string;
  images?: string[];
}): Promise<Review> => {
  const response = await axiosInstance.post('/reviews', data);
  return response.data.data;
};

export const markReviewHelpful = async (id: string): Promise<void> => {
  await axiosInstance.patch(`/reviews/${id}/helpful`);
};
