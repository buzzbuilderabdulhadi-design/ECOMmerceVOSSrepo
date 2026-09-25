'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import type { Cart, CartItem, Product } from '@/types';
import axiosInstance, { getErrorMessage, removeClientSessionId, peekClientSessionId } from '@/services/axios';
import { useAuth } from '@/context/AuthContext';

// ============================================================
// Cart Context — Shopping Cart State Management
// ============================================================

type CartAction =
  | { type: 'SET_CART'; payload: Cart }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'APPLY_COUPON'; payload: { code: string; discount: number } }
  | { type: 'REMOVE_COUPON' }
  | { type: 'SET_GUEST_EMPTY' };

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  itemCount: number;
  subtotal: number;
  pendingIds: string[];
  isItemPending: (itemId: string) => boolean;
  addItem: (
    product: Product,
    quantity: number,
    variantId?: string
  ) => Promise<string | null>;
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const initialState: {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
} = {
  cart: null,
  isLoading: false,
  error: null,
  hasLoaded: false,
};

const cartReducer = (
  state: typeof initialState,
  action: CartAction
): typeof initialState => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, cart: action.payload, isLoading: false, error: null, hasLoaded: true };
    case 'ADD_ITEM': {
      if (!state.cart) return state;
      const existingIndex = state.cart.items.findIndex(
        (item) => item.id === action.payload.id
      );
      let newItems: CartItem[];
      if (existingIndex >= 0) {
        newItems = state.cart.items.map((item, i) =>
          i === existingIndex
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.cart.items, action.payload];
      }
      return {
        ...state,
        cart: { ...state.cart, items: newItems },
        isLoading: false,
        hasLoaded: true,
      };
    }
    case 'UPDATE_QUANTITY': {
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        },
      };
    }
    case 'REMOVE_ITEM': {
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          items: state.cart.items.filter(
            (item) => item.id !== action.payload
          ),
        },
      };
    }
    case 'CLEAR_CART':
      return { ...state, cart: null, error: null, hasLoaded: true };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: action.payload ? null : state.error };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, hasLoaded: true };
    case 'SET_GUEST_EMPTY':
      return { cart: { id: '', items: [] }, isLoading: false, error: null, hasLoaded: false };
    case 'APPLY_COUPON':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          couponCode: action.payload.code,
          discountAmount: action.payload.discount,
        },
      };
    case 'REMOVE_COUPON':
      if (!state.cart) return state;
      return {
        ...state,
        cart: {
          ...state.cart,
          couponCode: undefined,
          discountAmount: undefined,
        },
      };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const markPending = useCallback((itemId: string) => {
    setPendingIds((prev) => (prev.includes(itemId) ? prev : [...prev, itemId]));
  }, []);

  const clearPending = useCallback((itemId: string) => {
    setPendingIds((prev) => prev.filter((id) => id !== itemId));
  }, []);

  const isItemPending = useCallback(
    (itemId: string) => pendingIds.includes(itemId),
    [pendingIds]
  );

  const refreshCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axiosInstance.get('/cart');
      dispatch({ type: 'SET_CART', payload: response.data.data });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      // After login, fold the guest cart into the account cart, then load the
      // authoritative user cart. Removing the stored session id keeps future
      // guest carts separate from the merged account cart.
      (async () => {
        try {
          // Only merge when a real guest session exists (peek, don't create).
          // Using the id getter here made this fire on every authenticated
          // page load by minting a fresh id each time the guard was checked.
          if (peekClientSessionId()) {
            await axiosInstance.post('/cart/merge');
            removeClientSessionId();
          }
        } catch {
          // Merge is best-effort; the authoritative cart load below is what
          // drives the UI either way.
        }
        refreshCart();
      })();
    } else {
      dispatch({ type: 'SET_GUEST_EMPTY' });
      // Guests store their cart under the anonymous session id; load it so a
      // page refresh keeps showing the items picked while browsing.
      refreshCart();
    }
  }, [authLoading, isAuthenticated, refreshCart]);

  const addItem = useCallback(
    async (product: Product, quantity: number, variantId?: string): Promise<string | null> => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await axiosInstance.post('/cart/items', {
          productId: product.id,
          variantId,
          quantity,
        });
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return null;
      } catch (error) {
        const message = getErrorMessage(error);
        dispatch({
          type: 'SET_ERROR',
          payload: message,
        });
        return message;
      }
    },
    []
  );

  const updateQuantity = useCallback(
    async (itemId: string, quantity: number) => {
      markPending(itemId);
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: itemId, quantity } });
      try {
        const response = await axiosInstance.put(`/cart/items/${itemId}`, { quantity });
        // The response is the authoritative server cart (quantity clamps,
        // recomputed coupon discount) — reconcile local state with it.
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return true;
      } catch (error) {
        refreshCart();
        dispatch({
          type: 'SET_ERROR',
          payload: getErrorMessage(error),
        });
        return false;
      } finally {
        clearPending(itemId);
      }
    },
    [refreshCart, markPending, clearPending]
  );

  const removeItem = useCallback(
    async (itemId: string) => {
      markPending(itemId);
      dispatch({ type: 'REMOVE_ITEM', payload: itemId });
      try {
        const response = await axiosInstance.delete(`/cart/items/${itemId}`);
        dispatch({ type: 'SET_CART', payload: response.data.data });
        return true;
      } catch (error) {
        refreshCart();
        dispatch({
          type: 'SET_ERROR',
          payload: getErrorMessage(error),
        });
        return false;
      } finally {
        clearPending(itemId);
      }
    },
    [refreshCart, markPending, clearPending]
  );

  const clearCart = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axiosInstance.delete('/cart');
      dispatch({ type: 'SET_CART', payload: response.data.data });
      return true;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
      return false;
    }
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // The server responds with the full, authoritative cart — replace local
      // state with it so coupon code + discount always match the backend.
      const response = await axiosInstance.post('/cart/coupon', { code });
      dispatch({ type: 'SET_CART', payload: response.data.data });
      return true;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
      return false;
    }
  }, []);

  const removeCoupon = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axiosInstance.delete('/cart/coupon');
      dispatch({ type: 'SET_CART', payload: response.data.data });
      return true;
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
      return false;
    }
  }, []);

  // Computed values
  const itemCount =
    state.cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const subtotal =
    state.cart?.items.reduce((sum, item) => {
      const price = item.variant?.priceOverride ?? item.product?.salePrice ?? item.product?.regularPrice ?? 0;
      return sum + price * item.quantity;
    }, 0) || 0;

  // While the session is being restored (or a known authenticated cart has
  // not loaded yet), report loading so consumers never flash an empty state.
  const isLoading =
    state.isLoading ||
    authLoading ||
    (isAuthenticated && !state.hasLoaded);

  return (
    <CartContext.Provider
      value={{
        cart: state.cart,
        isLoading,
        error: state.error,
        itemCount,
        subtotal,
        pendingIds,
        isItemPending,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

