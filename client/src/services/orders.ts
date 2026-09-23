import axiosInstance from './axios';
import type { Order } from '@/types';

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const createOrder = async (data: {
  shippingAddressId?: string;
  notes?: string;
  couponCode?: string;
  paymentMethod?: string;
  idempotencyKey?: string;
}): Promise<Order> => {
  const response = await axiosInstance.post('/orders', data);
  return response.data.data;
};

export const fetchOrders = async (params?: Record<string, string>): Promise<{ data: Order[]; pagination: PaginationMeta }> => {
  const response = await axiosInstance.get('/orders', { params });
  return response.data;
};

export const fetchOrder = async (id: string): Promise<Order> => {
  const response = await axiosInstance.get(`/orders/${id}`);
  return response.data.data;
};

export const cancelOrder = async (id: string): Promise<Order> => {
  const response = await axiosInstance.patch(`/orders/${id}/cancel`);
  return response.data.data;
};
