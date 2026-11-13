import { describe, it, expect, vi } from 'vitest';

vi.mock('cloudinary', async () => {
  const actual = await vi.importActual<typeof import('cloudinary')>('cloudinary');
  return {
    ...actual,
    v2: {
      ...(actual as any).v2,
      uploader: {
        ...((actual as any).v2?.uploader),
        destroy: vi.fn(),
        upload: vi.fn(),
      },
    },
  };
});

import cloudinary from 'cloudinary';

describe('mock probe', () => {
  it('exposes destroy as a mock', () => {
    const destroy = cloudinary.v2.uploader.destroy;
    console.log('destroy type:', typeof destroy);
    console.log('is vi.fn:', vi.isMockFunction(destroy));
    console.log('has mockResolvedValue:', typeof destroy?.mockResolvedValue);
    expect(typeof destroy).toBe('function');
  });
});