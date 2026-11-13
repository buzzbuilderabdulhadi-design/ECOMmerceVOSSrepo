import { Router } from 'express';
import { catalogListLimiter } from '../middleware/rateLimit.middleware';
import { getCategories, getCategory, getFeaturedCategories } from '../controllers/categories.controller';

const router = Router();

router.use(catalogListLimiter);
router.get('/', getCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:slug', getCategory);

export default router;