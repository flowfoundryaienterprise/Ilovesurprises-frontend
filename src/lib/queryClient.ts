import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Product } from '../types';

/**
 * 24-hour cache persistence key for local storage
 */
const STORAGE_KEY = 'ILOVESURPRISES_QUERY_CACHE_V2';
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Global TanStack Query Client configured for high performance e-commerce browsing.
 * - Stale Time: 15 minutes (browsing remains instantaneous across pages and tabs)
 * - GC Time: 24 hours (data stays warm in memory and persisted storage)
 * - refetchOnWindowFocus: false (avoids triggering multi-second network bursts when switching browser tabs)
 * - refetchOnReconnect: false
 * - retry: 1 (rapid fallback on transient network drop)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15 * ONE_MINUTE_MS,
      gcTime: ONE_DAY_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    },
  },
});

/**
 * Initialize persistent sync storage persister with safe quota handling.
 * Automatically persists React Query cache across browser reloads.
 */
if (typeof window !== 'undefined') {
  try {
    const persister = createSyncStoragePersister({
      storage: window.localStorage,
      key: STORAGE_KEY,
      throttleTime: 1000,
      serialize: (data) => JSON.stringify(data),
      deserialize: (str) => JSON.parse(str),
    });

    persistQueryClient({
      queryClient,
      persister,
      maxAge: ONE_DAY_MS,
      buster: 'v2.4', // Increment buster to flush old cached pagination and images
    });
  } catch (err) {
    console.warn('[TanStack Query] LocalStorage persistence unavailable, falling back to in-memory cache:', err);
  }
}

/**
 * Centralized, type-safe query key factories.
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...productKeys.lists(), params] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (slugOrId: string) => [...productKeys.details(), slugOrId?.toLowerCase()?.trim()] as const,
  collections: () => [...productKeys.all, 'collection'] as const,
  collection: (handle: string, params: Record<string, any> = {}) =>
    [...productKeys.collections(), handle?.toLowerCase()?.trim(), params] as const,
  featured: (limit = 8) => [...productKeys.all, 'featured', limit] as const,
  curatedTrending: (limit = 10) => [...productKeys.all, 'curatedTrending', limit] as const,
  related: (slugOrId: string, limit = 4) => [...productKeys.all, 'related', slugOrId?.toLowerCase()?.trim(), limit] as const,
};

/**
 * Helper to seed a product directly into TanStack Query cache.
 * Populates both slug and ID keys so navigation from any card or list is 100% instant (0ms).
 */
export function seedProductCache(product: Product): void {
  if (!product) return;
  if (product.slug) {
    queryClient.setQueryData(productKeys.detail(product.slug), product);
  }
  if (product.id) {
    queryClient.setQueryData(productKeys.detail(product.id), product);
  }
}

/**
 * Helper to get a product synchronously from the TanStack Query cache.
 */
export function getProductFromQueryCache(identifier: string): Product | null {
  if (!identifier) return null;
  const clean = identifier.toLowerCase().trim();
  const bySlug = queryClient.getQueryData<Product>(productKeys.detail(clean));
  if (bySlug) return bySlug;
  return null;
}
