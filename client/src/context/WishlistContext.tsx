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

// ============================================================
// Wishlist Context — Favorites/Wishlist State Management
// ============================================================

type WishlistAction =
  | { type: 'SET_WISHLIST'; payload: WishlistItem[] }
  | { type: 'ADD_ITEM'; payload: WishlistItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

interface WishlistContextType {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
  isInWishlist: (productId: string) => boolean;
  addItem: (product: Product, variantId?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  toggleItem: (product: Product, variantId?: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined
);

const initialState: {
  items: WishlistItem[];
  isLoading: boolean;
  error: string | null;
} = {
  items: [],
  isLoading: false,
  error: null,
};

const wishlistReducer = (
  state: typeof initialState,
  action: WishlistAction
): typeof initialState => {
  switch (action.type) {
    case 'SET_WISHLIST':
      return { ...state, items: action.payload, isLoading: false, error: null };
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
        isLoading: false,
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    default:
      return state;
  }
};

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(wishlistReducer, initialState);

  const refreshWishlist = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    refreshWishlist();
  }, [refreshWishlist]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return state.items.some((item) => item.productId === productId);
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
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: getErrorMessage(error),
        });
      }
    },
    []
  );

  const removeItem = useCallback(async (itemId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: itemId });
    try {
      await axiosInstance.delete(`/wishlist/${itemId}`);
    } catch (error) {
      refreshWishlist();
      dispatch({
        type: 'SET_ERROR',
        payload: getErrorMessage(error),
      });
    }
  }, [refreshWishlist]);

  const toggleItem = useCallback(
    async (product: Product, variantId?: string) => {
      const existingItem = state.items.find(
        (item) =>
          item.productId === product.id && item.variantId === variantId
      );
      if (existingItem) {
        await removeItem(existingItem.id);
      } else {
        await addItem(product, variantId);
      }
    },
    [state.items, addItem, removeItem]
  );

  return (
    <WishlistContext.Provider
      value={{
        items: state.items,
        isLoading: state.isLoading,
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

