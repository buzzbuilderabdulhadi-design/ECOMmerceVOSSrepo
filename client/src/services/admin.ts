import axiosInstance from './axios';
import type { Product, Category, Coupon, User } from '@/types';

// ============================================================
// Admin API Service
// ============================================================

type ProductInput = Omit<Partial<Product>, 'salePrice' | 'discountPercent'> & {
  salePrice?: number | null;
  discountPercent?: number | null;
};

const adminApi = {
  // Dashboard
  getDashboard: () => axiosInstance.get('/admin/dashboard').then(r => r.data.data),

  // Analytics
  getAnalytics: () => axiosInstance.get('/admin/analytics').then(r => r.data.data),
  getSalesAnalytics: (days = 30) => axiosInstance.get('/admin/analytics/sales', { params: { days } }).then(r => r.data.data),
  getOrderAnalytics: () => axiosInstance.get('/admin/analytics/orders').then(r => r.data.data),
  getProductAnalytics: () => axiosInstance.get('/admin/analytics/products').then(r => r.data.data),
  getCustomerAnalytics: () => axiosInstance.get('/admin/analytics/customers').then(r => r.data.data),

  // Products
  getProducts: (params?: Record<string, string>) => axiosInstance.get('/admin/products', { params }).then(r => r.data),
  getProduct: (id: string) => axiosInstance.get(`/admin/products/${id}`).then(r => r.data.data),
  createProduct: (data: ProductInput) => axiosInstance.post('/admin/products', data).then(r => r.data),
  updateProduct: (id: string, data: ProductInput) => axiosInstance.put(`/admin/products/${id}`, data).then(r => r.data),
  deleteProduct: (id: string) => axiosInstance.delete(`/admin/products/${id}`).then(r => r.data),
  bulkDeleteProducts: (ids: string[]) => axiosInstance.post('/admin/products/bulk-delete', { ids }).then(r => r.data),
  bulkUpdateProducts: (ids: string[], data: Partial<Product>) => axiosInstance.post('/admin/products/bulk-update', { ids, data }).then(r => r.data),
  duplicateProduct: (id: string) => axiosInstance.post(`/admin/products/${id}/duplicate`).then(r => r.data),

  // Categories
  getCategories: () => axiosInstance.get('/admin/categories').then(r => r.data.data),
  getCategory: (id: string) => axiosInstance.get(`/admin/categories/${id}`).then(r => r.data.data),
  createCategory: (data: Partial<Category>) => axiosInstance.post('/admin/categories', data).then(r => r.data),
  updateCategory: (id: string, data: Partial<Category>) => axiosInstance.put(`/admin/categories/${id}`, data).then(r => r.data),
  deleteCategory: (id: string) => axiosInstance.delete(`/admin/categories/${id}`).then(r => r.data),

  // Orders
  getOrders: (params?: Record<string, string>) => axiosInstance.get('/admin/orders', { params }).then(r => r.data),
  getOrder: (id: string) => axiosInstance.get(`/admin/orders/${id}`).then(r => r.data.data),
  updateOrderStatus: (id: string, data: { status?: string; trackingNumber?: string; notes?: string }) =>
    axiosInstance.patch(`/admin/orders/${id}/status`, data).then(r => r.data),
  verifyOrderPayment: (id: string, status: 'PAID' | 'FAILED') =>
    axiosInstance.patch(`/admin/orders/${id}/payment`, { status }).then(r => r.data.data),
  deleteOrder: (id: string) => axiosInstance.delete(`/admin/orders/${id}`).then(r => r.data),

  // Customers
  getCustomers: (params?: Record<string, string>) => axiosInstance.get('/admin/customers', { params }).then(r => r.data),
  getCustomer: (id: string) => axiosInstance.get(`/admin/customers/${id}`).then(r => r.data.data),
  updateCustomer: (id: string, data: Partial<User>) => axiosInstance.put(`/admin/customers/${id}`, data).then(r => r.data),
  deleteCustomer: (id: string) => axiosInstance.delete(`/admin/customers/${id}`).then(r => r.data),

  // Reviews
  getReviews: (params?: Record<string, string>) => axiosInstance.get('/admin/reviews', { params }).then(r => r.data),
  updateReview: (id: string, data: { isApproved?: boolean; adminReply?: string }) =>
    axiosInstance.put(`/admin/reviews/${id}`, data).then(r => r.data),
  deleteReview: (id: string) => axiosInstance.delete(`/admin/reviews/${id}`).then(r => r.data),

  // Product Questions (Q&A)
  getQuestions: (params?: Record<string, string>) => axiosInstance.get('/admin/questions', { params }).then(r => r.data),
  answerQuestion: (id: string, answer: string) =>
    axiosInstance.put(`/admin/questions/${id}/answer`, { answer }).then(r => r.data),
  deleteQuestion: (id: string) => axiosInstance.delete(`/admin/questions/${id}`).then(r => r.data),

  // Coupons
  getCoupons: (params?: Record<string, string>) => axiosInstance.get('/admin/coupons', { params }).then(r => r.data),
  getCoupon: (id: string) => axiosInstance.get(`/admin/coupons/${id}`).then(r => r.data.data),
  createCoupon: (data: Partial<Coupon>) => axiosInstance.post('/admin/coupons', data).then(r => r.data),
  updateCoupon: (id: string, data: Partial<Coupon>) => axiosInstance.put(`/admin/coupons/${id}`, data).then(r => r.data),
  deleteCoupon: (id: string) => axiosInstance.delete(`/admin/coupons/${id}`).then(r => r.data),

  // Media
  getMedia: (folder?: string) => axiosInstance.get('/admin/media', { params: { folder } }).then(r => r.data.data),
  uploadMedia: (payload: FormData) => axiosInstance.post('/admin/media/upload', payload, { headers: { 'Content-Type': undefined } }).then(r => r.data),
  deleteMedia: (id: string) => axiosInstance.delete(`/admin/media/${id}`).then(r => r.data),

  // Settings
  getSettings: () => axiosInstance.get('/admin/settings').then(r => r.data.data),
  updateSettings: (data: Record<string, unknown>) => axiosInstance.put('/admin/settings', data).then(r => r.data),

  // Notifications
  getNotifications: (params?: Record<string, string>) => axiosInstance.get('/admin/notifications', { params }).then(r => r.data),
  markNotificationRead: (id: string) => axiosInstance.patch(`/admin/notifications/${id}/read`).then(r => r.data),
  markAllNotificationsRead: () => axiosInstance.patch('/admin/notifications/read-all').then(r => r.data),

  // Activity Logs
  getActivityLogs: (params?: Record<string, string>) => axiosInstance.get('/admin/activity-logs', { params }).then(r => r.data),

  // Product Variants
  createVariant: (productId: string, data: Record<string, unknown>) =>
    axiosInstance.post(`/admin/products/${productId}/variants`, data).then(r => r.data),
  updateVariant: (productId: string, variantId: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/admin/products/${productId}/variants/${variantId}`, data).then(r => r.data),
  deleteVariant: (productId: string, variantId: string) =>
    axiosInstance.delete(`/admin/products/${productId}/variants/${variantId}`).then(r => r.data),

  // SEO
  getSeoEntries: () => axiosInstance.get('/admin/seo').then(r => r.data.data),
  updateSeoEntry: (page: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/admin/seo/${page}`, data).then(r => r.data),

  // Homepage Content
  getHomepageContent: () => axiosInstance.get('/admin/homepage').then(r => r.data.data),
  createHomepageContent: (data: Record<string, unknown>) =>
    axiosInstance.post('/admin/homepage', data).then(r => r.data),
  updateHomepageContent: (id: string, data: Record<string, unknown>) =>
    axiosInstance.put(`/admin/homepage/${id}`, data).then(r => r.data),
  deleteHomepageContent: (id: string) =>
    axiosInstance.delete(`/admin/homepage/${id}`).then(r => r.data),

  clearActivityLogs: () => axiosInstance.delete('/admin/activity-logs').then(r => r.data),
};

export default adminApi;
