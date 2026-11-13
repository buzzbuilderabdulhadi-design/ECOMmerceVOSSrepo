import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import fs from 'fs';

vi.mock('../config/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  requireCloudinaryConfigured: vi.fn(),
}));
vi.mock('../config/db', () => ({
  default: {
    media: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    activityLog: { create: vi.fn() },
  },
}));
vi.mock('cloudinary', async () => {
  const actual = await vi.importActual<typeof import('cloudinary')>('cloudinary');
  const realUploader = (actual as any).v2?.uploader;
  const uploader = {
    ...realUploader,
    destroy: vi.fn(),
    upload: vi.fn(),
  };
  const newV2 = {
    ...((actual as any).v2),
    uploader,
  };
  return {
    ...actual,
    v2: newV2,
    default: {
      ...((actual as any).default),
      v2: newV2,
    },
  };
});


import { uploadMedia, deleteMedia } from './admin.controller';
import { uploadImage, deleteImage, requireCloudinaryConfigured } from '../config/cloudinary';
import prisma from '../config/db';
import cloudinary from 'cloudinary';

const mockUploadImage = vi.mocked(uploadImage);
const mockDeleteImage = vi.mocked(deleteImage);
const mockRequireCloudinary = vi.mocked(requireCloudinaryConfigured);
const mockMediaCreate = vi.mocked(prisma.media.create);
const mockMediaFind = vi.mocked(prisma.media.findUnique);
const mockMediaDelete = vi.mocked(prisma.media.delete);
const mockActivityLog = vi.mocked(prisma.activityLog.create);
const mockDestroy = vi.mocked(cloudinary.v2.uploader.destroy);
const mockUnlink = vi.spyOn(fs.promises, 'unlink');

function mockRes() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}
function mockReq(file: any, body: any = {}, user: any = { userId: 'u1', role: 'ADMIN' }, params: any = {}) {
  return { file, body, user, params } as unknown as Request;
}
beforeEach(() => {
  vi.resetAllMocks();
  mockRequireCloudinary.mockImplementation(() => undefined);
  mockUnlink.mockResolvedValue(undefined);
  mockDestroy.mockResolvedValue(undefined);
});

describe('POST /admin/media/upload (admin.controller.uploadMedia)', () => {
  it('successful file upload stores the Cloudinary URL and publicId', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/cat.png',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/cat.png',
      publicId: 'zoya-goods/cat',
      width: 800,
      height: 600,
      format: 'png',
    });
    mockMediaCreate.mockResolvedValue({
      id: 'm1',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 999,
      fileName: 'cat.png',
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/cat.png',
      publicId: 'zoya-goods/cat',
      altText: 'A cat',
      mimeType: 'image/png',
      width: 800,
      height: 600,
      folder: 'categories',
      uploadedBy: 'u1',
    });

    await uploadMedia(
      mockReq(
        { path: '/tmp/f', originalname: 'cat.png', mimetype: 'image/png', size: 999 },
        { folder: 'categories', altText: 'A cat' },
      ),
      res,
      next,
    );

    expect(mockUploadImage).toHaveBeenCalledWith('/tmp/f', 'product', undefined);
    expect(mockMediaCreate).toHaveBeenCalledWith({
      data: {
        fileName: 'cat.png',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/cat.png',
        publicId: 'zoya-goods/cat',
        mimeType: 'image/png',
        size: 999,
        width: 800,
        height: 600,
        folder: 'categories',
        altText: 'A cat',
        uploadedBy: 'u1',
      },
    });
    expect(mockActivityLog).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(next).not.toHaveBeenCalled();
  });

  it('missing Cloudinary credentials fails fast instead of writing local files', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockRequireCloudinary.mockImplementation(() => {
      throw new Error('Cloudinary is not configured.');
    });
    await uploadMedia(
      mockReq({ path: '/tmp/f', originalname: 'x.png', mimetype: 'image/png', size: 1 }),
      res,
      next,
    );
    expect(mockUploadImage).not.toHaveBeenCalled();
    expect(mockMediaCreate).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('database failure after upload rolls back the Cloudinary asset', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockResolvedValue({
      url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/r.png',
      secure_url: 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/r.png',
      publicId: 'zoya-goods/r',
      width: 100, height: 100, format: 'png',
    });
    const dbError = new Error('DB write failed');
    mockMediaCreate.mockRejectedValue(dbError);
    await uploadMedia(mockReq({ path: '/tmp/f', originalname: 'r.png', mimetype: 'image/png', size: 1 }), res, next);
    expect(mockDeleteImage).toHaveBeenCalledWith('zoya-goods/r');
    expect(next).toHaveBeenCalledWith(dbError);
  });

describe('DELETE /admin/media/:id (admin.controller.deleteMedia)', () => {
  it('deletes the Cloudinary asset then the database record', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockMediaFind.mockResolvedValue({
      id: 'me1',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 1024,
      fileName: 'del.png',
      publicId: 'zoya-goods/del',
      url: 'https://res.cloudinary.com/demo/del.png',
      altText: null,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      folder: 'zoya-goods',
      uploadedBy: 'u1',
    });
    mockMediaDelete.mockResolvedValue({
      id: 'me1',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 1024,
      fileName: 'del.png',
      publicId: 'zoya-goods/del',
      url: 'https://res.cloudinary.com/demo/del.png',
      altText: null,
      mimeType: 'image/png',
      width: 800,
      height: 600,
      folder: 'zoya-goods',
      uploadedBy: 'u1',
    });
    await deleteMedia(mockReq(undefined, {}, { userId: 'u1', role: 'ADMIN' }, { id: 'me1' }), res, next);
    expect(mockDestroy).toHaveBeenCalledWith('zoya-goods/del');
    expect(mockMediaDelete).toHaveBeenCalledWith({ where: { id: 'me1' } });
    expect(mockActivityLog).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('media without publicId skips Cloudinary delete (existing local images preserved)', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockMediaFind.mockResolvedValue({
      id: 'me2',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 512,
      fileName: 'local.png',
      publicId: null,
      url: '/uploads/local.png',
      altText: null,
      mimeType: 'image/png',
      width: null,
      height: null,
      folder: null,
      uploadedBy: null,
    });
    mockMediaDelete.mockResolvedValue({
      id: 'me2',
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 512,
      fileName: 'local.png',
      publicId: null,
      url: '/uploads/local.png',
      altText: null,
      mimeType: 'image/png',
      width: null,
      height: null,
      folder: null,
      uploadedBy: null,
    });
    await deleteMedia(mockReq(undefined, {}, { userId: 'u1', role: 'ADMIN' }, { id: 'me2' }), res, next);
    expect(mockDestroy).not.toHaveBeenCalled();
    expect(mockMediaDelete).toHaveBeenCalledWith({ where: { id: 'me2' } });
    expect(next).not.toHaveBeenCalled();
  });

  it('missing media returns 404', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockMediaFind.mockResolvedValue(null);
    await deleteMedia(mockReq(undefined, {}, { userId: 'u1', role: 'ADMIN' }, { id: 'missing' }), res, next);
    expect(mockDestroy).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });
});
});