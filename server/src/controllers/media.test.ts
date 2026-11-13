import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import fs from 'fs';

vi.mock('../config/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  requireCloudinaryConfigured: vi.fn(),
  isCloudinaryReady: vi.fn(),
}));
vi.mock('../config/db', () => ({
  default: { media: { create: vi.fn() } },
}));


import { uploadFile, uploadMultiple } from './media.controller';
import { uploadImage, deleteImage, requireCloudinaryConfigured } from '../config/cloudinary';
import prisma from '../config/db';

const mockUploadImage = vi.mocked(uploadImage);
const mockDeleteImage = vi.mocked(deleteImage);
const mockRequireCloudinary = vi.mocked(requireCloudinaryConfigured);
const mockMediaCreate = vi.mocked(prisma.media.create);
const mockUnlink = vi.spyOn(fs.promises, 'unlink');

function mockRes() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}
function mockReq(file: any, body: any = {}, user: any = { userId: 'u1' }) {
  return { file, body, user } as unknown as Request;
}
const baseFile = {
  path: '/tmp/zoya-uploads/abc123',
  originalname: 'product.png',
  mimetype: 'image/png',
  size: 12_345,
};
beforeEach(() => {
  vi.resetAllMocks();
  mockRequireCloudinary.mockImplementation(() => undefined);
  mockUnlink.mockResolvedValue(undefined);
});

describe('POST /media/upload (media.controller)', () => {
  it('successful image upload creates a media record and cleans the temp file', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
      publicId: 'zoya-goods/abc',
      width: 800,
      height: 600,
      format: 'png',
    });
    mockMediaCreate.mockResolvedValue({
      id: 'm1',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 12345,
      fileName: 'product.png',
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
      publicId: 'zoya-goods/abc',
      altText: null,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      folder: 'zoya-goods',
      uploadedBy: 'u1',
    });

    await uploadFile(mockReq({ ...baseFile }), res, next);

    expect(mockUploadImage).toHaveBeenCalledWith(baseFile.path, 'product', undefined);
    expect(mockMediaCreate).toHaveBeenCalledWith({
      data: {
        fileName: 'product.png',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
        publicId: 'zoya-goods/abc',
        mimeType: 'image/png',
        size: 12_345,
        width: 800,
        height: 600,
        folder: 'zoya-goods',
        uploadedBy: 'u1',
      },
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(mockUnlink).toHaveBeenCalledWith(baseFile.path);
    expect(next).not.toHaveBeenCalled();
  });

  it('missing Cloudinary credentials fails fast (no local fallback)', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockRequireCloudinary.mockImplementation(() => {
      throw new Error('Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
    });
    await uploadFile(mockReq({ ...baseFile }), res, next);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockMediaCreate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect((next.mock.calls[0][0] as Error).message).toContain('Cloudinary is not configured');
  });

  it('storage-provider failure does not create a database record', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockRejectedValue(new Error('Cloudinary upload failed'));
    await uploadFile(mockReq({ ...baseFile }), res, next);
    expect(mockMediaCreate).not.toHaveBeenCalled();
    expect(mockDeleteImage).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('database failure after upload rolls back the Cloudinary asset', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/abc.png',
      publicId: 'zoya-goods/abc',
      width: 800, height: 600, format: 'png',
    });
    const dbError = new Error('DB write failed');
    mockMediaCreate.mockRejectedValue(dbError);
    await uploadFile(mockReq({ ...baseFile }), res, next);
    expect(mockDeleteImage).toHaveBeenCalledWith('zoya-goods/abc');
    expect(next).toHaveBeenCalledWith(dbError);
    expect(mockUnlink).toHaveBeenCalledWith(baseFile.path);
  });

  it('no file uploaded returns success without touching storage', async () => {
    const res = mockRes();
    const next = vi.fn();
    await uploadFile(mockReq(undefined), res, next);
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockMediaCreate).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });
});

describe('POST /media/upload-multiple (media.controller)', () => {
  it('uploads multiple files and rolls back all on database failure', async () => {
    const res = mockRes();
    const next = vi.fn();
    const files = [
      { ...baseFile, path: '/tmp/a', originalname: 'a.png' },
      { ...baseFile, path: '/tmp/b', originalname: 'b.png' },
    ];
    mockUploadImage
      .mockResolvedValueOnce({
        url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/a.png',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/a.png',
        publicId: 'zoya-goods/a',
        width: 800, height: 600, format: 'png',
      })
      .mockResolvedValueOnce({
        url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/b.png',
        secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/b.png',
        publicId: 'zoya-goods/b',
        width: 800, height: 600, format: 'png',
      });
    mockMediaCreate
      .mockResolvedValueOnce({
        id: 'm1',
        createdAt: new Date(),
        updatedAt: new Date(),
        size: 12345,
        fileName: 'a.png',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/a.png',
        publicId: 'zoya-goods/a',
        altText: null,
        mimeType: 'image/png',
        width: 800,
        height: 600,
        folder: 'zoya-goods',
        uploadedBy: 'u1',
      })
      .mockRejectedValueOnce(new Error('DB write failed'));

    await uploadMultiple({ ...mockReq(undefined), files } as unknown as Request, res, next);

    expect(mockDeleteImage).toHaveBeenCalledWith('zoya-goods/a');
    expect(mockDeleteImage).toHaveBeenCalledWith('zoya-goods/b');
    expect(next).toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith('/tmp/a');
    expect(mockUnlink).toHaveBeenCalledWith('/tmp/b');
  });
});