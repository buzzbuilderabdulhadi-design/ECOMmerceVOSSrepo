import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middleware/auth.middleware';
import { uploadFile, uploadMultiple } from '../controllers/media.controller';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

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

// Stage uploads in the OS temp dir (NOT the publicly-served /uploads folder)
// and always clean them up in the controller. This prevents temporary files
// from being web-reachable while an upload is in progress (or forgotten after
// a failed Cloudinary call).
const UPLOAD_TEMP_DIR = path.join(os.tmpdir(), 'zoya-uploads');

// Recreate the temp dir on every request: OS temp dirs are wiped by the
// system and multer only mkdirs once at boot, so a cleaned-out dir would
// break all uploads until the server restarts.
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      fs.mkdir(UPLOAD_TEMP_DIR, { recursive: true }, (err) => cb(err || null, UPLOAD_TEMP_DIR));
    },
    filename: (_req, _file, cb) => {
      cb(null, crypto.randomBytes(16).toString('hex'));
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const router = Router();

// Media uploads are privileged storefront assets. Only admins may upload;
// a plain customer hitting these routes is rejected before multer runs.
router.post('/upload', authenticate, authorizeAdmin, upload.single('file'), uploadFile);
router.post('/upload-multiple', authenticate, authorizeAdmin, upload.array('files', 10), uploadMultiple);

export default router;
