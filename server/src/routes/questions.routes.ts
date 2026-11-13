import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { questionCreateLimiter } from '../middleware/rateLimit.middleware';
import { createQuestionSchema } from '../validation/questions.validation';
import { getProductQuestions, createQuestion } from '../controllers/questions.controller';

const router = Router();

router.get('/product/:slug', getProductQuestions);
router.post('/', authenticate, questionCreateLimiter, validate(createQuestionSchema), createQuestion);

export default router;