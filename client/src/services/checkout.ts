import axiosInstance from './axios';
import type {
  CheckoutMethodsResponse,
  CheckoutPreview,
  OrderPaymentStatusResponse,
  PayPalCaptureResponse,
  PayPalOrderCreateResponse,
  PaymentIntentResponse,
} from '@/types';

export const fetchCheckoutPreview = async (): Promise<CheckoutPreview> => {
  const response = await axiosInstance.get('/checkout/preview');
  return response.data.data;
};

export const fetchCheckoutMethods = async (): Promise<CheckoutMethodsResponse> => {
  const response = await axiosInstance.get('/checkout/methods');
  return response.data.data;
};

export const createOrderPaymentIntent = async (orderId: string): Promise<PaymentIntentResponse> => {
  const response = await axiosInstance.post('/checkout/payment-intent', { orderId });
  return response.data.data;
};

export const fetchOrderPaymentStatus = async (
  orderId: string
): Promise<OrderPaymentStatusResponse> => {
  const response = await axiosInstance.get(`/checkout/orders/${orderId}/payment`);
  return response.data.data;
};

export const createPayPalOrder = async (data: {
  orderId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<PayPalOrderCreateResponse> => {
  const response = await axiosInstance.post('/checkout/paypal/create', data);
  return response.data.data;
};

export const capturePayPalOrder = async (data: {
  orderId: string;
  paypalOrderId: string;
}): Promise<PayPalCaptureResponse> => {
  const response = await axiosInstance.post('/checkout/paypal/capture', data);
  return response.data.data;
};