'use client';

import React, { createContext, useContext, useCallback, useState, ReactNode } from 'react';
import { CartDrawer } from '@/components/cart/CartDrawer';

// ============================================================
// Cart Drawer Context — Controls the mini cart drawer
// ============================================================

interface CartDrawerContextType {
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartDrawerContext = createContext<CartDrawerContextType | undefined>(undefined);

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  return (
    <CartDrawerContext.Provider value={{ isCartOpen, openCart, closeCart }}>
      {children}
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextType {
  const context = useContext(CartDrawerContext);
  if (context === undefined) {
    throw new Error('useCartDrawer must be used within a CartDrawerProvider');
  }
  return context;
}