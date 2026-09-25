import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { notifyAdminsReviewPending } from '../services/notification.service';

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const productSlug = req.params.slug as string;
    const product = await prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
    if (!product) throw ApiError.notFound('Product not found');
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({ where: { productId: product.id, isApproved: true }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, name: true, avatar: true } } } }),
      prisma.review.count({ where: { productId: product.id, isApproved: true } }),
    ]);
    sendPaginated(res, reviews, { page, limit, total });
  } catch (error) { next(error); }
};

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, rating, title, text, images } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw ApiError.notFound('Product not found');

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId, userId: req.user!.userId } },
    });
    if (existing) throw ApiError.conflict('You have already reviewed this product');

    // Verified-purchase flag so approved reviews at least reflect real orders.
    const purchased = await prisma.orderItem.findFirst({
      where: { productId, order: { userId: req.user!.userId, status: { notIn: ['CANCELLED', 'RETURNED'] } } },
      select: { id: true },
    });

    const review = await prisma.review.create({
      data: {
        productId,
        userId: req.user!.userId,
        rating,
        title: title || null,
        text: text ?? null,
        images: images || [],
        isVerifiedPurchase: !!purchased,
      },
    });
    sendCreated(res, review, 'Review submitted for approval');
    notifyAdminsReviewPending({ id: review.id, productId }).catch(() => {});
  } catch (error) { next(error); }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, title, text, images } = req.body;
    const id = req.params.id as string;
    const review = await prisma.review.findFirst({ where: { id, userId: req.user!.userId } });
    if (!review) throw ApiError.notFound('Review not found');
    const updated = await prisma.review.update({
      where: { id },
      data: { rating, title: title ?? null, text: text ?? null, images: images ?? [], isApproved: false },
    });
    sendSuccess(res, updated, 'Review updated');
    // Editing a review flips it back to awaiting approval — keep admins in the loop.
    notifyAdminsReviewPending({ id: updated.id, productId: updated.productId }).catch(() => {});
  } catch (error) { next(error); }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.findUnique({ where: { id }, select: { id: true, userId: true } });
    if (!review) throw ApiError.notFound('Review not found');
    if (review.userId !== req.user!.userId) {
      throw ApiError.forbidden('You can only delete your own reviews');
    }
    await prisma.review.delete({ where: { id } });
    sendMessage(res, 'Review deleted');
  } catch (error) { next(error); }
};

export const markReviewHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const review = await prisma.review.findUnique({ where: { id }, select: { id: true } });
    if (!review) throw ApiError.notFound('Review not found');
    const updated = await prisma.review.update({ where: { id }, data: { helpfulCount: { increment: 1 } } });
    sendSuccess(res, { helpfulCount: updated.helpfulCount });
  } catch (error) { next(error); }
};