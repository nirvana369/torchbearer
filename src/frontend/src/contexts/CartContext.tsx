import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Product } from '../backend';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => string; // Return as string to handle large numbers
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to recursively convert BigInt to string for storage
function bigIntToString(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'bigint') {
    return { __type: 'bigint', value: obj.toString() };
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => bigIntToString(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = bigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

// Helper function to recursively restore BigInt from storage
function stringToBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  
  // Check if this is a specially marked BigInt
  if (obj && typeof obj === 'object' && obj.__type === 'bigint') {
    return BigInt(obj.value);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => stringToBigInt(item));
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = stringToBigInt(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Restore BigInt values
        return stringToBigInt(parsed);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        return [];
      }
    }
    return [];
  });

  // Save to localStorage whenever items change
  useEffect(() => {
    try {
      // Convert BigInt to serializable format
      const serializable = bigIntToString(items);
      localStorage.setItem('cart', JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [items]);

  const addToCart = (product: Product, quantity: number) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.name === product.name);
      if (existing) {
        return prev.map(item =>
          item.product.name === product.name
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeFromCart = (productName: string) => {
    setItems(prev => prev.filter(item => item.product.name !== productName));
  };

  const updateQuantity = (productName: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productName);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.product.name === productName ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getTotalItems = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    // Use BigInt for accurate large number calculations
    const total = items.reduce((sum, item) => {
      const price = typeof item.product.price === 'bigint' 
        ? item.product.price 
        : BigInt(item.product.price);
      return sum + price * BigInt(item.quantity);
    }, 0n);
    
    return total.toString();
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}