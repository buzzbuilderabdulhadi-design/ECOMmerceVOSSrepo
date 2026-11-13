import { describe, it, expect, vi } from 'vitest';

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

import cloudinary from 'cloudinary';

describe('mock probe 3', () => {
  it('exposes destroy as a mock', () => {
    const destroy = cloudinary.v2.uploader.destroy;
    console.log('destroy type:', typeof destroy);
    console.log('is vi.fn:', vi.isMockFunction(destroy));
    console.log('has mockResolvedValue:', typeof destroy?.mockResolvedValue);
    expect(typeof destroy).toBe('function');
  });
});