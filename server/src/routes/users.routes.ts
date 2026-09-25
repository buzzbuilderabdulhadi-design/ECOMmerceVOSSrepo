import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validation/users.validation';
import { updateProfile, deleteAccount } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.delete('/account', deleteAccount);

export default router;