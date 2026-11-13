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
  cartReadLimiter,
  cartMutationLimiter,
  cartMergeLimiter,
  couponLimiter,
} from '../middleware/rateLimit.middleware';
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

router.get('/', cartReadLimiter, optionalAuth, getCart);
router.post('/items', cartMutationLimiter, optionalAuth, validate(addToCartSchema), addToCart);
router.put('/items/:itemId', cartMutationLimiter, optionalAuth, validate(updateCartItemSchema), updateCartItem);
router.delete('/items/:itemId', cartMutationLimiter, optionalAuth, validate(removeCartItemSchema), removeCartItem);
router.delete('/', cartMutationLimiter, optionalAuth, clearCart);

// Merging rewrites both carts — much stricter than an ordinary add.
router.post('/merge', cartMergeLimiter, optionalAuth, mergeGuestCart);

router.post('/coupon', couponLimiter, optionalAuth, validate(applyCouponSchema), applyCouponToCart);
router.delete('/coupon', couponLimiter, optionalAuth, removeCouponFromCart);

export default router;
