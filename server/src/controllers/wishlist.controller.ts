import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';

const wishlistInclude = {
  product: {
    select: {
      id: true, name: true, slug: true, sku: true,
      regularPrice: true, salePrice: true, discountPercent: true,
      images: true, stock: true, isActive: true, isNew: true, isBestSeller: true,
      brand: true,
      category: { select: { id: true, name: true, slug: true } },
      variants: {
        select: { id: true, color: true, colorHex: true, size: true, stock: true, isActive: true, priceOverride: true, sku: true },
      },
    },
  },
  variant: { select: { id: true, color: true, colorHex: true, size: true, stock: true, isActive: true, priceOverride: true, sku: true } },
};

export const getWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.userId },
      include: wishlistInclude,
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

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { variants: { select: { id: true, isActive: true } } },
    });
    if (!product) throw ApiError.notFound('Product not found');

    if (variantId != null) {
      const activeVariantIds = (product.variants ?? []).filter((v) => v.isActive).map((v) => v.id);
      if (!activeVariantIds.includes(variantId)) {
        throw ApiError.badRequest('The selected size or color is not available for this product.');
      }
    }

    const existing = await prisma.wishlistItem.findFirst({
      where: { userId: req.user!.userId, productId, variantId: variantId || null },
    });
    if (existing) throw ApiError.conflict('Item already in wishlist');

    const item = await prisma.wishlistItem.create({
      data: { userId: req.user!.userId, productId, variantId: variantId || null },
      include: wishlistInclude,
    });
    sendCreated(res, item, 'Added to wishlist');
  } catch (error) { next(error); }
};

export const removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    if (!isValidObjectId(id)) throw ApiError.badRequest('Invalid wishlist item ID');
    // Ownership is enforced in the same atomic delete so one customer can
    // never remove (or even probe for) another customer's wishlist entries.
    const result = await prisma.wishlistItem.deleteMany({
      where: { id, userId: req.user!.userId },
    });
    if (result.count === 0) throw ApiError.notFound('Wishlist item not found');
    sendMessage(res, 'Removed from wishlist');
  } catch (error) { next(error); }
};

export const clearWishlist = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.wishlistItem.deleteMany({ where: { userId: req.user!.userId } });
    sendMessage(res, 'Wishlist cleared');
  } catch (error) { next(error); }
};
