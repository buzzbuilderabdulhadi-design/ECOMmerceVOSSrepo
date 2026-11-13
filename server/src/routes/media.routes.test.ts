import { describe, it, expect, vi } from 'vitest';
import type { FileFilterCallback } from 'multer';

vi.mock('../middleware/auth.middleware', () => ({
  authenticate: vi.fn((req: any, _res: any, next: any) => next()),
  authorizeAdmin: vi.fn((req: any, _res: any, next: any) => next()),
}));
vi.mock('../middleware/rateLimit.middleware', () => ({ uploadLimiter: vi.fn((req: any, _res: any, next: any) => next()) }));
vi.mock('../controllers/media.controller', () => ({
  uploadFile: vi.fn(),
  uploadMultiple: vi.fn(),
}));

import { fileFilter, upload } from './media.routes';
import { ApiError } from '../utils/apiError';

function makeFile(mimetype: string, originalname: string) {
  return { mimetype, originalname } as Express.Multer.File;
}

describe('media.routes.ts upload validation', () => {
  it('rejects disallowed file types with a clear error', () => {
    const calls: Array<[Error | null, boolean]> = [];
    const cb = (err: Error | null, accept: boolean) => calls.push([err, accept]);
    fileFilter(undefined as any, makeFile('text/plain', 'notes.txt'), cb as unknown as FileFilterCallback);
    expect(calls.length).toBe(1);
    // Passing an error rejects the file; the accept flag is undefined.
    expect(calls[0][0]).toBeInstanceOf(ApiError);
    expect((calls[0][0] as ApiError).message).toContain('Invalid file type');
    expect(calls[0][1]).not.toBe(true);
  });

  it('accepts allowed image types', () => {
    const calls: Array<[Error | null, boolean]> = [];
    const cb = (err: Error | null, accept: boolean) => calls.push([err, accept]);
    for (const [mt, ext] of [['image/png', 'a.png'], ['image/jpeg', 'b.jpg'], ['image/webp', 'c.webp']]) {
      fileFilter(undefined as any, makeFile(mt, ext), cb as unknown as FileFilterCallback);
    }
    expect(calls.every(([, accept]) => accept === true)).toBe(true);
    expect(calls.every(([err]) => err === null)).toBe(true);
  });

  it('rejects mismatched extension even when MIME looks right', () => {
    const calls: Array<[Error | null, boolean]> = [];
    const cb = (err: Error | null, accept: boolean) => calls.push([err, accept]);
    fileFilter(undefined as any, makeFile('image/png', 'photo.docx'), cb as unknown as FileFilterCallback);
    expect(calls[0][0]).toBeInstanceOf(ApiError);
    expect(calls[0][1]).not.toBe(true);
  });

  it('enforces a 5MB file size limit', () => {
    expect((upload as any).limits.fileSize).toBe(5 * 1024 * 1024);
  });
});