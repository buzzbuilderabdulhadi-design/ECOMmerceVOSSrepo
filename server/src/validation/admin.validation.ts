import { z } from 'zod';

// ============================================================
// Admin Validation Schemas
//
// Every `:id` route param is validated against the MongoDB ObjectId
// shape up-front so malformed ids become a clean 400 instead of leaking
// a database-level error.
// ============================================================

const objectId = (label = 'id') =>
  z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, `Invalid ${label} format. Expected a valid ObjectId.`);

export const idParam = z.object({ params: z.object({ id: objectId() }) });
export const productParams = z.object({
  params: z.object({ id: objectId('product id') }),
});
export const variantParams = z.object({
  params: z.object({ productId: objectId('product id'), id: objectId('variant id') }),
});
export const categoryIdParam = z.object({ params: z.object({ id: objectId('category id') }) });
export const orderIdParam = z.object({ params: z.object({ id: objectId('order id') }) });
export const customerIdParam = z.object({ params: z.object({ id: objectId('customer id') }) });
export const couponIdParam = z.object({ params: z.object({ id: objectId('coupon id') }) });
export const reviewIdParam = z.object({ params: z.object({ id: objectId('review id') }) });
export const questionIdParam = z.object({ params: z.object({ id: objectId('question id') }) });

// --- Products ---
/** Optional fields shared by create + update. Required keys are defined per-schema. */
const additionalProductFields = {
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  specifications: z.any().optional(),
  material: z.string().max(100).optional(),
  brand: z.string().max(100).optional(),
  subcategoryId: objectId('subcategory id').nullable().optional(),
  salePrice: z.number().min(0).nullable().optional(),
  discountPercent: z.number().int().min(0).max(99).nullable().optional(),
  stock: z.number().int().min(0).optional(),
  lowStockThreshold: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isNew: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isLimitedEdition: z.boolean().optional(),
  isActive: z.boolean().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
};

export const createProductSchema = z.object({
  body: z
    .object({
      name: z.string().min(1).max(255),
      sku: z.string().min(1).max(100),
      categoryId: objectId('category id'),
      regularPrice: z.number().min(0),
      slug: z.string().min(1).max(255).optional(),
      ...additionalProductFields,
    })
    .superRefine((data, ctx) => {
      if (data.regularPrice == null) return;
      const { salePrice, discountPercent } = data as {
        salePrice?: number | null;
        discountPercent?: number | null;
      };
      if (salePrice != null && salePrice > data.regularPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salePrice'],
          message: 'Sale price cannot be higher than the regular price.',
        });
      }
      if (salePrice == null && discountPercent != null && discountPercent <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['discountPercent'],
          message: 'discountPercent requires a salePrice to take effect.',
        });
      }
    }),
});

export const updateProductSchema = z.object({
  params: z.object({ id: objectId('product id') }),
  body: z
    .object({
      name: z.string().min(1).max(255).optional(),
      slug: z.string().min(1).max(255).optional(),
      sku: z.string().min(1).max(100).optional(),
      categoryId: objectId('category id').optional(),
      regularPrice: z.number().min(0).optional(),
      ...additionalProductFields,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    })
    .superRefine((data, ctx) => {
      const { regularPrice, salePrice } = data as {
        regularPrice?: number;
        salePrice?: number | null;
      };
      if (regularPrice != null && salePrice != null && salePrice > regularPrice) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['salePrice'],
          message: 'Sale price cannot be higher than the regular price.',
        });
      }
    }),
});

export const bulkDeleteSchema = z.object({
  body: z.object({
    ids: z.array(objectId('product id')).min(1).max(100),
  }),
});

export const bulkUpdateSchema = z.object({
  body: z.object({
    ids: z.array(objectId('product id')).min(1).max(100),
    data: z
      .record(z.any())
      .refine((d) => Object.keys(d).length > 0, { message: 'Update data must not be empty' }),
  }),
});

// --- Product Variants ---
export const createVariantSchema = z.object({
  params: z.object({ id: objectId('product id') }),
  body: z.object({
    color: z.string().min(1).max(255),
    colorHex: z.string().max(20).optional(),
    size: z.string().min(1).max(100),
    stock: z.number().int().min(0).optional(),
    priceOverride: z.number().min(0).nullable().optional(),
    images: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    sku: z.string().min(1).max(100).optional(),
  }),
});

export const updateVariantSchema = z.object({
  params: z.object({ productId: objectId('product id'), id: objectId('variant id') }),
  body: z
    .object({
      color: z.string().min(1).max(255).optional(),
      colorHex: z.string().max(20).optional(),
      size: z.string().min(1).max(100).optional(),
      stock: z.number().int().min(0).optional(),
      priceOverride: z.number().min(0).nullable().optional(),
      images: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
      sku: z.string().min(1).max(100).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Categories ---
const additionalCategoryFields = {
  description: z.string().max(500).optional(),
  image: z.string().max(1000).optional(),
  parentId: objectId('parent category id').nullable().optional(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  seoTitle: z.string().max(255).optional(),
  seoDescription: z.string().max(500).optional(),
};

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100).optional(),
    ...additionalCategoryFields,
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({ id: objectId('category id') }),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).optional(),
      ...additionalCategoryFields,
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Orders ---
export const updateOrderStatusSchema = z.object({
  params: z.object({ id: objectId('order id') }),
  body: z
    .object({
      status: z
        .enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'])
        .optional(),
      trackingNumber: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

/**
 * Admin verification of a manual (bank transfer / Payoneer) payment. This is
 * the ONLY way a manual payment moves to PAID. Customers can never verify
 * their own payment.
 */
export const verifyOrderPaymentSchema = z.object({
  params: z.object({ id: objectId('order id') }),
  body: z.object({
    status: z.enum(['PAID', 'FAILED']).optional(),
  }),
});

// --- Customers ---
export const updateCustomerSchema = z.object({
  params: z.object({ id: objectId('customer id') }),
  body: z
    .object({
      name: z.string().min(1).max(100).optional(),
      phone: z.string().max(50).optional(),
      emailVerified: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Reviews ---
export const updateReviewSchema = z.object({
  params: z.object({ id: objectId('review id') }),
  body: z
    .object({
      isApproved: z.boolean().optional(),
      adminReply: z.string().max(2000).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Coupons ---
export const answerQuestionSchema = z.object({
  params: z.object({ id: objectId('question id') }),
  body: z
    .object({
      answer: z.string().trim().min(1).max(2000),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const createCouponSchema = z.object({
  body: z
    .object({
      code: z.string().min(1).max(50),
      type: z.enum(['PERCENTAGE', 'FIXED']),
      value: z.number().min(0),
      minOrderAmount: z.number().min(0).optional(),
      maxUses: z.number().int().min(1).optional(),
      maxDiscount: z.number().min(0).optional(),
      usedCount: z.number().int().min(0).optional(),
      expiresAt: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type === 'PERCENTAGE' && data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Percentage discount cannot exceed 100%.',
        });
      }
      if (data.maxDiscount != null && data.type === 'FIXED' && data.maxDiscount > data.value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['maxDiscount'],
          message: 'maxDiscount cannot exceed the fixed discount value.',
        });
      }
    }),
});

export const updateCouponSchema = z.object({
  params: z.object({ id: objectId('coupon id') }),
  body: z
    .object({
      code: z.string().min(1).max(50).optional(),
      type: z.enum(['PERCENTAGE', 'FIXED']).optional(),
      value: z.number().min(0).optional(),
      minOrderAmount: z.number().min(0).optional(),
      maxUses: z.number().int().min(1).optional(),
      maxDiscount: z.number().min(0).optional(),
      usedCount: z.number().int().min(0).optional(),
      expiresAt: z.string().optional(),
      isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    })
    .superRefine((data, ctx) => {
      if (data.type === 'PERCENTAGE' && data.value != null && data.value > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['value'],
          message: 'Percentage discount cannot exceed 100%.',
        });
      }
    }),
});

// --- SEO ---
export const updateSeoSchema = z.object({
  params: z.object({ page: z.string().min(1).max(100) }),
  body: z
    .object({
      metaTitle: z.string().max(255).optional(),
      metaDescription: z.string().max(500).optional(),
      keywords: z.string().max(500).optional(),
      canonicalUrl: z.string().max(1000).optional(),
      ogTitle: z.string().max(255).optional(),
      ogDescription: z.string().max(500).optional(),
      ogImage: z.string().max(1000).optional(),
      twitterCard: z.string().max(50).optional(),
      noindex: z.boolean().optional(),
      structuredData: z.any().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Homepage Content ---
export const createHomepageContentSchema = z.object({
  body: z.object({
    key: z.string().min(1).max(100),
    value: z.any(),
  }),
});

export const updateHomepageContentSchema = z.object({
  params: z.object({ id: objectId('content id') }),
  body: z
    .object({
      key: z.string().min(1).max(100).optional(),
      value: z.any().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    }),
});

// --- Settings ---
export const updateSettingsSchema = z.object({
  body: z
    .record(z.any())
    .refine((data) => Object.keys(data).length > 0, { message: 'Settings must not be empty' }),
});