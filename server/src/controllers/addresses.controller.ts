import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId }, orderBy: { isDefault: 'desc' } });
    sendSuccess(res, addresses);
  } catch (error) { next(error); }
};

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    if (data.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    const address = await prisma.address.create({ data: { ...data, userId: req.user!.userId } });
    sendCreated(res, address, 'Address added');
  } catch (error) { next(error); }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = req.body;
    const id = req.params.id as string;
    if (data.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.userId, id: { not: id } }, data: { isDefault: false } });
    const address = await prisma.address.update({ where: { id }, data });
    sendSuccess(res, address, 'Address updated');
  } catch (error) { next(error); }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id as string } });
    sendMessage(res, 'Address deleted');
  } catch (error) { next(error); }
};
