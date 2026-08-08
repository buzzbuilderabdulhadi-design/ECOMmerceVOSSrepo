import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendPaginated } from '../utils/apiResponse';

export const getProductQuestions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
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
    const q = await prisma.productQuestion.create({ data: { productId, userId: req.user!.userId, question } });
    sendCreated(res, q, 'Question submitted');
  } catch (error) { next(error); }
};
