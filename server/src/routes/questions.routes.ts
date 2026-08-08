import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { getProductQuestions, createQuestion } from '../controllers/questions.controller';

const router = Router();

router.get('/product/:slug', getProductQuestions);
router.post('/', authenticate, createQuestion);

export default router;
