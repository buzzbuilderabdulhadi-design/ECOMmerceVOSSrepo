import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { register, login, refresh, getMe, updatePassword } from '../controllers/auth.controller';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authenticate, getMe);
router.put('/password', authenticate, updatePassword);

export default router;
