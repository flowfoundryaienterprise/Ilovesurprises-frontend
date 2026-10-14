/**
 * Order service.
 *
 * ## Current status: no backend order endpoint exists
 *
 * The Prisma schema defines `orders`, `order_items`, `order_notes`,
 * `order_fulfillments`, and `payment_transactions`, but the Express API exposes
 * no route that reads or writes any of them. Verified against
 * `ilovesurprises-backend/src/routes/*.ts`.
 *
 * Consequently there is no authoritative order data to show, and this service
 * does not invent any. Previously it:
 *   - seeded `localStorage` with `MOCK_ORDERS` so the store always appeared to
 *     have sales,
 *   - created orders locally with a generated order ID, tracking number, and
 *     "paid" payment summary,
 *   - called `commissionService.processOrderCommissions()` to mint 5-level MLM
 *     commission records in the browser.
 *
 * All of that is removed. Orders are read-only and empty until the backend
 * provides them; commission generation is server-side only.
 */

import type { Order, OrderStatus } from '../types';
import { ApiError } from './apiClient';

/**
 * Whether the backend exposes order endpoints. Flip to true once
 * `GET /api/orders/me`, `GET /api/orders/:id`, and `POST /api/orders` exist.
 */
export const ORDERS_BACKEND_AVAILABLE = false;

export const ORDERS_UNAVAILABLE_MESSAGE =
  'Order history is not available yet: the server does not expose an orders endpoint.';

/**
 * Calculates an estimated delivery date, skipping Sundays.
 * Presentation helper only — not an order record.
 */
export function calculateEstimatedDelivery(daysToAdd: number): string {
  const date = new Date();
  let added = 0;
  while (added < daysToAdd) {
    date.setDate(date.getDate() + 1);
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

export const orderService = {
  ORDERS_BACKEND_AVAILABLE,
  ORDERS_UNAVAILABLE_MESSAGE,

  /**
   * Customer order history.
   *
   * Returns an empty list while no endpoint exists, so the account page shows
   * an accurate empty state. It never returns mock orders.
   *
   * Integration point: `GET /api/orders/me` → map to `Order[]`.
   */
  async fetchOrders(): Promise<Order[]> {
    return [];
  },

  /**
   * Synchronous accessor retained for component initial state. Orders are
   * server-owned, so there is nothing to read synchronously.
   */
  getOrders(): Order[] {
    return [];
  },

  /**
   * Single order lookup.
   *
   * Integration point: `GET /api/orders/:id`.
   */
  getOrderById(_orderId: string): Order | undefined {
    return undefined;
  },

  /** Async single-order lookup, for callers that can await. */
  async fetchOrderById(_orderId: string): Promise<Order | null> {
    return null;
  },

  /**
   * Order creation.
   *
   * BLOCKED: creating an order requires the server to validate the cart, price
   * every line from its own catalogue, and compute the totals. Doing it in the
   * browser would produce an unverifiable sale and trigger commission payouts
   * against money that was never collected.
   *
   * Integration point: `POST /api/orders` creating a PENDING order.
   */
  async createOrder(): Promise<never> {
    throw new ApiError(
      'Orders cannot be created yet: the server has no order endpoint. No order was placed and no payment was taken.',
      501,
      'http',
      { endpoint: '/api/orders', method: 'POST' }
    );
  },

  /**
   * Order cancellation.
   *
   * Integration point: `POST /api/orders/:id/cancel`.
   */
  async cancelOrder(_orderId: string, _reason?: string): Promise<Order | null> {
    throw new ApiError(
      'Orders cannot be cancelled yet: the server has no order endpoint.',
      501,
      'http',
      { endpoint: '/api/orders/:id/cancel', method: 'POST' }
    );
  },

  /**
   * Order status changes are an administrative, server-side operation.
   *
   * Integration point: `PATCH /api/admin/orders/:id`.
   */
  async updateOrderStatus(
    _orderId: string,
    _status: OrderStatus
  ): Promise<Order | undefined> {
    throw new ApiError(
      'Order status cannot be changed yet: the server has no order endpoint.',
      501,
      'http',
      { endpoint: '/api/admin/orders/:id', method: 'PATCH' }
    );
  },
};
