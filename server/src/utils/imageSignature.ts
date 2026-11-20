import fs from 'fs';
import { ApiError } from './apiError';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const WEBP_RIFF = Buffer.from('RIFF');
const WEBP_FORMAT = Buffer.from('WEBP');

function hasPrefix(bytes: Buffer, prefix: Buffer, offset = 0): boolean {
  return bytes.length >= offset + prefix.length && bytes.subarray(offset, offset + prefix.length).equals(prefix);
}

export async function assertImageSignature(filePath: string, mimeType?: string): Promise<void> {
  let handle: fs.promises.FileHandle | undefined;
  try {
    handle = await fs.promises.open(filePath, 'r');
    const bytes = Buffer.alloc(16);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    const header = bytes.subarray(0, bytesRead);

    const valid =
      mimeType === 'image/png'
        ? hasPrefix(header, PNG_SIGNATURE)
        : mimeType === 'image/jpeg'
          ? hasPrefix(header, JPEG_SIGNATURE)
          : mimeType === 'image/webp'
            ? hasPrefix(header, WEBP_RIFF) && hasPrefix(header, WEBP_FORMAT, 8)
            : false;

    if (!valid) {
      throw ApiError.badRequest('Invalid image contents. Allowed: JPEG, PNG, WebP.');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.badRequest('Invalid image contents. Allowed: JPEG, PNG, WebP.');
  } finally {
    await handle?.close().catch(() => undefined);
  }
}
