import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { registerUser, loginUser, refreshUserToken, changePassword } from '../services/auth.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema } from '../validation/auth.validation';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    sendCreated(res, result, 'Registration successful');
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await loginUser(data.email, data.password);
    sendSuccess(res, result, 'Login successful');
  } catch (error) { next(error); }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = refreshTokenSchema.parse(req.body);
    const result = await refreshUserToken(data.refreshToken);
    sendSuccess(res, result, 'Token refreshed');
  } catch (error) { next(error); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, emailVerified: true, createdAt: true },
    });
    sendSuccess(res, user);
  } catch (error) { next(error); }
};

export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = changePasswordSchema.parse(req.body);
    await changePassword(req.user!.userId, data.currentPassword, data.newPassword);
    sendMessage(res, 'Password changed successfully');
  } catch (error) { next(error); }
};
