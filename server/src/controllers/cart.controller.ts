import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { sendSuccess, sendMessage } from '../utils/apiResponse';
import { ApiError } from '../utils/apiError';
import { isValidObjectId } from '../utils/objectId';

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
          stock: true, priceOverride: true, sku: true,
        },
      },
    },
  },
};

function getCartWhere(req: Request) {
  const userId = req.user?.userId;
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (userId) return { userId };
  if (sessionId) return { sessionId };
  return null;
}

function requireCartWhere(req: Request) {
  const userId = req.user?.userId;
  const sessionId = req.headers['x-session-id'] as string | undefined;
  if (userId) return { userId };
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
  const sessionId = req.headers['x-session-id'] as string | undefined;

  const belongs =
    (userId && item.cart.userId === userId) ||
    (!userId && sessionId && item.cart.sessionId === sessionId);

  if (!belongs) throw ApiError.forbidden('This item does not belong to your cart');
  return item;
}

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    sendSuccess(res, cart || { id: null, userId: null, sessionId: null, couponCode: null, discountAmount: null, items: [] });
  } catch (error) { next(error); }
};

export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, quantity } = req.body;
    const qty = quantity || 1;

    if (!isValidObjectId(productId)) throw ApiError.badRequest('Invalid product ID');
    if (variantId != null && !isValidObjectId(variantId)) throw ApiError.badRequest('Invalid variant ID');

    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
    if (!product) throw ApiError.notFound('Product not found');
    if (product.stock < 1) throw ApiError.badRequest('This product is out of stock');

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || !variant.isActive) throw ApiError.notFound('Variant not found');
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
      let maxStock = product.stock;
      if (variantId) {
        const v = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (v) maxStock = v.stock;
      }
      if (newQty > maxStock) throw ApiError.badRequest(`Cannot add more than ${maxStock} units`);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId: variantId || null, quantity: qty } });
    }

    const updated = await prisma.cart.findUnique({ where: { id: cart.id }, include: cartInclude });
    sendSuccess(res, updated, 'Item added to cart');
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

    const maxStock = item.variant?.stock ?? item.product?.stock ?? 0;
    if (quantity > maxStock) throw ApiError.badRequest(`Only ${maxStock} units available`);

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });

    const cart = await findCart(req);
    sendSuccess(res, cart, 'Cart updated');
  } catch (error) { next(error); }
};

export const removeCartItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.itemId as string;
    await verifyOwnership(itemId, req);
    await prisma.cartItem.delete({ where: { id: itemId } });

    const cart = await findCart(req);
    sendSuccess(res, cart, 'Item removed from cart');
  } catch (error) { next(error); }
};

export const clearCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    if (cart?.id) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
    const empty = await findCart(req);
    sendSuccess(res, empty, 'Cart cleared');
  } catch (error) { next(error); }
};

export const applyCouponToCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const code = req.body.code as string;
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    if (!coupon.isActive) throw ApiError.badRequest('Coupon is inactive');
    if (coupon.expiresAt && coupon.expiresAt < new Date()) throw ApiError.badRequest('Coupon has expired');
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw ApiError.badRequest('Coupon usage limit reached');

    const cart = await findCart(req);
    if (!cart || cart.items.length === 0) throw ApiError.badRequest('Cart is empty');

    const subtotal = cart.items.reduce((sum, item) => {
      const price = item.variant?.priceOverride ?? item.product.salePrice ?? item.product.regularPrice;
      return sum + price * item.quantity;
    }, 0);

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      throw ApiError.badRequest(`Minimum order amount of $${coupon.minOrderAmount} required`);
    }

    const discount = coupon.type === 'PERCENTAGE'
      ? Math.min(subtotal * (coupon.value / 100), coupon.maxDiscount || Infinity)
      : coupon.value;

    await prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: code.toUpperCase(), discountAmount: discount },
    });

    const updated = await findCart(req);
    sendSuccess(res, updated, 'Coupon applied');
  } catch (error) { next(error); }
};

export const removeCouponFromCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cart = await findCart(req);
    if (cart?.id) {
      await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: null, discountAmount: null } });
    }
    const updated = await findCart(req);
    sendSuccess(res, updated, 'Coupon removed');
  } catch (error) { next(error); }
};
