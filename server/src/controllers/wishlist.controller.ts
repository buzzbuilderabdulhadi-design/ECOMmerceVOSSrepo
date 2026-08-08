import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: { select: { id: true, name: true, slug: true, regularPrice: true, salePrice: true, images: true, stock: true, isActive: true } },
        variant: { select: { id: true, color: true, colorHex: true, size: true } },
      },
      orderBy: { addedAt: 'desc' },
    });
    sendSuccess(res, items);
  } catch (error) { next(error); }
};

export const addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId } = req.body;
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId_variantId: { userId: req.user!.userId, productId, variantId: variantId || '' } },
    });
    if (existing) throw ApiError.conflict('Item already in wishlist');
    const item = await prisma.wishlistItem.create({ data: { userId: req.user!.userId, productId, variantId: variantId || null } });
    sendCreated(res, item, 'Added to wishlist');
  } catch (error) { next(error); }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.wishlistItem.delete({ where: { id: req.params.id as string } });
    sendMessage(res, 'Removed from wishlist');
  } catch (error) { next(error); }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.userId } });
    sendMessage(res, 'Wishlist cleared');
  } catch (error) { next(error); }
};
