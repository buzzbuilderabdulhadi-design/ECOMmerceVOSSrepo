import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { cacheGet, cacheSet } from '../utils/cache';

const PRODUCT_TTL_MS = 15_000;
const LIST_TTL_MS = 20_000;

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { category, search, minPrice, maxPrice, sort, color, size, material, brand, isNew, isBestSeller, isFeatured } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = { slug: category as string };
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    if (minPrice) where.regularPrice = { ...where.regularPrice, gte: parseFloat(minPrice as string) };
    if (maxPrice) where.regularPrice = { ...where.regularPrice, lte: parseFloat(maxPrice as string) };
    if (material) where.material = material as string;
    if (brand) where.brand = brand as string;
    if (isNew === 'true') where.isNew = true;
    if (isBestSeller === 'true') where.isBestSeller = true;
    if (isFeatured === 'true') where.isFeatured = true;
    if (color) where.variants = { some: { color: color as string, isActive: true } };
    if (size) where.variants = { ...where.variants, some: { ...where.variants?.some, size: size as string, isActive: true } };

    const orderBy: any = {};
    switch (sort) {
      case 'price_asc': orderBy.regularPrice = 'asc'; break;
      case 'price_desc': orderBy.regularPrice = 'desc'; break;
      case 'newest': orderBy.createdAt = 'desc'; break;
      case 'rating': orderBy.reviews = { _count: 'desc' }; break;
      default: orderBy.createdAt = 'desc';
    }

    const cacheKey = `products:list:${JSON.stringify({ page, limit, category, search, minPrice, maxPrice, sort, color, size, material, brand, isNew, isBestSeller, isFeatured })}`;
    const cached = cacheGet<{ products: unknown[]; total: number }>(cacheKey);
    if (cached) {
      sendPaginated(res, cached.products, { page, limit, total: cached.total });
      return;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true }, select: { id: true, color: true, colorHex: true, size: true, stock: true, priceOverride: true, images: true } },
          _count: { select: { reviews: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);
    cacheSet(cacheKey, { products, total }, LIST_TTL_MS);
    sendPaginated(res, products, { page, limit, total });
  } catch (error) { next(error); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const cacheKey = `products:slug:${slug}`;
    const cached = cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }

    const product = await prisma.product.findUnique({ where: { slug } });
    if (!product) throw ApiError.notFound('Product not found');

    // Prisma's MongoDB connector issues one round-trip per relation, so nested
    // includes are sequential and multiply Atlas latency. The relations below
    // are independent — load them in parallel and merge into the same shape.
    const [category, variants, reviews, reviewCount, questionCount] = await Promise.all([
      prisma.category.findUnique({
        where: { id: product.categoryId },
        select: { id: true, name: true, slug: true },
      }),
      prisma.productVariant.findMany({
        where: { productId: product.id, isActive: true },
        orderBy: { color: 'asc' },
      }),
      prisma.review.findMany({
        where: { productId: product.id, isApproved: true },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      }),
      prisma.review.count({ where: { productId: product.id } }),
      prisma.productQuestion.count({ where: { productId: product.id } }),
    ]);

    const payload = {
      ...product,
      category,
      variants,
      reviews,
      _count: { reviews: reviewCount, questions: questionCount },
    };
    cacheSet(cacheKey, payload, PRODUCT_TTL_MS);
    sendSuccess(res, payload);
  } catch (error) { next(error); }
};

const productListWhere = {
  featured: { isActive: true, isFeatured: true },
  newArrivals: { isActive: true, isNew: true },
  bestSellers: { isActive: true, isBestSeller: true },
} as const;

async function sendCachedProductList(
  res: Response,
  cacheKey: string,
  where: Record<string, unknown>
): Promise<void> {
  const cached = cacheGet<unknown[]>(cacheKey);
  if (cached) {
    sendSuccess(res, cached);
    return;
  }
  const products = await prisma.product.findMany({
    where,
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
  });
  cacheSet(cacheKey, products, LIST_TTL_MS);
  sendSuccess(res, products);
}

export const getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await sendCachedProductList(res, 'products:featured', productListWhere.featured);
  } catch (error) { next(error); }
};

export const getNewArrivals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await sendCachedProductList(res, 'products:new-arrivals', productListWhere.newArrivals);
  } catch (error) { next(error); }
};

export const getBestSellers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await sendCachedProductList(res, 'products:best-sellers', productListWhere.bestSellers);
  } catch (error) { next(error); }
};

export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const cacheKey = `products:related:${slug}`;
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }
    const product = await prisma.product.findUnique({ where: { slug }, select: { categoryId: true, id: true } });
    if (!product) throw ApiError.notFound('Product not found');
    const products = await prisma.product.findMany({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
    });
    cacheSet(cacheKey, products, LIST_TTL_MS);
    sendSuccess(res, products);
  } catch (error) { next(error); }
};

export const searchProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = req.query.q as string;
    if (!q) throw ApiError.badRequest('Search query is required');
    const products = await prisma.product.findMany({
      where: { isActive: true, name: { contains: q, mode: 'insensitive' } },
      take: 10,
      select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, images: true },
    });
    sendSuccess(res, products);
  } catch (error) { next(error); }
};
