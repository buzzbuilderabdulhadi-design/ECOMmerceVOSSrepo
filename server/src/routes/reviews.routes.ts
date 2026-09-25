import { Router } from 'express';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createReviewSchema, updateOwnReviewSchema, reviewIdParam } from '../validation/reviews.validation';
import { getProductReviews, createReview, updateReview, deleteReview, markReviewHelpful } from '../controllers/reviews.controller';

const router = Router();

router.get('/product/:slug', getProductReviews);
router.post('/', authenticate, validate(createReviewSchema), createReview);
router.put('/:id', authenticate, validate(updateOwnReviewSchema), updateReview);
router.delete('/:id', authenticate, validate(reviewIdParam), deleteReview);
router.patch('/:id/helpful', optionalAuth, validate(reviewIdParam), markReviewHelpful);

export default router;