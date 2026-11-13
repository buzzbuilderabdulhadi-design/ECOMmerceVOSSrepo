import { vi } from 'vitest';

vi.mock('cloudinary', async () => {
  const actual = await vi.importActual('cloudinary');
  return {
    ...actual,
    v2: {
      ...(actual).v2,
      uploader: {
        ...((actual).v2?.uploader),
        destroy: vi.fn(),
        upload: vi.fn(),
      },
    },
  };
});

const cloudinary = (await import('cloudinary')).default;
const destroy = cloudinary.v2.uploader.destroy;
console.log('destroy type:', typeof destroy);
console.log('is vi.fn:', vi.isMockFunction(destroy));
console.log('has mockResolvedValue:', typeof destroy?.mockResolvedValue);