import { v2 as cloudinary } from 'cloudinary';
import config from './index';

// ============================================================
// Cloudinary Configuration
// ============================================================

cloudinary.config({
  cloud_name: config.cloudinary.name,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

// ============================================================
// Image Upload Options
// ============================================================

export const UPLOAD_OPTIONS: Record<string, {
  folder: string;
  allowed_formats: string[];
  max_file_size: number;
  transformation: Record<string, unknown>[];
}> = {
  // Image upload presets
  product: {
    folder: 'voss/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    max_file_size: 5 * 1024 * 1024, // 5 MB
    transformation: [
      { width: 1200, height: 1200, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
  avatar: {
    folder: 'voss/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 2 * 1024 * 1024, // 2 MB
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
  review: {
    folder: 'voss/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 3 * 1024 * 1024, // 3 MB
    transformation: [
      { width: 800, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
  category: {
    folder: 'voss/categories',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    max_file_size: 5 * 1024 * 1024,
    transformation: [
      { width: 800, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
  banner: {
    folder: 'voss/banners',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    max_file_size: 10 * 1024 * 1024,
    transformation: [
      { width: 1920, height: 600, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' },
    ],
  },
};

export type UploadType = keyof typeof UPLOAD_OPTIONS;

// ============================================================
// Helper: Upload image to Cloudinary
// ============================================================

export async function uploadImage(
  filePath: string,
  type: UploadType = 'product',
  publicId?: string
): Promise<{
  url: string;
  publicId: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
}> {
  const options = UPLOAD_OPTIONS[type];

  const result = await cloudinary.uploader.upload(filePath, {
    ...options,
    public_id: publicId,
    resource_type: 'image',
  });

  return {
    url: result.url,
    publicId: result.public_id,
    secure_url: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
  };
}

// ============================================================
// Helper: Delete image from Cloudinary
// ============================================================

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

// ============================================================
// Helper: Get optimized image URL with transformations
// ============================================================

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: 'fill' | 'limit' | 'pad' | 'thumb';
    quality?: number | 'auto';
    format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  } = {}
): string {
  return cloudinary.url(publicId, {
    width: options.width || 800,
    height: options.height || 800,
    crop: options.crop || 'limit',
    quality: options.quality || 'auto',
    fetch_format: options.format || 'auto',
    secure: true,
  });
}

export default cloudinary;

