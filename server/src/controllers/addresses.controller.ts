import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';

const normalize = (parsed: any) => ({
  label: parsed.label,
  fullName: parsed.fullName,
  phone: parsed.phone,
  line1: parsed.line1,
  line2: parsed.line2 ?? null,
  city: parsed.city,
  state: parsed.state,
  zip: parsed.zip,
  country: parsed.country,
  isDefault: parsed.isDefault ?? false,
});

export const getAddresses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId }, orderBy: { isDefault: 'desc' } });
    sendSuccess(res, addresses);
  } catch (error) { next(error); }
};

export const createAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = normalize(req.body);
    // Never trust a raw body spread: the shape is guaranteed by the Zod route
    // guard and rebuilt field-by-field above, so no ownership/extra columns.
    if (data.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
    const address = await prisma.address.create({ data: { ...data, userId: req.user!.userId } });
    sendCreated(res, address, 'Address added');
  } catch (error) { next(error); }
};

export const updateAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const parsed = req.body as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    // Rebuild from whitelisted key set only — safe against injected columns.
    for (const key of ['label', 'fullName', 'phone', 'line1', 'line2', 'city', 'state', 'zip', 'country', 'isDefault']) {
      if (parsed[key] !== undefined) {
        data[key] = parsed[key];
      }
    }
    if (data.isDefault) await prisma.address.updateMany({ where: { userId: req.user!.userId, id: { not: id } }, data: { isDefault: false } });
    const updated = await prisma.address.updateMany({ where: { id, userId: req.user!.userId }, data });
    if (updated.count === 0) throw ApiError.notFound('Address not found');
    const address = await prisma.address.findFirst({ where: { id, userId: req.user!.userId } });
    sendSuccess(res, address, 'Address updated');
  } catch (error) { next(error); }
};

export const deleteAddress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const deleted = await prisma.address.deleteMany({ where: { id, userId: req.user!.userId } });
    if (deleted.count === 0) throw ApiError.notFound('Address not found');
    sendMessage(res, 'Address deleted');
  } catch (error) { next(error); }
};