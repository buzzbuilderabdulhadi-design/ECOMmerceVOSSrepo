import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadFile, uploadMultiple } from '../controllers/media.controller';
import multer from 'multer';

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, upload.array('files', 10), uploadMultiple);

export default router;
