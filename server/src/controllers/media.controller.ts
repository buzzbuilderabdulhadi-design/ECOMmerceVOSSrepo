import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendCreated } from '../utils/apiResponse';

const cloudinaryUpload = async (file: any) => {
  const cloudinary = require('cloudinary').v2;
  const config = require('../config').default;
  cloudinary.config({ cloud_name: config.cloudinary.name, api_key: config.cloudinary.apiKey, api_secret: config.cloudinary.apiSecret });
  return cloudinary.uploader.upload(file.path, { folder: 'voss' });
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { sendSuccess(res, null, 'No file uploaded'); return; }
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
        folder: (req.body.folder as string) || 'general',
        uploadedBy: req.user?.userId,
      },
    });
    sendCreated(res, media, 'File uploaded');
  } catch (error) { next(error); }
};

export const uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) { sendSuccess(res, []); return; }
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
          folder: (req.body.folder as string) || 'general',
          uploadedBy: req.user?.userId,
        },
      })
    ));
    sendCreated(res, media, 'Files uploaded');
  } catch (error) { next(error); }
};
