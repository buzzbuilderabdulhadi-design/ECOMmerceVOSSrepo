import axiosInstance from './axios';
import type { User } from '@/types';

export const fetchProfile = async (): Promise<User> => {
  const response = await axiosInstance.get('/auth/me');
  return response.data.data;
};

export const updateProfile = async (data: { name?: string; phone?: string; avatar?: string }): Promise<User> => {
  const response = await axiosInstance.put('/users/profile', data);
  return response.data.data;
};

export const changePassword = async (data: { currentPassword: string; newPassword: string }): Promise<void> => {
  await axiosInstance.put('/auth/password', data);
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/users/account');
};
