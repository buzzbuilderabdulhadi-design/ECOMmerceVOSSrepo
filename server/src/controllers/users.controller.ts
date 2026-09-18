import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendMessage } from '../utils/apiResponse';
import { cacheInvalidate } from '../utils/cache';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: { ...(name && { name }), ...(phone !== undefined && { phone }), ...(avatar !== undefined && { avatar }) },
      select: { id: true, name: true, email: true, avatar: true, phone: true },
    });
    sendSuccess(res, user, 'Profile updated');
  } catch (error) { next(error); }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.user.delete({ where: { id: req.user!.userId } });
    cacheInvalidate(`auth:user:${req.user!.userId}`);
    sendMessage(res, 'Account deleted');
  } catch (error) { next(error); }
};
