import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { Product } from '../types';

/**
 * Cache persistence key. Bumped from V2 because the persisted scope changed:
 * only public catalogue data is written to storage now.
 */
const STORAGE_KEY = 'ILOVESURPRISES_QUERY_CACHE_V3';
const ONE_MINUTE_MS = 60 * 1000;
const ONE_HOUR_MS = 60 * ONE_MINUTE_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

/**
 * Query key prefixes that are safe to persist to localStorage.
 *
 * Only public, non-sensitive catalogue data qualifies. Admin, authentication,
 * affiliate, commission, and cart results are deliberately excluded: they are
 * per-user or privileged, and persisting them would leave another person's
 * data readable on a shared browser and could show a stale privileged response
 * after a role change or sign-out.
 */
const PERSISTABLE_KEY_PREFIXES = ['products', 'storefront', 'collections'];

function isPersistableQueryKey(key: readonly unknown[]): boolean {
  const root = key?.[0];
  return typeof root === 'string' && PERSISTABLE_KEY_PREFIXES.includes(root);
}

/**
 * Global TanStack Query client.
 *
 * - `staleTime` 2 minutes: browsing stays fast, while an admin catalogue or
 *   storefront edit becomes visible to shoppers within a short window instead
 *   of being hidden for 15 minutes.
 * - `refetchOnMount: 'always'` for the default: a navigation back to a page
 *   revalidates in the background while showing cached data immediately, so
 *   content is never silently stale. (Previously `false`, which meant an admin
 *   product change could stay invisible until the cache buster changed.)
 * - `refetchOnWindowFocus` stays off to avoid a request burst on tab switches.
 * - Mutations are never retried; only idempotent queries are.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * ONE_MINUTE_MS,
      gcTime: ONE_HOUR_MS,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 3000),
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Persists only the public catalogue slice of the cache, so a reload is fast
 * without storing privileged or per-user responses in localStorage.
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
      buster: 'v3.0',
      dehydrateOptions: {
        shouldDehydrateQuery: (query) =>
          query.state.status === 'success' && isPersistableQueryKey(query.queryKey),
      },
    });

    // Remove the previous unscoped cache, which held admin and auth responses.
    try {
      window.localStorage.removeItem('ILOVESURPRISES_QUERY_CACHE_V2');
    } catch {
      // Storage unavailable; nothing to clean up.
    }
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

/** Query keys for storefront (homepage) content. */
export const storefrontKeys = {
  all: ['storefront'] as const,
  config: () => [...storefrontKeys.all, 'config'] as const,
  banners: () => [...storefrontKeys.all, 'banners'] as const,
  showcase: () => [...storefrontKeys.all, 'showcase'] as const,
};

/**
 * Invalidates every cached product query after a catalogue change.
 *
 * Called when an admin creates, updates, or deletes a product so shoppers see
 * the new values on their next render rather than waiting out the stale time.
 */
export async function invalidateProductCaches(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: productKeys.all });
}

/** Invalidates homepage/storefront content after an admin content save. */
export async function invalidateStorefrontCaches(): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: storefrontKeys.all });
}

/**
 * Drops the persisted catalogue cache entirely.
 *
 * Used on sign-out so nothing a previous session fetched is carried into the
 * next one on a shared browser.
 */
export function clearPersistedQueryCache(): void {
  queryClient.clear();
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable.
  }
}

/**
 * Keeps the query cache in step with server-side changes.
 *
 * `ils_catalog_updated` and `ils_storefront_updated` are emitted only after
 * the backend has confirmed a mutation, so invalidating here means a
 * confirmed admin edit propagates to the storefront without a rebuild.
 */
if (typeof window !== 'undefined') {
  window.addEventListener('ils_catalog_updated', () => {
    void invalidateProductCaches();
  });
  window.addEventListener('ils_storefront_updated', () => {
    void invalidateStorefrontCaches();
  });
}
