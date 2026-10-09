import { apiClient } from './apiClient';
import type { Product, SurpriseType, Collection, ProductVariant, ProductOption } from '../types';
import { categoriesData } from '../data/categories';
import { deduplicateProducts, rankProductsBySearch } from '../utils/productUtils';
import { productsData } from '../data/products';
import { getApprovedCollectionMeta } from '../data/approvedCollectionsData';

/**
 * Authoritative production Supabase catalog query columns (retained for backward compatibility).
 */
export const CARD_SELECT_COLUMNS =
  'product_id, handle, title, body_html, total_inventory_qty, category_name, product_variants(variant_id, price, compare_at_price, sku, option1_name, option1_value, option2_name, option2_value, option3_name, option3_value), product_images(image_url, position, alt_text)';

/**
 * In-memory LRU/TTL Query Cache to deliver instant (< 5ms) responses on repeated queries,
 * tab switching, pagination back-and-forth, and filter toggles.
 */
interface QueryCacheEntry {
  result: any;
  timestamp: number;
}
const queryCache = new Map<string, QueryCacheEntry>();
const QUERY_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * In-memory single product cache by slug & ID for instant product details navigation.
 */
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
 * Resolves a product image URL, automatically recovering from 404s, generic Shopify placeholders,
 * or missing image fields by selecting the authentic category or product mockup.
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

  // Special match for "50 and fabulous" series
  if (n.includes('50 and fabulous')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/37_Mockup_Jewelry_JewelryCandles_133547cc-a1c0-4b24-b2ae-58b15dc9e17c.jpg?v=1654707054';
  }

  // Wax Melts / Bear Melts
  if (n.includes('bear') || n.includes('wax melt') || c.includes('melt')) {
    return '/assets/ilovesurprises/products/Gummy-Bear_Figurines_JWL_wax_melts.jpg';
  }
  // Bath & Body / Bath Bombs
  if (n.includes('bath') || c.includes('bath')) {
    return '/assets/ilovesurprises/products/7_Mockup_JC_c4d7b0a0-8353-4e0c-b8af-eb0ccc5b41d8.jpg';
  }
  // Soaps
  if (n.includes('soap') || c.includes('soap')) {
    return '/assets/ilovesurprises/categories/goats_milk_soaps.jpg';
  }
  // Slimes
  if (n.includes('slime') || c.includes('slime')) {
    return '/assets/ilovesurprises/categories/BDayCake.webp';
  }
  // Candy
  if (n.includes('candy') || c.includes('candy')) {
    return '/assets/ilovesurprises/categories/cash_candy.jpg';
  }
  // Chocolates
  if (n.includes('chocolate') || c.includes('chocolate')) {
    return '/assets/ilovesurprises/categories/chocolates.jpg';
  }
  // Zodiac
  if (n.includes('zodiac') || c.includes('zodiac')) {
    return '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp';
  }
  // Cash Money Candles
  if (n.includes('cash money') || c.includes('cash-money') || c.includes('cash money')) {
    return '/assets/ilovesurprises/categories/cash_money_candles.jpg';
  }
  // Cash Candles
  if (n.includes('cash') || c.includes('cash')) {
    return '/assets/ilovesurprises/categories/cash_candles.jpg';
  }
  // Soda Pop Candles
  if (n.includes('soda') || c.includes('soda')) {
    return '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
  }
  // Christmas & Holiday Candles
  if (n.includes('christmas') || n.includes('holiday') || c.includes('christmas')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158';
  }
  // Halloween Candles & Bath Bombs
  if (n.includes('halloween') || c.includes('halloween')) {
    return 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369';
  }
  // Default Jewelry Candle Mockup
  return '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';
}

/**
 * Resolves the authoritative founder-specified price for products based on category & type.
 * Ensures 100% consistent pricing across all store views, search, cart, and checkout.
 */
export function resolveFounderCategoryPrice(name: string, categoryName: string, defaultPrice: number): number {
  const n = (name || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();

  // 1. Cereal Bowl Cash & Jewelry Candles -> $49.99
  if (n.includes('cereal') && (n.includes('candle') || c.includes('candle') || n.includes('bowl'))) {
    return 49.99;
  }

  // 2. Beer Mug Cash & Jewelry Candles -> $49.99
  if (n.includes('beer') && (n.includes('candle') || n.includes('mug') || c.includes('candle'))) {
    return 49.99;
  }

  // 3. Soda Can Cash & Jewelry Candles -> $29.99
  if (n.includes('soda') && (n.includes('candle') || c.includes('candle') || n.includes('can'))) {
    return 29.99;
  }

  // 4. Cash Surprise Bear & Cash Wax Melt Bundles -> $59.99
  if (n.includes('bear') && (n.includes('bundle') || n.includes('melt') || n.includes('treasure')) && (n.includes('cash') || n.includes('money'))) {
    return 59.99;
  }

  // 5. Giant Jewelry Wax Melts & Cash Figurine Wax Melts -> $34.99
  if (
    (n.includes('giant') && (n.includes('wax') || n.includes('melt'))) ||
    ((n.includes('figurine') || n.includes('shaped') || n.includes('skull')) && (n.includes('wax') || n.includes('melt')))
  ) {
    return 34.99;
  }

  // 6. 5.5 oz Cash & Jewelry Wax Melts (non-figurine) -> $19.99
  if ((n.includes('wax melt') || c.includes('wax melt') || n.includes('wax-melt')) && !n.includes('giant') && !n.includes('figurine') && !n.includes('bundle')) {
    return 19.99;
  }

  // 7. Cash & Jewelry Slimes (single jars) -> $19.99
  if (n.includes('slime') || c.includes('slime')) {
    return 19.99;
  }

  // 8. Cash & Jewelry Bath Bomb 2-Pack Tubes -> $34.99
  if ((n.includes('bath bomb') || c.includes('bath bomb')) && (n.includes('2-pack') || n.includes('2 pack') || n.includes('tube') || n.includes('bundle'))) {
    return 34.99;
  }

  // 9. Cash & Jewelry Bath Bombs (Singles) -> $19.99
  if (n.includes('bath bomb') || c.includes('bath bomb')) {
    return 19.99;
  }

  // 10. Cash & Jewelry Bath Soaks (Tubes) -> $19.99
  if (n.includes('bath soak') || n.includes('bath salt') || c.includes('bath soak') || c.includes('bath salt') || n.includes('money bath salt')) {
    return 19.99;
  }

  // 11. 7.5 oz Cash & Jewelry Sugar Scrubs -> $19.99
  if (n.includes('sugar scrub') || c.includes('sugar scrub')) {
    return 19.99;
  }

  // 12. Cash Candy & Chocolate Candy Tubes -> $27.99
  if ((n.includes('candy') || n.includes('chocolate')) && (n.includes('tube') || n.includes('cash') || n.includes('money'))) {
    return 27.99;
  }

  // 13. Cash & Jewelry Greeting Cards -> $14.99
  if (n.includes('greeting card') || c.includes('greeting card') || n.includes('card')) {
    return 14.99;
  }

  // 14. All Cash & Jewelry Candles -> $44.99
  if (n.includes('candle') || c.includes('candle')) {
    return 44.99;
  }

  return defaultPrice > 0 ? defaultPrice : 44.99;
}

/**
 * Authoritative Customer Visibility Filter:
 * Ensures only authentic Cash or Jewelry surprise creations are presented to the shopper.
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
}): boolean {
  if (!product) return false;

  const title = (product.title || product.name || '').toLowerCase();
  const handle = (product.handle || product.slug || '').toLowerCase();
  const surpriseType = (product.surpriseType || '').toLowerCase();
  const category = (product.category || product.categoryName || '').toLowerCase();
  const productType = (product.productType || '').toLowerCase();
  const tags = (product.tags || '').toLowerCase();

  // Specifically hide scented flowers bouquet
  if (
    handle.includes('scented-flower') ||
    title.includes('scented flowers bouquet') ||
    title.includes('scented flower bouquet')
  ) {
    return false;
  }

  // Specifically hide the 'you make me so happy' soap design
  if (
    handle.includes('you-make-me-so-happy') ||
    title.includes('you make me so happy')
  ) {
    return false;
  }

  // Check Cash / Money relation
  const hasCash =
    surpriseType.includes('cash') ||
    surpriseType.includes('money') ||
    title.includes('cash') ||
    title.includes('money') ||
    handle.includes('cash') ||
    handle.includes('money') ||
    category.includes('cash') ||
    productType.includes('cash') ||
    tags.includes('cash');

  // Check Jewelry relation
  const hasJewelry =
    surpriseType.includes('jewel') ||
    surpriseType.includes('diamond') ||
    surpriseType.includes('ring') ||
    title.includes('jewelry') ||
    title.includes('jewellery') ||
    title.includes('ring') ||
    title.includes('necklace') ||
    title.includes('bracelet') ||
    title.includes('earring') ||
    title.includes('diamond') ||
    handle.includes('jewelry') ||
    handle.includes('jewellery') ||
    handle.includes('ring') ||
    handle.includes('necklace') ||
    handle.includes('bracelet') ||
    handle.includes('earring') ||
    handle.includes('diamond') ||
    category.includes('jewelry') ||
    category.includes('jewellery') ||
    productType.includes('jewelry') ||
    tags.includes('jewelry');

  // Hide plain cereal bowl versions with no contents
  if (title.includes('cereal') || handle.includes('cereal')) {
    if (!hasCash && !hasJewelry) {
      return false;
    }
  }

  // Hide plain beer mug versions with no contents
  if (title.includes('beer') || handle.includes('beer')) {
    if (!hasCash && !hasJewelry) {
      return false;
    }
  }

  // Check Holiday priority collection
  const isHoliday =
    title.includes('halloween') ||
    handle.includes('halloween') ||
    category.includes('halloween') ||
    productType.includes('halloween') ||
    title.includes('christmas') ||
    title.includes('holiday') ||
    handle.includes('christmas') ||
    handle.includes('holiday') ||
    category.includes('christmas') ||
    productType.includes('christmas');

  return hasCash || hasJewelry || isHoliday;
}

/**
 * Maps a backend product DTO or database row to the frontend Product model.
 */
export function mapRowToProduct(row: any): Product {
  const id = String(row.product_id || row.id || '');
  const name = String(row.title || row.name || 'Surprise Product');
  const slug = String(row.handle || row.slug || id);
  const description = row.description || row.shortDescription || row.body_html || undefined;

  let categoryName = row.categoryName || row.category_name || '';
  if (!categoryName && row.categoryId) {
    const matchedCategory = categoriesData.find((c) => c.id === row.categoryId);
    categoryName = matchedCategory ? matchedCategory.name : 'Candles';
  }
  if (!categoryName) {
    categoryName = row.badge || 'Candles';
  }

  const nameLower = name.toLowerCase();
  const catLower = categoryName.toLowerCase();
  const isWaxMelt = nameLower.includes('wax melt') || nameLower.includes('wax-melt') || catLower.includes('wax melt');
  const isCandle = !isWaxMelt && (nameLower.includes('candle') || catLower.includes('candle'));

  if (isCandle) {
    if (categoryName.toLowerCase().includes('flameless')) {
      categoryName = 'Scented Candles';
    }
  } else if (isWaxMelt) {
    if (!categoryName.toLowerCase().includes('flameless')) {
      categoryName = 'Wax Melts (Flameless Candles)';
    }
  }

  // Variant pricing & SKU resolution
  let price = 0;
  let originalPrice: number | undefined = undefined;
  let sku: string | undefined = undefined;

  if (Array.isArray(row.product_variants) && row.product_variants.length > 0) {
    const validVariants = row.product_variants.filter((v: any) => v && typeof v.price === 'number' && v.price > 0);
    const chosenVariant = validVariants[0] || row.product_variants[0];
    price = Number(chosenVariant?.price) || 0;
    if (chosenVariant?.compare_at_price) {
      originalPrice = Number(chosenVariant.compare_at_price);
    }
    sku = chosenVariant?.sku || undefined;
  } else {
    price = Number(row.price) || 0;
    if (row.compareAtPrice) {
      originalPrice = Number(row.compareAtPrice);
    } else if (row.compare_at_price) {
      originalPrice = Number(row.compare_at_price);
    } else if (row.originalPrice) {
      originalPrice = Number(row.originalPrice);
    }
    sku = row.sku || undefined;
  }

  price = resolveFounderCategoryPrice(name, categoryName, price);

  // Image resolution
  let rawImage: string | null = null;
  let allImages: string[] = [];

  if (Array.isArray(row.product_images) && row.product_images.length > 0) {
    const validImages = row.product_images.filter((img: any) => {
      const u = (img?.image_url || img?.url || '').toLowerCase();
      return u && !u.includes('youtube.com') && !u.includes('youtu.be') && !u.includes('vimeo.com');
    });
    const sortedImages = [...validImages].sort(
      (a: any, b: any) => (a.position || a.sortOrder || 0) - (b.position || b.sortOrder || 0)
    );
    rawImage = sortedImages[0]?.image_url || sortedImages[0]?.url || null;
    allImages = sortedImages.map((img: any) => img.image_url || img.url).filter(Boolean);
  } else if (Array.isArray(row.images) && row.images.length > 0) {
    const valid = row.images.filter((u: any) => {
      const s = String(u).toLowerCase();
      return s && !s.includes('youtube.com') && !s.includes('youtu.be') && !s.includes('vimeo.com');
    });
    if (valid.length > 0) {
      rawImage = valid[0];
      allImages = valid;
    }
  }

  if (!rawImage && (row.imageUrl || row.image)) {
    const candidate = row.imageUrl || row.image;
    const u = String(candidate).toLowerCase();
    if (!u.includes('youtube.com') && !u.includes('youtu.be') && !u.includes('vimeo.com')) {
      rawImage = candidate;
      allImages = [candidate];
    }
  }

  const resolvedImage = resolveProductImage(rawImage, name, categoryName);
  if (allImages.length === 0 && resolvedImage) {
    allImages = [resolvedImage];
  }

  // Ring sizes & Jewelry types
  const rawRingSizes = Array.isArray(row.ringSizes) ? row.ringSizes : [];
  const ringSizesNum: number[] = rawRingSizes.map(Number).filter((n: number) => !isNaN(n));
  const finalRingSizes = ringSizesNum.length > 0 ? ringSizesNum : [5, 6, 7, 8, 9, 10];

  const jewelryTypes: string[] =
    Array.isArray(row.jewelryTypes) && row.jewelryTypes.length > 0
      ? row.jewelryTypes
      : ['Ring', 'Necklace', 'Earrings', 'Bracelet'];

  // Scent options & notes
  const scentNotes: string[] = Array.isArray(row.scentNotes)
    ? row.scentNotes
    : Array.isArray(row.scent_notes)
    ? row.scent_notes
    : [];

  // Options & Variants
  const options: ProductOption[] = [];
  if (finalRingSizes.length > 0) {
    options.push({
      name: 'Ring Size',
      position: 1,
      values: finalRingSizes.map(String),
    });
  }
  if (jewelryTypes.length > 0) {
    options.push({
      name: 'Jewelry Reveal Type',
      position: 2,
      values: jewelryTypes,
    });
  }
  if (Array.isArray(row.scentOptions) && row.scentOptions.length > 0) {
    options.push({
      name: 'Fragrance Scent',
      position: 3,
      values: row.scentOptions.map((s: any) => s.name || s),
    });
  }

  const variants: ProductVariant[] = finalRingSizes.map((size) => ({
    variantId: `${id}-size-${size}`,
    productId: id,
    title: `Size ${size}`,
    price,
    compareAtPrice: originalPrice,
    sku,
    inStock: true,
    option1Name: 'Ring Size',
    option1Value: String(size),
  }));

  // Surprise type
  let surpriseType: SurpriseType = (row.surprise_type as SurpriseType) || 'mystery';
  if (!row.surprise_type) {
    if (nameLower.includes('cash') || nameLower.includes('money')) {
      surpriseType = 'cash';
    } else if (
      nameLower.includes('jewelry') ||
      nameLower.includes('ring') ||
      nameLower.includes('necklace') ||
      nameLower.includes('diamond')
    ) {
      surpriseType = 'jewelry';
    } else if (nameLower.includes('charm')) {
      surpriseType = 'charm';
    } else {
      surpriseType = 'mystery';
    }
  }

  const surpriseValue =
    row.surpriseRevealInfo?.valueRange ||
    row.surprise_value ||
    (surpriseType === 'cash'
      ? 'Real Cash $2 - $2,500 inside'
      : 'Jewelry inside worth $10 - $7,500');

  const inStock =
    row.inStock !== undefined
      ? Boolean(row.inStock)
      : row.in_stock !== undefined
      ? Boolean(row.in_stock)
      : typeof row.total_inventory_qty === 'number'
      ? row.total_inventory_qty > 0
      : (row.stock ?? 50) > 0;

  const prod: Product = {
    id,
    name,
    slug,
    category: categoryName,
    price,
    originalPrice,
    surpriseType,
    surpriseValue,
    rating: Number(row.rating) || 4.8,
    reviewCount: Number(row.reviewCount ?? row.review_count ?? 0),
    image: resolvedImage,
    images: allImages,
    variants: variants.length > 0 ? variants : undefined,
    options: options.length > 0 ? options : undefined,
    badge: row.badge || undefined,
    isNew: Boolean(row.isNew ?? row.is_new),
    isBestSeller: Boolean(row.isBestSeller ?? row.is_best_seller ?? nameLower.includes('diamond') ?? nameLower.includes('cash')),
    inStock,
    stock: row.stock ?? row.total_inventory_qty ?? 50,
    scentNotes,
    description,
    sku,
    ringSizes: finalRingSizes,
    jewelryTypes,
  };

  cacheProduct(prod);
  return prod;
}

const SIGNATURE_COLLECTION_IMAGES: Record<string, string> = {
  'halloween': 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369',
  'christmas-candles-1': 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
  'christmas': 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
  'cash-candles': '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
  'zodiac-cash-money-candles': '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
  'giant-jewelry-wax-melts': 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
  'cash-figurine-wax-melts': '/assets/ilovesurprises/categories/Wax_melts_JC.jpg',
  'cash-surprise-bear-and-cash-wax-melt-bundles': 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
};

/**
 * Maps a collection row to frontend Collection model.
 */
export function mapRowToCollection(row: any): Collection {
  const handle = String(row.handle || '').toLowerCase();
  const fallbackImg = SIGNATURE_COLLECTION_IMAGES[handle] || undefined;
  return {
    id: String(row.collection_id || row.id || ''),
    handle: String(row.handle || ''),
    title: String(row.title || 'Collection'),
    bodyHtml: row.body_html || undefined,
    productsCount: Number(row.products_count) || 0,
    imageUrl: row.image_url || fallbackImg,
    sortOrder: row.sort_order || undefined,
  };
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  searchQuery?: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  surpriseTypes?: SurpriseType[];
  sort?: 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest' | 'best-sellers';
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productService = {
  /**
   * Fast paginated product loader querying the authoritative 57,479-product Supabase catalog
   * via Nithish backend (http://localhost:3000/api/products).
   */
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 15 : 16);

    const cacheKey = JSON.stringify({
      page,
      limit,
      category: params.category || 'all',
      search: (params.searchQuery || '').trim().toLowerCase(),
      minPrice: params.minPrice ?? null,
      maxPrice: params.maxPrice ?? null,
      surpriseTypes: (params.surpriseTypes || []).slice().sort(),
      sort: params.sort || 'featured',
    });

    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      // Map sort param to backend sortBy enum: newest, price-asc, price-desc, rating, bestseller
      const backendSort =
        params.sort === 'price-asc'
          ? 'price-asc'
          : params.sort === 'price-desc'
          ? 'price-desc'
          : params.sort === 'rating'
          ? 'rating'
          : params.sort === 'best-sellers'
          ? 'bestseller'
          : 'newest';

      const queryParams: Record<string, any> = {
        page,
        limit,
        sortBy: backendSort,
      };

      if (params.searchQuery?.trim()) {
        queryParams.search = params.searchQuery.trim();
      }

      if (params.category && params.category !== 'All Surprises' && params.category !== 'All') {
        queryParams.category = params.category;
      }

      if (params.minPrice !== undefined && params.minPrice !== null) {
        queryParams.minPrice = params.minPrice;
      }
      if (params.maxPrice !== undefined && params.maxPrice !== null) {
        queryParams.maxPrice = params.maxPrice;
      }

      if (params.surpriseTypes && params.surpriseTypes.includes('cash') && !params.surpriseTypes.includes('jewelry')) {
        if (!queryParams.search) {
          queryParams.search = 'cash';
        }
      }

      const response = await apiClient.get<any>('/api/products', queryParams);
      const rawProducts: any[] = response?.data?.products || [];
      const total: number = response?.data?.pagination?.total ?? rawProducts.length;
      const totalPages: number = response?.data?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit));

      const products = deduplicateProducts(rawProducts.map(mapRowToProduct));

      const result: PaginatedProductsResult = {
        products,
        total,
        page,
        totalPages,
      };

      queryCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (err: any) {
      console.warn('Backend API getProducts error, falling back to static dataset:', err.message);

      // Graceful offline fallback
      let filtered = [...productsData];
      if (params.category && params.category !== 'All Surprises') {
        filtered = filtered.filter((p) => p.category === params.category);
      }
      if (params.searchQuery?.trim()) {
        filtered = rankProductsBySearch(filtered, params.searchQuery.trim());
      }
      const total = filtered.length;
      const skip = (page - 1) * limit;
      const paginated = filtered.slice(skip, skip + limit);

      return {
        products: paginated,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }
  },

  /**
   * Fast real-time product search with backend querying against title, description, and tags.
   */
  async searchProducts(query: string, limit = 8): Promise<Product[]> {
    const q = query.trim();
    if (!q) return [];

    const cacheKey = `search_${q.toLowerCase()}_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      const response = await apiClient.get<any>('/api/products', {
        search: q,
        limit,
      });
      const rawProducts: any[] = response?.data?.products || [];
      const products = deduplicateProducts(rawProducts.map(mapRowToProduct));
      queryCache.set(cacheKey, { result: products, timestamp: Date.now() });
      return products;
    } catch (err) {
      console.warn('Backend API searchProducts error, falling back to static:', err);
      const fallback = rankProductsBySearch(productsData, q).slice(0, limit);
      return fallback;
    }
  },

  /**
   * Retrieves single product details by handle / URL slug / database ID via backend.
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const cleanSlug = decodeURIComponent(slug).trim().toLowerCase();

    const cached = getCachedProduct(cleanSlug);
    if (cached) return cached;

    try {
      const response = await apiClient.get<any>(`/api/products/${encodeURIComponent(cleanSlug)}`);
      const rawProduct = response?.data?.product;
      if (rawProduct) {
        return mapRowToProduct(rawProduct);
      }
    } catch (err) {
      console.warn(`Backend API getProductBySlug error for slug ${cleanSlug}:`, err);
    }

    // Static fallback if backend does not find product
    const fallback = productsData.find(
      (p) => p.slug.toLowerCase() === cleanSlug || p.id.toLowerCase() === cleanSlug
    );
    if (fallback) {
      cacheProduct(fallback);
      return fallback;
    }

    return null;
  },

  /**
   * Retrieves single product by database ID.
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.getProductBySlug(id);
  },

  /**
   * Retrieves products by a list of IDs.
   */
  async getProductsByIds(ids: string[]): Promise<Product[]> {
    if (!ids || ids.length === 0) return [];

    const productMap = new Map<string, Product>();
    const missingIds: string[] = [];

    ids.forEach((id) => {
      const cached = getCachedProduct(id);
      if (cached) {
        productMap.set(id.toLowerCase(), cached);
        if (cached.slug) productMap.set(cached.slug.toLowerCase(), cached);
        if (cached.id) productMap.set(cached.id.toLowerCase(), cached);
      } else {
        missingIds.push(id);
      }
    });

    if (missingIds.length > 0) {
      try {
        const chunkSize = 12;
        for (let i = 0; i < missingIds.length; i += chunkSize) {
          const chunk = missingIds.slice(i, i + chunkSize);
          const fetchPromises = chunk.map(async (id) => {
            try {
              const res = await apiClient.get<any>(`/api/products/${encodeURIComponent(id)}`);
              const p = res?.data?.product;
              return p ? mapRowToProduct(p) : null;
            } catch {
              // Check offline fallback dataset
              const fallback = productsData.find(
                (p) => p.slug.toLowerCase() === id.toLowerCase() || p.id.toLowerCase() === id.toLowerCase()
              );
              if (fallback) {
                cacheProduct(fallback);
                return fallback;
              }
              return null;
            }
          });

          const fetched = await Promise.all(fetchPromises);
          fetched.forEach((p) => {
            if (p) {
              productMap.set(p.slug.toLowerCase(), p);
              productMap.set(p.id.toLowerCase(), p);
            }
          });
        }
      } catch (err) {
        console.warn('Error fetching products by IDs from backend:', err);
      }
    }

    // Preserve exact ordering of input IDs
    const resolved: Product[] = [];
    const seen = new Set<string>();
    ids.forEach((id) => {
      const cleanId = id.toLowerCase();
      const prod = productMap.get(cleanId);
      if (prod && !seen.has(prod.id)) {
        seen.add(prod.id);
        resolved.push(prod);
      }
    });

    return resolved;
  },

  /**
   * Retrieves featured bestseller products directly from live catalog.
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const cacheKey = `featured_prods_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result;
    }

    try {
      const res = await apiClient.get<any>('/api/products', {
        featured: true,
        limit,
        sortBy: 'bestseller',
      });
      const rawProducts = res?.data?.products || [];
      if (rawProducts.length > 0) {
        const products = deduplicateProducts(rawProducts.map(mapRowToProduct));
        queryCache.set(cacheKey, { result: products, timestamp: Date.now() });
        return products;
      }
    } catch (err) {
      console.warn('Backend getFeaturedProducts error, using static dataset:', err);
    }

    return productsData.filter((p) => p.isBestSeller).slice(0, limit);
  },

  /**
   * Retrieves products for homepage collections.
   */
  async getHomepageCollectionProducts(
    collection: 'cash-candles' | 'trending' | 'zodiac',
    limit = 8
  ): Promise<Product[]> {
    const cacheKey = `hp_collection_${collection}_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result.products;
    }

    try {
      let searchTerm = 'candle';
      if (collection === 'cash-candles') searchTerm = 'cash candle';
      else if (collection === 'trending') searchTerm = 'jewelry candle';
      else if (collection === 'zodiac') searchTerm = 'zodiac';

      const res = await apiClient.get<any>('/api/products', {
        search: searchTerm,
        limit,
      });
      const rawProducts = res?.data?.products || [];
      if (rawProducts.length > 0) {
        const products = deduplicateProducts(rawProducts.map(mapRowToProduct));
        queryCache.set(cacheKey, {
          result: { products, total: products.length, page: 1, totalPages: 1 },
          timestamp: Date.now(),
        });
        return products;
      }
    } catch (err) {
      console.warn(`Error fetching homepage collection ${collection}:`, err);
    }

    // Graceful offline fallback to static dataset
    if (collection === 'cash-candles') {
      return productsData.filter((p) => p.surpriseType === 'cash').slice(0, limit);
    } else if (collection === 'zodiac') {
      return productsData.filter((p) => p.badge?.toLowerCase().includes('zodiac') || p.name.toLowerCase().includes('zodiac')).slice(0, limit);
    }
    return productsData.filter((p) => p.isBestSeller).slice(0, limit);
  },

  /**
   * Loads diverse, distinct products for the home screen.
   */
  async getDiverseFeaturedProducts(limit = 60): Promise<Product[]> {
    const cacheKey = `home_diverse_products_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result.products;
    }

    try {
      const res = await apiClient.get<any>('/api/products', { limit });
      const rawProducts = res?.data?.products || [];
      if (rawProducts.length > 0) {
        const products = deduplicateProducts(rawProducts.map(mapRowToProduct));
        queryCache.set(cacheKey, {
          result: { products, total: products.length, page: 1, totalPages: 1 },
          timestamp: Date.now(),
        });
        return products;
      }
    } catch (err) {
      console.warn('Error fetching diverse home products:', err);
    }

    const fallback = await this.getProducts({ limit });
    return fallback.products;
  },

  /**
   * Retrieves collection metadata by handle or ID.
   */
  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    if (!handle) return null;
    const clean = decodeURIComponent(handle).trim().toLowerCase();

    // 1. Check authoritative approved collections first
    const approvedMeta = getApprovedCollectionMeta(clean);
    if (approvedMeta) {
      const fallbackImg =
        approvedMeta.imageUrl ||
        SIGNATURE_COLLECTION_IMAGES[approvedMeta.canonicalHandle] ||
        SIGNATURE_COLLECTION_IMAGES['cash-candles'] ||
        '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';

      return {
        id: approvedMeta.collectionId,
        handle: approvedMeta.canonicalHandle,
        title: approvedMeta.name,
        bodyHtml: approvedMeta.description,
        productsCount: approvedMeta.actualCount,
        imageUrl: fallbackImg,
      };
    }

    // Comprehensive map from navigation slugs to collection handles & keywords
    const ALIAS_MAP: Record<string, string> = {
      'candles': 'candles',
      'wax-melts': 'wax-melts',
      'bath-bombs': 'bath-bombs',
      'soaps': 'soap',
      'soap': 'soap',
      'jewelry': 'jewelry',
      'candy': 'candy',
      'chocolates': 'chocolates',
      'slimes': 'slimes',
      'cards': 'greeting-cards',
      'greeting-cards': 'greeting-cards',
      'halloween': 'halloween',
      'christmas': 'christmas-candles-1',
      'christmas-candles': 'christmas-candles-1',
      'christmas-candles-1': 'christmas-candles-1',
      'cash-candle': 'cash-candles',
      'cash-candles': 'cash-candles',
      'cash-money-candle': 'cash-money-candles',
      'cash-money-candles': 'cash-money-candles',
      'jewelry-candle': 'jewelry-candles',
      'jewelry-candles': 'jewelry-candles',
      'jewelry-candles-1': 'jewelry-candles',
      'jewellery': 'jewelry',
      'jewellery-candle': 'jewelry-candles',
      'jewellery-candles': 'jewelry-candles',
      'funny-cash-candles': 'funny-candle',
      'funny-candle': 'funny-candle',
      'funny-candles': 'funny-candles',
      'military-cash-candles': 'military-cash-candles',
      'soda-pop-cash-candles': 'soda-pop-candles-soda-candles-soda-cash-candles-soda-money-candles',
      'cereal-bowl-candles': 'cereal-bowl-candles-cereal-candles',
      'cereal-cash-candles': 'cereal-candles-cereal-cash-candles',
      'jewelry-cereal-candles': 'jewelry-cereal-candles',
      'coffee-mug-cash-candles': 'cash-coffee-candles-coffee-mug-candles',
      'foodie-cash-candles': 'foodie-jewelry-candles-jewelry-candles-for-foodies',
      'wine-bottle-cash-candles': 'wine-bottle-cash-candles',
      'zodiac-cash-candles': 'zodiac-cash-money-candles',
      'zodiac-cash-money-candles': 'zodiac-cash-money-candles',
      'zodiac-candles': 'zodiac-candles',
      'zodiac': 'zodiac-cash-money-candles',
      'astrology-birthdate-cash-candles': 'astrology-birthdate-cash-candles',
      'anime-cash-candles': 'cash-anime-candles',
      'cash-anime-candles': 'cash-anime-candles',
      'cereal-bowl-wax-melts': 'cereal-bowl-wax-melts',
      'cash-wax-melts': 'cash-wax-melts',
      'jewelry-wax-melts': 'jewelry-wax-melts',
      'wax-melt-bundles': 'cash-wax-melt-surprise-bundles',
      'cash-wax-melt-surprise-bundles': 'cash-wax-melt-surprise-bundles',
      'cash-bath-bombs': 'cash-bath-bombs',
      'surprise-rose-bear-cash-bath-bomb-bundle': 'cash-surprise-bear-and-cash-wax-melt-bundles',
      'surprise-rose-bear-bundle': 'cash-surprise-bear-and-cash-wax-melt-bundles',
      'astrology-cash-bath-bombs': 'astrology-cash-bath-bombs',
      'cash-bath-bomb-tube-bundles': 'cash-bath-bombs-bundles',
      'cash-bath-bombs-bundles': 'cash-bath-bombs-bundles',
      'jewelry-bath-bombs': 'jewelry-bath-bombs',
      'cash-sugar-scrubs': 'sugar-scrubs',
      'sugar-scrubs': 'sugar-scrubs',
      'jewelry-sugar-scrubs': 'jewelry-sugar-scrubs-1',
      'cash-bath-soaks': 'money-bath-salts',
      'money-bath-salts': 'money-bath-salts',
      'goat-milk-cash-money-soaps': 'goat-milk-soaps',
      'goat-milk-soaps': 'goat-milk-soaps',
      'goat-milk-soap': 'goat-milk-soap',
    };

    const targetHandle = ALIAS_MAP[clean] || clean;

    // Check categoriesData first
    const matchedCategory = categoriesData.find(
      (c) =>
        c.slug.toLowerCase() === clean ||
        c.slug.toLowerCase() === targetHandle ||
        c.id.toLowerCase() === clean ||
        c.name.toLowerCase() === clean
    );

    const friendlyTitle = (targetHandle || clean)
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const fallbackImg = SIGNATURE_COLLECTION_IMAGES[targetHandle] ||
      matchedCategory?.image ||
      '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';

    return {
      id: matchedCategory?.id || targetHandle,
      handle: targetHandle,
      title: matchedCategory?.name || friendlyTitle,
      description: matchedCategory?.description || `Explore our authentic ${friendlyTitle} collection with guaranteed hidden cash or jewelry surprises inside!`,
      productsCount: matchedCategory?.itemCount || 100,
      imageUrl: fallbackImg,
    };
  },

  /**
   * Retrieves products belonging strictly to a collection via backend API.
   */
  async getProductsByCollection(
    handleOrId: string | Collection,
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
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || (typeof window !== 'undefined' && window.innerWidth >= 1024 ? 15 : 16);

    const col =
      typeof handleOrId === 'object' && handleOrId !== null
        ? (handleOrId as Collection)
        : await this.getCollectionByHandle(handleOrId);

    if (!col) {
      return {
        collection: null,
        products: [],
        total: 0,
        page,
        totalPages: 1,
      };
    }

    const sortOption = params.sort || 'featured';
    const cacheKey = `col_prods_${col.handle}_${page}_${limit}_${sortOption}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result as any;
    }

    // Check if this is an approved collection with authoritative product mapping
    const handleStr = typeof handleOrId === 'string' ? handleOrId : col.handle;
    const approvedMeta = getApprovedCollectionMeta(col.handle) || getApprovedCollectionMeta(handleStr);

    if (approvedMeta) {
      const allHandles = approvedMeta.productHandles;
      const total = allHandles.length;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      let prods: Product[] = [];

      if (sortOption === 'featured' || sortOption === 'best-sellers') {
        const skip = (page - 1) * limit;
        const pageHandles = allHandles.slice(skip, skip + limit);
        prods = await this.getProductsByIds(pageHandles);

        // Warm cache for next page asynchronously
        if (page < totalPages) {
          const nextSlice = allHandles.slice(skip + limit, skip + 2 * limit);
          if (nextSlice.length > 0) {
            setTimeout(() => {
              this.getProductsByIds(nextSlice).catch(() => {});
            }, 200);
          }
        }
      } else {
        // Price or Newest sort
        if (total <= 200) {
          const allProds = await this.getProductsByIds(allHandles);
          const sorted = [...allProds];
          if (sortOption === 'price-asc') {
            sorted.sort((a, b) => a.price - b.price);
          } else if (sortOption === 'price-desc') {
            sorted.sort((a, b) => b.price - a.price);
          } else if (sortOption === 'newest') {
            sorted.reverse();
          }
          const skip = (page - 1) * limit;
          prods = sorted.slice(skip, skip + limit);
        } else {
          // Large collection
          const skip = (page - 1) * limit;
          const pageHandles = allHandles.slice(skip, skip + limit);
          prods = await this.getProductsByIds(pageHandles);
          if (sortOption === 'price-asc') {
            prods.sort((a, b) => a.price - b.price);
          } else if (sortOption === 'price-desc') {
            prods.sort((a, b) => b.price - a.price);
          }
        }
      }

      if (prods.length < Math.min(limit, total)) {
        // 1. Backfill with live backend search if needed
        try {
          const searchKeyword =
            col.handle.includes('cash') || col.handle.includes('money')
              ? 'cash candle'
              : col.handle.replace(/-/g, ' ');
          const searchRes = await apiClient.get<any>('/api/products', {
            search: searchKeyword,
            limit,
          });
          const rawProds = searchRes?.data?.products || [];
          if (rawProds.length > 0) {
            const mapped = rawProds.map(mapRowToProduct);
            const seenIds = new Set(prods.map((p) => p.id.toLowerCase()));
            const seenSlugs = new Set(prods.map((p) => p.slug.toLowerCase()));
            for (const item of mapped) {
              if (!seenIds.has(item.id.toLowerCase()) && !seenSlugs.has(item.slug.toLowerCase())) {
                prods.push(item);
                seenIds.add(item.id.toLowerCase());
                seenSlugs.add(item.slug.toLowerCase());
                if (prods.length >= limit) break;
              }
            }
          }
        } catch {
          // Ignore backend search error and proceed to offline fallback
        }
      }

      if (prods.length < Math.min(limit, total)) {
        // 2. Resilient offline fallback: backfill matching products from productsData
        const handleLower = col.handle.toLowerCase();
        let fallbackProds = productsData.filter((p) => {
          const pCat = (p.category || '').toLowerCase();
          const pName = (p.name || '').toLowerCase();
          const pBadge = (p.badge || '').toLowerCase();
          if (handleLower.includes('cash') || handleLower.includes('money')) {
            return p.surpriseType === 'cash' || pName.includes('cash') || pCat.includes('cash') || pBadge.includes('cash');
          }
          if (handleLower.includes('zodiac')) {
            return pName.includes('zodiac') || pBadge.includes('zodiac');
          }
          if (handleLower.includes('jewelry') || handleLower.includes('jewel')) {
            return p.surpriseType === 'jewelry' || pName.includes('jewelry') || pCat.includes('jewelry');
          }
          return pCat.includes(handleLower) || pName.includes(handleLower);
        });
        if (fallbackProds.length === 0) {
          fallbackProds = productsData.slice(0, limit);
        }
        const seenIds = new Set(prods.map((p) => p.id.toLowerCase()));
        const seenSlugs = new Set(prods.map((p) => p.slug.toLowerCase()));
        for (const item of fallbackProds) {
          if (!seenIds.has(item.id.toLowerCase()) && !seenSlugs.has(item.slug.toLowerCase())) {
            prods.push(item);
            seenIds.add(item.id.toLowerCase());
            seenSlugs.add(item.slug.toLowerCase());
            if (prods.length >= limit) break;
          }
        }
      }

      if (!col.imageUrl && prods.length > 0 && prods[0].image) {
        col.imageUrl = prods[0].image;
      }
      col.productsCount = total;

      const result = {
        collection: col,
        products: prods,
        total: Math.max(total, prods.length),
        page,
        totalPages,
      };

      // Only cache full result, never cache an incomplete list
      if (prods.length >= Math.min(limit, total)) {
        queryCache.set(cacheKey, { result, timestamp: Date.now() });
      }
      return result;
    }

    try {
      // Map handle to best search keyword for the backend
      const handleLower = col.handle.toLowerCase();
      let searchKeyword = handleLower.replace(/-/g, ' ');

      if (handleLower.includes('cash-candle') || handleLower === 'cash-candles') {
        searchKeyword = 'cash candle';
      } else if (handleLower.includes('cash-money') || handleLower === 'cash-money-candles') {
        searchKeyword = 'cash money candle';
      } else if (handleLower.includes('jewelry-candle') || handleLower === 'jewelry-candles') {
        searchKeyword = 'jewelry candle';
      } else if (handleLower.includes('wax-melt')) {
        searchKeyword = 'wax melt';
      } else if (handleLower.includes('bath-bomb')) {
        searchKeyword = 'bath bomb';
      } else if (handleLower.includes('soap')) {
        searchKeyword = 'soap';
      } else if (handleLower.includes('zodiac')) {
        searchKeyword = 'zodiac';
      } else if (handleLower.includes('halloween')) {
        searchKeyword = 'halloween';
      } else if (handleLower.includes('christmas')) {
        searchKeyword = 'christmas';
      } else if (handleLower.includes('slime')) {
        searchKeyword = 'slime';
      } else if (handleLower.includes('candy')) {
        searchKeyword = 'candy';
      } else if (handleLower.includes('chocolate')) {
        searchKeyword = 'chocolate';
      } else if (handleLower.includes('cereal')) {
        searchKeyword = 'cereal';
      } else if (handleLower.includes('coffee')) {
        searchKeyword = 'coffee';
      } else if (handleLower.includes('funny')) {
        searchKeyword = 'funny';
      } else if (handleLower.includes('military')) {
        searchKeyword = 'military';
      } else if (handleLower.includes('soda')) {
        searchKeyword = 'soda';
      } else if (handleLower.includes('wine')) {
        searchKeyword = 'wine';
      } else if (handleLower.includes('sugar-scrub')) {
        searchKeyword = 'sugar scrub';
      } else if (handleLower.includes('bath-salt') || handleLower.includes('bath-soak') || handleLower.includes('money-bath-salt')) {
        searchKeyword = 'bath salt';
      }

      const backendSort =
        params.sort === 'price-asc'
          ? 'price-asc'
          : params.sort === 'price-desc'
          ? 'price-desc'
          : params.sort === 'best-sellers'
          ? 'bestseller'
          : 'newest';

      const res = await apiClient.get<any>('/api/products', {
        search: searchKeyword,
        page,
        limit,
        sortBy: backendSort,
      });

      const rawProducts: any[] = res?.data?.products || [];
      const total: number = res?.data?.pagination?.total ?? rawProducts.length;

      let prods = deduplicateProducts(rawProducts.map(mapRowToProduct));

      // Filter out explicitly excluded defective/hidden designs
      prods = prods.filter((p: Product) => {
        const h = (p.slug || '').toLowerCase();
        const t = (p.name || '').toLowerCase();
        if (
          h.includes('scented-flower') ||
          t.includes('scented flower bouquet') ||
          t.includes('scented flowers bouquet')
        ) {
          return false;
        }
        if (
          h.includes('you-make-me-so-happy') ||
          t.includes('you make me so happy')
        ) {
          return false;
        }
        return true;
      });

      if (!col.imageUrl && prods.length > 0 && prods[0].image) {
        col.imageUrl = prods[0].image;
      }

      const result = {
        collection: col,
        products: prods,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };

      queryCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.warn(`Error fetching products for collection ${col.handle}:`, err);

      // Graceful offline fallback to static dataset
      const handleLower = col.handle.toLowerCase();
      let fallbackProds = productsData.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        const pName = (p.name || '').toLowerCase();
        const pSlug = (p.slug || '').toLowerCase();
        const pBadge = (p.badge || '').toLowerCase();

        if (handleLower.includes('cash') || handleLower.includes('money')) {
          return p.surpriseType === 'cash' || pName.includes('cash') || pCat.includes('cash') || pBadge.includes('cash');
        }
        if (handleLower.includes('zodiac')) {
          return pName.includes('zodiac') || pBadge.includes('zodiac') || pSlug.includes('zodiac');
        }
        if (handleLower.includes('halloween')) {
          return pName.includes('halloween') || pCat.includes('halloween') || pBadge.includes('halloween');
        }
        if (handleLower.includes('christmas')) {
          return pName.includes('christmas') || pCat.includes('christmas') || pBadge.includes('christmas') || pBadge.includes('holiday');
        }
        if (handleLower.includes('jewelry') || handleLower.includes('jewel')) {
          return p.surpriseType === 'jewelry' || pName.includes('jewelry') || pCat.includes('jewelry');
        }
        if (handleLower.includes('melt')) {
          return pCat.includes('melt') || pName.includes('melt');
        }
        return pCat.includes(handleLower) || pName.includes(handleLower) || pSlug.includes(handleLower);
      });

      if (fallbackProds.length === 0) {
        fallbackProds = productsData.slice(0, 10);
      }

      const total = fallbackProds.length;
      const skip = (page - 1) * limit;
      const paginated = fallbackProds.slice(skip, skip + limit);

      return {
        collection: col,
        products: paginated,
        total,
        page,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      };
    }

    return {
      collection: col,
      products: [],
      total: 0,
      page,
      totalPages: 1,
    };
  },

  /**
   * Retrieves curated trending products for the Homepage Trending / Best Sellers section.
   */
  async getCuratedTrendingProducts(limit = 10): Promise<Product[]> {
    const cappedLimit = Math.min(10, Math.max(1, limit));
    const cacheKey = `curated_trending_home_${cappedLimit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result as Product[];
    }

    try {
      const colRes = await this.getProductsByCollection('cash-candles', {
        page: 1,
        limit: cappedLimit,
        sort: 'featured',
      });

      if (colRes && colRes.products.length > 0) {
        const products = colRes.products.slice(0, cappedLimit);
        queryCache.set(cacheKey, { result: products, timestamp: Date.now() });
        return products;
      }
    } catch (err) {
      console.warn('Error fetching curated trending products from backend:', err);
    }

    // Graceful offline fallback to best-sellers
    const fallback = productsData
      .filter((p) => p.isBestSeller && (p.surpriseType === 'cash' || p.category.toLowerCase().includes('cash')))
      .concat(productsData.filter((p) => p.isBestSeller))
      .slice(0, cappedLimit);

    return fallback.length > 0 ? fallback : productsData.slice(0, cappedLimit);
  },

  /**
   * Retrieves related products for a product detail page.
   */
  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    if (!product) return [];
    try {
      const res = await this.getProducts({
        category: product.category,
        limit: limit + 6,
      });
      const related = (res.products || []).filter(
        (p: Product) => p.id !== product.id && p.slug !== product.slug
      );
      return deduplicateProducts(related).slice(0, limit);
    } catch {
      return [];
    }
  },

  /**
   * Caches a product in memory for immediate PDP access.
   */
  cacheProduct(product: Product) {
    cacheProduct(product);
  },

  /**
   * Retrieves a cached product by slug or ID.
   */
  getCachedProduct(identifier: string): Product | null {
    return getCachedProduct(identifier);
  },

  /**
   * Clears the in-memory query cache.
   */
  clearCache() {
    queryCache.clear();
  },
};

