import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { updateProfile, deleteAccount } from '../controllers/users.controller';

const router = Router();

router.use(authenticate);
router.put('/profile', updateProfile);
router.delete('/account', deleteAccount);

export default router;
