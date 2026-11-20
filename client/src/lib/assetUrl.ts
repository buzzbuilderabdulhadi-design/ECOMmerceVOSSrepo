import { UPLOADS_BASE_PATH } from './apiPaths';

// Legacy files uploaded without a CDN are served by the backend under
// /uploads. The same-origin proxy exposes them at /api/uploads so no browser
// request ever depends on the backend hostname.

export function resolveAssetUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  // Absolute HTTPS URLs remain unchanged (Cloudinary, external hosts).
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Relative /uploads/ paths resolve through the same-origin proxy.
  if (trimmed.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_PATH}${trimmed.slice('/uploads'.length)}`;
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