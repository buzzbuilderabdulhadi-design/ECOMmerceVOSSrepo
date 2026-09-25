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

// In-flight dedupe keyed by param signature: concurrent identical order-list
// fetches (dev StrictMode double-mounts, multiple callers) share one request.
const orderRequests = new Map<string, Promise<{ data: Order[]; pagination: PaginationMeta }>>();

export const fetchOrders = (params?: Record<string, string>): Promise<{ data: Order[]; pagination: PaginationMeta }> => {
  const key = JSON.stringify(params || {});
  let request = orderRequests.get(key);
  if (!request) {
    request = axiosInstance
      .get('/orders', { params })
      .then((response) => response.data)
      .finally(() => {
        orderRequests.delete(key);
      });
    orderRequests.set(key, request);
  }
  return request;
};

export const fetchOrder = async (id: string): Promise<Order> => {
  const response = await axiosInstance.get(`/orders/${id}`);
  return response.data.data;
};

export const cancelOrder = async (id: string): Promise<Order> => {
  const response = await axiosInstance.patch(`/orders/${id}/cancel`);
  return response.data.data;
};
