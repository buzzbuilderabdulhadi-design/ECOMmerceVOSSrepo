import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdParam,
} from '../validation/addresses.validation';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/addresses.controller';

const router = Router();

router.use(authenticate);
router.get('/', getAddresses);
router.post('/', validate(createAddressSchema), createAddress);
router.put('/:id', validate(updateAddressSchema), updateAddress);
router.delete('/:id', validate(addressIdParam), deleteAddress);

export default router;