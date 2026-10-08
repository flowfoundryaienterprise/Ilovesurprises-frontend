import type { Product, CartItem } from '../types';
import { apiClient } from './apiClient';

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
   * Persists cart to local storage cache and notifies UI
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
   * Retrieves the current cart from backend (GET /api/cart) with local fallback.
   */
  async getCart(): Promise<{ items: CartItem[]; subtotal: number; total: number }> {
    try {
      const res = await apiClient.get<any>('/api/cart');
      const backendCart: BackendCartDTO = res?.data?.cart;

      if (backendCart && Array.isArray(backendCart.items)) {
        const localItems = this.getLocalCart();
        const mappedItems: CartItem[] = backendCart.items.map((bItem) => {
          const match = localItems.find(
            (l) => l.product.id === bItem.productId || l.product.slug === bItem.productSlug
          );
          return mapBackendCartItemToFrontend(bItem, match?.product);
        });

        this.saveLocalCart(mappedItems);
        return {
          items: mappedItems,
          subtotal: backendCart.subtotal,
          total: backendCart.total,
        };
      }
    } catch (err: any) {
      console.warn('Backend getCart failed, using local cart:', err.message);
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
   * Adds an item to the cart via backend (POST /api/cart/items) with local fallback.
   */
  async addItem(params: {
    product: Product;
    quantity: number;
    selectedRingSize?: number;
    selectedJewelryType?: string;
    selectedSize?: string;
  }): Promise<{ items: CartItem[]; subtotal?: number }> {
    if (!params.product.inStock) {
      throw new Error(`"${params.product.name}" is currently out of stock.`);
    }

    try {
      const res = await apiClient.post<any>('/api/cart/items', {
        productId: params.product.id || params.product.slug,
        quantity: params.quantity,
        selectedRingSize: params.selectedRingSize ? String(params.selectedRingSize) : undefined,
        selectedScent: params.selectedSize,
      });

      const backendCart: BackendCartDTO = res?.data?.cart;
      if (backendCart && Array.isArray(backendCart.items)) {
        const localItems = this.getLocalCart();
        const mappedItems: CartItem[] = backendCart.items.map((bItem) => {
          if (bItem.productId === params.product.id || bItem.productSlug === params.product.slug) {
            return mapBackendCartItemToFrontend(bItem, params.product);
          }
          const match = localItems.find(
            (l) => l.product.id === bItem.productId || l.product.slug === bItem.productSlug
          );
          return mapBackendCartItemToFrontend(bItem, match?.product);
        });

        this.saveLocalCart(mappedItems);
        return { items: mappedItems, subtotal: backendCart.subtotal };
      }
    } catch (err: any) {
      console.warn('Backend addItem notice, applying local fallback:', err.message);
    }

    // Local fallback
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

    this.saveLocalCart(current);
    const subtotal = current.reduce((acc, i) => acc + (i.product.price || 0) * i.quantity, 0);
    return { items: current, subtotal };
  },

  /**
   * Updates line item quantity via backend (PATCH /api/cart/items/:id) with local fallback.
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
    const targetItemId = targetItem.serverItemId || targetItem.id;

    if (targetItemId && !targetItemId.startsWith('prod-') && !targetItemId.startsWith('rs:')) {
      try {
        let res: any;
        if (newQuantity <= 0) {
          res = await apiClient.delete<any>(`/api/cart/items/${encodeURIComponent(targetItemId)}`);
        } else {
          res = await apiClient.patch<any>(`/api/cart/items/${encodeURIComponent(targetItemId)}`, {
            quantity: newQuantity,
          });
        }

        const backendCart: BackendCartDTO = res?.data?.cart;
        if (backendCart && Array.isArray(backendCart.items)) {
          const mappedItems: CartItem[] = backendCart.items.map((bItem) => {
            const match = currentCart.find(
              (l) => l.product.id === bItem.productId || l.product.slug === bItem.productSlug
            );
            return mapBackendCartItemToFrontend(bItem, match?.product);
          });

          this.saveLocalCart(mappedItems);
          return mappedItems;
        }
      } catch (err: any) {
        console.warn('Backend updateQuantity failed, using local update:', err.message);
      }
    }

    // Local fallback
    if (newQuantity <= 0) {
      return this.removeItem(itemIdentifier, currentCart);
    }

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
   * Removes line item via backend (DELETE /api/cart/items/:id) with local fallback.
   */
  async removeItem(itemIdentifier: string, currentCart: CartItem[]): Promise<CartItem[]> {
    const targetItem = currentCart.find(
      (i) => i.id === itemIdentifier || i.serverItemId === itemIdentifier || i.product.id === itemIdentifier
    );
    const targetItemId = targetItem?.serverItemId || targetItem?.id;

    if (targetItemId && !targetItemId.startsWith('prod-') && !targetItemId.startsWith('rs:')) {
      try {
        const res = await apiClient.delete<any>(`/api/cart/items/${encodeURIComponent(targetItemId)}`);
        const backendCart: BackendCartDTO = res?.data?.cart;
        if (backendCart && Array.isArray(backendCart.items)) {
          const mappedItems: CartItem[] = backendCart.items.map((bItem) => {
            const match = currentCart.find(
              (l) => l.product.id === bItem.productId || l.product.slug === bItem.productSlug
            );
            return mapBackendCartItemToFrontend(bItem, match?.product);
          });

          this.saveLocalCart(mappedItems);
          return mappedItems;
        }
      } catch (err: any) {
        console.warn('Backend removeItem failed, using local remove:', err.message);
      }
    }

    // Local fallback
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
   * Clears the entire cart via backend (DELETE /api/cart) and local cache.
   */
  async clearCart(): Promise<void> {
    try {
      await apiClient.delete('/api/cart');
    } catch (err: any) {
      console.warn('Backend clearCart notice:', err.message);
    }
    this.saveLocalCart([]);
  },

  /**
   * Syncs / merges guest cart line items to the authenticated customer backend cart on login.
   */
  async syncLocalCartToServer(): Promise<CartItem[]> {
    const local = this.getLocalCart();
    if (local.length > 0) {
      try {
        for (const item of local) {
          await apiClient.post('/api/cart/items', {
            productId: item.product.id || item.product.slug,
            quantity: item.quantity,
            selectedRingSize: item.selectedRingSize ? String(item.selectedRingSize) : undefined,
            selectedScent: item.selectedSize,
          }).catch(() => {});
        }
      } catch (err: any) {
        console.warn('Cart items sync notice:', err.message);
      }
    }

    const fresh = await this.getCart();
    return fresh.items;
  },
};
