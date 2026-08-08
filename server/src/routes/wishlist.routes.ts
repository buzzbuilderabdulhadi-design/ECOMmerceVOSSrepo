import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getWishlist, addToWishlist, removeFromWishlist, clearWishlist } from '../controllers/wishlist.controller';

const router = Router();

router.use(authenticate);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.delete('/:id', removeFromWishlist);
router.delete('/', clearWishlist);

export default router;
