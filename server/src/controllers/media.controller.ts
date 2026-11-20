import { Request, Response, NextFunction } from 'express';
import { uploadImage, deleteImage, isCloudinaryReady, requireCloudinaryConfigured } from '../config/cloudinary';
import config from '../config';
import prisma from '../config/db';
import { sendSuccess, sendCreated } from '../utils/apiResponse';
import { assertImageSignature } from '../utils/imageSignature';
import { cleanupTempFile } from '../utils/tempCleanup';

const CLOUDINARY_FOLDER = 'zoya-goods';

/**
 * Upload one staged file to Cloudinary. Throws a clear error when Cloudinary
 * is not configured so the caller never silently falls back to ephemeral
 * local storage.
 */
const cloudinaryUpload = async (file: any, folder: string) => {
  requireCloudinaryConfigured();
  await assertImageSignature(file.path, file.mimetype);
  return uploadImage(file.path, 'product', undefined);
};

/**
 * Remove a staged multer temp file after the Cloudinary attempt, whether it
 * succeeded or failed, so nothing lingers on the filesystem (and, previously,
 * in the publicly-served uploads/ dir).
 */
export { cleanupTempFile };

/**
 * Roll back a successful Cloudinary upload when the database record cannot be
 * created, so a failed upload never leaves an orphaned asset in storage.
 */
const rollbackUpload = async (publicId?: string) => {
  if (!publicId) return;
  try {
    await deleteImage(publicId);
  } catch {
    // Best-effort rollback; surface the original DB error instead.
  }
};

export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) { sendSuccess(res, null, 'No file uploaded'); return; }

    requireCloudinaryConfigured();

    let publicId: string | undefined;
    try {
      const result = await cloudinaryUpload(req.file, CLOUDINARY_FOLDER);
      publicId = result.publicId;
      const media = await prisma.media.create({
        data: {
          fileName: req.file.originalname,
          url: result.secure_url,
          publicId: result.publicId,
          mimeType: req.file.mimetype,
          size: req.file.size,
          width: result.width,
          height: result.height,
          folder: (req.body.folder as string) || CLOUDINARY_FOLDER,
          uploadedBy: req.user?.userId,
        },
      });
      sendCreated(res, media, 'File uploaded');
    } catch (error) {
      // Database failure after a successful upload: delete the orphaned Cloudinary
      // asset so nothing is stored without a corresponding database record.
      await rollbackUpload(publicId);
      throw error;
    } finally {
      cleanupTempFile(req.file.path);
    }
  } catch (error) { next(error); }
};

export const uploadMultiple = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = (req.files as Express.Multer.File[]) ?? [];
    if (files.length === 0) { sendSuccess(res, []); return; }

    requireCloudinaryConfigured();

    const uploaded: Array<{ publicId: string; index: number }> = [];
    try {
      const results = await Promise.all(files.map((f) => cloudinaryUpload(f, CLOUDINARY_FOLDER)));
      const media = await Promise.all(results.map((r, i) => {
        uploaded.push({ publicId: r.publicId, index: i });
        return prisma.media.create({
          data: {
            fileName: files[i].originalname,
            url: r.secure_url,
            publicId: r.publicId,
            mimeType: files[i].mimetype,
            size: files[i].size,
            width: r.width,
            height: r.height,
            folder: (req.body.folder as string) || CLOUDINARY_FOLDER,
            uploadedBy: req.user?.userId,
          },
        });
      }));
      sendCreated(res, media, 'Files uploaded');
    } catch (error) {
      // Roll back every Cloudinary upload whose DB record could not be created.
      await Promise.all(uploaded.map((u) => rollbackUpload(u.publicId)));
      throw error;
    } finally {
      files.forEach((f) => cleanupTempFile(f.path));
    }
  } catch (error) { next(error); }
};