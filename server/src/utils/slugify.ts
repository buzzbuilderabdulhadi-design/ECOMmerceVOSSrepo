// ============================================================
// Slug utilities — generate URL-safe slugs server-side.
// ============================================================

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/**
 * Ensure a slug is unique within its model. Appends a short numeric suffix
 * while the slug collides. The caller provides a predicate that returns true
 * when the slug is already taken (excluding the record id being edited).
 */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const clean = slugify(base) || 'item';
  if (!(await exists(clean))) return clean;
  for (let i = 1; i < 1000; i++) {
    const candidate = `${clean}-${Date.now().toString(36)}${i > 1 ? `-${i}` : ''}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${clean}-${Date.now().toString(36)}`;
}