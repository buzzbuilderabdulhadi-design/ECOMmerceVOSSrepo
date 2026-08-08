import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { getProductReviews, createReview, updateReview, deleteReview, markReviewHelpful } from '../controllers/reviews.controller';

const router = Router();

router.get('/product/:slug', getProductReviews);
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);
router.patch('/:id/helpful', optionalAuth, markReviewHelpful);

export default router;
