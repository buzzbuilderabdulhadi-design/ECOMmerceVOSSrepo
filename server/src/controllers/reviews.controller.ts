import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const getProductReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
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
    const existing = await prisma.review.findUnique({ where: { productId_userId: { productId, userId: req.user!.userId } } });
    if (existing) throw ApiError.conflict('You have already reviewed this product');
    const review = await prisma.review.create({ data: { productId, userId: req.user!.userId, rating, title, text, images: images || [] } });
    sendCreated(res, review, 'Review submitted for approval');
  } catch (error) { next(error); }
};

export const updateReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rating, title, text, images } = req.body;
    const id = req.params.id as string;
    const review = await prisma.review.findFirst({ where: { id, userId: req.user!.userId } });
    if (!review) throw ApiError.notFound('Review not found');
    const updated = await prisma.review.update({ where: { id }, data: { rating, title, text, images, isApproved: false } });
    sendSuccess(res, updated, 'Review updated');
  } catch (error) { next(error); }
};

export const deleteReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.review.delete({ where: { id: req.params.id as string } });
    sendMessage(res, 'Review deleted');
  } catch (error) { next(error); }
};

export const markReviewHelpful = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const review = await prisma.review.update({ where: { id: req.params.id as string }, data: { helpfulCount: { increment: 1 } } });
    sendSuccess(res, review);
  } catch (error) { next(error); }
};
