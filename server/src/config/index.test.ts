import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const originalEnv = process.env;

function setProductionEnv(overrides: Record<string, string>) {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'production',
    JWT_SECRET: '0123456789012345678901234567890123456789012345678901234567890123',
    JWT_REFRESH_SECRET: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzABCDEFGHIJ',
    JWT_EXPIRES_IN: '15m',
    DATABASE_URL: 'mongodb://localhost:27017/test',
    CLIENT_URL: 'https://zoyagoods.com',
    GOOGLE_REDIRECT_URI: 'https://zoyagoods.com/auth/google/callback',
    REDIS_URL: 'redis://localhost:6379',
    ...overrides,
  };
}

beforeEach(() => { vi.resetModules(); });
afterEach(() => { process.env = originalEnv; vi.resetModules(); });

describe('src/config/index.ts validateConfig (production)', () => {
  it('throws when Cloudinary credentials are missing in production', async () => {
    setProductionEnv({ CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' });
    const mod = await import('./index');
    expect(() => mod.validateConfig()).toThrow(/CLOUDINARY/);
  });

  it('rejects access token lifetimes longer than 1 hour in production', async () => {
    setProductionEnv({ JWT_EXPIRES_IN: '2h' });
    const mod = await import('./index');
    expect(() => mod.validateConfig()).toThrow(/JWT_EXPIRES_IN/);
  });

  it('does not throw for Cloudinary when all credentials are present in production', async () => {
    setProductionEnv({ CLOUDINARY_CLOUD_NAME: 'demo', CLOUDINARY_API_KEY: 'key', CLOUDINARY_API_SECRET: 'secret' });
    const mod = await import('./index');
    expect(() => mod.validateConfig()).not.toThrow();
    expect(mod.isCloudinaryConfigured()).toBe(true);
  });

  it('isCloudinaryConfigured is false when credentials are absent', async () => {
    setProductionEnv({ CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' });
    const mod = await import('./index');
    expect(mod.isCloudinaryConfigured()).toBe(false);
  });
});