import type { Product, SurpriseType, Collection } from '../types';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
import { deduplicateProducts, rankProductsBySearch } from '../utils/productUtils';

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
}): boolean {
  if (!product) return false;

  const title = (product.title || product.name || '').toLowerCase();
  const handle = (product.handle || product.slug || '').toLowerCase();
  const surpriseType = (product.surpriseType || '').toLowerCase();
  const category = (product.category || product.categoryName || '').toLowerCase();
  const productType = (product.productType || '').toLowerCase();
  const tags = (product.tags || '').toLowerCase();

  if (
    handle.includes('scented-flower') ||
    title.includes('scented flowers bouquet') ||
    title.includes('scented flower bouquet') ||
    handle.includes('you-make-me-so-happy') ||
    title.includes('you make me so happy')
  ) {
    return false;
  }

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

  if (title.includes('cereal') || handle.includes('cereal')) {
    if (!hasCash && !hasJewelry) return false;
  }

  if (title.includes('beer') || handle.includes('beer')) {
    if (!hasCash && !hasJewelry) return false;
  }

  return true;
}

export function mapRowToProduct(row: any): Product {
  if (!row) return productsData[0];
  if (row.price && row.name && row.category) return row as Product;

  const id = String(row.product_id || row.id || '');
  const title = row.title || row.name || 'Surprise Candle';
  const handle = row.handle || row.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const catName = row.category_name || row.category || 'Surprise Candles';

  return {
    id,
    name: title,
    slug: handle,
    price: Number(row.price) || 44.99,
    originalPrice: Number(row.original_price || row.compare_at_price) || 54.99,
    rating: Number(row.rating) || 5.0,
    reviewCount: Number(row.review_count) || 24,
    image: resolveProductImage(row.image || row.image_url, title, catName),
    images: row.images || [resolveProductImage(row.image || row.image_url, title, catName)],
    category: catName,
    surpriseType: (row.surprise_type as SurpriseType) || 'both',
    surpriseValue: row.surprise_value || '$10 - $5,000',
    description: row.description || row.body_html || '',
    inStock: row.in_stock !== undefined ? Boolean(row.in_stock) : true,
    isBestSeller: Boolean(row.is_best_seller),
    isNew: Boolean(row.is_new),
  };
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
}

export interface PaginatedProductsResult {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productService = {
  /**
   * Retrieves products with filtering, search, sorting, and pagination
   */
  async getProducts(params: GetProductsParams = {}): Promise<PaginatedProductsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = params.limit || 12;

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
      filtered = filtered.filter((p) => p.surpriseType === params.surpriseType || (p.surpriseType as string) === 'both');
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
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'best-sellers':
        filtered.sort((a, b) => (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0));
        break;
      case 'newest':
        filtered.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        // Featured
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
   * Retrieves single product by slug
   */
  async getProductBySlug(slug: string): Promise<Product | null> {
    if (!slug) return null;
    const cached = getCachedProduct(slug);
    if (cached) return cached;

    const clean = decodeURIComponent(slug).trim().toLowerCase();
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
    return productsData.filter((p) => idSet.has(p.id.toLowerCase()) || idSet.has(p.slug.toLowerCase()));
  },

  /**
   * Retrieves featured products
   */
  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ sortBy: 'featured', limit });
    return res.products;
  },

  /**
   * Retrieves collection products for homepage
   */
  async getHomepageCollectionProducts(collectionHandle: string, limit = 8): Promise<Product[]> {
    const res = await this.getProducts({ category: collectionHandle, limit });
    return res.products;
  },

  /**
   * Retrieves diverse featured products across multiple categories
   */
  async getDiverseFeaturedProducts(limit = 8): Promise<Product[]> {
    const categories = ['Cash Candles', 'Jewelry Candles', 'Wax Melts', 'Bath Treats'];
    const results: Product[] = [];

    for (const cat of categories) {
      const match = productsData.find((p) => p.category.toLowerCase().includes(cat.toLowerCase()));
      if (match && !results.some((r) => r.id === match.id)) {
        results.push(match);
      }
    }

    for (const p of productsData) {
      if (results.length >= limit) break;
      if (!results.some((r) => r.id === p.id)) {
        results.push(p);
      }
    }

    return results.slice(0, limit);
  },

  /**
   * Retrieves a collection by handle
   */
  async getCollectionByHandle(handle: string): Promise<Collection | null> {
    const clean = decodeURIComponent(handle).trim().toLowerCase();
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
        productsCount: matchedCategory.itemCount || 10,
      };
    }

    return {
      id: `col-${clean}`,
      title: clean.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      handle: clean,
      description: 'Exclusive surprise reveal collection',
      imageUrl: '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
      productsCount: 12,
    };
  },

  /**
   * Retrieves products by collection handle
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
      category: col?.title,
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
   * Retrieves curated trending products for home page
   */
  async getCuratedTrendingProducts(limit = 10): Promise<Product[]> {
    const capped = Math.min(10, Math.max(1, limit));
    const trending = productsData.filter((p) => p.isBestSeller || p.category.toLowerCase().includes('cash'));
    return deduplicateProducts(trending).slice(0, capped);
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
};
