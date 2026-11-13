import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { reviewCreateLimiter, reviewWriteLimiter, reviewHelpfulLimiter } from '../middleware/rateLimit.middleware';
import { createReviewSchema, updateOwnReviewSchema, reviewIdParam } from '../validation/reviews.validation';
import { getProductReviews, createReview, updateReview, deleteReview, markReviewHelpful } from '../controllers/reviews.controller';

const router = Router();

router.get('/product/:slug', getProductReviews);
router.post('/', authenticate, reviewCreateLimiter, validate(createReviewSchema), createReview);
router.put('/:id', authenticate, reviewWriteLimiter, validate(updateOwnReviewSchema), updateReview);
router.delete('/:id', authenticate, reviewWriteLimiter, validate(reviewIdParam), deleteReview);
router.patch('/:id/helpful', reviewHelpfulLimiter, optionalAuth, validate(reviewIdParam), markReviewHelpful);

export default router;