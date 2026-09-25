import { productImages } from '@/data/productImages';

export interface NavSubcategory {
  label: string;
  href: string;
}

export interface NavCategory {
  label: string;
  href: string;
  image: string;
  tagline: string;
  accent?: boolean;
  subcategories: NavSubcategory[];
}

const img = (key: string, idx = 0) => productImages[key]?.[idx] ?? productImages.leather[0];

export const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'New Arrivals',
    href: '/shop?sort=newest',
    image: img('leather', 0),
    tagline: 'Fresh from the atelier',
    subcategories: [
      { label: 'All Products', href: '/shop' },
      { label: 'Newest', href: '/shop?sort=newest' },
      { label: 'Best Rated', href: '/shop?sort=rating' },
      { label: 'Price: Low to High', href: '/shop?sort=price_asc' },
    ],
  },
  {
    label: 'Clothing',
    href: '/category/clothing-accessories',
    image: img('suede', 0),
    tagline: 'Crafted for the modern wardrobe',
    subcategories: [
      { label: 'Jackets', href: '/category/jackets' },
      { label: 'Dresses', href: '/category/dresses' },
      { label: 'Suits & Blazers', href: '/category/suits-blazers' },
      { label: 'Tops & Shirts', href: '/category/tops-shirts' },
    ],
  },
  {
    label: 'Handbags',
    href: '/category/handbags',
    image: img('backpack', 0),
    tagline: 'Carry it with intention',
    subcategories: [
      { label: 'Handbags', href: '/category/handbags' },
      { label: 'Bags', href: '/category/bags' },
    ],
  },
  {
    label: 'Watches',
    href: '/category/watches',
    image: img('sunglasses', 0),
    tagline: 'Luxury timepieces',
    subcategories: [
      { label: 'Mechanical Watches', href: '/category/mechanical-watches' },
    ],
  },
  {
    label: 'Jewelry',
    href: '/category/jewelry',
    image: img('sunglasses', 1),
    tagline: 'The finishing details',
    subcategories: [
      { label: 'Necklaces', href: '/category/necklaces' },
      { label: 'Rings', href: '/category/rings' },
    ],
  },
  {
    label: 'Footwear',
    href: '/category/footwear',
    image: img('boots', 0),
    tagline: 'Walk the line in luxury',
    subcategories: [
      { label: 'Heels', href: '/category/heels' },
      { label: 'Sneakers', href: '/category/sneakers' },
    ],
  },
];