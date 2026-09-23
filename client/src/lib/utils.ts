import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function formatDiscountPercentage(regularPrice: number, salePrice: number): number {
  if (regularPrice <= 0) return 0;
  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

export function randomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isPhone(phone: string): boolean {
  return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\./0-9]*$/.test(phone);
}

export interface ProductColorItem {
  name: string;
  hex: string;
}

// Collapses a product's variant list down to one swatch per distinct color.
// Variants are stored per (color, size), so the same color appears once per
// size; without this, a 6-size Black jacket would yield six identical "Black"
// swatches and duplicate React keys. Variant rows themselves are preserved —
// only the display swatch list is deduplicated. Entries without a hex value
// are dropped because they cannot be rendered as a swatch.
export function variantsToColors(
  variants?: Array<{ color?: string; colorHex?: string }>
): ProductColorItem[] {
  if (!Array.isArray(variants)) return [];
  const seen = new Set<string>();
  const colors: ProductColorItem[] = [];
  for (const variant of variants) {
    const name = variant.color?.trim();
    const hex = variant.colorHex?.trim();
    if (!name || !hex) continue;
    const key = `${name.toLowerCase()}|${hex.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    colors.push({ name, hex });
  }
  return colors;
}
