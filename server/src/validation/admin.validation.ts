import { z } from 'zod';

// ============================================================
// Admin Validation Schemas
// ============================================================

// --- Products ---
export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    regularPrice: z.number().min(0),
    salePrice: z.number().min(0).optional(),
    sku: z.string().min(1).max(100),
    barcode: z.string().optional(),
    stock: z.number().int().min(0),
    lowStockThreshold: z.number().int().min(0).optional(),
    weight: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.string().optional(),
    images: z.array(z.string()).optional(),
    specifications: z.any().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(255).optional(),
    slug: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    regularPrice: z.number().min(0).optional(),
    salePrice: z.number().min(0).optional(),
    sku: z.string().min(1).max(100).optional(),
    barcode: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    weight: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    categoryId: z.string().optional(),
    images: z.array(z.string()).optional(),
    specifications: z.any().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

export const productIdParam = z.object({
  params: z.object({ id: z.string().min(1) }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({ ids: z.array(z.string().min(1)).min(1) }),
});

export const bulkUpdateSchema = z.object({
  body: z.object({
    ids: z.array(z.string().min(1)).min(1),
    data: z.record(z.any()).refine(d => Object.keys(d).length > 0, { message: 'Update data must not be empty' }),
  }),
});

// --- Product Variants ---
export const createVariantSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    color: z.string().min(1).max(255),
    colorHex: z.string().max(20).optional(),
    size: z.string().min(1).max(100),
    stock: z.number().int().min(0).optional(),
    priceOverride: z.number().min(0).optional(),
    images: z.any().optional(),
    isActive: z.boolean().optional(),
    sku: z.string().min(1).max(100).optional(),
  }),
});

export const updateVariantSchema = z.object({
  params: z.object({ productId: z.string().min(1), id: z.string().min(1) }),
  body: z.object({
    color: z.string().min(1).max(255).optional(),
    colorHex: z.string().max(20).optional(),
    size: z.string().min(1).max(100).optional(),
    stock: z.number().int().min(0).optional(),
    priceOverride: z.number().min(0).optional(),
    images: z.any().optional(),
    isActive: z.boolean().optional(),
    sku: z.string().min(1).max(100).optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Categories ---
export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    parentId: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    slug: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    image: z.string().optional(),
    parentId: z.string().optional(),
    displayOrder: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Orders ---
export const updateOrderStatusSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
    trackingNumber: z.string().optional(),
    notes: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Customers ---
export const updateCustomerSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().optional(),
    emailVerified: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Reviews ---
export const updateReviewSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    isApproved: z.boolean().optional(),
    adminReply: z.string().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Coupons ---
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(1).max(50),
    type: z.enum(['PERCENTAGE', 'FIXED']),
    value: z.number().min(0),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().int().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usedCount: z.number().int().min(0).optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    code: z.string().min(1).max(50).optional(),
    type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
    value: z.number().min(0).optional(),
    minOrderAmount: z.number().min(0).optional(),
    maxUses: z.number().int().min(0).optional(),
    maxDiscount: z.number().min(0).optional(),
    usedCount: z.number().int().min(0).optional(),
    expiresAt: z.string().optional(),
    isActive: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- SEO ---
export const updateSeoSchema = z.object({
  params: z.object({ page: z.string().min(1) }),
  body: z.object({
    metaTitle: z.string().max(255).optional(),
    metaDescription: z.string().max(500).optional(),
    keywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogTitle: z.string().max(255).optional(),
    ogDescription: z.string().max(500).optional(),
    ogImage: z.string().optional(),
    twitterCard: z.string().optional(),
    noindex: z.boolean().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Homepage Content ---
export const createHomepageContentSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(100),
    value: z.any(),
  }),
});

export const updateHomepageContentSchema = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    key: z.string().min(1).max(100).optional(),
    value: z.any().optional(),
  }).refine(data => Object.keys(data).length > 0, { message: 'At least one field must be provided' }),
});

// --- Settings ---
export const updateSettingsSchema = z.object({
  body: z.record(z.any()).refine(data => Object.keys(data).length > 0, { message: 'Settings must not be empty' }),
});
