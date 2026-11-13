import { Router } from 'express';
import { validate } from '../middleware/validate';
import { contactLimiter } from '../middleware/rateLimit.middleware';
import { contactSchema } from '../validation/contact.validation';
import { submitContact } from '../controllers/contact.controller';

const router = Router();

router.post('/', contactLimiter, validate(contactSchema), submitContact);

export default router;