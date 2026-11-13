import { API_BASE_URL } from '@/services/axios';

// Files uploaded without a CDN are served by the API server under /uploads,
// while the browser page itself runs on the Next.js origin. Prefix those
// relative URLs with the API origin so <img> tags resolve correctly instead
// of 404ing against the client origin.
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
})();

export function resolveAssetUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  // Absolute HTTPS URLs remain unchanged (Cloudinary, external hosts).
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Relative /uploads/ paths resolve against the API origin.
  if (trimmed.startsWith('/uploads/')) {
    return API_ORIGIN ? API_ORIGIN + trimmed : '';
  }
  // Any other relative path is treated as client-origin; return as-is.
  return trimmed;
}

/** Return a safe image URL, falling back to a placeholder when none is usable. */
export function resolveAssetUrlOrFallback(
  url?: string | null,
  fallback = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=85',
): string {
  const resolved = resolveAssetUrl(url);
  return resolved || fallback;
}