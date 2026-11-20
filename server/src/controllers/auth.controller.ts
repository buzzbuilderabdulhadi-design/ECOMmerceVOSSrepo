import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import prisma from '../config/db';
import { registerUser, loginUser, refreshUserToken, changePassword, requestPasswordReset, resetPassword, authenticateWithGoogle, logoutUser } from '../services/auth.service';
import { sendSuccess, sendCreated, sendMessage } from '../utils/apiResponse';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, googleCallbackSchema } from '../validation/auth.validation';
import { sendPasswordResetEmail } from '../utils/email';
import { ApiError } from '../utils/apiError';
import { isLoginThrottled, recordLoginFailure, clearLoginFailures, maskEmail } from '../utils/loginThrottle';
import logger from '../utils/logger';
import config from '../config';
import {
  OAUTH_STATE_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  clearOAuthStateCookie,
  ensureCsrfCookie,
  setAuthCookies,
  setOAuthStateCookie,
} from '../utils/authCookies';

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body);
    const result = await registerUser(data);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendCreated(res, { user: result.user }, 'Registration successful');
  } catch (error) { next(error); }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body);

    // Per-account backstop (the IP limiter on this route is the other half).
    // Checked BEFORE password hashing so a locked account costs no CPU.
    if (await isLoginThrottled(data.email)) {
      logger.warn('Login attempt blocked — account temporarily throttled', {
        account: maskEmail(data.email),
        ip: req.ip,
      });
      throw ApiError.tooMany(
        'Too many failed sign-in attempts for this account. Please wait a few minutes and try again.'
      );
    }

    try {
      const result = await loginUser(data.email, data.password);
      try {
        await clearLoginFailures(data.email);
      } catch (throttleError) {
        // A successful login must not fail just because counter cleanup did.
        logger.error('Failed to clear login throttle', {
          error: String(throttleError),
        });
      }
      setAuthCookies(res, result.accessToken, result.refreshToken);
      sendSuccess(res, { user: result.user }, 'Login successful');
    } catch (error) {
      // Only genuine credential failures count toward the throttle —
      // never validation errors or unrelated server faults.
      if (error instanceof ApiError && error.statusCode === 401) {
        try {
          await recordLoginFailure(data.email);
        } catch (throttleError) {
          // The shared IP limiter fails closed; log the per-account counter
          // outage but preserve the real 401 for the caller.
          logger.error('Failed to record login failure', {
            error: String(throttleError),
          });
        }
        logger.warn('Failed login attempt', {
          account: maskEmail(data.email),
          ip: req.ip,
        });
      }
      throw error;
    }
  } catch (error) { next(error); }
};

/**
 * POST /auth/logout — server-side session revocation.
 * Clears the stored refresh-token hash so the session can no longer be
 * refreshed even if a refresh token was copied. (Local token cleanup on the
 * client alone would not revoke anything.)
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await logoutUser(req.user!.userId);
    clearAuthCookies(res);
    sendMessage(res, 'Logged out');
  } catch (error) {
    // Always clear browser credentials, even if revocation hit a DB error.
    clearAuthCookies(res);
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = refreshTokenSchema.parse(req.body ?? {});
    const token = data.refreshToken || req.cookies?.[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized('No refresh token provided');
    const result = await refreshUserToken(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { refreshed: true }, 'Token refreshed');
  } catch (error) { next(error); }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, emailVerified: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw ApiError.unauthorized('User not found');
    ensureCsrfCookie(req, res);
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

// ============================================================
// Google OAuth — OAuth 2.0 / OpenID Connect authorization-code flow
// ============================================================

/**
 * GET /auth/google — redirect the browser to Google's consent screen.
 * The `state` nonce is generated by the client (stored in its own
 * localStorage) or randomly here, and is echoed back unchanged by
 * Google. We also bind it to a short-lived HttpOnly cookie so the
 * callback cannot be forged by a client that only controls localStorage.
 */
export const googleStart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!config.google.clientId) {
      res.redirect(`${config.client.url}/login?google=not_configured`);
      return;
    }
    const state =
      typeof req.query.state === 'string' && req.query.state.length > 0
        ? req.query.state
        : crypto.randomUUID();

    const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizeUrl.searchParams.set('client_id', config.google.clientId);
    authorizeUrl.searchParams.set('redirect_uri', config.google.redirectUri);
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('scope', 'openid email profile');
    authorizeUrl.searchParams.set('prompt', 'select_account');
    authorizeUrl.searchParams.set('access_type', 'online');
    authorizeUrl.searchParams.set('state', state);
    setOAuthStateCookie(res, state);
    res.redirect(authorizeUrl.toString());
  } catch (error) { next(error); }
};

/**
 * POST /auth/google/callback — exchange the authorization code for
 * tokens (server-side only; the client secret never leaves the
 * server), read the verified Google profile, then link or create the
 * customer account. Returns the same { user, accessToken, refreshToken }
 * shape as email login/register so the client persists the session
 * identically.
 */
export const googleCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, state } = googleCallbackSchema.parse(req.body);
    const expectedState = req.cookies?.[OAUTH_STATE_COOKIE];
    if (
      !expectedState ||
      typeof expectedState !== 'string' ||
      !constantTimeEqual(expectedState, state)
    ) {
      clearOAuthStateCookie(res);
      throw ApiError.forbidden('Google sign-in could not be verified. Please try again.');
    }
    clearOAuthStateCookie(res);
    const result = await authenticateWithGoogle(code);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user }, 'Google sign-in successful');
  } catch (error) { next(error); }
};
