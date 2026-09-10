import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { uploadFile, uploadMultiple } from '../controllers/media.controller';
import multer from 'multer';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const ext = '.' + file.originalname.split('.').pop()?.toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: JPEG, PNG, WebP. Received: ${file.mimetype} (${ext})`));
  }
};

const upload = multer({ dest: 'uploads/', limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

const router = Router();

router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, upload.array('files', 10), uploadMultiple);

export default router;
