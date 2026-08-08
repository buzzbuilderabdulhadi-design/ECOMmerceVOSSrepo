import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import {
  getDashboard,
  getAnalytics,
  getSalesAnalytics,
  getOrderAnalytics,
  getProductAnalytics,
  getCustomerAnalytics,
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProducts,
  duplicateProduct,
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
  getReviews,
  updateReview,
  deleteReview,
  getCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getMedia,
  uploadMedia,
  deleteMedia,
  getSiteSettings,
  updateSiteSettings,
  getSeoEntries,
  updateSeoEntry,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getActivityLogs,
  clearActivityLogs,
  getHomepageContent,
  updateHomepageContent,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorizeAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Analytics
router.get('/analytics', getAnalytics);
router.get('/analytics/sales', getSalesAnalytics);
router.get('/analytics/orders', getOrderAnalytics);
router.get('/analytics/products', getProductAnalytics);
router.get('/analytics/customers', getCustomerAnalytics);

// Products
router.get('/products', getProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk-delete', bulkDeleteProducts);
router.post('/products/bulk-update', bulkUpdateProducts);
router.post('/products/:id/duplicate', duplicateProduct);

// Categories
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Reviews
router.get('/reviews', getReviews);
router.put('/reviews/:id', updateReview);
router.delete('/reviews/:id', deleteReview);

// Coupons
router.get('/coupons', getCoupons);
router.get('/coupons/:id', getCoupon);
router.post('/coupons', createCoupon);
router.put('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Media
router.get('/media', getMedia);
router.post('/media/upload', uploadMedia);
router.delete('/media/:id', deleteMedia);

// Settings
router.get('/settings', getSiteSettings);
router.put('/settings', updateSiteSettings);

// SEO
router.get('/seo', getSeoEntries);
router.put('/seo/:page', updateSeoEntry);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

// Activity Logs
router.get('/activity-logs', getActivityLogs);
router.delete('/activity-logs', clearActivityLogs);

// Homepage
router.get('/homepage', getHomepageContent);
router.put('/homepage', updateHomepageContent);

export default router;
