import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('src/config/cloudinary.ts', () => {
  const originalEnv = process.env;
  beforeEach(() => { process.env = { ...originalEnv }; vi.resetModules(); });
  afterEach(() => { process.env = originalEnv; vi.resetModules(); });

  it('isCloudinaryReady is false and requireCloudinaryConfigured throws when credentials are missing', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = '';
    process.env.CLOUDINARY_API_KEY = '';
    process.env.CLOUDINARY_API_SECRET = '';
    const mod = await import('./cloudinary');
    expect(mod.isCloudinaryReady()).toBe(false);
    expect(() => mod.requireCloudinaryConfigured()).toThrow(/Cloudinary is not configured/);
  });

  it('isCloudinaryReady is true and requireCloudinaryConfigured does not throw when credentials are present', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = 'demo';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    const mod = await import('./cloudinary');
    expect(mod.isCloudinaryReady()).toBe(true);
    expect(() => mod.requireCloudinaryConfigured()).not.toThrow();
  });

  it('accepts the legacy CLOUDINARY_NAME alias', async () => {
    process.env.CLOUDINARY_CLOUD_NAME = '';
    process.env.CLOUDINARY_NAME = 'demo-alias';
    process.env.CLOUDINARY_API_KEY = 'key';
    process.env.CLOUDINARY_API_SECRET = 'secret';
    const mod = await import('./cloudinary');
    expect(mod.isCloudinaryReady()).toBe(true);
  });
});