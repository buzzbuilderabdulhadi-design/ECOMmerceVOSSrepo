import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import cloudinary from 'cloudinary';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { cacheInvalidate } from '../utils/cache';
import { parsePagination } from '../utils/pagination';
import { slugify, uniqueSlug } from '../utils/slugify';
import { assertObjectId, isValidObjectId } from '../utils/objectId';
import {
  isManualPaymentMethod,
  ORDER_STATUS,
  PAYMENT_STATUS,
  canTransitionOrder,
  isOrderCancellable,
  OrderStatusValue,
  PaymentStatusValue,
} from '../constants/order';
import { setOrderPaid, setOrderPaymentFailed } from '../services/payment/payment-state.service';
import { reverseOrderReservations } from '../services/order-reversal.service';
import { notifyOrderStatus, notifyUser } from '../services/notification.service';
import { sendOrderStatusEmail } from '../utils/email';
import config from '../config';

// Invalidate cached public catalog reads after any product/category/variant write.
const invalidateCatalog = () => {
  cacheInvalidate('products:');
  cacheInvalidate('categories:');
};

const isForeignKeyError = (error: unknown): boolean => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === 'P2003';
  }
  return false;
};

/** Map a Prisma unique-constraint violation into a targeted conflict error. */
const uniqueViolation = (error: unknown, fallback: string): ApiError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const hint: Record<string, string> = {
      sku: 'A product with this SKU already exists.',
      slug: 'A record with this slug already exists.',
      code: 'A coupon with this code already exists.',
      email: 'A user with this email already exists.',
      page: 'An SEO entry for this page already exists.',
    };
    for (const t of target) {
      if (hint[t as string]) return ApiError.conflict(hint[t as string]);
    }
    return ApiError.conflict(fallback);
  }
  return ApiError.internal(fallback);
};

export const getDashboard = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [totalProducts, activeProducts, totalOrders, totalCustomers, totalRevenue, pendingOrders, paidOrders, awaitingVerificationOrders, cancelledOrders, lowStockProducts, recentOrders, recentCustomers, recentReviews] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: PAYMENT_STATUS.PAID } }),
      prisma.order.count({ where: { status: ORDER_STATUS.PENDING } }),
      prisma.order.count({ where: { paymentStatus: PAYMENT_STATUS.PAID } }),
      prisma.order.count({ where: { paymentStatus: PAYMENT_STATUS.AWAITING_VERIFICATION } }),
      prisma.order.count({ where: { status: ORDER_STATUS.CANCELLED } }),
      prisma.product.count({ where: { stock: { lte: 5 } } }),
      prisma.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } } } }),
      prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, avatar: true, createdAt: true } }),
      prisma.review.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } }, product: { select: { name: true } } } }),
    ]);
    sendSuccess(res, {
      stats: {
        totalProducts,
        activeProducts,
        inactiveProducts: totalProducts - activeProducts,
        totalOrders,
        totalCustomers,
        totalRevenue: totalRevenue._sum.total || 0,
        pendingOrders,
        paidOrders,
        awaitingVerificationOrders,
        cancelledOrders,
        lowStockProducts,
      },
      recentOrders,
      recentCustomers,
      recentReviews,
    });
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
    const days = Math.min(366, Math.max(1, parseInt(req.query.days as string) || 30));
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
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search as string;
    const categoryId = req.query.categoryId as string;
    const status = req.query.status as string;
    const sort = req.query.sort as string || 'createdAt';
    const order = req.query.order as string || 'desc';
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) {
      assertObjectId(categoryId, 'category id');
      where.categoryId = categoryId;
    }
    if (status === 'active') where.isActive = true;
    if (status === 'inactive') where.isActive = false;
    if (status === 'lowStock') where.stock = { lte: 5 };
    if (status === 'outOfStock') where.stock = 0;
    const ALLOWED_SORTS = ['createdAt', 'updatedAt', 'name', 'regularPrice', 'stock', 'discountPercent'];
    const sortKey = ALLOWED_SORTS.includes(sort) ? sort : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';
    const [products, total] = await Promise.all([
      prisma.product.findMany({ where, skip, take: limit, orderBy: { [sortKey]: sortOrder }, include: { category: { select: { id: true, name: true, slug: true } }, _count: { select: { reviews: true, orderItems: true } } } }),
      prisma.product.count({ where }),
    ]);
    sendPaginated(res, products, { page, limit, total });
  } catch (error) { next(error); }
};

/** Verify the referenced category exists and, if a subcategory is set, that it belongs to that category. */
async function assertCategoryAssignments(categoryId?: string | null, subcategoryId?: string | null) {
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
    if (!category) throw ApiError.badRequest('Invalid category');
  }
  if (subcategoryId) {
    const sub = await prisma.category.findUnique({ where: { id: subcategoryId }, select: { id: true, parentId: true } });
    if (!sub) throw ApiError.badRequest('Invalid subcategory');
    if (categoryId && sub.parentId !== categoryId) {
      throw ApiError.badRequest('Subcategory does not belong to the selected category');
    }
  }
}

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id }, include: { category: { select: { id: true, name: true, slug: true } }, variants: true, reviews: { include: { user: { select: { name: true, avatar: true } } } } } });
    if (!product) throw ApiError.notFound('Product not found');
    let subcategory = null;
    if (product.subcategoryId) {
      subcategory = await prisma.category.findUnique({ where: { id: product.subcategoryId }, select: { id: true, name: true, slug: true } }).catch(() => null);
    }
    sendSuccess(res, { ...product, subcategory });
  } catch (error) { next(error); }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const { categoryId, subcategoryId, slug, ...rest } = body;
    await assertCategoryAssignments(categoryId, subcategoryId);

    let productSlug = slug || slugify(body.name);
    productSlug = await uniqueSlug(productSlug, async (s) => {
      const existing = await prisma.product.findUnique({ where: { slug: s }, select: { id: true } });
      return existing !== null;
    });

    const product = await prisma.product.create({
      data: { ...rest, categoryId, subcategoryId: subcategoryId ?? null, slug: productSlug },
    }).catch((error) => {
      throw uniqueViolation(error, 'A product with these details already exists.');
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_PRODUCT', entity: 'Product', entityId: product.id } });
    invalidateCatalog();
    sendCreated(res, product, 'Product created successfully');
  } catch (error) { next(error); }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { categoryId, subcategoryId, slug, sku, ...rest } = req.body;
    if (categoryId !== undefined || subcategoryId !== undefined) {
      const current = await prisma.product.findUnique({ where: { id }, select: { categoryId: true, subcategoryId: true } });
      if (!current) throw ApiError.notFound('Product not found');
      await assertCategoryAssignments(
        categoryId !== undefined ? categoryId : current.categoryId,
        subcategoryId !== undefined ? subcategoryId : current.subcategoryId
      );
    }

    const data: any = { ...rest };
    if (categoryId !== undefined) data.categoryId = categoryId;
    if (subcategoryId !== undefined) data.subcategoryId = subcategoryId ?? null;
    if (slug !== undefined && slug !== '') data.slug = await uniqueSlug(`${slug}`, async (s) => {
      const existing = await prisma.product.findUnique({ where: { slug: s }, select: { id: true } });
      return existing !== null && existing.id !== id;
    });
    if (sku !== undefined && sku !== null && sku !== '') data.sku = sku;

    const product = await prisma.product.update({ where: { id }, data })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw ApiError.notFound('Product not found');
        }
        throw uniqueViolation(error, 'A product with these details already exists.');
      });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_PRODUCT', entity: 'Product', entityId: product.id } });
    invalidateCatalog();
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
      invalidateCatalog();
      sendMessage(res, 'Product deactivated (it has order history and cannot be permanently deleted)');
      return;
    }
    // Hard delete only when nothing depends on it. MongoDB enforces no
    // referential actions, so remove dependent documents explicitly first.
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.wishlistItem.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.productQuestion.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_PRODUCT', entity: 'Product', entityId: id } });
    invalidateCatalog();
    sendMessage(res, 'Product deleted successfully');
  } catch (error) { next(error); }
};

export const bulkDeleteProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;
    let hardDeleted = 0;
    let deactivated = 0;
    for (const id of ids as string[]) {
      const orderItemCount = await prisma.orderItem.count({ where: { productId: id } });
      if (orderItemCount > 0) {
        await prisma.product.update({ where: { id }, data: { isActive: false } });
        deactivated++;
      } else {
        await prisma.review.deleteMany({ where: { productId: id } });
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        await prisma.wishlistItem.deleteMany({ where: { productId: id } });
        await prisma.cartItem.deleteMany({ where: { productId: id } });
        await prisma.productQuestion.deleteMany({ where: { productId: id } });
        await prisma.product.delete({ where: { id } });
        hardDeleted++;
      }
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'BULK_DELETE_PRODUCTS', entity: 'Product', metadata: { count: ids.length, hardDeleted, deactivated } } });
    invalidateCatalog();
    sendMessage(res, `${ids.length} products processed (${hardDeleted} deleted, ${deactivated} deactivated due to order history)`);
  } catch (error) { next(error); }
};

export const bulkUpdateProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ids, data } = req.body;
    const update: any = {};
    const allowed: Record<string, (v: any) => unknown> = {
      regularPrice: (v) => v, salePrice: (v) => v, discountPercent: (v) => v, stock: (v) => v,
      isActive: (v) => v, isBestSeller: (v) => v, isNew: (v) => v, isFeatured: (v) => v,
      isLimitedEdition: (v) => v, lowStockThreshold: (v) => v,
    };
    for (const key of Object.keys(data)) {
      if (allowed[key]) update[key] = data[key];
    }
    if (Object.keys(update).length === 0) {
      throw ApiError.badRequest('No valid bulk update fields provided.');
    }
    await prisma.product.updateMany({ where: { id: { in: ids } }, data: update });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'BULK_UPDATE_PRODUCTS', entity: 'Product', metadata: { count: ids.length, update } } });
    invalidateCatalog();
    sendMessage(res, `${ids.length} products updated successfully`);
  } catch (error) { next(error); }
};

export const duplicateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const original = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!original) throw ApiError.notFound('Product not found');
    const { createdAt, updatedAt, variants, reviews, orderItems, cartItems, wishlist, questions, id: _ignored, ...productData } = original as any;
    const newSlug = await uniqueSlug(`${productData.slug}-copy`, async (s) => {
      const existing = await prisma.product.findUnique({ where: { slug: s }, select: { id: true } });
      return existing !== null;
    });
    const newSku = await uniqueSlug(`${String(productData.sku).slice(0, 90)}-COPY`, async (s) => {
      const existing = await prisma.product.findUnique({ where: { sku: s }, select: { id: true } });
      return existing !== null;
    });
    const duplicate = await prisma.product.create({
      data: {
        ...productData,
        name: `${productData.name} (Copy)`,
        slug: newSlug,
        sku: newSku,
        specifications: productData.specifications !== null && productData.specifications !== undefined ? productData.specifications : undefined,
      } as any,
    });

    if (variants && variants.length > 0) {
      for (const v of variants) {
        const { productId, id: _vId, sku: _vSku, ...variantData } = v as any;
        let vSku = `${newSku}-${String(variantData.color).slice(0, 12)}-${String(variantData.size).slice(0, 12)}`;
        vSku = await uniqueSlug(vSku, async (s) => {
          const existing = await prisma.productVariant.findUnique({ where: { sku: s }, select: { id: true } });
          return existing !== null;
        });
        await prisma.productVariant.create({
          data: { ...variantData, sku: vSku, productId: duplicate.id },
        });
      }
    }

    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DUPLICATE_PRODUCT', entity: 'Product', entityId: duplicate.id } });
    invalidateCatalog();
    sendCreated(res, duplicate, 'Product duplicated successfully');
  } catch (error) { next(error); }
};

const variantUniqueViolation = (error: unknown): ApiError => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return ApiError.conflict('A variant with this color/size combination or SKU already exists for this product.');
  }
  return ApiError.internal('Could not save variant.');
};

const pickVariantFields = (body: Record<string, unknown>): Record<string, any> => {
  const allowed = ['color', 'colorHex', 'size', 'stock', 'priceOverride', 'images', 'isActive', 'sku'];
  return Object.fromEntries(allowed.filter((k) => k in body).map((k) => [k, (body as any)[k]]));
};

export const createProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.id as string;
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, sku: true } });
    if (!product) throw ApiError.notFound('Product not found');
    const { color, colorHex, size, stock, priceOverride, images, isActive, sku } = req.body as any;
    let variantSku = sku;
    if (!variantSku || variantSku.trim() === '') {
      variantSku = `${product.sku}-${String(color).slice(0, 12)}-${String(size).slice(0, 12)}`;
    }
    let finalSku = variantSku as string;
    const exists = await prisma.productVariant.findFirst({ where: { sku: finalSku }, select: { id: true } });
    if (exists) {
      throw ApiError.conflict('A variant with this SKU already exists.');
    }
    const variant = await prisma.productVariant.create({ data: { color, colorHex, size, stock, priceOverride, images, isActive, sku: finalSku, productId } }).catch((error) => {
      throw variantUniqueViolation(error);
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: variant.id, metadata: { productId } } });
    invalidateCatalog();
    sendCreated(res, variant, 'Variant created');
  } catch (error) { next(error); }
};

export const updateProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const id = req.params.id as string;
    const variant = await prisma.productVariant.findUnique({ where: { id }, select: { id: true, productId: true } });
    if (!variant) throw ApiError.notFound('Variant not found');
    if (variant.productId !== productId) {
      throw ApiError.badRequest('Variant does not belong to this product');
    }
    const updated = await prisma.productVariant.update({ where: { id }, data: pickVariantFields(req.body) }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw ApiError.notFound('Variant not found');
      }
      throw variantUniqueViolation(error);
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: id, metadata: { productId } } });
    invalidateCatalog();
    sendSuccess(res, updated, 'Variant updated');
  } catch (error) { next(error); }
};

export const deleteProductVariant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const productId = req.params.productId as string;
    const id = req.params.id as string;
    const variant = await prisma.productVariant.findUnique({ where: { id }, select: { id: true, productId: true } });
    if (!variant) throw ApiError.notFound('Variant not found');
    if (variant.productId !== productId) {
      throw ApiError.badRequest('Variant does not belong to this product');
    }
    const cartUse = await prisma.cartItem.count({ where: { variantId: id } });
    const orderUse = await prisma.orderItem.count({ where: { variantId: id } });
    if (orderUse > 0) {
      throw ApiError.badRequest('Cannot delete variant: it is referenced by past orders');
    }
    if (cartUse > 0) {
      await prisma.cartItem.deleteMany({ where: { variantId: id } });
    }
    await prisma.wishlistItem.deleteMany({ where: { variantId: id } });
    await prisma.productVariant.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_PRODUCT_VARIANT', entity: 'ProductVariant', entityId: id, metadata: { productId } } });
    invalidateCatalog();
    sendMessage(res, 'Variant deleted');
  } catch (error) { next(error); }
};

export const getCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    const categories = await prisma.category.findMany({ where, orderBy: { displayOrder: 'asc' }, include: { _count: { select: { products: true } }, children: true } });
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
    const { name, slug, parentId, ...rest } = req.body;
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } });
      if (!parent) throw ApiError.badRequest('Parent category not found');
    }
    const categorySlug = await uniqueSlug(slug || name, async (s) => {
      const existing = await prisma.category.findUnique({ where: { slug: s }, select: { id: true } });
      return existing !== null;
    });
    const category = await prisma.category.create({ data: { name, slug: categorySlug, ...(parentId ? { parentId } : {}), ...rest } }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.conflict('A category with this slug already exists.');
      }
      throw error;
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_CATEGORY', entity: 'Category', entityId: category.id } });
    invalidateCatalog();
    sendCreated(res, category, 'Category created successfully');
  } catch (error) { next(error); }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { parentId, slug, ...rest } = req.body;

    if (parentId === id) {
      throw ApiError.badRequest('A category cannot be its own parent');
    }
    const data: any = { ...rest };
    if (parentId !== undefined) {
      if (parentId) {
        const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } });
        if (!parent) throw ApiError.badRequest('Parent category not found');
        let cursor: string | null = parent.id;
        let hops = 0;
        while (cursor && hops < 50) {
          if (cursor === id) {
            throw ApiError.badRequest('A category cannot be moved under its own descendant');
          }
          const nextRow: { parentId: string | null } | null = await prisma.category
            .findUnique({ where: { id: cursor }, select: { parentId: true } })
            .catch(() => null);
          cursor = nextRow?.parentId ?? null;
          hops += 1;
        }
      }
      data.parentId = parentId || null;
    }
    if (slug !== undefined && slug !== '') {
      data.slug = await uniqueSlug(slug, async (s) => {
        const existing = await prisma.category.findUnique({ where: { slug: s }, select: { id: true } });
        return existing !== null && existing.id !== id;
      });
    }

    const category = await prisma.category.update({ where: { id }, data }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw ApiError.notFound('Category not found');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.conflict('A category with this slug already exists.');
      }
      throw error;
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_CATEGORY', entity: 'Category', entityId: category.id } });
    invalidateCatalog();
    sendSuccess(res, category, 'Category updated successfully');
  } catch (error) { next(error); }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const [productCount, subcategoryProductCount, childCount] = await Promise.all([
      prisma.product.count({ where: { categoryId: id } }),
      prisma.product.count({ where: { subcategoryId: id } }),
      prisma.category.count({ where: { parentId: id } }),
    ]);
    if (productCount > 0 || subcategoryProductCount > 0 || childCount > 0) {
      const total = productCount + subcategoryProductCount + childCount;
      throw ApiError.badRequest(`Cannot delete category: it has ${total} products or subcategories referencing it. Move or delete them first.`);
    }
    await prisma.category.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_CATEGORY', entity: 'Category', entityId: id } });
    invalidateCatalog();
    sendMessage(res, 'Category deleted successfully');
  } catch (error) { next(error); }
};

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const status = req.query.status as string;
    const paymentStatus = req.query.paymentStatus as string;
    const search = req.query.search as string;
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { ...(isValidObjectId(search) ? { id: search } : {}) },
      ];
    }
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, email: true } }, _count: { select: { items: true } } } }),
      prisma.order.count({ where }),
    ]);
    sendPaginated(res, orders, { page, limit, total });
  } catch (error) { next(error); }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id }, include: { user: { select: { id: true, name: true, email: true, phone: true, avatar: true } }, shippingAddress: true, items: { include: { product: { select: { id: true, name: true, slug: true, images: true } }, variant: true } } } });
    if (!order) throw ApiError.notFound('Order not found');
    let verifiedByUser = null;
    if (order.paymentVerifiedBy) {
      verifiedByUser = await prisma.user.findUnique({ where: { id: order.paymentVerifiedBy }, select: { id: true, name: true } }).catch(() => null);
    }
    sendSuccess(res, { ...order, verifiedByUser });
  } catch (error) { next(error); }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, trackingNumber, notes } = req.body;
    const current = await prisma.order.findUnique({ where: { id }, select: { id: true, status: true, paymentStatus: true } });
    if (!current) throw ApiError.notFound('Order not found');

    if (status) {
      const from = current.status as OrderStatusValue;
      const to = status as OrderStatusValue;
      if (!canTransitionOrder(from, to)) {
        throw ApiError.badRequest(`Cannot move order from ${from} to ${status}.`);
      }
      if (to === ORDER_STATUS.CANCELLED && !isOrderCancellable(current.paymentStatus as PaymentStatusValue)) {
        throw ApiError.badRequest('This order is already paid. Issue a refund instead of cancelling.');
      }
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(trackingNumber !== undefined && { trackingNumber: trackingNumber || null }),
        ...(notes !== undefined && { internalNotes: notes }),
      },
    });
    // Stock and coupon were reserved at creation; returning them on a
    // cancellation keeps inventory and coupon limits honest.
    if (status === ORDER_STATUS.CANCELLED && current.status !== ORDER_STATUS.CANCELLED) {
      await reverseOrderReservations(id);
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_ORDER_STATUS', entity: 'Order', entityId: order.id, metadata: { from: current.status, to: status || current.status } } });
    sendSuccess(res, order, 'Order status updated');

    // Notify + email the customer for status moves they can see. Fire and
    // forget — a failing email must not roll back the admin action.
    if (status && status !== current.status && ['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'].includes(status)) {
      notifyOrderStatus({ id: order.id, userId: order.userId, orderNumber: order.orderNumber }, status).catch(() => {});
      prisma.user
        .findUnique({ where: { id: order.userId }, select: { id: true, name: true, email: true } })
        .then((user) => {
          if (!user) return;
          return sendOrderStatusEmail({
            to: user.email,
            name: user.name,
            orderNumber: order.orderNumber,
            status,
            orderUrl: `${config.client.url}/dashboard/orders/${order.id}`,
          });
        })
        .catch(() => {});
    }
  } catch (error) { next(error); }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const order = await prisma.order.findUnique({ where: { id }, select: { id: true, paymentStatus: true } });
    if (!order) throw ApiError.notFound('Order not found');
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      throw ApiError.badRequest('Cannot delete a paid order. Refund or archive it instead.');
    }
    // MongoDB enforces no referential actions: remove dependent docs explicitly.
    // Restock first while the items still exist, then release the coupon.
    await reverseOrderReservations(id);
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.paymentEvent.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_ORDER', entity: 'Order', entityId: id } });
    sendMessage(res, 'Order deleted');
  } catch (error) { next(error); }
};

/**
 * Admin verification of a manual payment (bank transfer / Payoneer). Only
 * admins can confirm settlement; the guarded state transitions enforce that
 * a verified payment is the sole path to PAID for manual orders.
 */
export const verifyOrderPayment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const desired = req.body.status === 'FAILED' ? PAYMENT_STATUS.FAILED : PAYMENT_STATUS.PAID;
    const adminId = req.user?.userId;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true, orderNumber: true, paymentStatus: true, paymentMethod: true,
        paymentReference: true, status: true,
      },
    });
    if (!order) throw ApiError.notFound('Order not found');
    let isManual = false;
    try {
      isManual = isManualPaymentMethod(order.paymentMethod ?? '');
    } catch {
      isManual = false;
    }
    if (!isManual) {
      throw ApiError.badRequest('Only manual payment methods (bank transfer / Payoneer) can be verified this way.');
    }

    if (order.paymentStatus === desired) {
      sendSuccess(res, order, 'Payment already verified');
      return;
    }

    let moved = false;
    if (desired === PAYMENT_STATUS.PAID) {
      moved = await setOrderPaid(order.id, { verifiedBy: adminId, verifiedAt: new Date() });
    } else {
      moved = await setOrderPaymentFailed(order.id);
    }

    if (!moved) {
      throw ApiError.badRequest('This payment cannot be moved to that status.');
    }

    await prisma.activityLog.create({
      data: {
        userId: adminId,
        action: 'VERIFY_PAYMENT',
        entity: 'Order',
        entityId: order.id,
        metadata: { status: desired, orderNumber: order.orderNumber },
      },
    });

    const updated = await prisma.order.findUnique({ where: { id }, select: { id: true, paymentStatus: true, paymentVerifiedBy: true, paymentVerifiedAt: true } });
    let verifiedByUser = null;
    if (updated?.paymentVerifiedBy) {
      verifiedByUser = await prisma.user.findUnique({ where: { id: updated.paymentVerifiedBy }, select: { id: true, name: true } }).catch(() => null);
    }
    sendSuccess(res, { ...updated, verifiedByUser }, desired === PAYMENT_STATUS.PAID ? 'Payment verified as paid' : 'Payment marked as failed');
  } catch (error) { next(error); }
};

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search as string;
    const where: any = { role: 'CUSTOMER' };
    if (search) { where.OR = [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }]; }
    const [customers, total] = await Promise.all([
      prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, avatar: true, phone: true, createdAt: true, _count: { select: { orders: true, reviews: true } } } }),
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
    const customer = await prisma.user.update({ where: { id }, data: { ...(name !== undefined && { name }), ...(phone !== undefined && { phone }), ...(emailVerified !== undefined && { emailVerified }) }, select: { id: true, name: true, email: true, phone: true, avatar: true, emailVerified: true } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'UPDATE_CUSTOMER', entity: 'Customer', entityId: customer.id } });
    sendSuccess(res, customer, 'Customer updated');
  } catch (error) { next(error); }
};

export const deleteCustomer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (id === req.user?.userId) {
      throw ApiError.badRequest('You cannot delete your own account.');
    }
    const [orderCount, reviewCount, wishlistCount, cartCount, addressCount, questionCount, notificationCount] = await Promise.all([
      prisma.order.count({ where: { userId: id } }),
      prisma.review.count({ where: { userId: id } }),
      prisma.wishlistItem.count({ where: { userId: id } }),
      prisma.cart.count({ where: { userId: id } }),
      prisma.address.count({ where: { userId: id } }),
      prisma.productQuestion.count({ where: { userId: id } }),
      prisma.notification.count({ where: { userId: id } }),
    ]);
    if (orderCount > 0) {
      throw ApiError.badRequest('Cannot delete this customer: they have order history. Consider deactivating instead.');
    }
    if (questionCount > 0) await prisma.productQuestion.deleteMany({ where: { userId: id } });
    if (reviewCount > 0) await prisma.review.deleteMany({ where: { userId: id } });
    if (wishlistCount > 0) await prisma.wishlistItem.deleteMany({ where: { userId: id } });
    if (cartCount > 0) {
      const carts = await prisma.cart.findMany({ where: { userId: id }, select: { id: true } });
      await prisma.cartItem.deleteMany({ where: { cartId: { in: carts.map((c) => c.id) } } });
      await prisma.cart.deleteMany({ where: { userId: id } });
    }
    if (addressCount > 0) await prisma.address.deleteMany({ where: { userId: id } });
    if (notificationCount > 0) await prisma.notification.deleteMany({ where: { userId: id } });
    await prisma.activityLog.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_CUSTOMER', entity: 'Customer', entityId: id } });
    cacheInvalidate(`auth:user:${id}`);
    sendMessage(res, 'Customer deleted');
  } catch (error) { next(error); }
};

export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const status = req.query.status as string;
    const search = req.query.search as string;
    const where: any = {};
    if (status === 'pending') where.isApproved = false;
    if (status === 'approved') where.isApproved = true;
    if (search) {
      where.OR = [
        { text: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } }, product: { select: { id: true, name: true, slug: true } } } }),
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

    // Tell the author their review went live (or was told to be revised).
    if (isApproved === true) {
      notifyUser({
        userId: review.userId,
        title: 'Review approved',
        message: 'Your product review has been approved and is now public.',
        type: 'review',
        link: '/dashboard/reviews',
      }).catch(() => {});
    } else if (isApproved === false) {
      notifyUser({
        userId: review.userId,
        title: 'Review update',
        message: 'Your product review is pending approval again. Thanks for your patience.',
        type: 'review',
        link: '/dashboard/reviews',
      }).catch(() => {});
    }
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

export const getQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const status = req.query.status as string;
    const search = req.query.search as string;
    const where: any = {};
    if (status === 'answered') where.answer = { not: null };
    if (status === 'unanswered') where.answer = null;
    if (search) {
      where.OR = [
        { question: { contains: search, mode: 'insensitive' } },
        { answer: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [questions, total] = await Promise.all([
      prisma.productQuestion.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } }, product: { select: { id: true, name: true, slug: true } } } }),
      prisma.productQuestion.count({ where }),
    ]);
    sendPaginated(res, questions, { page, limit, total });
  } catch (error) { next(error); }
};

export const answerQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { answer } = req.body;
    const question = await prisma.productQuestion.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!question) throw ApiError.notFound('Question not found');

    const updated = await prisma.productQuestion.update({
      where: { id },
      data: { answer, adminAnsweredAt: new Date(), isPublished: true },
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'ANSWER_QUESTION', entity: 'ProductQuestion', entityId: id } });
    sendSuccess(res, updated, 'Answer published');

    // Let the asker know their question has been answered.
    notifyUser({
      userId: question.userId,
      title: 'Question answered',
      message: 'Your product question has been answered — check the product page.',
      type: 'question',
    }).catch(() => {});
  } catch (error) { next(error); }
};

export const deleteQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    try {
      await prisma.productQuestion.delete({ where: { id } });
    } catch (error) {
      if (isForeignKeyError(error)) throw ApiError.badRequest('Cannot delete question: it has related data');
      throw error;
    }
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'DELETE_QUESTION', entity: 'ProductQuestion', entityId: id } });
    sendMessage(res, 'Question deleted');
  } catch (error) { next(error); }
};

export const getCoupons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const search = req.query.search as string;
    const where: any = {};
    if (search) {
      where.code = { contains: search.toUpperCase(), mode: 'insensitive' };
    }
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.coupon.count({ where }),
    ]);
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

const couponCodeFromBody = (body: any): { code?: string; expiresAt?: Date; rest: any } => {
  const { code, expiresAt, ...rest } = body;
  const clean: { code?: string; expiresAt?: Date; rest: any } = { rest };
  if (typeof code === 'string' && code.trim() !== '') clean.code = code.trim().toUpperCase();
  if (typeof expiresAt === 'string' && expiresAt.trim() !== '') {
    const date = new Date(expiresAt);
    if (Number.isNaN(date.getTime())) throw ApiError.badRequest('Invalid expiry date');
    clean.expiresAt = date;
  }
  return clean;
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, expiresAt, rest } = couponCodeFromBody(req.body);
    if (!code) throw ApiError.badRequest('Coupon code is required');
    const coupon = await prisma.coupon.create({ data: { ...rest, code, ...(expiresAt ? { expiresAt } : {}) } }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.conflict('A coupon with this code already exists.');
      }
      throw error;
    });
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CREATE_COUPON', entity: 'Coupon', entityId: coupon.id } });
    sendCreated(res, coupon, 'Coupon created');
  } catch (error) { next(error); }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { code, expiresAt, rest } = couponCodeFromBody(req.body);
    const coupon = await prisma.coupon.update({ where: { id }, data: { ...rest, ...(code ? { code } : {}), ...(expiresAt !== undefined && { expiresAt }) } }).catch((error) => {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw ApiError.notFound('Coupon not found');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw ApiError.conflict('A coupon with this code already exists.');
      }
      throw error;
    });
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
      // Cloudinary is optional at runtime: if credentials are configured we
      // upload to the CDN, otherwise fall back to serving the file locally by
      // PROMOTING the validated temp file into the public uploads dir.
      const cloudinaryReady =
        config.cloudinary && config.cloudinary.name && config.cloudinary.apiKey && config.cloudinary.apiSecret;

      let url: string;
      let publicId: string | null = null;
      let width: number | null = null;
      let height: number | null = null;
      const folder = (req.body.folder as string) || 'zoya-goods';

      if (cloudinaryReady) {
        cloudinary.v2.config({ cloud_name: config.cloudinary.name, api_key: config.cloudinary.apiKey, api_secret: config.cloudinary.apiSecret });
        const result = await cloudinary.v2.uploader.upload(req.file.path, {
          folder,
          resource_type: 'auto',
        });
        url = result.secure_url;
        publicId = result.public_id;
        width = result.width ?? null;
        height = result.height ?? null;
      } else {
        const uploadsDir = path.join(process.cwd(), 'uploads');
        await fs.promises.mkdir(uploadsDir, { recursive: true });
        await fs.promises.copyFile(req.file.path, path.join(uploadsDir, req.file.filename));
        url = `/uploads/${req.file.filename}`;
      }

      try {
        media = await prisma.media.create({
          data: {
            fileName: req.file.originalname,
            url,
            publicId,
            mimeType: req.file.mimetype,
            size: req.file.size,
            width,
            height,
            folder,
            altText: (req.body.altText as string) || req.file.originalname,
            uploadedBy: req.user?.userId,
          },
        });
      } finally {
        // Always remove the staged temp file (promoted copy already made).
        fs.promises.unlink(req.file.path).catch(() => {});
      }
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
        await cloudinary.v2.uploader.destroy(media.publicId);
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
    const { page, limit, skip } = parsePagination(req.query);
    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.notification.count(),
      prisma.notification.count({ where: { isRead: false } }),
    ]);
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
      pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
    });
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
    const { page, limit, skip } = parsePagination(req.query);
    const where: any = {};
    if (req.query.userId) {
      if (!isValidObjectId(req.query.userId as string)) throw ApiError.badRequest('Invalid user id format.');
      where.userId = req.query.userId as string;
    }
    if (req.query.entity) where.entity = req.query.entity as string;
    if (req.query.action) where.action = req.query.action as string;
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true } } } }),
      prisma.activityLog.count({ where }),
    ]);
    sendPaginated(res, logs, { page, limit, total });
  } catch (error) { next(error); }
};

export const clearActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const clearedCount = await prisma.activityLog.count();
    await prisma.activityLog.deleteMany();
    await prisma.activityLog.create({ data: { userId: req.user?.userId, action: 'CLEAR_ACTIVITY_LOGS', entity: 'ActivityLog', metadata: { clearedAt: new Date().toISOString(), clearedCount } } });
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
