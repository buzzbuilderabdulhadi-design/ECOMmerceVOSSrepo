// ============================================================
// ZOYA GOODS - Admin-specific Type Definitions
// ============================================================

import type { User, Product, Order, Review, Coupon, Address } from './index';

// --- Admin: Reviews ---
export interface AdminReview extends Review {
  adminReply?: string;
  product?: Pick<Product, 'id' | 'name' | 'slug'>;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// --- Admin: Product Questions (Q&A) ---
export interface AdminQuestion {
  id: string;
  question: string;
  answer?: string | null;
  adminAnsweredAt?: string | null;
  helpfulCount: number;
  isPublished: boolean;
  createdAt: string;
  product?: Pick<Product, 'id' | 'name' | 'slug'>;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
}

// --- Admin: Orders ---
export interface AdminOrder extends Order {
  user?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface OrderDetail extends Order {
  user?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  trackingNumber?: string;
  internalNotes?: string;
  verifiedByUser?: { id: string; name: string } | null;
}

// --- Admin: Notifications ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// --- Admin: Customers ---
export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  createdAt: string;
  _count?: { orders: number; reviews: number };
}

export interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
  emailVerified?: boolean;
  createdAt: string;
  orders?: Order[];
  addresses?: Address[];
  reviews?: Review[];
  _stats?: { totalSpent: number; orderCount: number; reviewCount: number };
}

// --- Admin: Analytics ---
export interface SalesDataPoint {
  total: number;
  createdAt: string;
}

export interface SalesAnalytics {
  revenue: { thisMonth: number; lastMonth: number };
  orders: SalesDataPoint[];
  topProducts: Array<{
    id: string;
    name: string;
    _count?: { reviews: number; orderItems: number };
  }>;
}

export interface OrderAnalytics {
  byStatus: Array<{ status: Order['status']; _count: number }>;
  totalRevenue: number;
}

export interface ProductAnalytics {
  total: number;
  active: number;
  lowStock: number;
  outOfStock: number;
}

export interface CustomerAnalytics {
  total: number;
  newThisMonth: number;
  withOrders: number;
}

// --- Admin: Coupons ---
export interface CouponForm {
  code: string;
  type: Coupon['type'];
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  isActive: boolean;
  expiresAt?: string;
  maxDiscount?: number;
}
