import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

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
    sendPaginated(res, products, { page, limit, total });
  } catch (error) { next(error); }
};

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { color: 'asc' } },
        reviews: {
          where: { isApproved: true },
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, avatar: true } } },
        },
        _count: { select: { reviews: true, questions: true } },
      },
    });
    if (!product) throw ApiError.notFound('Product not found');
    sendSuccess(res, product);
  } catch (error) { next(error); }
};

export const getFeaturedProducts = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
    });
    sendSuccess(res, products);
  } catch (error) { next(error); }
};

export const getNewArrivals = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
    });
    sendSuccess(res, products);
  } catch (error) { next(error); }
};

export const getBestSellers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isBestSeller: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
    });
    sendSuccess(res, products);
  } catch (error) { next(error); }
};

export const getRelatedProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findUnique({ where: { slug }, select: { categoryId: true, id: true } });
    if (!product) throw ApiError.notFound('Product not found');
    const products = await prisma.product.findMany({
      where: { isActive: true, categoryId: product.categoryId, id: { not: product.id } },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { category: { select: { name: true, slug: true } }, variants: { where: { isActive: true } } },
    });
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
