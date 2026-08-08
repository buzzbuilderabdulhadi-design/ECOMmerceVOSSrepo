import { Router } from 'express';
import { getCategories, getCategory, getFeaturedCategories } from '../controllers/categories.controller';

const router = Router();

router.get('/', getCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:slug', getCategory);

export default router;
