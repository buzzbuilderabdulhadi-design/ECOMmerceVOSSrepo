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
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return API_ORIGIN + url;
  }
  return url;
}