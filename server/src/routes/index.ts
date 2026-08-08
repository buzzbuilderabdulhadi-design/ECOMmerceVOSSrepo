import { Router } from 'express';
import adminRoutes from './admin.routes';
import authRoutes from './auth.routes';
import productRoutes from './products.routes';
import categoryRoutes from './categories.routes';
import cartRoutes from './cart.routes';
import wishlistRoutes from './wishlist.routes';
import reviewRoutes from './reviews.routes';
import orderRoutes from './orders.routes';
import couponRoutes from './coupons.routes';
import addressRoutes from './addresses.routes';
import userRoutes from './users.routes';
import questionRoutes from './questions.routes';
import mediaRoutes from './media.routes';

const router = Router();

router.use('/admin', adminRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/reviews', reviewRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/addresses', addressRoutes);
router.use('/users', userRoutes);
router.use('/questions', questionRoutes);
router.use('/media', mediaRoutes);

export default router;
