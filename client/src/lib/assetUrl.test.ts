import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveAssetUrl, resolveAssetUrlOrFallback } from './assetUrl';

const originalEnv = process.env;
beforeEach(() => { process.env = { ...originalEnv }; vi.resetModules(); });
afterEach(() => { process.env = originalEnv; vi.resetModules(); });

describe('resolveAssetUrl', () => {
  it('returns empty string for missing or invalid URLs', () => {
    expect(resolveAssetUrl(undefined)).toBe('');
    expect(resolveAssetUrl(null)).toBe('');
    expect(resolveAssetUrl('')).toBe('');
    expect(resolveAssetUrl('   ')).toBe('');
  });

  it('leaves absolute HTTPS Cloudinary URLs unchanged', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/p.png';
    expect(resolveAssetUrl(url)).toBe(url);
  });

  it('leaves other absolute URLs unchanged (external hosts keep working)', () => {
    const url = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900';
    expect(resolveAssetUrl(url)).toBe(url);
    expect(resolveAssetUrl('http://example.com/img.jpg')).toBe('http://example.com/img.jpg');
  });

  it('resolves /uploads/ paths against the API origin', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:5000/api/v1';
    vi.resetModules();
    const { resolveAssetUrl: r } = require('./assetUrl');
    expect(r('/uploads/products/abc.png')).toBe('http://localhost:5000/uploads/products/abc.png');
  });

  it('does not introduce localhost into production absolute URLs', () => {
    process.env.NEXT_PUBLIC_API_URL = 'https://api.zoyagoods.com/api/v1';
    vi.resetModules();
    const { resolveAssetUrl: r } = require('./assetUrl');
    const cdn = 'https://res.cloudinary.com/demo/image/upload/v1/zoya-goods/p.png';
    expect(r(cdn)).toBe(cdn);
    expect(r('https://images.unsplash.com/x.jpg')).toBe('https://images.unsplash.com/x.jpg');
    // No /uploads/ prefix means no API origin is prepended.
    expect(r('/uploads/x.png')).toBe('https://api.zoyagoods.com/uploads/x.png');
  });

  it('passes through other relative paths unchanged', () => {
    expect(resolveAssetUrl('/images/logo.png')).toBe('/images/logo.png');
    expect(resolveAssetUrl('assets/banner.jpg')).toBe('assets/banner.jpg');
  });
});

describe('resolveAssetUrlOrFallback', () => {
  it('returns the fallback when the URL is missing', () => {
    expect(resolveAssetUrlOrFallback(undefined)).toBe('https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85');
    expect(resolveAssetUrlOrFallback('')).toContain('images.unsplash.com');
  });

  it('returns a custom fallback when provided', () => {
    expect(resolveAssetUrlOrFallback(null, 'https://cdn.example.com/fallback.png')).toBe('https://cdn.example.com/fallback.png');
  });

  it('returns the resolved URL when one exists', () => {
    expect(resolveAssetUrlOrFallback('https://res.cloudinary.com/demo/x.png')).toBe('https://res.cloudinary.com/demo/x.png');
  });
});