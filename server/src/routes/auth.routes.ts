import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { register, login, refresh, getMe, updatePassword, forgotPassword, resetPasswordEndpoint, googleStart, googleCallback } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPasswordEndpoint);
router.get('/google', googleStart);
router.post('/google/callback', googleCallback);
router.get('/me', authenticate, getMe);
router.put('/password', authenticate, updatePassword);

export default router;
