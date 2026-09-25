// ============================================================
// ZOYA GOODS - Type Definitions
// ============================================================

// --- User & Auth Types ---
export type Role = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// --- Address Types ---
export interface Address {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

// --- Product Types ---
export interface ProductImage {
  url: string;
  alt?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  color: string;
  colorHex?: string;
  size: string;
  stock: number;
  priceOverride?: number;
  images: ProductImage[];
  isActive: boolean;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description?: string;
  specifications?: Record<string, string>;
  material?: string;
  brand?: string;
  categoryId: string;
  subcategoryId?: string;
  regularPrice: number;
  salePrice?: number;
  discountPercent?: number;
  stock: number;
  images: (ProductImage | string)[];
  tags: string[];
  isNew: boolean;
  isBestSeller: boolean;
  isFeatured: boolean;
  isActive: boolean;
  seoTitle?: string;
  seoDescription?: string;
  category?: Category;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  seoTitle?: string;
  seoDescription?: string;
  displayOrder: number;
  isActive: boolean;
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

// --- Cart Types ---
export interface CartItemAvailability {
  available: boolean;
  stockLeft: number;
  quantityAdjusted: boolean;
  unavailable: boolean;
  message?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  couponCode?: string;
  discountAmount?: number;
  items: CartItem[];
  availability?: Record<string, CartItemAvailability>;
  couponNotice?: string;
}

// --- Order Types ---
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'AWAITING_VERIFICATION' | 'REFUNDED';

export type PaymentMethod = 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER' | 'PAYONEER' | 'card';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productSnapshot: Record<string, unknown>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddressId?: string;
  billingAddressId?: string;
  notes?: string;
  couponCode?: string;
  idempotencyKey?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paymentReference?: string;
  paymentVerifiedBy?: string;
  paymentVerifiedAt?: string;
  shippingAddress?: Address;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutTotals {
  subtotal: number;
  discount: number;
  netSubtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface CheckoutPreviewItem {
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  color?: string;
  size?: string;
  colorHex?: string;
  stock: number;
  image: string;
}

export interface CheckoutPreview {
  items: CheckoutPreviewItem[];
  totals: CheckoutTotals;
  couponCode: string | null;
  couponApplied: boolean;
  couponWarning?: string;
  currency: string;
}

export interface PaymentIntentResponse {
  orderId: string;
  orderNumber: string;
  paymentIntentId: string;
  clientSecret: string;
  amountCents: number;
  currency: string;
  paymentStatus: PaymentStatus;
}

export interface CheckoutMethod {
  id: PaymentMethod;
  kind: 'online' | 'manual';
  enabled: boolean;
  label: string;
  description: string;
  instructions: string[];
}

export interface CheckoutMethodsResponse {
  methods: CheckoutMethod[];
  currency: string;
}

export interface PayPalOrderCreateResponse {
  orderId: string;
  paypalOrderId?: string;
  approvalUrl?: string;
  alreadyCaptured?: boolean;
}

export interface PayPalCaptureResponse {
  orderId: string;
  status: 'PAID';
  captureId?: string;
}

// --- Review Types ---
export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  text?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  isApproved: boolean;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

// --- Wishlist Types ---
export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  addedAt: string;
}

// --- API Types ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Coupon Types ---
export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  maxDiscount?: number;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

// --- Component Prop Types ---
export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  showFirstLast?: boolean;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
}

