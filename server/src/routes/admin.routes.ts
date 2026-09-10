import { Router } from 'express';
import multer from 'multer';
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
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
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
  createHomepageContent,
  deleteHomepageContent,
} from '../controllers/admin.controller';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  bulkDeleteSchema,
  bulkUpdateSchema,
  createVariantSchema,
  updateVariantSchema,
  createCategorySchema,
  updateCategorySchema,
  updateOrderStatusSchema,
  updateCustomerSchema,
  updateReviewSchema,
  createCouponSchema,
  updateCouponSchema,
  updateSeoSchema,
  createHomepageContentSchema,
  updateHomepageContentSchema,
  updateSettingsSchema,
} from '../validation/admin.validation';

const router = Router();

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: JPEG, PNG, WebP. Received: ${file.mimetype} (${ext})`));
  }
};

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter,
});

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
router.post('/products', validate(createProductSchema), createProduct);
router.put('/products/:id', validate(updateProductSchema), updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk-delete', validate(bulkDeleteSchema), bulkDeleteProducts);
router.post('/products/bulk-update', validate(bulkUpdateSchema), bulkUpdateProducts);
router.post('/products/:id/duplicate', duplicateProduct);

// Product Variants
router.post('/products/:id/variants', validate(createVariantSchema), createProductVariant);
router.put('/products/:productId/variants/:id', validate(updateVariantSchema), updateProductVariant);
router.delete('/products/:productId/variants/:id', deleteProductVariant);

// Categories
router.get('/categories', getCategories);
router.get('/categories/:id', getCategory);
router.post('/categories', validate(createCategorySchema), createCategory);
router.put('/categories/:id', validate(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Orders
router.get('/orders', getOrders);
router.get('/orders/:id', getOrder);
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

// Customers
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomer);
router.put('/customers/:id', validate(updateCustomerSchema), updateCustomer);
router.delete('/customers/:id', deleteCustomer);

// Reviews
router.get('/reviews', getReviews);
router.put('/reviews/:id', validate(updateReviewSchema), updateReview);
router.delete('/reviews/:id', deleteReview);

// Coupons
router.get('/coupons', getCoupons);
router.get('/coupons/:id', getCoupon);
router.post('/coupons', validate(createCouponSchema), createCoupon);
router.put('/coupons/:id', validate(updateCouponSchema), updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Media
router.get('/media', getMedia);
router.post('/media/upload', upload.single('file'), uploadMedia);
router.delete('/media/:id', deleteMedia);

// Settings
router.get('/settings', getSiteSettings);
router.put('/settings', validate(updateSettingsSchema), updateSiteSettings);

// SEO
router.get('/seo', getSeoEntries);
router.put('/seo/:page', validate(updateSeoSchema), updateSeoEntry);

// Notifications
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.patch('/notifications/read-all', markAllNotificationsRead);

// Activity Logs
router.get('/activity-logs', getActivityLogs);
router.delete('/activity-logs', clearActivityLogs);

// Homepage
router.get('/homepage', getHomepageContent);
router.post('/homepage', validate(createHomepageContentSchema), createHomepageContent);
router.put('/homepage/:id', validate(updateHomepageContentSchema), updateHomepageContent);
router.delete('/homepage/:id', deleteHomepageContent);

export default router;
