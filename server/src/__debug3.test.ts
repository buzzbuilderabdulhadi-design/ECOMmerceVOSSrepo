import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./config/cloudinary', () => ({
  uploadImage: vi.fn(),
  deleteImage: vi.fn(),
  requireCloudinaryConfigured: vi.fn(),
  isCloudinaryReady: vi.fn(),
}));
vi.mock('./config/db', () => ({
  default: { media: { create: vi.fn() } },
}));
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      unlink: vi.fn(),
    },
  };
});

import { uploadFile } from './controllers/media.controller';
import { uploadImage, requireCloudinaryConfigured } from './config/cloudinary';
import prisma from './config/db';
import fs from 'fs';

const mockUploadImage = vi.mocked(uploadImage);
const mockRequireCloudinary = vi.mocked(requireCloudinaryConfigured);
const mockMediaCreate = vi.mocked(prisma.media.create);
const mockUnlink = vi.mocked(fs.promises.unlink);

function mockRes() {
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  return res;
}
function mockReq(file: any, body: any = {}, user: any = { userId: 'u1' }) {
  return { file, body, user } as any;
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
  mockUnlink.mockResolvedValue(undefined as never);
});

describe('debug3', () => {
  it('trace', async () => {
    const res = mockRes();
    const next = vi.fn();
    mockUploadImage.mockResolvedValue({
      url: 'u', secure_url: 'su', publicId: 'zoya-goods/abc', width: 800, height: 600, format: 'png',
    });
    mockMediaCreate.mockResolvedValue({
      id: 'm1', createdAt: new Date(), updatedAt: new Date(), size: 12345,
      fileName: 'product.png', url: 'u', publicId: 'zoya-goods/abc', altText: null,
      mimeType: 'image/png', width: 800, height: 600, folder: 'zoya-goods', uploadedBy: 'u1',
    });
    await uploadFile(mockReq({ ...baseFile }), res, next);
    console.log('unlink calls:', mockUnlink.mock.calls);
    console.log('res.status calls:', res.status.mock.calls);
    console.log('next calls:', next.mock.calls);
    expect(mockUnlink).toHaveBeenCalledWith(baseFile.path);
  });
});