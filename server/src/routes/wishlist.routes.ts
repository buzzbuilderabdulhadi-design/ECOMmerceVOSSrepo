import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { wishlistLimiter } from '../middleware/rateLimit.middleware';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '../controllers/wishlist.controller';

const router = Router();

router.use(authenticate);
router.get('/', getWishlist);
router.post('/', wishlistLimiter, addToWishlist);
router.delete('/:id', wishlistLimiter, removeFromWishlist);
router.delete('/', wishlistLimiter, clearWishlist);

export default router;
