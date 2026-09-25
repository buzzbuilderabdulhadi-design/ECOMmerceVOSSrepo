import axiosInstance from './axios';

export interface ContactPayload {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}

export const submitContactMessage = async (data: ContactPayload): Promise<void> => {
  await axiosInstance.post('/contact', data);
};