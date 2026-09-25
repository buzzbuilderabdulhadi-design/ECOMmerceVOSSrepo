import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { notifyAdminsQuestionAsked } from '../services/notification.service';

export const getProductQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
    const productSlug = req.params.slug as string;
    const product = await prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
    if (!product) { sendSuccess(res, []); return; }
    const [questions, total] = await Promise.all([
      prisma.productQuestion.findMany({ where: { productId: product.id, isPublished: true }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true } } } }),
      prisma.productQuestion.count({ where: { productId: product.id, isPublished: true } }),
    ]);
    sendPaginated(res, questions, { page, limit, total });
  } catch (error) { next(error); }
};

export const createQuestion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, question } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) throw ApiError.notFound('Product not found');

    // Keep a single open+unanswered question per product per user so inboxes
    // don't get spammed with near-duplicate asks. Unanswered questions are
    // never published (answerQuestion sets isPublished=true with the answer),
    // and marking them null-invisible is unreliable on Mongo.
    const open = await prisma.productQuestion.findFirst({
      where: { productId, userId: req.user!.userId, isPublished: false },
      select: { id: true },
    });
    if (open) throw ApiError.conflict('You already have an open question on this product');

    const q = await prisma.productQuestion.create({ data: { productId, userId: req.user!.userId, question } });
    sendCreated(res, q, 'Question submitted');
    notifyAdminsQuestionAsked({ id: q.id, productId: q.productId }).catch(() => {});
  } catch (error) { next(error); }
};