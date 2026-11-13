import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';
import { getCouponOrThrow, normalizeCouponCode } from '../services/coupon.service';
import { fromCents, itemsSubtotalCents } from '../utils/pricing';

const cartInclude = {
  items: {
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, sku: true,
          regularPrice: true, salePrice: true, discountPercent: true,
          images: true, stock: true, isActive: true,
          categoryId: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      variant: {
        select: {
          id: true, color: true, colorHex: true, size: true,
          stock: true, priceOverride: true, sku: true, isActive: true,
        },
      },
    },
  },
};

interface CartItemFlag {
  available: boolean;
  stockLeft: number;
  quantityAdjusted: boolean;
  unavailable: boolean;
  message?: string;
}

/**
 * Normalize a cart before it is served to the client (single authoritative
 * source, mirrors the rules the checkout pipeline enforces):
 *  - Items whose product/variant became inactive or ran out of stock are
 *    flagged "Currently unavailable" (kept so the customer can review them,
 *    never removed silently).
 *  - When stock dropped below the requested quantity the quantity is clamped
 *    and persisted, surfaced as "Only X left — quantity adjusted".
 *  - A previously applied coupon is revalidated against the current contents.
 *    If it no longer applies (expired/deactivated/minimum not met/usage cap)
 *    it is cleared from the cart and a couponNotice is returned so the UI can
 *    tell the customer. When still valid the stored discount is recomputed so
 *    the client never shows a stale amount.
 */
async function finalizeCart(cart: {
  id: string | null;
  couponCode: string | null;
  discountAmount: number | null;
  items: any[];
} | null) {
  if (!cart) return cart;

  const availability: Record<string, CartItemFlag> = {};
  const clampedRows: { id: string; quantity: number }[] = [];

  const items = cart.items.map((item) => {
    const productActive = !!item.product?.isActive;
    const variantActive = item.variant ? !!item.variant.isActive : true;
    const stockLeft = item.variant?.stock ?? item.product?.stock ?? 0;
    const isAvailable = productActive && variantActive && stockLeft >= 1;

    if (!isAvailable) {
      availability[item.id] = {
        available: false,
        stockLeft,
        quantityAdjusted: false,
        unavailable: true,
        message: 'Currently unavailable',
      };
      return { ...item };
    }

    let quantity = item.quantity;
    let quantityAdjusted = false;
    if (quantity > stockLeft) {
      quantity = stockLeft;
      quantityAdjusted = true;
      clampedRows.push({ id: item.id, quantity });
    }

    let message: string | undefined;
    if (quantityAdjusted) {
      message = stockLeft > 1 ? `Only ${stockLeft} left — quantity adjusted` : 'Only 1 left — quantity adjusted';
    } else if (quantity === stockLeft) {
      message = stockLeft > 1 ? `Only ${stockLeft} left` : 'Only 1 left';
    }

    availability[item.id] = {
      available: true,
      stockLeft,
      quantityAdjusted,
      unavailable: false,
      message,
    };
    return { ...item, quantity };
  });

  let couponNotice: string | undefined;
  let couponCode: string | null = cart.couponCode ?? null;
  let discountAmount: number | null = cart.discountAmount ?? null;
  let couponChanged = false;

  if (couponCode) {
    try {
      const subtotalCents = itemsSubtotalCents(
        items.map((item) => ({
          unitPrice: item.variant?.priceOverride ?? item.product?.salePrice ?? item.product?.regularPrice ?? 0,
          quantity: item.quantity,
        }))
      );
      const { discountCents } = await getCouponOrThrow(couponCode, subtotalCents);
      const recomputed = fromCents(discountCents);
      if (Math.abs((discountAmount ?? 0) - recomputed) > 0.001) {
        discountAmount = recomputed;
        couponChanged = true;
      }
    } catch {
      couponCode = null;
      discountAmount = null;
      couponChanged = true;
      couponNotice = `Coupon ${cart.couponCode} is no longer valid and was removed from your cart.`;
    }
  }

  if (clampedRows.length > 0 || couponChanged) {
    for (const row of clampedRows) {
      await prisma.cartItem.update({ where: { id: row.id }, data: { quantity: row.quantity } });
    }
    if (couponChanged) {
      await prisma.cart.update({
        where: { id: cart.id! },
        data: couponCode ? { couponCode, discountAmount } : { couponCode: null, discountAmount: null },
      });
    }
  }

  // Always return the normalized coupon state (cleared or recomputed), never
  // the raw cart snapshot — it may hold a discount that was just invalidated.
  return { ...cart, items, availability, couponNotice, couponCode, discountAmount };
}

// Guest cart scoping. The session id is client-generated (a UUID or a
// `zg-session-…` string from the storefront). It is NOT a credential — it
// merely scopes a guest cart — but accepting arbitrary values lets one caller
// squat on unbounded storage and craft collisions. Enforce a sane shape.
const SESSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,100}$/;

function getGuestSessionId(req: Request): string | null {
  const raw = req.headers['x-session-id'];
  if (raw === undefined) return null;
  const sessionId = Array.isArray(raw) ? raw[0] : raw;
  if (!sessionId || !SESSION_ID_PATTERN.test(sessionId)) {
    throw ApiError.badRequest('Invalid session id');
  }
  return sessionId;
}

function getCartWhere(req: Request) {
  const userId = req.user?.userId;
  if (userId) return { userId };
  const sessionId = getGuestSessionId(req);
  if (sessionId) return { sessionId };
  return null;
}

function requireCartWhere(req: Request) {
  const userId = req.user?.userId;
  if (userId) return { userId };
  const sessionId = getGuestSessionId(req);
  if (sessionId) return { sessionId };
  throw ApiError.badRequest('Authentication or session required');
}

async function findCart(req: Request) {
  const where = requireCartWhere(req);
  return prisma.cart.findFirst({ where, include: cartInclude });
}

async function ensureCart(req: Request) {
  const where = requireCartWhere(req);
  let cart = await prisma.cart.findFirst({ where, include: cartInclude });
  if (!cart) {
    cart = await prisma.cart.create({ data: where, include: cartInclude });
  }
  return cart;
}

async function verifyOwnership(itemId: string, req: Request) {
  if (!isValidObjectId(itemId)) throw ApiError.badRequest('Invalid cart item ID');
  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true },
  });
  if (!item) throw ApiError.notFound('Cart item not found');

  const userId = req.user?.userId;
  const sessionId = getGuestSessionId(req);

  const belongs =
    (userId && item.cart.userId === userId) ||
    (!userId && sessionId && item.cart.sessionId === sessionId);

  // Match the 404 used by addresses/orders/wishlist: a caller must not be
  // able to distinguish "another user's item" from "does not exist".
  if (!belongs) throw ApiError.notFound('Cart item not found');
  return item;
}

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    const empty = { id: null, userId: null, sessionId: null, couponCode: null, discountAmount: null, items: [] };
    const cartResponse = cart ? await finalizeCart(cart) : empty;
    sendSuccess(res, cartResponse);
  } catch (error) { next(error); }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const qty = quantity || 1;

    if (!isValidObjectId(productId)) throw ApiError.badRequest('Invalid product ID');
    if (variantId != null && !isValidObjectId(variantId)) throw ApiError.badRequest('Invalid variant ID');

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { variants: { select: { id: true, stock: true, isActive: true, color: true, size: true } } },
    });
    if (!product) throw ApiError.notFound('Product not found');
    if (product.stock < 1) throw ApiError.badRequest('This product is out of stock');

    // PRRODUCT/VARIANT IDENTITY: a cart item is keyed by (productId, variantId).
    // Products with variants must always be added with one of THEIR OWN variants
    // so quantity/price/stock are tracked against the concrete variant and two
    // different colors/sizes of the same product can never share a line.
    const activeVariants = (product.variants ?? []).filter((v) => v.isActive);
    let variant = null;
    let variantStock: number | null = null;
    if (activeVariants.length > 0) {
      if (!variantId) {
        throw ApiError.badRequest('Please select a size and color before adding this product to your cart.');
      }
      variant = activeVariants.find((v) => v.id === variantId);
      if (!variant) {
        throw ApiError.badRequest('The selected size or color is not available for this product.');
      }
      variantStock = variant.stock;
      if (variant.stock < 1) throw ApiError.badRequest('This product is out of stock for the selected size and color');
      if (variant.stock < qty) throw ApiError.badRequest(`Only ${variant.stock} units available for this variant`);
    } else if (product.stock < qty) {
      throw ApiError.badRequest(`Only ${product.stock} units available`);
    }

    const cart = await ensureCart(req);

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });

    if (existing) {
      const newQty = existing.quantity + qty;
      const maxStock = variantStock ?? product.stock;
      if (newQty > maxStock) throw ApiError.badRequest(`Cannot add more than ${maxStock} units`);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId || null, quantity: qty } });
    }

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    sendSuccess(res, await finalizeCart(updated), 'Item added to cart');
  } catch (error) { next(error); }
};

export const updateCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    const { quantity } = req.body;
    await verifyOwnership(itemId, req);

    const item = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true, variant: true },
    });
    if (!item) throw ApiError.notFound('Cart item not found');

    const productActive = !!item.product?.isActive;
    const variantActive = item.variant ? !!item.variant.isActive : true;
    const stockLeft = item.variant?.stock ?? item.product?.stock ?? 0;
    if (!productActive || !variantActive || stockLeft < 1) {
      throw ApiError.badRequest('This item is currently unavailable and cannot be updated.');
    }

    const maxStock = Math.min(stockLeft, 99);
    if (quantity > maxStock) throw ApiError.badRequest(`Only ${maxStock} units available`);

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

    const cart = await findCart(req);
    sendSuccess(res, await finalizeCart(cart), 'Cart updated');
  } catch (error) { next(error); }
};

export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    await verifyOwnership(itemId, req);
    await prisma.cartItem.delete({ where: { id: itemId } });

    const cart = await findCart(req);
    sendSuccess(res, await finalizeCart(cart), 'Item removed from cart');
  } catch (error) { next(error); }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    if (cart?.id) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      // Emptying the cart also retires any applied coupon/discount so a stale
      // discount can never linger on a fresh cart.
      await prisma.cart.update({
        where: { id: cart.id },
        data: { couponCode: null, discountAmount: null },
      });
    }
    const empty = await findCart(req);
    sendSuccess(res, await finalizeCart(empty), 'Cart cleared');
  } catch (error) { next(error); }
};

export const applyCouponToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = normalizeCouponCode(req.body.code);
    if (!code) throw ApiError.badRequest('Coupon code is required');

    const cart = await findCart(req);
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    const subtotalCents = itemsSubtotalCents(
      cart.items.map((item) => {
        const unitPrice = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.regularPrice;
        return { unitPrice, quantity: item.quantity };
      })
    );

    const { coupon, discountCents } = await getCouponOrThrow(code, subtotalCents);

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: coupon!.code, discountAmount: fromCents(discountCents) },
    });

    const updated = await findCart(req);
    sendSuccess(res, await finalizeCart(updated), 'Coupon applied');
  } catch (error) { next(error); }
};

export const removeCouponFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    if (cart?.id) {
      await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null, discountAmount: null } });
    }
    const updated = await findCart(req);
    sendSuccess(res, await finalizeCart(updated), 'Coupon removed');
  } catch (error) { next(error); }
};

/**
 * Merges the guest (x-session-id) cart into the authenticated user's cart.
 * Used after login so items picked up while browsing as a guest survive the
 * transition. Idempotent — running it when there is no guest cart simply
 * returns the user's cart.
 */
export const mergeGuestCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.forbidden('Login is required to merge your cart');
    const sessionId = getGuestSessionId(req);

    if (!sessionId) {
      const cart = await ensureCart(req);
      return sendSuccess(res, cart, 'Cart synced');
    }

    const guestCart = await prisma.cart.findFirst({
      where: { sessionId },
      include: { items: { include: { product: true, variant: true } } },
    });

    let userCart = await prisma.cart.findFirst({ where: { userId } });
    if (!userCart) {
      userCart = await prisma.cart.create({ data: { userId } });
    }

    if (guestCart && guestCart.items.length > 0) {
      for (const guestItem of guestCart.items) {
        const stock = guestItem.variant?.stock ?? guestItem.product?.stock ?? 0;
        if (stock < 1) continue;

        const existing = await prisma.cartItem.findFirst({
          where: {
            cartId: userCart.id,
            productId: guestItem.productId,
            variantId: guestItem.variantId ?? null,
          },
        });

        const mergedQty = Math.min((existing?.quantity ?? 0) + guestItem.quantity, 99, stock);
        if (mergedQty < 1) continue;

        if (existing) {
          await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: mergedQty } });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: guestItem.productId,
              variantId: guestItem.variantId ?? null,
              quantity: mergedQty,
            },
          });
        }
      }
    }

    if (guestCart) {
      // A cart row is keyed by userId OR sessionId; once merged, the guest
      // cart row must be cleared so a future guest session starts fresh.
      await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await prisma.cart.delete({ where: { id: guestCart.id } });
    }

    const updated = await prisma.cart.findUnique({ where: { id: userCart.id }, include: cartInclude });
    sendSuccess(res, await finalizeCart(updated), 'Cart merged');
  } catch (error) { next(error); }
};
