import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { registerUser, loginUser, refreshUserToken, changePassword, requestPasswordReset, resetPassword } from '../services/auth.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validation/auth.validation';
import { sendPasswordResetEmail } from '../utils/email';
import config from '../config';

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

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordReset(email);
    if (result) {
      const resetUrl = `${config.client.url}/reset-password/${result.resetToken}`;
      await sendPasswordResetEmail(result.email, resetUrl);
    }
    sendMessage(res, 'If that email is registered, a reset link has been sent');
  } catch (error) { next(error); }
};

export const resetPasswordEndpoint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);
    await resetPassword(token, newPassword);
    sendMessage(res, 'Password reset successfully');
  } catch (error) { next(error); }
};
