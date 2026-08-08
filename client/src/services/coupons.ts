import axiosInstance from './axios';
import type { Coupon } from '@/types';

export const validateCoupon = async (code: string, subtotal: number): Promise<Coupon & { discount: number }> => {
  const response = await axiosInstance.post('/coupons/validate', { code, subtotal });
  return response.data.data;
};
