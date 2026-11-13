import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  register,
  login,
  logout,
  refresh,
  getMe,
  updatePassword,
  forgotPassword,
  resetPasswordEndpoint,
  googleStart,
  googleCallback,
} from '../controllers/auth.controller';
import {
  registerLimiter,
  loginLimiter,
  refreshLimiter,
  passwordResetLimiter,
  passwordChangeLimiter,
  googleAuthLimiter,
  sessionLimiter,
} from '../middleware/rateLimit.middleware';

const router = Router();

// Per-endpoint limits (per IP; login additionally has a per-account
// throttle inside the controller). Replaces the previous single crude
// limiter on the whole /auth prefix, which also throttled harmless
// session reads.
router.post('/register', registerLimiter, register);
router.post('/login', loginLimiter, login);
router.post('/refresh', refreshLimiter, refresh);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPasswordEndpoint);
router.get('/google', googleAuthLimiter, googleStart);
router.post('/google/callback', googleAuthLimiter, googleCallback);
router.get('/me', sessionLimiter, authenticate, getMe);
router.put('/password', passwordChangeLimiter, authenticate, updatePassword);
router.post('/logout', sessionLimiter, authenticate, logout);

export default router;
