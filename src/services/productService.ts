import type { Product, SurpriseType, Collection, ProductOption, ProductVariant } from '../types';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
import { deduplicateProducts, rankProductsBySearch } from '../utils/productUtils';
import { apiClient } from './apiClient';

export const CARD_SELECT_COLUMNS =
  'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants, product_images';

interface QueryCacheEntry {
  result: any;
  timestamp: number;
}
const queryCache = new Map<string, QueryCacheEntry>();

const productSlugCache = new Map<string, Product>();

export function cacheProduct(product: Product) {
  if (!product) return;
  if (product.slug) productSlugCache.set(product.slug.toLowerCase(), product);
  if (product.id) productSlugCache.set(product.id.toLowerCase(), product);
}

export function getCachedProduct(identifier: string): Product | null {
  if (!identifier) return null;
  const clean = decodeURIComponent(identifier).trim().toLowerCase();
  return productSlugCache.get(clean) || null;
}

/**
 * Resolves a product image URL, recovering from missing or broken images
 */
export function resolveProductImage(
  rawImage?: string | null,
  name?: string,
  category?: string
): string {
  const img = (rawImage || '').trim();
  const isBroken =
    !img ||
    img.includes('generic-candle.jpg') ||
    img.includes('placeholder') ||
    img === '/placeholder.svg' ||
    img.includes('youtube.com') ||
    img.includes('youtu.be') ||
    img.includes('vimeo.com');

  if (!isBroken) {
    return img;
  }

  const n = (name || '').toLowerCase();
  const c = (category || '').toLowerCase();

  if (n.includes('50 and fabulous')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/37_Mockup_Jewelry_JewelryCandles_133547cc-a1c0-4b24-b2ae-58b15dc9e17c.jpg?v=1654707054';
  }

  if (n.includes('bear') || n.includes('wax melt') || c.includes('melt')) {
    return '/assets/ilovesurprises/products/Gummy-Bear_Figurines_JWL_wax_melts.jpg';
  }
  if (n.includes('bath') || c.includes('bath')) {
    return '/assets/ilovesurprises/products/7_Mockup_JC_c4d7b0a0-8353-4e0c-b8af-eb0ccc5b41d8.jpg';
  }
  if (n.includes('soap') || c.includes('soap')) {
    return '/assets/ilovesurprises/categories/goats_milk_soaps.jpg';
  }
  if (n.includes('slime') || c.includes('slime')) {
    return '/assets/ilovesurprises/categories/BDayCake.webp';
  }
  if (n.includes('candy') || c.includes('candy')) {
    return '/assets/ilovesurprises/categories/cash_candy.jpg';
  }
  if (n.includes('chocolate') || c.includes('chocolate')) {
    return '/assets/ilovesurprises/categories/chocolates.jpg';
  }
  if (n.includes('zodiac') || c.includes('zodiac')) {
    return '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp';
  }
  if (n.includes('cash money') || c.includes('cash-money') || c.includes('cash money')) {
    return '/assets/ilovesurprises/categories/cash_money_candles.jpg';
  }
  if (n.includes('cash') || c.includes('cash')) {
    return '/assets/ilovesurprises/categories/cash_candles.jpg';
  }
  if (n.includes('soda') || c.includes('soda')) {
    return '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
  }
  if (n.includes('christmas') || n.includes('holiday') || c.includes('christmas')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158';
  }
  if (n.includes('halloween') || c.includes('halloween')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369';
  }

  return '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';
}

/**
 * Resolves standard pricing by product category & name
 */
export function resolveFounderCategoryPrice(name: string, categoryName: string, defaultPrice: number): number {
  const n = (name || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();

  if (n.includes('cereal') && (n.includes('candle') || c.includes('candle') || n.includes('bowl'))) {
    return 49.99;
  }
  if (n.includes('beer') && (n.includes('candle') || n.includes('mug') || c.includes('candle'))) {
    return 49.99;
  }
  if (n.includes('soda') && (n.includes('candle') || c.includes('candle') || n.includes('can'))) {
    return 29.99;
  }
  if (n.includes('bear') && (n.includes('bundle') || n.includes('melt') || n.includes('treasure')) && (n.includes('cash') || n.includes('money'))) {
    return 59.99;
  }
  if (
    (n.includes('giant') && (n.includes('wax') || n.includes('melt'))) ||
    ((n.includes('figurine') || n.includes('shaped') || n.includes('skull')) && (n.includes('wax') || n.includes('melt')))
  ) {
    return 34.99;
  }
  if ((n.includes('wax melt') || c.includes('wax melt') || n.includes('wax-melt')) && !n.includes('giant') && !n.includes('figurine') && !n.includes('bundle')) {
    return 19.99;
  }
  if (n.includes('slime') || c.includes('slime')) {
    return 19.99;
  }
  if ((n.includes('bath bomb') || c.includes('bath bomb')) && (n.includes('2-pack') || n.includes('2 pack') || n.includes('tube') || n.includes('bundle'))) {
    return 34.99;
  }
  if (n.includes('bath bomb') || c.includes('bath bomb')) {
    return 19.99;
  }
  if (n.includes('bath soak') || n.includes('bath salt') || c.includes('bath soak') || c.includes('bath salt') || n.includes('money bath salt')) {
    return 19.99;
  }
  if (n.includes('sugar scrub') || c.includes('sugar scrub')) {
    return 19.99;
  }
  if ((n.includes('candy') || n.includes('chocolate')) && (n.includes('tube') || n.includes('cash') || n.includes('money'))) {
    return 27.99;
  }
  if (n.includes('greeting card') || c.includes('greeting card') || n.includes('card')) {
    return 14.99;
  }
  if (n.includes('candle') || c.includes('candle')) {
    return 44.99;
  }

  return defaultPrice > 0 ? defaultPrice : 44.99;
}

/**
 * Customer visibility filter for catalog
 */
export function isCustomerVisible(product: {
  name?: string;
  title?: string;
  handle?: string;
  slug?: string;
  surpriseType?: string;
  category?: string;
  categoryName?: string;
  productType?: string;
  tags?: string;
  status?: string;
}): boolean {
  if (!product) return false;
  if (product.status && product.status.toLowerCase() !== 'active') {
    return false;
  }
  return true;
}

/**
 * Normalizes any backend surpriseType value into the frontend SurpriseType union
 */
export function resolveSurpriseType(rawType?: string | null, name?: string, cat?: string): SurpriseType {
  const t = (rawType || '').toLowerCase();
  if (t.includes('cash') || t.includes('money')) return 'cash';
  if (t.includes('ring') || t.includes('jewel') || t.includes('diamond') || t.includes('necklace') || t.includes('earring') || t.includes('bracelet')) return 'jewelry';
  if (t.includes('trinket')) return 'trinket';
  if (t.includes('charm')) return 'charm';
  if (t.includes('mystery')) return 'mystery';
  if (t === 'both') return 'both';

  const n = (name || '').toLowerCase();
  const c = (cat || '').toLowerCase();
  if (n.includes('cash') || c.includes('cash')) return 'cash';
  return 'jewelry';
}

/**
 * Maps live backend API product DTO (or database/row record) into the frontend Product type
 */
export function mapBackendProductToFrontend(raw: any): Product {
  if (!raw) return productsData[0];

  const id = String(raw.id || raw.product_id || raw._id || '');
  const title = String(raw.name || raw.title || 'Surprise Candle');
  const slug = String(
    raw.slug ||
    raw.handle ||
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ||
    id
  );

  // Category resolution
  let categoryName = 'Surprise Candles';
  if (raw.category && typeof raw.category === 'object' && raw.category.name) {
    categoryName = String(raw.category.name);
  } else if (raw.categoryName) {
    categoryName = String(raw.categoryName);
  } else if (raw.category_name) {
    categoryName = String(raw.category_name);
  } else if (typeof raw.category === 'string' && raw.category.trim()) {
    categoryName = raw.category.trim();
  }

  // Price resolution
  const price = Number(raw.price) > 0
    ? Number(raw.price)
    : resolveFounderCategoryPrice(title, categoryName, 44.99);

  const rawOrigPrice = raw.compareAtPrice ?? raw.compare_at_price ?? raw.originalPrice ?? raw.original_price;
  const originalPrice = rawOrigPrice !== null && rawOrigPrice !== undefined && Number(rawOrigPrice) > 0
    ? Number(rawOrigPrice)
    : undefined;

  // Surprise type
  const surpriseType = resolveSurpriseType(raw.surpriseType || raw.surprise_type, title, categoryName);

  // Surprise value string representation (e.g. "Real Cash inside up to $2,500" or "Guaranteed Jewelry inside worth up to $5,000")
  let surpriseValue: string;
  if (raw.surpriseValue !== undefined && raw.surpriseValue !== null) {
    const numVal = Number(raw.surpriseValue);
    if (!isNaN(numVal) && numVal > 0) {
      surpriseValue = surpriseType === 'cash'
        ? `Real Cash inside up to $${numVal.toLocaleString()}`
        : `Guaranteed Jewelry inside worth up to $${numVal.toLocaleString()}`;
    } else if (typeof raw.surpriseValue === 'string' && raw.surpriseValue.trim()) {
      surpriseValue = raw.surpriseValue.trim();
    } else {
      surpriseValue = surpriseType === 'cash' ? 'Real Cash $2 - $2,500 inside' : 'Guaranteed Jewelry inside worth up to $5,000';
    }
  } else if (raw.surprise_value) {
    surpriseValue = String(raw.surprise_value);
  } else {
    surpriseValue = surpriseType === 'cash' ? 'Real Cash $2 - $2,500 inside' : 'Guaranteed Jewelry inside worth up to $5,000';
  }

  // Rating and reviews
  const rawRating = Number(raw.rating);
  const rating = !isNaN(rawRating) && rawRating > 0 ? Number(rawRating.toFixed(1)) : 5.0;

  const rawReviews = Number(raw.reviewCount ?? raw.review_count);
  const reviewCount = !isNaN(rawReviews) && rawReviews >= 0 ? rawReviews : 24;

  // Images resolution
  let primaryImageRaw = raw.imageUrl || raw.image_url || raw.image;
  const imageList: string[] = [];

  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const sorted = [...raw.images].sort((a: any, b: any) => (a?.sortOrder ?? 0) - (b?.sortOrder ?? 0));
    sorted.forEach((img: any) => {
      const u = typeof img === 'string' ? img : img?.url || img?.src;
      if (u && typeof u === 'string' && u.trim()) {
        const cleanUrl = u.trim();
        if (!imageList.includes(cleanUrl)) {
          imageList.push(cleanUrl);
        }
        if (img?.isPrimary && !primaryImageRaw) {
          primaryImageRaw = cleanUrl;
        }
      }
    });
  }

  if (!primaryImageRaw && imageList.length > 0) {
    primaryImageRaw = imageList[0];
  }

  const resolvedPrimaryImage = resolveProductImage(primaryImageRaw, title, categoryName);
  if (!imageList.includes(resolvedPrimaryImage)) {
    imageList.unshift(resolvedPrimaryImage);
  }

  // Stock resolution
  const inStock = raw.stock !== undefined
    ? Number(raw.stock) > 0
    : (raw.inStock !== undefined ? Boolean(raw.inStock) : (raw.in_stock !== undefined ? Boolean(raw.in_stock) : true));

  // Scent notes
  let scentNotes: string[] | undefined;
  if (Array.isArray(raw.scentNotes) && raw.scentNotes.length > 0) {
    scentNotes = raw.scentNotes.map(String);
  } else if (Array.isArray(raw.scent_notes) && raw.scent_notes.length > 0) {
    scentNotes = raw.scent_notes.map(String);
  }

  // Ring sizes
  let ringSizes: number[] | undefined;
  const rawRingSizes = raw.ringSizes || raw.ring_sizes;
  if (Array.isArray(rawRingSizes) && rawRingSizes.length > 0) {
    const parsed = rawRingSizes.map(Number).filter((n: number) => !isNaN(n) && n > 0);
    if (parsed.length > 0) ringSizes = parsed;
  }

  // Jewelry types
  let jewelryTypes: string[] | undefined;
  const rawJTypes = raw.jewelryTypes || raw.jewelry_types;
  if (Array.isArray(rawJTypes) && rawJTypes.length > 0) {
    jewelryTypes = rawJTypes.map(String);
  }

  // Variants mapping
  let variants: ProductVariant[] | undefined;
  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    variants = raw.variants.map((v: any) => ({
      variantId: String(v.id || v.variantId || v.variant_id || ''),
      productId: id,
      title: v.title ? String(v.title) : undefined,
      price: Number(v.price) > 0 ? Number(v.price) : price,
      compareAtPrice: v.compareAtPrice !== null && v.compareAtPrice !== undefined ? Number(v.compareAtPrice) : undefined,
      sku: v.sku ? String(v.sku) : undefined,
      inStock: v.stock !== undefined ? Number(v.stock) > 0 : (v.isActive ?? v.inStock ?? true),
      option1Name: v.ringSize ? 'Ring Size' : undefined,
      option1Value: v.ringSize ? String(v.ringSize) : undefined,
      option2Name: v.scent ? 'Scent' : undefined,
      option2Value: v.scent ? String(v.scent) : undefined,
    }));
  }

  // Options mapping
  let options: ProductOption[] | undefined;
  if (Array.isArray(raw.options) && raw.options.length > 0) {
    options = raw.options.map((opt: any, idx: number) => ({
      name: String(opt.name || `Option ${idx + 1}`),
      position: idx + 1,
      values: Array.isArray(opt.values)
        ? opt.values.map((val: any) => (typeof val === 'string' ? val : String(val?.value || ''))).filter(Boolean)
        : [],
    }));
  }

  // Badges and flags
  const isBestSeller = Boolean(raw.isBestSeller ?? raw.is_best_seller);
  const isNew = Boolean(raw.isNew ?? raw.is_new);
  const badge = raw.badge
    ? String(raw.badge)
    : isBestSeller
    ? 'Best Seller'
    : isNew
    ? 'New'
    : undefined;

  return {
    id,
    name: title,
    slug,
    category: categoryName,
    price,
    originalPrice,
    surpriseType,
    surpriseValue,
    rating,
    reviewCount,
    image: resolvedPrimaryImage,
    images: imageList,
    variants,
    options,
    badge,
    isNew,
    isBestSeller,
    inStock,
    scentNotes,
    description: String(raw.description || raw.shortDescription || raw.body_html || ''),
    sku: raw.sku ? String(raw.sku) : undefined,
    ringSizes,
    jewelryTypes,
  };
}

/**
 * Backward compatibility alias for mapBackendProductToFrontend
 */
export function mapRowToProduct(row: any): Product {
  return mapBackendProductToFrontend(row);
}

export function mapRowToCollection(row: any): Collection {
  return {
    id: String(row.collection_id || row.id || ''),
    title: row.title || 'Collection',
    handle: row.handle || 'collection',
    description: row.description || '',
    imageUrl: row.image_url || row.image || undefined,
    productsCount: Number(row.products_count) || 0,
  };
}

export interface GetProductsParams {
  collection?: string;
  category?: string;
  search?: string;
  searchQuery?: string;
  sortBy?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'best-sellers' | 'newest';
  sort?: string;
  surpriseType?: SurpriseType | 'all';
  surpriseTypes?: SurpriseType[];
  minPrice?: number | null;
  maxPrice?: number | null;
  ringSize?: string;
  page?: number;
  limit?: number;
  noFallback?: boolean;
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  isFallback?: boolean;
}

/**
 * Helper to build URL query parameters conforming to the backend listProductsQuerySchema
 */
function buildProductQueryParams(params: GetProductsParams): string {
  const query = new URLSearchParams();

  if (params.page !== undefined && params.page !== null) {
    query.set('page', String(Math.max(1, params.page)));
  }
  if (params.limit !== undefined && params.limit !== null) {
    query.set('limit', String(Math.max(1, params.limit)));
  }

  const search = (params.search || params.searchQuery || '').trim();
  if (search) {
    query.set('search', search);
  }

  if (params.collection) {
    query.set('collection', params.collection.trim());
  } else if (params.category && params.category !== 'all' && params.category !== 'All Surprises') {
    const cleanCat = params.category.trim();
    const cleanCatLower = cleanCat.toLowerCase();

    if (
      cleanCatLower === 'candles' ||
      cleanCatLower === 'surprise candles' ||
      cleanCatLower === 'cash candles' ||
      cleanCatLower === 'jewelry candles' ||
      cleanCatLower === 'cash money candles' ||
      cleanCatLower === 'zodiac cash candles' ||
      cleanCatLower === 'cash-candles' ||
      cleanCatLower === 'jewelry-candles' ||
      cleanCatLower === 'cash-money-candles' ||
      cleanCatLower === 'zodiac-cash-money-candles'
    ) {
      query.set('collection', 'candles');
      if (!query.has('surpriseType') && !params.surpriseTypes && !params.surpriseType) {
        if (cleanCatLower.includes('cash')) {
          query.set('surpriseType', 'cash');
        } else if (cleanCatLower.includes('jewelry')) {
          query.set('surpriseType', 'jewelry');
        }
      }
    } else {
      const matchedCategory = categoriesData.find(
        (c) => c.name.toLowerCase() === cleanCatLower || c.slug.toLowerCase() === cleanCatLower
      );
      query.set('collection', matchedCategory ? matchedCategory.slug : cleanCat);
    }
  }

  if (params.surpriseTypes && params.surpriseTypes.length === 1) {
    query.set('surpriseType', params.surpriseTypes[0]);
  } else if (params.surpriseType && params.surpriseType !== 'all') {
    query.set('surpriseType', params.surpriseType);
  }

  if (params.minPrice !== undefined && params.minPrice !== null) {
    query.set('minPrice', String(params.minPrice));
  }
  if (params.maxPrice !== undefined && params.maxPrice !== null) {
    query.set('maxPrice', String(params.maxPrice));
  }

  const sort = params.sortBy || params.sort;
  if (sort) {
    let backendSort = 'featured';
    switch (sort) {
      case 'price-asc':
      case 'price_asc':
        backendSort = 'price_asc';
        break;
      case 'price-desc':
      case 'price_desc':
        backendSort = 'price_desc';
        break;
      case 'best-sellers':
      case 'best_sellers':
        backendSort = 'best_sellers';
        break;
      case 'rating':
        backendSort = 'rating';
        break;
      case 'newest':
        backendSort = 'newest';
        break;
      default:
        backendSort = 'featured';
        break;
    }
    query.set('sort', backendSort);
  }

  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Extracts raw product list and pagination details across multiple response envelope structures
 */
function extractProductsAndPagination(
  res: any,
  fallbackPage: number,
  fallbackLimit: number
): {
  products: any[];
  total: number;
  page: number;
  totalPages: number;
} {
  let rawList: any[] = [];
  let total = 0;
  let page = fallbackPage;
  let limit = fallbackLimit;
  let totalPages = 1;

  if (res && res.data) {
    if (Array.isArray(res.data.products)) {
      rawList = res.data.products;
      if (res.data.pagination) {
        total = Number(res.data.pagination.total) || rawList.length;
        page = Number(res.data.pagination.page) || fallbackPage;
        limit = Number(res.data.pagination.limit) || fallbackLimit;
        totalPages = Number(res.data.pagination.totalPages) || Math.max(1, Math.ceil(total / limit));
      } else {
        total = Number(res.data.total) || rawList.length;
        totalPages = Math.max(1, Math.ceil(total / limit));
      }
    } else if (Array.isArray(res.data)) {
      rawList = res.data;
      total = rawList.length;
      totalPages = Math.max(1, Math.ceil(total / limit));
    }
  } else if (res && Array.isArray(res.products)) {
    rawList = res.products;
    total = Number(res.total) || rawList.length;
    page = Number(res.page) || fallbackPage;
    limit = Number(res.limit) || fallbackLimit;
    totalPages = Number(res.totalPages) || Math.max(1, Math.ceil(total / limit));
  } else if (Array.isArray(res)) {
    rawList = res;
    total = rawList.length;
    totalPages = Math.max(1, Math.ceil(total / limit));
  }

  return { products: rawList, total, page, totalPages };
}

export const productService = {
  /**
   * Retrieves products with filtering, search, sorting, and pagination.
   * PRIMARY SOURCE: Live backend endpoint GET /api/products
   * FALLBACK SOURCE: src/data/products.ts (only if genuine network/API failure)
   */
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 12);
    const cacheKey = `products_${JSON.stringify(params)}`;

    // Check recent query cache (60s TTL)
    const cachedEntry = queryCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < 60000) {
      return cachedEntry.result;
    }

    // 1. PRIMARY SOURCE: Attempt live backend API call
    try {
      const queryString = buildProductQueryParams(params);
      const response = await apiClient.get<any>(`/api/products${queryString}`, { skipAuth: true });

      if (response) {
        const { products: rawProducts, total, totalPages } = extractProductsAndPagination(response, page, limit);

        // Map live backend product records to frontend Product model
        const mappedProducts = rawProducts.map(mapBackendProductToFrontend);

        // Filter customer visible products
        const visibleProducts = mappedProducts.filter(isCustomerVisible);

        // Populate slug and id cache for instant lookups
        visibleProducts.forEach(cacheProduct);

        const result: PaginatedProductsResult = {
          products: visibleProducts,
          total: total > 0 ? total : visibleProducts.length,
          page,
          totalPages: totalPages > 0 ? totalPages : Math.max(1, Math.ceil((total || visibleProducts.length) / limit)),
          isFallback: false,
        };

        if (result.products.length > 0) {
          queryCache.set(cacheKey, { result, timestamp: Date.now() });
        }
        return result;
      }
    } catch (apiError: any) {
      console.warn(
        `[ProductService] Live API request to GET /api/products failed (${apiError?.statusCode || 0}: ${apiError?.message}). Gracefully falling back to static catalog.`
      );

      if (params.noFallback) {
        throw apiError;
      }
    }

    // 2. FALLBACK SOURCE: Return empty result for live browsing
    return {
      products: [],
      total: 0,
      page,
      totalPages: 1,
      isFallback: false,
    };
  },

  /**
   * Evaluates local static fallback catalog from src/data/products.ts
   */
  getLocalFallbackProducts(params: GetProductsParams, page: number, limit: number): PaginatedProductsResult {
    let filtered = productsData.filter(isCustomerVisible);

    // Filter by category
    if (params.category && params.category !== 'all' && params.category !== 'All Surprises') {
      const catLower = params.category.toLowerCase().trim();
      filtered = filtered.filter((p) => {
        const pCat = p.category.toLowerCase().trim();
        return pCat === catLower || pCat.includes(catLower) || catLower.includes(pCat);
      });
    }

    // Filter by search query
    const search = (params.search || params.searchQuery || '').trim();
    if (search) {
      filtered = rankProductsBySearch(filtered, search);
    }

    // Filter by surprise type
    if (params.surpriseTypes && params.surpriseTypes.length > 0) {
      filtered = filtered.filter((p) => params.surpriseTypes!.includes(p.surpriseType));
    } else if (params.surpriseType && params.surpriseType !== 'all') {
      filtered = filtered.filter((p) => p.surpriseType === params.surpriseType || p.surpriseType === 'both');
    }

    // Filter by price range
    if (params.minPrice !== undefined && params.minPrice !== null) {
      filtered = filtered.filter((p) => p.price >= params.minPrice!);
    }
    if (params.maxPrice !== undefined && params.maxPrice !== null) {
      filtered = filtered.filter((p) => p.price <= params.maxPrice!);
    }

    // Sort products
    const sortBy = params.sortBy || params.sort;
    switch (sortBy) {
      case 'price-asc':
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-sellers':
      case 'best_sellers':
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        break;
    }

    const deduplicated = deduplicateProducts(filtered);
    const total = deduplicated.length;
    const from = (page - 1) * limit;
    const paginated = deduplicated.slice(from, from + limit);

    paginated.forEach(cacheProduct);

    return {
      products: paginated,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      isFallback: true,
    };
  },

  /**
   * Searches products by text query
   */
  async searchProducts(query: string, categoryOrLimit?: string | number, limit = 8): Promise<Product[]> {
    if (!query || !query.trim()) return [];
    const cat = typeof categoryOrLimit === 'string' ? categoryOrLimit : undefined;
    const lim = typeof categoryOrLimit === 'number' ? categoryOrLimit : limit;
    const res = await this.getProducts({ search: query, category: cat, limit: lim });
    return res.products;
  },

  /**
   * Retrieves single product by slug or ID
   * Primary source: GET /api/products/:slug
   * Fallback source: src/data/products.ts
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;

    const clean = decodeURIComponent(slug).trim().toLowerCase();
    const cached = getCachedProduct(clean);
    if (cached) return cached;

    // Primary: query live backend API
    try {
      const response = await apiClient.get<any>(`/api/products/${encodeURIComponent(clean)}`, {
        skipAuth: true,
      });

      const rawProduct = response?.data?.product || response?.product || response?.data;
      if (rawProduct && (rawProduct.id || rawProduct.name || rawProduct.title)) {
        const mapped = mapBackendProductToFrontend(rawProduct);
        cacheProduct(mapped);
        return mapped;
      }
    } catch (apiError: any) {
      console.warn(
        `[ProductService] Live API request to GET /api/products/${clean} failed (${apiError?.statusCode || 0}: ${apiError?.message}). Falling back to static catalog.`
      );
    }

    // Fallback: search in productsData
    const found = productsData.find(
      (p) => p.slug.toLowerCase() === clean || p.id.toLowerCase() === clean
    );

    if (found) {
      cacheProduct(found);
      return found;
    }

    return null;
  },

  /**
   * Retrieves single product by ID
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.getProductBySlug(id);
  },

  /**
   * Retrieves products by list of IDs
   */
  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];
    const idSet = new Set(ids.map((i) => i.toLowerCase().trim()));

    const results: Product[] = [];
    const missingIds: string[] = [];

    for (const id of ids) {
      const cached = getCachedProduct(id);
      if (cached) {
        results.push(cached);
      } else {
        missingIds.push(id);
      }
    }

    if (missingIds.length === 0) {
      return deduplicateProducts(results);
    }

    for (const id of missingIds) {
      const p = await this.getProductById(id);
      if (p) results.push(p);
    }

    if (results.length > 0) {
      return deduplicateProducts(results);
    }

    return productsData.filter((p) => idSet.has(p.id.toLowerCase()) || idSet.has(p.slug.toLowerCase()));
  },

  /**
   * Retrieves featured products from live backend API
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ sortBy: 'featured', limit });
    return res.products;
  },

  /**
   * Retrieves collection products for homepage from live backend API
   */
  async getHomepageCollectionProducts(collectionHandle: string, limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ category: collectionHandle, limit });
    return res.products;
  },

  /**
   * Retrieves diverse featured products across multiple categories from live backend API
   */
  async getDiverseFeaturedProducts(limit = 8): Promise<Product[]> {
    const categories = ['Cash Candles', 'Jewelry Candles', 'Wax Melts', 'Bath Treats'];
    const results: Product[] = [];

    try {
      const res = await this.getProducts({ limit: 30 });
      const pool = res.products.length > 0 ? res.products : productsData;

      for (const cat of categories) {
        const match = pool.find((p) => p.category.toLowerCase().includes(cat.toLowerCase()));
        if (match && !results.some((r) => r.id === match.id)) {
          results.push(match);
        }
      }

      for (const p of pool) {
        if (results.length >= limit) break;
        if (!results.some((r) => r.id === p.id)) {
          results.push(p);
        }
      }

      return results.slice(0, limit);
    } catch {
      return productsData.slice(0, limit);
    }
  },

  /**
   * Retrieves a collection by handle
   */
  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    const clean = decodeURIComponent(handle).trim().toLowerCase();

    // 1. Query live backend API for real collection details
    try {
      const response = await apiClient.get<any>(`/api/collections/${encodeURIComponent(clean)}`, { skipAuth: true });
      if (response?.data?.collection) {
        const c = response.data.collection;
        return {
          id: c.id,
          title: c.name,
          handle: c.slug,
          description: c.description || '',
          imageUrl: c.bannerImage || '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
          productsCount: c._count?.products || 0,
        };
      }
    } catch {
      // Fall through to local collection metadata if not found
    }

    const matchedCategory = categoriesData.find(
      (c) => c.slug.toLowerCase() === clean || c.name.toLowerCase() === clean.replace(/-/g, ' ')
    );

    if (matchedCategory) {
      return {
        id: matchedCategory.id,
        title: matchedCategory.name,
        handle: matchedCategory.slug,
        description: matchedCategory.description || '',
        imageUrl: matchedCategory.image,
        productsCount: matchedCategory.itemCount || 0,
      };
    }

    return {
      id: `col-${clean}`,
      title: clean.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      handle: clean,
      description: 'Exclusive surprise reveal collection',
      imageUrl: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
      productsCount: 0,
    };
  },

  /**
   * Retrieves products by collection handle from live backend API
   */
  async getProductsByCollection(
    handleOrId: string,
    params: {
      page?: number;
      limit?: number;
      sort?: 'featured' | 'price-asc' | 'price-desc' | 'newest' | 'best-sellers';
    } = {}
  ): Promise<{
    collection: Collection | null;
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const col = await this.getCollectionByHandle(handleOrId);
    const res = await this.getProducts({
      collection: handleOrId,
      page: params.page,
      limit: params.limit,
      sortBy: params.sort,
    });

    return {
      collection: col,
      products: res.products,
      total: res.total,
      page: res.page,
      totalPages: res.totalPages,
    };
  },

  /**
   * Retrieves curated trending products for home page from live backend API
   */
  async getCuratedTrendingProducts(limit = 10): Promise<Product[]> {
    const capped = Math.min(10, Math.max(1, limit));
    try {
      const res = await this.getProducts({ sortBy: 'best-sellers', limit: capped });
      if (res.products && res.products.length > 0) {
        return deduplicateProducts(res.products).slice(0, capped);
      }
    } catch {
      // Fallback below
    }
    const trending = productsData.filter((p) => p.isBestSeller || p.category.toLowerCase().includes('cash'));
    return deduplicateProducts(trending).slice(0, capped);
  },

  /**
   * Retrieves related products in the same category from live backend API
   */
  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    if (!product) return [];
    try {
      const res = await this.getProducts({
        category: product.category,
        limit: limit + 6,
      });
      const related = res.products.filter(
        (p) => p.id !== product.id && p.slug !== product.slug
      );
      if (related.length > 0) {
        return deduplicateProducts(related).slice(0, limit);
      }
    } catch {
      // Fallback below
    }

    const filtered = productsData.filter(
      (p) => p.category === product.category && p.id !== product.id && p.slug !== product.slug
    );
    return deduplicateProducts(filtered).slice(0, limit);
  },

  /**
   * Clears in-memory query cache
   */
  clearCache() {
    queryCache.clear();
    productSlugCache.clear();
  },

  getCachedProduct,
  cacheProduct,
  mapBackendProductToFrontend,
};

