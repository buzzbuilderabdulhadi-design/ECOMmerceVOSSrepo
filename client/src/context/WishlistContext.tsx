'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import type { WishlistItem, Product } from '@/types';
import axiosInstance, { getErrorMessage } from '@/services/axios';
import { useAuth } from '@/context/AuthContext';

// ============================================================
// Wishlist Context — Favorites/Wishlist State Management
// ============================================================

type WishlistAction =
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_GUEST_EMPTY' };

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  addItem: (product: Product, variantId?: string) => Promise<boolean>;
  removeItem: (itemId: string) => Promise<boolean>;
  toggleItem: (product: Product, variantId?: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

const initialState: {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  hasLoaded: boolean;
} = {
  items: [],
  isLoading: false,
  error: null,
  hasLoaded: false,
};

const wishlistReducer = (
  state: typeof initialState,
  action: WishlistAction
): typeof initialState => {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, items: action.payload, isLoading: false, error: null, hasLoaded: true };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        isLoading: false,
        hasLoaded: true,
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, hasLoaded: true };
    case 'SET_GUEST_EMPTY':
      return { items: [], isLoading: false, error: null, hasLoaded: false };
    default:
      return state;
  }
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const refreshWishlist = useCallback(async () => {
    // The wishlist endpoint is auth-protected. Skip it for guests so every
    // page load doesn't fire a 401 that used to bounce users to /login.
    if (!isAuthenticated) {
      dispatch({ type: 'SET_GUEST_EMPTY' });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axiosInstance.get('/wishlist');
      dispatch({ type: 'SET_WISHLIST', payload: response.data.data });
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string, variantId?: string): boolean => {
      return state.items.some(
        (item) =>
          item.productId === productId &&
          (variantId ? item.variantId === variantId : true)
      );
    },
    [state.items]
  );

  const addItem = useCallback(
    async (product: Product, variantId?: string) => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const response = await axiosInstance.post('/wishlist', {
          productId: product.id,
          variantId,
        });
        dispatch({ type: 'ADD_ITEM', payload: response.data.data });
        return true;
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: getErrorMessage(error),
        });
        return false;
      }
    },
    []
  );

  const removeItem = useCallback(async (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    try {
      await axiosInstance.delete(`/wishlist/${itemId}`);
      return true;
    } catch (error) {
      refreshWishlist();
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
      return false;
    }
  }, [refreshWishlist]);

  const toggleItem = useCallback(
    async (product: Product, variantId?: string) => {
      const existingItem = state.items.find(
        (item) =>
          item.productId === product.id && item.variantId === variantId
      );
      if (existingItem) {
        return removeItem(existingItem.id);
      }
      return addItem(product, variantId);
    },
    [state.items, addItem, removeItem]
  );

  // Derived loading: show skeletons while the session or actual wishlist data
  // is being resolved so an authenticated user never sees "empty" first.
  const isLoading =
    state.isLoading ||
    authLoading ||
    (isAuthenticated && !state.hasLoaded);

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        isLoading,
        error: state.error,
        isInWishlist,
        addItem,
        removeItem,
        toggleItem,
        refreshWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}

