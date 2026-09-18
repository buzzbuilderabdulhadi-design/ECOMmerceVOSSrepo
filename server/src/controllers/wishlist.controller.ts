import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';

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
    if (!isValidObjectId(productId)) throw ApiError.badRequest('Invalid product ID');
    if (variantId != null && !isValidObjectId(variantId)) throw ApiError.badRequest('Invalid variant ID');
    const existing = await prisma.wishlistItem.findFirst({
      where: { userId: req.user!.userId, productId, variantId: variantId || null },
    });
    if (existing) throw ApiError.conflict('Item already in wishlist');
    const item = await prisma.wishlistItem.create({ data: { userId: req.user!.userId, productId, variantId: variantId || null } });
    sendCreated(res, item, 'Added to wishlist');
  } catch (error) { next(error); }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid wishlist item ID');
    await prisma.wishlistItem.delete({ where: { id } });
    sendMessage(res, 'Removed from wishlist');
  } catch (error) { next(error); }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.userId } });
    sendMessage(res, 'Wishlist cleared');
  } catch (error) { next(error); }
};
