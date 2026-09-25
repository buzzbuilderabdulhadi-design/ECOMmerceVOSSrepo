import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { cacheInvalidate } from '../utils/cache';

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        // Normalize an empty avatar to null so clearing the field actually
        // clears it rather than storing an empty string.
        ...(avatar !== undefined && { avatar: avatar || null }),
      },
      select: { id: true, name: true, email: true, avatar: true, phone: true },
    });
    sendSuccess(res, user, 'Profile updated');
  } catch (error) { next(error); }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    // Deleting a user who has orders would orphan their order history (and the
    // admin dashboard's real revenue/customer numbers). Mirror the admin
    // policy: refuse deletion while order history exists, with a clear path
    // forward. This avoids both orphaned records and obviously wrong totals.
    const orderCount = await prisma.order.count({ where: { userId } });
    if (orderCount > 0) {
      throw ApiError.badRequest(
        'Account cannot be deleted because it has order history. Please contact support for assistance.'
      );
    }

    // Cascade-clean dependent records (MongoDB has no enforced FKs).
    const cart = await prisma.cart.findMany({ where: { userId }, select: { id: true } });
    if (cart.length > 0) {
      await prisma.cartItem.deleteMany({ where: { cartId: { in: cart.map((c) => c.id) } } });
    }
    await prisma.cart.deleteMany({ where: { userId } });
    await prisma.address.deleteMany({ where: { userId } });
    await prisma.wishlistItem.deleteMany({ where: { userId } });
    await prisma.review.deleteMany({ where: { userId } });
    await prisma.productQuestion.deleteMany({ where: { userId } });
    await prisma.notification.deleteMany({ where: { userId } });
    await prisma.activityLog.deleteMany({ where: { userId } });

    await prisma.user.delete({ where: { id: userId } });
    cacheInvalidate(`auth:user:${userId}`);
    sendMessage(res, 'Account deleted');
  } catch (error) { next(error); }
};