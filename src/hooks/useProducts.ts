import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback } from 'react';
import { productService, type GetProductsParams } from '../services/productService';
import { productKeys, seedProductCache } from '../lib/queryClient';
import type { Product, Collection } from '../types';

/**
 * Hook to fetch paginated products with automatic TanStack Query caching and filter synchronization.
 */
export function useProducts(params: GetProductsParams = {}) {
  const query = useQuery({
    queryKey: productKeys.list(params as any),
    queryFn: async () => {
      const result = await productService.getProducts(params);
      // Automatically seed individual products into the detail cache
      if (result?.products?.length) {
        result.products.forEach((p) => {
          seedProductCache(p);
          productService.cacheProduct(p);
        });
      }
      return result;
    },
    placeholderData: keepPreviousData, // Keeps previous page data while new page loads, eliminating UI flicker
    staleTime: 10 * 60 * 1000, // 10 minutes fresh
  });

  return {
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? params.page ?? 1,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch a single product by handle/slug or database ID.
 * Features instant initial display if the product exists in the query cache or local catalog.
 */
export function useProductBySlug(slug: string | null | undefined) {
  const cleanSlug = (slug || '').toLowerCase().trim();

  return useQuery({
    queryKey: productKeys.detail(cleanSlug),
    queryFn: async () => {
      if (!cleanSlug) return null;
      const product = await productService.getProductBySlug(cleanSlug);
      if (product) {
        seedProductCache(product);
      }
      return product;
    },
    enabled: Boolean(cleanSlug),
    staleTime: 30 * 60 * 1000, // 30 minutes
    initialData: () => {
      if (!cleanSlug) return undefined;
      // Instant cache hit check
      const cached = productService.getCachedProduct(cleanSlug);
      return cached || undefined;
    },
  });
}

export interface UseProductsByCollectionParams {
  page?: number;
  limit?: number;
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'best-sellers';
}

export interface CollectionQueryResult {
  collection: Collection | null;
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Hook to fetch products by collection handle (e.g. 'jewelry-candles', 'cash-candles').
 * Delivers instant (0ms) render from cache on repeated visits, and smoothly handles pagination.
 */
export function useProductsByCollection(
  handleOrId: string | null | undefined,
  params: UseProductsByCollectionParams = {}
) {
  const cleanHandle = (handleOrId || '').toLowerCase().trim();

  const query = useQuery({
    queryKey: productKeys.collection(cleanHandle, params as any),
    queryFn: async (): Promise<CollectionQueryResult> => {
      if (!cleanHandle) {
        return {
          collection: null,
          products: [],
          total: 0,
          page: params.page || 1,
          totalPages: 1,
        };
      }
      const result = await productService.getProductsByCollection(cleanHandle, params);
      // Automatically seed all returned products into detail cache for 0ms PDP navigation
      if (result?.products?.length) {
        result.products.forEach((p) => {
          seedProductCache(p);
          productService.cacheProduct(p);
        });
      }
      return result;
    },
    enabled: Boolean(cleanHandle),
    placeholderData: keepPreviousData,
    staleTime: 15 * 60 * 1000, // 15 minutes fresh
  });

  return {
    collection: query.data?.collection ?? null,
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? params.page ?? 1,
    totalPages: query.data?.totalPages ?? 1,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

/**
 * Hook to retrieve featured bestseller products for homepage and header search.
 */
export function useFeaturedProducts(limit = 8) {
  return useQuery({
    queryKey: productKeys.featured(limit),
    queryFn: async () => {
      const items = await productService.getFeaturedProducts(limit);
      items.forEach((p) => {
        seedProductCache(p);
        productService.cacheProduct(p);
      });
      return items;
    },
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to retrieve curated trending products for the homepage.
 */
export function useCuratedTrendingProducts(limit = 10) {
  return useQuery({
    queryKey: productKeys.curatedTrending(limit),
    queryFn: async () => {
      const items = await productService.getCuratedTrendingProducts(limit);
      items.forEach((p) => {
        seedProductCache(p);
        productService.cacheProduct(p);
      });
      return items;
    },
    staleTime: 15 * 60 * 1000,
  });
}

/**
 * Hook to retrieve related products for PDP.
 */
export function useRelatedProducts(product: Product | null | undefined, limit = 4) {
  return useQuery({
    queryKey: productKeys.related(product?.slug || product?.id || '', limit),
    queryFn: async () => {
      if (!product) return [];
      const items = await productService.getRelatedProducts(product, limit);
      items.forEach((p) => {
        seedProductCache(p);
        productService.cacheProduct(p);
      });
      return items;
    },
    enabled: Boolean(product),
    staleTime: 20 * 60 * 1000,
  });
}

/**
 * Hook providing a background prefetch utility.
 * Use on mouseEnter / hover over product cards or collection links
 * to eliminate all loading lag prior to user click.
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  const prefetchProduct = useCallback(
    (slugOrId: string | null | undefined) => {
      if (!slugOrId) return;
      const clean = slugOrId.toLowerCase().trim();
      const existing = queryClient.getQueryData(productKeys.detail(clean));
      if (existing) return;

      queryClient.prefetchQuery({
        queryKey: productKeys.detail(clean),
        queryFn: async () => {
          const prod = await productService.getProductBySlug(clean);
          if (prod) {
            seedProductCache(prod);
          }
          return prod;
        },
        staleTime: 30 * 60 * 1000,
      });
    },
    [queryClient]
  );

  return { prefetchProduct };
}
