import fs from 'fs';

/**
 * Remove a staged multer temp file after the Cloudinary attempt, whether it
 * succeeded or failed, so nothing lingers on the filesystem (and, previously,
 * in the publicly-served uploads/ dir).
 *
 * Kept in its own module so tests can swap the filesystem call without
 * fighting ESM module-instance identity between the controller and the test.
 */
export const cleanupTempFile = (filePath?: string): void => {
  if (!filePath) return;
  fs.promises.unlink(filePath).catch(() => {});
};