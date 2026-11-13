import { Router } from 'express';
import { couponLimiter } from '../middleware/rateLimit.middleware';
import { validateCoupon } from '../controllers/coupons.controller';

const router = Router();

router.post('/validate', couponLimiter, validateCoupon);

export default router;