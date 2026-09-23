'use client';

import React, { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthProvider } from './AuthContext';
import { CartProvider } from './CartContext';
import { CartDrawerProvider } from './CartDrawerContext';
import { WishlistProvider } from './WishlistContext';

// ============================================================
// App Provider — Wraps all context providers
// ============================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CartProvider>
          <CartDrawerProvider>
            <WishlistProvider>{children}</WishlistProvider>
          </CartDrawerProvider>
        </CartProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export { useAuth } from './AuthContext';
export { useCart } from './CartContext';
export { useCartDrawer } from './CartDrawerContext';
export { useWishlist } from './WishlistContext';

