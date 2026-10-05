import { apiClient } from './apiClient';
import type { Product, CartItem } from '../types';

export const CART_STORAGE_KEY = 'ilovesurprises_cart_v1';

export interface BackendCartItemDTO {
  id: string;
  cartId?: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  productSlug: string;
  imageUrl?: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  selectedRingSize?: string | null;
  selectedScent?: string | null;
  customNote?: string | null;
  isAvailable?: boolean;
}

export interface BackendCartDTO {
  id: string;
  userId?: string | null;
  items: BackendCartItemDTO[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  freeShippingEligible?: boolean;
  freeShippingThreshold?: number;
  amountNeededForFreeShipping?: number;
}

/**
 * Generates a stable composite identifier for a cart line item based on product and variant attributes.
 */
export function generateCartItemKey(
  productId: string,
  options?: {
    selectedRingSize?: number | string;
    selectedJewelryType?: string;
    selectedSize?: string;
  }
): string {
  const parts = [
    productId,
    options?.selectedRingSize ? `rs:${options.selectedRingSize}` : '',
    options?.selectedJewelryType ? `jt:${options.selectedJewelryType}` : '',
    options?.selectedSize ? `sz:${options.selectedSize}` : '',
  ].filter(Boolean);
  return parts.join('_');
}

/**
 * Maps a backend cart item to a frontend CartItem model.
 */
export function mapBackendCartItemToFrontend(
  item: BackendCartItemDTO,
  fallbackProduct?: Product
): CartItem {
  const product: Product = fallbackProduct || {
    id: item.productId,
    name: item.productName,
    slug: item.productSlug,
    category: 'Surprise Candles',
    price: Number(item.unitPrice) || 0,
    surpriseType: (item.productName || '').toLowerCase().includes('cash') ? 'cash' : 'jewelry',
    rating: 5.0,
    reviewCount: 0,
    image: item.imageUrl || '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
    inStock: item.isAvailable !== false,
  };

  const ringSizeNum = item.selectedRingSize ? parseInt(item.selectedRingSize, 10) : undefined;

  return {
    id: item.id,
    serverItemId: item.id,
    product,
    quantity: item.quantity,
    selectedRingSize: isNaN(ringSizeNum as number) ? undefined : ringSizeNum,
    selectedSize: item.selectedScent || undefined,
  };
}

export const cartService = {
  /**
   * Retrieves cart from local storage cache
   */
  getLocalCart(): CartItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Persists cart to local storage cache
   */
  saveLocalCart(cart: CartItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      window.dispatchEvent(new CustomEvent('ils_cart_updated', { detail: { cart } }));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  },

  /**
   * Retrieves the live cart from the backend API.
   * Falls back to local storage if API call fails or user is offline.
   */
  async getCart(): Promise<{ items: CartItem[]; subtotal: number; total: number }> {
    try {
      const response = await apiClient.get<{
        status: string;
        data: { cart: BackendCartDTO };
      }>('/api/cart');

      const serverCart = response.data?.cart;
      if (serverCart && Array.isArray(serverCart.items)) {
        const localCart = this.getLocalCart();
        const mappedItems = serverCart.items.map((srvItem) => {
          const matchedLocal = localCart.find(
            (loc) => loc.product.id === srvItem.productId || loc.serverItemId === srvItem.id
          );
          return mapBackendCartItemToFrontend(srvItem, matchedLocal?.product);
        });

        this.saveLocalCart(mappedItems);
        return {
          items: mappedItems,
          subtotal: Number(serverCart.subtotal) || 0,
          total: Number(serverCart.total) || 0,
        };
      }
    } catch (err: any) {
      // Graceful fallback to cached cart
      console.warn('[CartService] Live backend cart fetch notice:', err?.message || err);
    }

    const localItems = this.getLocalCart();
    const subtotal = localItems.reduce((acc, i) => acc + (i.product.price || 0) * i.quantity, 0);
    return {
      items: localItems,
      subtotal,
      total: subtotal,
    };
  },

  /**
   * Adds an item to the cart via live backend API.
   */
  async addItem(params: {
    product: Product;
    quantity: number;
    selectedRingSize?: number;
    selectedJewelryType?: string;
    selectedSize?: string;
  }): Promise<{ items: CartItem[]; subtotal?: number }> {
    // 1. Prevent adding out-of-stock products
    if (!params.product.inStock) {
      throw new Error(`"${params.product.name}" is currently out of stock.`);
    }

    let serverSuccess = false;
    let updatedCartItems: CartItem[] = [];

    // 2. Call backend API POST /api/cart/items
    try {
      const response = await apiClient.post<{
        status: string;
        data: { cart: BackendCartDTO };
      }>('/api/cart/items', {
        productId: params.product.id,
        quantity: params.quantity,
        selectedRingSize: params.selectedRingSize ? String(params.selectedRingSize) : undefined,
        selectedScent: params.selectedSize,
        customNote: params.selectedJewelryType ? `Type: ${params.selectedJewelryType}` : undefined,
      });

      const serverCart = response.data?.cart;
      if (serverCart && Array.isArray(serverCart.items)) {
        const localCart = this.getLocalCart();
        updatedCartItems = serverCart.items.map((srvItem) => {
          const matchedLocal = localCart.find(
            (loc) => loc.product.id === srvItem.productId || loc.serverItemId === srvItem.id
          );
          return mapBackendCartItemToFrontend(srvItem, matchedLocal?.product || params.product);
        });
        serverSuccess = true;
      }
    } catch (err: any) {
      console.warn('[CartService] Backend addItem notice:', err?.message || err);
    }

    // 3. Fallback / client state management
    if (!serverSuccess) {
      const current = this.getLocalCart();
      const itemKey = generateCartItemKey(params.product.id, {
        selectedRingSize: params.selectedRingSize,
        selectedJewelryType: params.selectedJewelryType,
        selectedSize: params.selectedSize,
      });

      const existingIdx = current.findIndex((item) => {
        const existingKey = item.id || generateCartItemKey(item.product.id, {
          selectedRingSize: item.selectedRingSize,
          selectedJewelryType: item.selectedJewelryType,
          selectedSize: item.selectedSize,
        });
        return existingKey === itemKey;
      });

      if (existingIdx !== -1) {
        current[existingIdx] = {
          ...current[existingIdx],
          quantity: current[existingIdx].quantity + params.quantity,
        };
      } else {
        current.push({
          id: itemKey,
          product: params.product,
          quantity: params.quantity,
          selectedRingSize: params.selectedRingSize,
          selectedJewelryType: params.selectedJewelryType,
          selectedSize: params.selectedSize,
        });
      }
      updatedCartItems = current;
    }

    this.saveLocalCart(updatedCartItems);
    return { items: updatedCartItems };
  },

  /**
   * Updates line item quantity via live backend API.
   */
  async updateQuantity(
    itemIdentifier: string,
    delta: number,
    currentCart: CartItem[]
  ): Promise<CartItem[]> {
    const targetItem = currentCart.find(
      (i) => i.id === itemIdentifier || i.serverItemId === itemIdentifier || i.product.id === itemIdentifier
    );

    if (!targetItem) return currentCart;

    const newQuantity = targetItem.quantity + delta;

    if (newQuantity <= 0) {
      return this.removeItem(itemIdentifier, currentCart);
    }

    // 1. If line item has backend server ID, sync with backend API
    const serverItemId = targetItem.serverItemId;
    if (serverItemId) {
      try {
        await apiClient.patch(`/api/cart/items/${serverItemId}`, {
          quantity: newQuantity,
        });
      } catch (err: any) {
        console.warn('[CartService] Backend updateQuantity notice:', err?.message || err);
      }
    }

    // 2. Update local state
    const updated = currentCart.map((item) => {
      const isTarget =
        item.id === itemIdentifier ||
        item.serverItemId === itemIdentifier ||
        (item.product.id === itemIdentifier && !item.id && !item.serverItemId);
      return isTarget ? { ...item, quantity: newQuantity } : item;
    });

    this.saveLocalCart(updated);
    return updated;
  },

  /**
   * Removes line item from cart via live backend API.
   */
  async removeItem(itemIdentifier: string, currentCart: CartItem[]): Promise<CartItem[]> {
    const targetItem = currentCart.find(
      (i) => i.id === itemIdentifier || i.serverItemId === itemIdentifier || i.product.id === itemIdentifier
    );

    const serverItemId = targetItem?.serverItemId;
    if (serverItemId) {
      try {
        await apiClient.delete(`/api/cart/items/${serverItemId}`);
      } catch (err: any) {
        console.warn('[CartService] Backend removeItem notice:', err?.message || err);
      }
    }

    const filtered = currentCart.filter((item) => {
      const isTarget =
        item.id === itemIdentifier ||
        item.serverItemId === itemIdentifier ||
        (item.product.id === itemIdentifier && !item.id && !item.serverItemId);
      return !isTarget;
    });

    this.saveLocalCart(filtered);
    return filtered;
  },

  /**
   * Clears the entire cart via live backend API.
   */
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete('/api/cart');
    } catch (err: any) {
      console.warn('[CartService] Backend clearCart notice:', err?.message || err);
    }
    this.saveLocalCart([]);
  },

  /**
   * Syncs guest cart items into backend server cart after user logs in.
   */
  async syncLocalCartToServer(): Promise<CartItem[]> {
    const local = this.getLocalCart();
    if (local.length === 0) {
      const { items } = await this.getCart();
      return items;
    }

    try {
      for (const item of local) {
        if (item.product.inStock) {
          await apiClient.post('/api/cart/items', {
            productId: item.product.id,
            quantity: item.quantity,
            selectedRingSize: item.selectedRingSize ? String(item.selectedRingSize) : undefined,
            selectedScent: item.selectedSize,
          }).catch(() => {});
        }
      }
    } catch {
      // ignore
    }

    const { items } = await this.getCart();
    return items;
  },
};
