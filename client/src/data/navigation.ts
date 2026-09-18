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
    href: '/category/new-arrivals',
    image: img('leather', 0),
    tagline: 'Fresh from the atelier',
    subcategories: [
      { label: 'Latest Collection', href: '/category/latest-collection' },
      { label: 'Trending Now', href: '/category/trending-now' },
      { label: 'Limited Edition', href: '/category/limited-edition' },
      { label: 'Seasonal Picks', href: '/category/seasonal-picks' },
    ],
  },
  {
    label: 'Clothing',
    href: '/category/clothing',
    image: img('suede', 0),
    tagline: 'Crafted for the modern wardrobe',
    subcategories: [
      { label: 'Leather Jackets', href: '/category/leather-jackets' },
      { label: 'Bomber Jackets', href: '/category/bomber-jackets' },
      { label: 'Suede Jackets', href: '/category/suede-jackets' },
      { label: 'Denim Jackets', href: '/category/denim-jackets' },
      { label: 'Winter Coats', href: '/category/winter-coats' },
      { label: 'Hoodies', href: '/category/hoodies' },
      { label: 'T-Shirts', href: '/category/t-shirts' },
      { label: 'Shirts', href: '/category/shirts' },
      { label: 'Pants', href: '/category/pants' },
    ],
  },
  {
    label: 'Accessories',
    href: '/category/accessories',
    image: img('sunglasses', 0),
    tagline: 'The finishing details',
    subcategories: [
      { label: 'Wallets', href: '/category/wallets' },
      { label: 'Belts', href: '/category/belts' },
      { label: 'Gloves', href: '/category/gloves' },
      { label: 'Sunglasses', href: '/category/sunglasses' },
      { label: 'Watches', href: '/category/watches' },
      { label: 'Scarves', href: '/category/scarves' },
      { label: 'Hats', href: '/category/hats' },
      { label: 'Keychains', href: '/category/keychains' },
    ],
  },
  {
    label: 'Bags',
    href: '/category/bags',
    image: img('backpack', 0),
    tagline: 'Carry it with intention',
    subcategories: [
      { label: 'Backpacks', href: '/category/backpacks' },
      { label: 'Travel Bags', href: '/category/travel-bags' },
      { label: 'Messenger Bags', href: '/category/messenger-bags' },
      { label: 'Duffel Bags', href: '/category/duffel-bags' },
      { label: 'Leather Bags', href: '/category/leather-bags' },
    ],
  },
  {
    label: 'Shoes',
    href: '/category/shoes',
    image: img('boots', 0),
    tagline: 'Walk the line in luxury',
    subcategories: [
      { label: 'Sneakers', href: '/category/sneakers' },
      { label: 'Boots', href: '/category/boots' },
      { label: 'Loafers', href: '/category/loafers' },
      { label: 'Formal Shoes', href: '/category/formal-shoes' },
      { label: 'Casual Shoes', href: '/category/casual-shoes' },
    ],
  },
  {
    label: 'Sale',
    href: '/category/sale',
    image: img('leather', 1),
    tagline: 'Timeless pieces, exceptional value',
    accent: true,
    subcategories: [
      { label: 'Up to 20% Off', href: '/category/up-to-20' },
      { label: 'Up to 40% Off', href: '/category/up-to-40' },
      { label: 'Clearance', href: '/category/clearance' },
      { label: 'Last Chance', href: '/category/last-chance' },
    ],
  },
];
