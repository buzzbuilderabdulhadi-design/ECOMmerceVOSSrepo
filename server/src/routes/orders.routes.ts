import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createOrder, getOrders, getOrder, cancelOrder } from '../controllers/orders.controller';

const router = Router();

router.use(authenticate);
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrder);
router.patch('/:id/cancel', cancelOrder);

export default router;
