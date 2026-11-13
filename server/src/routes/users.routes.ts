import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { accountWriteLimiter } from '../middleware/rateLimit.middleware';
import { updateProfileSchema } from '../validation/users.validation';
import { updateProfile, deleteAccount } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);
router.put('/profile', accountWriteLimiter, validate(updateProfileSchema), updateProfile);
router.delete('/account', accountWriteLimiter, deleteAccount);

export default router;