import axiosInstance from './axios';
import type { Address } from '@/types';

export const fetchAddresses = async (): Promise<Address[]> => {
  const response = await axiosInstance.get('/addresses');
  return response.data.data;
};

export const createAddress = async (data: Omit<Address, 'id'>): Promise<Address> => {
  const response = await axiosInstance.post('/addresses', data);
  return response.data.data;
};

export const updateAddress = async (id: string, data: Partial<Address>): Promise<Address> => {
  const response = await axiosInstance.put(`/addresses/${id}`, data);
  return response.data.data;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/addresses/${id}`);
};
