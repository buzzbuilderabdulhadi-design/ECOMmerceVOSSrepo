import axiosInstance from './axios';

export const updateProfile = async (data: { name?: string; phone?: string; avatar?: string }) => {
  const response = await axiosInstance.put('/users/profile', data);
  return response.data.data;
};

export const deleteAccount = async (): Promise<void> => {
  await axiosInstance.delete('/users/account');
};
