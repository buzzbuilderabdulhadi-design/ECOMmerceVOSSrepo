import axiosInstance from './axios';
import { adminCacheGet, adminCacheClear } from '@/lib/staleCache';
import type { Product, Category, Coupon, User } from '@/types';

// ============================================================
// Admin API Service
// ============================================================

type ProductInput = Omit<Partial<Product>, 'salePrice' | 'discountPercent'> & {
  salePrice?: number | null;
  discountPercent?: number | null;
};

const cacheKey = (method: string, url: string, params?: Record<string, string | number | undefined>) => {
  const q = params
    ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
    : '';
  return `${method} ${url}${q}`;
};

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  return adminCacheGet(key, fetcher);
}

const adminApi = {
  // Dashboard
  getDashboard: () => cached(cacheKey('GET', '/admin/dashboard'), () => axiosInstance.get('/admin/dashboard').then(r => r.data.data)),

  // Analytics
  getAnalytics: () => cached(cacheKey('GET', '/admin/analytics'), () => axiosInstance.get('/admin/analytics').then(r => r.data.data)),
  getSalesAnalytics: (days = 30) => cached(cacheKey('GET', '/admin/analytics/sales', { days }), () => axiosInstance.get('/admin/analytics/sales', { params: { days } }).then(r => r.data.data)),
  getOrderAnalytics: () => cached(cacheKey('GET', '/admin/analytics/orders'), () => axiosInstance.get('/admin/analytics/orders').then(r => r.data.data)),
  getProductAnalytics: () => cached(cacheKey('GET', '/admin/analytics/products'), () => axiosInstance.get('/admin/analytics/products').then(r => r.data.data)),
  getCustomerAnalytics: () => cached(cacheKey('GET', '/admin/analytics/customers'), () => axiosInstance.get('/admin/analytics/customers').then(r => r.data.data)),

  // Products
  getProducts: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/products', params), () => axiosInstance.get('/admin/products', { params }).then(r => r.data)),
  getProduct: (id: string) => cached(cacheKey('GET', `/admin/products/${id}`), () => axiosInstance.get(`/admin/products/${id}`).then(r => r.data.data)),
  createProduct: (data: ProductInput) => { adminCacheClear(); return axiosInstance.post('/admin/products', data).then(r => r.data); },
  updateProduct: (id: string, data: ProductInput) => { adminCacheClear(); return axiosInstance.put(`/admin/products/${id}`, data).then(r => r.data); },
  deleteProduct: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/products/${id}`).then(r => r.data); },
  bulkDeleteProducts: (ids: string[]) => { adminCacheClear(); return axiosInstance.post('/admin/products/bulk-delete', { ids }).then(r => r.data); },
  bulkUpdateProducts: (ids: string[], data: Partial<Product>) => { adminCacheClear(); return axiosInstance.post('/admin/products/bulk-update', { ids, data }).then(r => r.data); },
  duplicateProduct: (id: string) => { adminCacheClear(); return axiosInstance.post(`/admin/products/${id}/duplicate`).then(r => r.data); },

  // Categories
  getCategories: () => cached(cacheKey('GET', '/admin/categories'), () => axiosInstance.get('/admin/categories').then(r => r.data.data)),
  getCategory: (id: string) => cached(cacheKey('GET', `/admin/categories/${id}`), () => axiosInstance.get(`/admin/categories/${id}`).then(r => r.data.data)),
  createCategory: (data: Partial<Category>) => { adminCacheClear(); return axiosInstance.post('/admin/categories', data).then(r => r.data); },
  updateCategory: (id: string, data: Partial<Category>) => { adminCacheClear(); return axiosInstance.put(`/admin/categories/${id}`, data).then(r => r.data); },
  deleteCategory: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/categories/${id}`).then(r => r.data); },

  // Orders
  getOrders: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/orders', params), () => axiosInstance.get('/admin/orders', { params }).then(r => r.data)),
  getOrder: (id: string) => cached(cacheKey('GET', `/admin/orders/${id}`), () => axiosInstance.get(`/admin/orders/${id}`).then(r => r.data.data)),
  updateOrderStatus: (id: string, data: { status?: string; trackingNumber?: string; notes?: string }) => {
    adminCacheClear(); return axiosInstance.patch(`/admin/orders/${id}/status`, data).then(r => r.data);
  },
  verifyOrderPayment: (id: string, status: 'PAID' | 'FAILED') => {
    adminCacheClear(); return axiosInstance.patch(`/admin/orders/${id}/payment`, { status }).then(r => r.data.data);
  },
  deleteOrder: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/orders/${id}`).then(r => r.data); },

  // Customers
  getCustomers: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/customers', params), () => axiosInstance.get('/admin/customers', { params }).then(r => r.data)),
  getCustomer: (id: string) => cached(cacheKey('GET', `/admin/customers/${id}`), () => axiosInstance.get(`/admin/customers/${id}`).then(r => r.data.data)),
  updateCustomer: (id: string, data: Partial<User>) => { adminCacheClear(); return axiosInstance.put(`/admin/customers/${id}`, data).then(r => r.data); },
  deleteCustomer: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/customers/${id}`).then(r => r.data); },

  // Reviews
  getReviews: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/reviews', params), () => axiosInstance.get('/admin/reviews', { params }).then(r => r.data)),
  updateReview: (id: string, data: { isApproved?: boolean; adminReply?: string }) => {
    adminCacheClear(); return axiosInstance.put(`/admin/reviews/${id}`, data).then(r => r.data);
  },
  deleteReview: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/reviews/${id}`).then(r => r.data); },

  // Product Questions (Q&A)
  getQuestions: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/questions', params), () => axiosInstance.get('/admin/questions', { params }).then(r => r.data)),
  answerQuestion: (id: string, answer: string) => {
    adminCacheClear(); return axiosInstance.put(`/admin/questions/${id}/answer`, { answer }).then(r => r.data);
  },
  deleteQuestion: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/questions/${id}`).then(r => r.data); },

  // Coupons
  getCoupons: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/coupons', params), () => axiosInstance.get('/admin/coupons', { params }).then(r => r.data)),
  getCoupon: (id: string) => cached(cacheKey('GET', `/admin/coupons/${id}`), () => axiosInstance.get(`/admin/coupons/${id}`).then(r => r.data.data)),
  createCoupon: (data: Partial<Coupon>) => { adminCacheClear(); return axiosInstance.post('/admin/coupons', data).then(r => r.data); },
  updateCoupon: (id: string, data: Partial<Coupon>) => { adminCacheClear(); return axiosInstance.put(`/admin/coupons/${id}`, data).then(r => r.data); },
  deleteCoupon: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/coupons/${id}`).then(r => r.data); },

  // Media
  getMedia: (folder?: string) => cached(cacheKey('GET', '/admin/media', folder ? { folder } : undefined), () => axiosInstance.get('/admin/media', { params: { folder } }).then(r => r.data.data)),
  uploadMedia: (payload: FormData) => { adminCacheClear(); return axiosInstance.post('/admin/media/upload', payload, { headers: { 'Content-Type': undefined } }).then(r => r.data); },
  deleteMedia: (id: string) => { adminCacheClear(); return axiosInstance.delete(`/admin/media/${id}`).then(r => r.data); },

  // Settings
  getSettings: () => cached(cacheKey('GET', '/admin/settings'), () => axiosInstance.get('/admin/settings').then(r => r.data.data)),
  updateSettings: (data: Record<string, unknown>) => { adminCacheClear(); return axiosInstance.put('/admin/settings', data).then(r => r.data); },

  // Notifications
  getNotifications: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/notifications', params), () => axiosInstance.get('/admin/notifications', { params }).then(r => r.data)),
  markNotificationRead: (id: string) => { adminCacheClear(); return axiosInstance.patch(`/admin/notifications/${id}/read`).then(r => r.data); },
  markAllNotificationsRead: () => { adminCacheClear(); return axiosInstance.patch('/admin/notifications/read-all').then(r => r.data); },

  // Activity Logs
  getActivityLogs: (params?: Record<string, string>) => cached(cacheKey('GET', '/admin/activity-logs', params), () => axiosInstance.get('/admin/activity-logs', { params }).then(r => r.data)),

  // Product Variants
  createVariant: (productId: string, data: Record<string, unknown>) => {
    adminCacheClear(); return axiosInstance.post(`/admin/products/${productId}/variants`, data).then(r => r.data);
  },
  updateVariant: (productId: string, variantId: string, data: Record<string, unknown>) => {
    adminCacheClear(); return axiosInstance.put(`/admin/products/${productId}/variants/${variantId}`, data).then(r => r.data);
  },
  deleteVariant: (productId: string, variantId: string) => {
    adminCacheClear(); return axiosInstance.delete(`/admin/products/${productId}/variants/${variantId}`).then(r => r.data);
  },

  // SEO
  getSeoEntries: () => cached(cacheKey('GET', '/admin/seo'), () => axiosInstance.get('/admin/seo').then(r => r.data.data)),
  updateSeoEntry: (page: string, data: Record<string, unknown>) => {
    adminCacheClear(); return axiosInstance.put(`/admin/seo/${page}`, data).then(r => r.data);
  },

  // Homepage Content
  getHomepageContent: () => cached(cacheKey('GET', '/admin/homepage'), () => axiosInstance.get('/admin/homepage').then(r => r.data.data)),
  createHomepageContent: (data: Record<string, unknown>) => {
    adminCacheClear(); return axiosInstance.post('/admin/homepage', data).then(r => r.data);
  },
  updateHomepageContent: (id: string, data: Record<string, unknown>) => {
    adminCacheClear(); return axiosInstance.put(`/admin/homepage/${id}`, data).then(r => r.data);
  },
  deleteHomepageContent: (id: string) => {
    adminCacheClear(); return axiosInstance.delete(`/admin/homepage/${id}`).then(r => r.data);
  },

  clearActivityLogs: () => { adminCacheClear(); return axiosInstance.delete('/admin/activity-logs').then(r => r.data); },
};

export default adminApi;