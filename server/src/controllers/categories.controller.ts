import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';
import { cacheGet, cacheSet } from '../utils/cache';

const CATEGORY_TTL_MS = 60_000;

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'categories:all';
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' }, include: { _count: { select: { products: { where: { isActive: true } } } } } },
      },
    });
    cacheSet(cacheKey, categories, CATEGORY_TTL_MS);
    sendSuccess(res, categories);
  } catch (error) { next(error); }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const cacheKey = `categories:slug:${slug}`;
    const cached = cacheGet<Record<string, unknown>>(cacheKey);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    if (category) cacheSet(cacheKey, category, CATEGORY_TTL_MS);
    sendSuccess(res, category);
  } catch (error) { next(error); }
};

export const getFeaturedCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const cacheKey = 'categories:featured';
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) {
      sendSuccess(res, cached);
      return;
    }
    const categories = await prisma.category.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    cacheSet(cacheKey, categories, CATEGORY_TTL_MS);
    sendSuccess(res, categories);
  } catch (error) { next(error); }
};
