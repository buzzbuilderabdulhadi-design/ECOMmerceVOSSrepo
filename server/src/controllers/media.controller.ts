import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import cloudinary from 'cloudinary';
import config from '../config';
import prisma from '../config/db';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

const CLOUDINARY_FOLDER = 'zoya-goods';

const cloudinaryUpload = async (file: any) => {
  cloudinary.v2.config({ cloud_name: config.cloudinary.name, api_key: config.cloudinary.apiKey, api_secret: config.cloudinary.apiSecret });
  return cloudinary.v2.uploader.upload(file.path, { folder: CLOUDINARY_FOLDER });
};

// Remove a staged multer temp file after the Cloudinary attempt, whether it
// succeeded or failed, so nothing lingers on the filesystem (and, previously,
// in the publicly-served uploads/ dir).
const cleanupTempFile = (filePath?: string) => {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { sendSuccess(res, null, 'No file uploaded'); return; }
    try {
      const result = await cloudinaryUpload(req.file);
      const media = await prisma.media.create({
        data: {
          fileName: req.file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width: result.width,
          height: result.height,
          folder: (req.body.folder as string) || CLOUDINARY_FOLDER,
          uploadedBy: req.user?.userId,
        },
      });
      sendCreated(res, media, 'File uploaded');
    } finally {
      cleanupTempFile(req.file.path);
    }
  } catch (error) { next(error); }
};

export const uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) { sendSuccess(res, []); return; }
    try {
      const results = await Promise.all(files.map((f) => cloudinaryUpload(f)));
      const media = await Promise.all(results.map((r, i) =>
        prisma.media.create({
          data: {
            fileName: files[i].originalname,
            url: r.secure_url,
            publicId: r.public_id,
            mimeType: files[i].mimetype,
            size: files[i].size,
            width: r.width,
            height: r.height,
            folder: (req.body.folder as string) || CLOUDINARY_FOLDER,
            uploadedBy: req.user?.userId,
          },
        })
      ));
      sendCreated(res, media, 'Files uploaded');
    } finally {
      files.forEach((f) => cleanupTempFile(f.path));
    }
  } catch (error) { next(error); }
};