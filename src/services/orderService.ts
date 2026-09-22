import type { Order, OrderStatus, OrderItem, ShippingAddress, DeliveryMethod, PaymentSummary } from '../types';
import { attributionService } from './attributionService';
import { commissionService } from './commissionService';
import { representativeService } from './representativeService';

const ORDERS_STORAGE_KEY = 'ilovesurprises_orders_v1';

/**
 * Generates an authentic formatted Order ID
 * Example: ILS-749201-US
 */
export function generateOrderId(): string {
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `ILS-${randomNum}-US`;
}

/**
 * Generates an authentic tracking number
 * Example: 94001118995628392012
 */
export function generateTrackingNumber(): string {
  const prefix = '9400';
  const suffix = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');
  return `${prefix}${suffix}`;
}

/**
 * Calculates estimated delivery date formatted cleanly
 */
export function calculateEstimatedDelivery(daysToAdd: number): string {
  const date = new Date();
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
    // Skip Sundays for standard business delivery
    if (date.getDay() !== 0) {
      added++;
    }
  }
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Order Service layer (Standalone Local Storage Implementation)
 */
export const orderService = {
  /**
   * Loads all orders from storage
   */
  getOrders(): Order[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Retrieves single order by ID
   */
  getOrderById(orderId: string): Order | undefined {
    const orders = this.getOrders();
    return orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  },

  /**
   * Creates and persists a new order with Lifetime Attribution & 5-Level Commission Generation
   */
  async createOrder(params: {
    items: OrderItem[];
    shippingAddress: ShippingAddress;
    deliveryMethod: DeliveryMethod;
    paymentSummary: PaymentSummary;
    subtotal: number;
    discount: number;
    promoCode?: string;
    shippingFee: number;
    total: number;
    attributedRep?: {
      name: string;
      repUsername: string;
    };
    userId?: string;
    isPersonalPurchase?: boolean;
    isMembershipFee?: boolean;
    repDiscountAmount?: number;
    notes?: string;
  }): Promise<Order> {
    // Simulating realistic latency (350ms)
    await new Promise((resolve) => setTimeout(resolve, 350));

    const customerEmail = params.shippingAddress.email?.toLowerCase().trim() || '';
    const customerName = params.shippingAddress.fullName || 'Valued Customer';

    // 1. Resolve Lifetime Attribution
    let finalAttributedRep = params.attributedRep;
    const attributionResolution = await attributionService.resolveAttributionForCheckout({
      customerEmail,
      userId: params.userId,
      currentSessionRep: params.attributedRep?.repUsername,
    });

    if (attributionResolution.repUsername) {
      const repDetails = representativeService.lookupRepresentative(attributionResolution.repUsername);
      finalAttributedRep = {
        name: repDetails?.name || attributionResolution.repUsername,
        repUsername: attributionResolution.repUsername,
      };
    }

    const orderId = generateOrderId();
    const createdAtIso = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      createdAt: createdAtIso,
      status: 'processing',
      trackingNumber: generateTrackingNumber(),
      estimatedDeliveryDate: params.deliveryMethod.estimatedDeliveryDate,
      items: params.items,
      shippingAddress: params.shippingAddress,
      deliveryMethod: params.deliveryMethod,
      paymentSummary: params.paymentSummary,
      subtotal: params.subtotal,
      discount: params.discount,
      promoCode: params.promoCode,
      shippingFee: params.shippingFee,
      total: params.total,
      attributedRep: finalAttributedRep,
      notes: params.notes || (finalAttributedRep?.repUsername ? `rep:${finalAttributedRep.repUsername}` : undefined),
      isPersonalPurchase: params.isPersonalPurchase,
      isMembershipFee: params.isMembershipFee,
      repDiscountAmount: params.repDiscountAmount,
    };

    // 2. Persist to Local Storage
    const existing = this.getOrders();
    const updated = [newOrder, ...existing];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ilovesurprises_orders_updated'));
      } catch (err) {
        console.error('Failed to save order to localStorage', err);
      }
    }

    // 3. Generate 5-Level MLM Commissions (Idempotent & Lifetime Assured)
    if (finalAttributedRep && params.subtotal > 0 && !params.isPersonalPurchase && !params.isMembershipFee) {
      const primaryProductName = params.items.length > 0 ? params.items[0].product.name : 'Candle Order';
      try {
        await commissionService.processOrderCommissions({
          orderId: newOrder.id,
          orderAmount: params.subtotal,
          customerName,
          customerEmail,
          userId: params.userId,
          productName: primaryProductName,
          sessionRepUsername: finalAttributedRep.repUsername,
          isPersonalPurchase: params.isPersonalPurchase,
          isMembershipFee: params.isMembershipFee,
          notes: params.notes,
        });
      } catch (commErr) {
        console.error('Commission processing warning:', commErr);
      }
    }

    return newOrder;
  },

  /**
   * Updates order status
   */
  updateOrderStatus(orderId: string, status: OrderStatus): Order | undefined {
    const orders = this.getOrders();
    const target = orders.find((o) => o.id === orderId);
    if (!target) return undefined;

    target.status = status;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
      window.dispatchEvent(new CustomEvent('ilovesurprises_orders_updated'));
    }
    return target;
  },
};
