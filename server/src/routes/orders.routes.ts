import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { createOrder, getOrders, getOrder, cancelOrder } from '../controllers/orders.controller';
import { createOrderSchema } from '../validation/order.validation';

const router = Router();

router.use(authenticate);
router.post('/', validate(createOrderSchema), createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;
