import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { accountWriteLimiter } from '../middleware/rateLimit.middleware';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParam,
} from '../validation/addresses.validation';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addresses.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAddresses);
router.post('/', accountWriteLimiter, validate(createAddressSchema), createAddress);
router.put('/:id', accountWriteLimiter, validate(updateAddressSchema), updateAddress);
router.delete('/:id', accountWriteLimiter, validate(addressIdParam), deleteAddress);

export default router;