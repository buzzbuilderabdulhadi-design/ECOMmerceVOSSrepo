import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const isForeignKeyError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2003';
  }
  return false;
};

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalProducts, totalOrders, totalCustomers, totalRevenue, pendingOrders, lowStockProducts, recentOrders, recentCustomers, recentReviews] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: 'PAID' } }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
      prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, avatar: true, createdAt: true } }),
      prisma.review.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } }, product: { select: { name: true } } } }),
    ]);
    sendSuccess(res, { stats: { totalProducts, totalOrders, totalCustomers, totalRevenue: totalRevenue._sum.total || 0, pendingOrders, lowStockProducts }, recentOrders, recentCustomers, recentReviews });
  } catch (error) { next(error); }
};

export const getAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [thisMonthRevenue, lastMonthRevenue, totalOrders, totalCustomers, topProducts] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: lastMonth, lt: thisMonth }, paymentStatus: 'PAID' } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.findMany({ take: 10, orderBy: { reviews: { _count: 'desc' } }, include: { _count: { select: { reviews: true, orderItems: true } } } }),
    ]);
    sendSuccess(res, { revenue: { thisMonth: thisMonthRevenue._sum.total || 0, lastMonth: lastMonthRevenue._sum.total || 0 }, totalOrders, totalCustomers, topProducts });
  } catch (error) { next(error); }
};

export const getSalesAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [orders, thisMonthRevenue, lastMonthRevenue, topProducts] = await Promise.all([
      prisma.order.findMany({ where: { createdAt: { gte: startDate }, paymentStatus: 'PAID' }, orderBy: { createdAt: 'asc' }, select: { total: true, createdAt: true } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: thisMonth }, paymentStatus: 'PAID' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: lastMonth, lt: thisMonth }, paymentStatus: 'PAID' } }),
      prisma.product.findMany({ take: 10, orderBy: { orderItems: { _count: 'desc' } }, include: { _count: { select: { reviews: true, orderItems: true } } } }),
    ]);

    sendSuccess(res, {
      period: `${days}d`,
      orders,
      revenue: { thisMonth: thisMonthRevenue._sum.total || 0, lastMonth: lastMonthRevenue._sum.total || 0 },
      topProducts,
    });
  } catch (error) { next(error); }
};

export const getOrderAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [byStatus, total] = await Promise.all([prisma.order.groupBy({ by: ['status'], _count: true }), prisma.order.aggregate({ _sum: { total: true } })]);
    sendSuccess(res, { byStatus, totalRevenue: total._sum.total || 0 });
  } catch (error) { next(error); }
};

export const getProductAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, active, lowStock, outOfStock, byCategory] = await Promise.all([
      prisma.product.count(), prisma.product.count({ where: { isActive: true } }), prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }), prisma.product.count({ where: { stock: 0 } }), prisma.product.groupBy({ by: ['categoryId'], _count: true }),
    ]);
    sendSuccess(res, { total, active, lowStock, outOfStock, byCategory });
  } catch (error) { next(error); }
};

export const getCustomerAnalytics = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [total, newThisMonth, withOrders] = await Promise.all([
      prisma.user.count({ where: { role: 'CUSTOMER' } }), prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }), prisma.user.count({ where: { role: 'CUSTOMER', orders: { some: {} } } }),
    ]);
    sendSuccess(res, { total, newThisMonth, withOrders });
  } catch (error) { next(error); }
};

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const status = req.query.status as string;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as string || 'desc';
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'lowStock') where.stock = { lte: 5 };
    if (status === 'outOfStock') where.stock = 0;
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: order }, include: { category: { select: { id: true, name: true, slug: true } }, _count: { select: { reviews: true, orderItems: true } } } }),
      prisma.product.count({ where }),
    ]);
    sendPaginated(res, products, { page, limit, total });
  } catch (error) { next(error); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id }, include: { category: true, variants: true, reviews: { include: { user: { select: { name: true, avatar: true } } } } } });
    if (!product) throw ApiError.notFound('Product not found');
    sendSuccess(res, product);
  } catch (error) { next(error); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.create({ data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_PRODUCT', entity: 'Product', entityId: product.id } });
    sendCreated(res, product, 'Product created successfully');
  } catch (error) { next(error); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.update({ where: { id }, data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: product.id } });
    sendSuccess(res, product, 'Product updated successfully');
  } catch (error) { next(error); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const [orderItemCount, reviewCount, variantCount] = await Promise.all([
      prisma.orderItem.count({ where: { productId: id } }),
      prisma.review.count({ where: { productId: id } }),
      prisma.productVariant.count({ where: { productId: id } }),
    ]);
    if (orderItemCount > 0) {
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_PRODUCT', entity: 'Product', entityId: id, metadata: { softDelete: true, reason: 'has order history' } } });
      sendMessage(res, 'Product deactivated (it has order history and cannot be permanently deleted)');
      return;
    }
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_PRODUCT', entity: 'Product', entityId: id } });
    sendMessage(res, 'Product deleted successfully');
  } catch (error) { next(error); }
};

export const bulkDeleteProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'BULK_DELETE_PRODUCTS', entity: 'Product', metadata: { count: ids.length } } });
    sendMessage(res, `${ids.length} products deleted successfully`);
  } catch (error) { next(error); }
};

export const bulkUpdateProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, data } = req.body;
    await prisma.product.updateMany({ where: { id: { in: ids } }, data });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'BULK_UPDATE_PRODUCTS', entity: 'Product', metadata: { count: ids.length, update: data } } });
    sendMessage(res, `${ids.length} products updated successfully`);
  } catch (error) { next(error); }
};

export const duplicateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const original = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!original) throw ApiError.notFound('Product not found');
    const { createdAt, updatedAt, variants, ...productData } = original;
    const duplicate = await prisma.product.create({
      data: {
        ...productData,
        name: `${productData.name} (Copy)`,
        slug: `${productData.slug}-copy-${Date.now()}`,
        sku: `${productData.sku}-COPY`,
        specifications: productData.specifications !== null ? productData.specifications : undefined,
      } as any,
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DUPLICATE_PRODUCT', entity: 'Product', entityId: duplicate.id } });
    sendCreated(res, duplicate, 'Product duplicated successfully');
  } catch (error) { next(error); }
};

export const createProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw ApiError.notFound('Product not found');
    const variant = await prisma.productVariant.create({ data: { ...req.body, productId } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: variant.id, metadata: { productId } } });
    sendCreated(res, variant, 'Variant created');
  } catch (error) { next(error); }
};

export const updateProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const variant = await prisma.productVariant.update({ where: { id }, data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: variant.id } });
    sendSuccess(res, variant, 'Variant updated');
  } catch (error) { next(error); }
};

export const deleteProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.productVariant.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete variant: it has related order items or cart entries');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: id } });
    sendMessage(res, 'Variant deleted');
  } catch (error) { next(error); }
};

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { displayOrder: 'asc' }, include: { _count: { select: { products: true } }, children: true } });
    sendSuccess(res, categories);
  } catch (error) { next(error); }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.findUnique({ where: { id }, include: { parent: true, children: true, products: { take: 10, orderBy: { createdAt: 'desc' } } } });
    if (!category) throw ApiError.notFound('Category not found');
    sendSuccess(res, category);
  } catch (error) { next(error); }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.category.create({ data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_CATEGORY', entity: 'Category', entityId: category.id } });
    sendCreated(res, category, 'Category created successfully');
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const category = await prisma.category.update({ where: { id }, data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_CATEGORY', entity: 'Category', entityId: category.id } });
    sendSuccess(res, category, 'Category updated successfully');
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const [productCount, childCount] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    if (productCount > 0 || childCount > 0) {
      throw ApiError.badRequest(`Cannot delete category: it has ${productCount} products and ${childCount} subcategories. Move or delete them first.`);
    }
    await prisma.category.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_CATEGORY', entity: 'Category', entityId: id } });
    sendMessage(res, 'Category deleted successfully');
  } catch (error) { next(error); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const where: any = {};
    if (status) where.status = status;
    if (search) where.orderNumber = { contains: search, mode: 'insensitive' };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, items: true } }),
      prisma.order.count({ where }),
    ]);
    sendPaginated(res, orders, { page, limit, total });
  } catch (error) { next(error); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, shippingAddress: true, items: { include: { product: true, variant: true } } } });
    if (!order) throw ApiError.notFound('Order not found');
    sendSuccess(res, order);
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, trackingNumber, notes } = req.body;
    const order = await prisma.order.update({ where: { id }, data: { ...(status && { status }), ...(trackingNumber && { trackingNumber }), ...(notes && { internalNotes: notes }) } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_ORDER_STATUS', entity: 'Order', entityId: order.id, metadata: { status } } });
    sendSuccess(res, order, 'Order status updated');
  } catch (error) { next(error); }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.order.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete order: it has related items');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_ORDER', entity: 'Order', entityId: id } });
    sendMessage(res, 'Order deleted');
  } catch (error) { next(error); }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const where: any = { role: 'CUSTOMER' };
    if (search) { where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]; }
    const [customers, total] = await Promise.all([
      prisma.user.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true, _count: { select: { orders: true, reviews: true } } } }),
      prisma.user.count({ where }),
    ]);
    sendPaginated(res, customers, { page, limit, total });
  } catch (error) { next(error); }
};

export const getCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const customer = await prisma.user.findUnique({ where: { id }, select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true, emailVerified: true, addresses: true, orders: { take: 10, orderBy: { createdAt: 'desc' } }, reviews: { take: 5, include: { product: { select: { name: true } } } }, wishlist: { include: { product: { select: { id: true, name: true, slug: true, regularPrice: true, images: true } } } } } });
    if (!customer) throw ApiError.notFound('Customer not found');

    const [totalSpentResult, orderCount, reviewCount] = await Promise.all([
      prisma.order.aggregate({ where: { userId: id, paymentStatus: 'PAID' }, _sum: { total: true } }),
      prisma.order.count({ where: { userId: id } }),
      prisma.review.count({ where: { userId: id } }),
    ]);

    sendSuccess(res, { ...customer, _stats: { totalSpent: totalSpentResult._sum.total || 0, orderCount, reviewCount } });
  } catch (error) { next(error); }
};

export const updateCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { name, phone, emailVerified } = req.body;
    const customer = await prisma.user.update({ where: { id }, data: { ...(name && { name }), ...(phone !== undefined && { phone }), ...(emailVerified !== undefined && { emailVerified }) }, select: { id: true, name: true, email: true, phone: true, avatar: true, emailVerified: true } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_CUSTOMER', entity: 'Customer', entityId: customer.id } });
    sendSuccess(res, customer, 'Customer updated');
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.user.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete customer: they have related orders, reviews, or wishlist items');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_CUSTOMER', entity: 'Customer', entityId: id } });
    sendMessage(res, 'Customer deleted');
  } catch (error) { next(error); }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const where: any = {};
    if (status === 'pending') where.isApproved = false;
    if (status === 'approved') where.isApproved = true;
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } }, product: { select: { id: true, name: true, slug: true } } } }),
      prisma.review.count({ where }),
    ]);
    sendPaginated(res, reviews, { page, limit, total });
  } catch (error) { next(error); }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { isApproved, adminReply } = req.body;
    const review = await prisma.review.update({ where: { id }, data: { ...(isApproved !== undefined && { isApproved }), ...(adminReply !== undefined && { adminReply }) } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_REVIEW', entity: 'Review', entityId: review.id, metadata: { isApproved } } });
    sendSuccess(res, review, 'Review updated');
  } catch (error) { next(error); }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.review.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete review: it has related data');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_REVIEW', entity: 'Review', entityId: id } });
    sendMessage(res, 'Review deleted');
  } catch (error) { next(error); }
};

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [coupons, total] = await Promise.all([prisma.coupon.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }), prisma.coupon.count()]);
    sendPaginated(res, coupons, { page, limit, total });
  } catch (error) { next(error); }
};

export const getCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const coupon = await prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    sendSuccess(res, coupon);
  } catch (error) { next(error); }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await prisma.coupon.create({ data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_COUPON', entity: 'Coupon', entityId: coupon.id } });
    sendCreated(res, coupon, 'Coupon created');
  } catch (error) { next(error); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const coupon = await prisma.coupon.update({ where: { id }, data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_COUPON', entity: 'Coupon', entityId: coupon.id } });
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) { next(error); }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.coupon.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete coupon: it has related data');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_COUPON', entity: 'Coupon', entityId: id } });
    sendMessage(res, 'Coupon deleted');
  } catch (error) { next(error); }
};

export const getMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const folder = req.query.folder as string;
    const where: any = {};
    if (folder) where.folder = folder;
    const media = await prisma.media.findMany({ where, orderBy: { createdAt: 'desc' } });
    sendSuccess(res, media);
  } catch (error) { next(error); }
};

export const uploadMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let media;
    if (req.file) {
      const { v2: cloudinary } = require('cloudinary');
      const config = require('../config').default;
      cloudinary.config({ cloud_name: config.cloudinary.name, api_key: config.cloudinary.apiKey, api_secret: config.cloudinary.apiSecret });
      const folder = (req.body.folder as string) || 'general';
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: `voss/${folder}`,
        resource_type: 'auto',
      });
      media = await prisma.media.create({
        data: {
          fileName: req.file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width: result.width,
          height: result.height,
          folder,
          altText: (req.body.altText as string) || req.file.originalname,
          uploadedBy: req.user?.userId,
        },
      });
    } else {
      media = await prisma.media.create({
        data: {
          url: (req.body.url as string) || '',
          fileName: (req.body.fileName as string) || 'file',
          folder: (req.body.folder as string) || 'general',
          mimeType: (req.body.mimeType as string) || 'image/jpeg',
          size: parseInt(req.body.size as string) || 0,
          altText: (req.body.altText as string) || 'Untitled',
          uploadedBy: req.user?.userId,
        },
      });
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPLOAD_MEDIA', entity: 'Media', entityId: media.id } });
    sendCreated(res, media, 'File uploaded');
  } catch (error) { next(error); }
};

export const deleteMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const media = await prisma.media.findUnique({ where: { id } });
    if (media?.publicId) {
      try {
        const { v2: cloudinary } = require('cloudinary');
        await cloudinary.uploader.destroy(media.publicId);
      } catch {
        // ignore cloudinary delete errors
      }
    }
    try {
      await prisma.media.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete: record has related data');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_MEDIA', entity: 'Media', entityId: id } });
    sendMessage(res, 'File deleted');
  } catch (error) { next(error); }
};

export const getSiteSettings = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.siteSetting.findMany();
    const settingsMap: Record<string, any> = {};
    settings.forEach((s: { key: string; value: any }) => { settingsMap[s.key] = s.value; });
    sendSuccess(res, settingsMap);
  } catch (error) { next(error); }
};

export const updateSiteSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.siteSetting.upsert({ where: { key }, update: { value: value as any }, create: { key, value: value as any } });
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_SETTINGS', entity: 'SiteSetting', metadata: { keys: Object.keys(updates) } } });
    sendSuccess(res, updates, 'Settings updated');
  } catch (error) { next(error); }
};

export const getSeoEntries = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const entries = await prisma.seoEntry.findMany({ orderBy: { page: 'asc' } });
    sendSuccess(res, entries);
  } catch (error) { next(error); }
};

export const updateSeoEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = req.params.page as string;
    const entry = await prisma.seoEntry.upsert({ where: { page }, update: req.body, create: { page, ...req.body } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_SEO', entity: 'SeoEntry', entityId: page } });
    sendSuccess(res, entry, 'SEO entry updated');
  } catch (error) { next(error); }
};

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count(),
    ]);
    sendPaginated(res, notifications, { page, limit, total });
  } catch (error) { next(error); }
};

export const markNotificationRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id as string }, data: { isRead: true } });
    sendMessage(res, 'Notification marked as read');
  } catch (error) { next(error); }
};

export const markAllNotificationsRead = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({ where: { isRead: false }, data: { isRead: true } });
    sendMessage(res, 'All notifications marked as read');
  } catch (error) { next(error); }
};

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const where: any = {};
    if (req.query.userId) where.userId = req.query.userId as string;
    if (req.query.entity) where.entity = req.query.entity as string;
    if (req.query.action) where.action = req.query.action as string;
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } }),
      prisma.activityLog.count({ where }),
    ]);
    sendPaginated(res, logs, { page, limit, total });
  } catch (error) { next(error); }
};

export const clearActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CLEAR_ACTIVITY_LOGS', entity: 'ActivityLog', metadata: { clearedAt: new Date().toISOString() } } });
    await prisma.activityLog.deleteMany();
    sendMessage(res, 'Activity logs cleared');
  } catch (error) { next(error); }
};

export const getHomepageContent = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await prisma.homepageContent.findMany();
    sendSuccess(res, content);
  } catch (error) { next(error); }
};

export const updateHomepageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const content = await prisma.homepageContent.update({ where: { id }, data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_HOMEPAGE_CONTENT', entity: 'HomepageContent', entityId: content.id } });
    sendSuccess(res, content, 'Homepage content updated');
  } catch (error) { next(error); }
};

export const createHomepageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const content = await prisma.homepageContent.create({ data: req.body });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_HOMEPAGE_CONTENT', entity: 'HomepageContent', entityId: content.id } });
    sendCreated(res, content, 'Homepage content created');
  } catch (error) { next(error); }
};

export const deleteHomepageContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.homepageContent.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete: record has related data');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_HOMEPAGE_CONTENT', entity: 'HomepageContent', entityId: id } });
    sendMessage(res, 'Homepage content deleted');
  } catch (error) { next(error); }
};
