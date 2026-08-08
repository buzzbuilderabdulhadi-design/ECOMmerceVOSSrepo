import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess } from '../utils/apiResponse';

export const getCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' }, include: { _count: { select: { products: { where: { isActive: true } } } } } },
      },
    });
    sendSuccess(res, categories);
  } catch (error) { next(error); }
};

export const getCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.params.slug as string;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, orderBy: { displayOrder: 'asc' } },
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    sendSuccess(res, category);
  } catch (error) { next(error); }
};

export const getFeaturedCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, isFeatured: true },
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    });
    sendSuccess(res, categories);
  } catch (error) { next(error); }
};
