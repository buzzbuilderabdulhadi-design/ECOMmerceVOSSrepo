import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { orderCreateLimiter, orderReadLimiter } from '../middleware/rateLimit.middleware';
import { createOrder, getOrders, getOrder, cancelOrder } from '../controllers/orders.controller';
import { createOrderSchema } from '../validation/order.validation';

const router = Router();

router.use(authenticate);
router.post('/', orderCreateLimiter, validate(createOrderSchema), createOrder);
router.get('/', orderReadLimiter, getOrders);
router.get('/:id', orderReadLimiter, getOrder);
router.patch('/:id/cancel', orderCreateLimiter, cancelOrder);

export default router;