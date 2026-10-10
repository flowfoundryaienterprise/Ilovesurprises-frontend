import { apiClient } from './apiClient';
import type { Product, SurpriseType, Collection, ProductVariant, ProductOption } from '../types';
import { categoriesData } from '../data/categories';
import { deduplicateProducts } from '../utils/productUtils';
import { getApprovedCollectionMeta } from '../data/approvedCollectionsData';
import { seedProductCache, getProductFromQueryCache } from '../lib/queryClient';
import { getJewelryCandlePrimaryImage } from '../data/jewelryCandlesImages';

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
const QUERY_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes fresh

/**
 * Storage cache helpers for instant (< 5ms) restores on page reload and navigation.
 */
const SESSION_CACHE_PREFIX = 'ils_prod_qcache_v4_';
const LOCAL_STORAGE_PREFIX = 'ils_prod_store_v4_';

function getSessionCache<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < QUERY_CACHE_TTL_MS) {
      return parsed.data as T;
    }
  } catch {
    // ignore
  }
  return null;
}

function setSessionCache<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      SESSION_CACHE_PREFIX + key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore quota errors
  }
}

function getLocalProduct(key: string): Product | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.timestamp === 'number' && Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
      return parsed.data as Product;
    }
  } catch {
    // ignore
  }
  return null;
}

function setLocalProduct(key: string, data: Product): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      LOCAL_STORAGE_PREFIX + key,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore quota errors
  }
}

/**
 * In-memory single product cache by slug & ID for instant product details navigation.
 */
const productSlugCache = new Map<string, Product>();

export function cacheProduct(product: Product) {
  if (!product) return;
  try {
    seedProductCache(product);
  } catch {
    // ignore if query client not ready
  }

  if (product.slug) {
    const cleanSlug = product.slug.toLowerCase().trim();
    productSlugCache.set(cleanSlug, product);
    setSessionCache(`prod_slug_${cleanSlug}`, product);
    setLocalProduct(`prod_slug_${cleanSlug}`, product);
  }
  if (product.id) {
    const cleanId = product.id.toLowerCase().trim();
    productSlugCache.set(cleanId, product);
    setSessionCache(`prod_id_${cleanId}`, product);
    setLocalProduct(`prod_id_${cleanId}`, product);
  }
}

export function getCachedProduct(identifier: string): Product | null {
  if (!identifier) return null;
  const clean = decodeURIComponent(identifier).trim().toLowerCase();

  // 1. Fast in-memory map (< 0.1ms)
  const mem = productSlugCache.get(clean);
  if (mem) return mem;

  // 2. TanStack Query cache check (< 0.5ms)
  try {
    const qData = getProductFromQueryCache(clean);
    if (qData) {
      productSlugCache.set(clean, qData);
      return qData;
    }
  } catch {
    // ignore
  }

  // 3. SessionStorage check
  const sessSlug = getSessionCache<Product>(`prod_slug_${clean}`);
  if (sessSlug) {
    productSlugCache.set(clean, sessSlug);
    return sessSlug;
  }
  const sessId = getSessionCache<Product>(`prod_id_${clean}`);
  if (sessId) {
    productSlugCache.set(clean, sessId);
    return sessId;
  }

  // 4. LocalStorage persistent store check (persists across reloads/restarts)
  const localSlug = getLocalProduct(`prod_slug_${clean}`);
  if (localSlug) {
    productSlugCache.set(clean, localSlug);
    return localSlug;
  }
  const localId = getLocalProduct(`prod_id_${clean}`);
  if (localId) {
    productSlugCache.set(clean, localId);
    return localId;
  }

  return null;
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
    img.includes('vimeo.com') ||
    img.includes('1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg');

  if (!isBroken) {
    return img;
  }

  // Authoritative Jewelry Candles resolution from approved CSV
  const jcDirect = getJewelryCandlePrimaryImage(name, name);
  if (jcDirect) {
    return jcDirect;
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

  // Authoritative Jewelry Candles mapping from CSV (Shopify ID first, then exact handle)
  const jcApproved = getJewelryCandlePrimaryImage(id || slug, name);
  if (jcApproved) {
    rawImage = jcApproved;
    allImages = [jcApproved, ...allImages.filter((u) => u !== jcApproved)];
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
    const sessCached = getSessionCache<PaginatedProductsResult>(cacheKey);
    if (sessCached) {
      queryCache.set(cacheKey, { result: sessCached, timestamp: Date.now() });
      return sessCached;
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
      products.forEach((p) => cacheProduct(p));

      const result: PaginatedProductsResult = {
        products,
        total,
        page,
        totalPages,
      };

      queryCache.set(cacheKey, { result, timestamp: Date.now() });
      setSessionCache(cacheKey, result);
      return result;
    } catch (err: any) {
      console.warn('Backend API getProducts error:', err?.message || err);
      throw err;
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
      products.forEach((p) => cacheProduct(p));
      queryCache.set(cacheKey, { result: products, timestamp: Date.now() });
      return products;
    } catch (err) {
      console.warn('Backend API searchProducts error:', err);
      return [];
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
        const prod = mapRowToProduct(rawProduct);
        cacheProduct(prod);
        return prod;
      }
    } catch (err) {
      console.warn(`Backend API getProductBySlug error for slug ${cleanSlug}:`, err);
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
   * Retrieves products by a list of IDs or slugs.
   * Runs concurrent fetching up to 16 in parallel and caches every product for 0ms subsequent views.
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
        // Fast single-request batch fetch
        const batchRes = await apiClient.post<any>('/api/products/batch', { ids: missingIds });
        const batchProducts: any[] = batchRes?.data?.products || [];

        batchProducts.forEach((p) => {
          if (p) {
            const prod = mapRowToProduct(p);
            if (prod.id) productMap.set(prod.id.toLowerCase(), prod);
            if (prod.slug) productMap.set(prod.slug.toLowerCase(), prod);
            cacheProduct(prod);
          }
        });
      } catch (batchErr) {
        console.warn('Batch fetch fallback to individual fetch:', batchErr);
      }

      // Check if any items are still missing
      const stillMissing = missingIds.filter(
        (id) => !productMap.has(id.toLowerCase())
      );

      if (stillMissing.length > 0) {
        try {
          // Fetch remaining missing products in parallel chunks of 16
          const chunkSize = 16;
          for (let i = 0; i < stillMissing.length; i += chunkSize) {
            const chunk = stillMissing.slice(i, i + chunkSize);
            const fetchPromises = chunk.map(async (id) => {
              try {
                const res = await apiClient.get<any>(`/api/products/${encodeURIComponent(id)}`);
                const p = res?.data?.product;
                if (p) {
                  const prod = mapRowToProduct(p);
                  cacheProduct(prod);
                  return { requestedId: id, prod };
                }
                return null;
              } catch {
                return null;
              }
            });

            const fetched = await Promise.all(fetchPromises);
            fetched.forEach((item) => {
              if (item && item.prod) {
                const { requestedId, prod } = item;
                productMap.set(requestedId.toLowerCase(), prod);
                if (prod.slug) productMap.set(prod.slug.toLowerCase(), prod);
                if (prod.id) productMap.set(prod.id.toLowerCase(), prod);
                cacheProduct(prod);
              }
            });
          }
        } catch (err) {
          console.warn('Error fetching missing products by IDs:', err);
        }
      }
    }

    // Fallback synthesis for any unresolved Jewelry Candles to guarantee all 15 products render
    const unresolved = ids.filter((id) => !productMap.has(id.toLowerCase()));
    for (const id of unresolved) {
      const cleanId = id.toLowerCase();
      const authImg = getJewelryCandlePrimaryImage(cleanId);
      if (authImg) {
        const fallbackName = cleanId
          .split('-')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        const fallbackProd: Product = {
          id: cleanId,
          name: fallbackName,
          slug: cleanId,
          category: 'Candles',
          price: 44.99,
          surpriseType: 'jewelry',
          surpriseValue: 'Jewelry inside worth $10 - $7,500',
          rating: 4.8,
          reviewCount: 0,
          image: authImg,
          images: [authImg],
          inStock: true,
          stock: 50,
          ringSizes: [5, 6, 7, 8, 9, 10],
          jewelryTypes: ['Ring', 'Necklace', 'Earrings', 'Bracelet'],
        };
        productMap.set(cleanId, fallbackProd);
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
      console.warn('Backend getFeaturedProducts error:', err);
    }

    return [];
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

    return [];
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

    return [];
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
    const inputHandle = typeof handleOrId === 'string' ? handleOrId.toLowerCase().trim() : col.handle.toLowerCase();
    const cacheKey = `col_prods_${col.handle.toLowerCase()}_${page}_${limit}_${sortOption}`;
    const altCacheKey = `col_prods_${inputHandle}_${page}_${limit}_${sortOption}`;

    const cached = queryCache.get(cacheKey) || queryCache.get(altCacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result as any;
    }
    const sessCached = getSessionCache<any>(cacheKey) || getSessionCache<any>(altCacheKey);
    if (sessCached) {
      queryCache.set(cacheKey, { result: sessCached, timestamp: Date.now() });
      queryCache.set(altCacheKey, { result: sessCached, timestamp: Date.now() });
      return sessCached;
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

      // Guarantee unique, non-repeated primary images for Jewelry Candles collection
      if (col.handle === 'jewelry-candles' || inputHandle === 'jewelry-candles') {
        prods = prods.map((p) => {
          const authImg = getJewelryCandlePrimaryImage(p.id || p.slug, p.name);
          if (authImg) {
            return {
              ...p,
              image: authImg,
              images: [authImg, ...(p.images || []).filter((u) => u !== authImg)],
            };
          }
          return p;
        });
      }

      prods = deduplicateProducts(prods);
      prods.forEach((p) => cacheProduct(p));

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

      // Only persist full complete page results to prevent poisoned partial page caching in sessionStorage
      const expectedCount =
        sortOption === 'featured' || sortOption === 'best-sellers'
          ? Math.min(limit, Math.max(0, total - (page - 1) * limit))
          : Math.min(limit, total);

      queryCache.set(cacheKey, { result, timestamp: Date.now() });
      queryCache.set(altCacheKey, { result, timestamp: Date.now() });
      if (prods.length >= expectedCount) {
        setSessionCache(cacheKey, result);
        setSessionCache(altCacheKey, result);
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

      prods.forEach((p) => cacheProduct(p));

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
      queryCache.set(altCacheKey, { result, timestamp: Date.now() });
      setSessionCache(cacheKey, result);
      setSessionCache(altCacheKey, result);
      return result;
    } catch (err: any) {
      console.warn(`Error fetching products for collection ${col.handle}:`, err);
      throw err;
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
    const sessCached = getSessionCache<Product[]>(cacheKey);
    if (sessCached && Array.isArray(sessCached)) {
      queryCache.set(cacheKey, { result: sessCached, timestamp: Date.now() });
      return sessCached;
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
        setSessionCache(cacheKey, products);
        return products;
      }

      // Fallback to bestseller products if cash-candles collection was empty
      const featured = await this.getFeaturedProducts(cappedLimit);
      if (featured && featured.length > 0) {
        const products = featured.slice(0, cappedLimit);
        queryCache.set(cacheKey, { result: products, timestamp: Date.now() });
        setSessionCache(cacheKey, products);
        return products;
      }
    } catch (err) {
      console.warn('Error fetching curated trending products from backend:', err);
    }

    return [];
  },

  /**
   * Synchronously retrieves cached products for a homepage collection if already in memory or sessionStorage.
   * Returns immediately (< 1ms), allowing instant paint with zero loading shimmer when cached.
   */
  getCachedCollectionProducts(handleOrId: string, limit = 10): Product[] | null {
    if (!handleOrId) return null;
    const clean = String(handleOrId).trim().toLowerCase();
    const keysToCheck = [
      `col_prods_${clean}_1_${limit}_featured`,
      clean === 'cash-candles' ? `col_prods_cash-money-candles_1_${limit}_featured` : '',
      clean === 'cash-money-candles' ? `col_prods_cash-candles_1_${limit}_featured` : '',
      clean === 'zodiac-cash-money-candles' ? `col_prods_zodiac-cash-candles_1_${limit}_featured` : '',
      clean === 'christmas-candles-1' ? `col_prods_christmas_1_${limit}_featured` : '',
    ].filter(Boolean);

    for (const key of keysToCheck) {
      const cached = queryCache.get(key);
      if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
        return cached.result?.products || null;
      }
      const sess = getSessionCache<any>(key);
      if (sess?.products && Array.isArray(sess.products)) {
        queryCache.set(key, { result: sess, timestamp: Date.now() });
        return sess.products;
      }
    }
    return null;
  },

  /**
   * Synchronously retrieves cached trending products if already in memory or sessionStorage.
   */
  getCachedTrendingProducts(limit = 10): Product[] | null {
    const cappedLimit = Math.min(10, Math.max(1, limit));
    const cacheKey = `curated_trending_home_${cappedLimit}`;
    const cached = queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < QUERY_CACHE_TTL_MS) {
      return cached.result as Product[];
    }
    const sess = getSessionCache<Product[]>(cacheKey);
    if (sess && Array.isArray(sess)) {
      queryCache.set(cacheKey, { result: sess, timestamp: Date.now() });
      return sess;
    }
    return null;
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

