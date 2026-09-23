import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyCouponSchema,
} from '../validation/cart.validation';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCouponToCart,
  removeCouponFromCart,
  mergeGuestCart,
} from '../controllers/cart.controller';

const router = Router();

router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, validate(addToCartSchema), addToCart);
router.put('/items/:itemId', optionalAuth, validate(updateCartItemSchema), updateCartItem);
router.delete('/items/:itemId', optionalAuth, validate(removeCartItemSchema), removeCartItem);
router.delete('/', optionalAuth, clearCart);

router.post('/merge', optionalAuth, mergeGuestCart);

router.post('/coupon', optionalAuth, validate(applyCouponSchema), applyCouponToCart);
router.delete('/coupon', optionalAuth, removeCouponFromCart);

export default router;
