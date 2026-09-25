import { Router } from 'express';
import { validate } from '../middleware/validate';
import { contactSchema } from '../validation/contact.validation';
import { submitContact } from '../controllers/contact.controller';

const router = Router();

router.post('/', validate(contactSchema), submitContact);

export default router;