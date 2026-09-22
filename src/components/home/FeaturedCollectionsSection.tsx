import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight, DollarSign, Flame, Gift, Gem } from 'lucide-react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { deduplicateProducts } from '../../utils/productUtils';
import { ProductCard } from '../products/ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product, CartItem } from '../../types';

interface FeaturedCollectionsSectionProps {
  cart?: CartItem[];
  wishlistIds?: string[];
  onSelectCategory?: (category: string) => void;
  onSelectCollection?: (handle: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onWishlistToggle?: (product: Product) => void;
}

interface CuratedCollectionConfig {
  id: string;
  title: string;
  categoryKey: string;
  badge: string;
  badgeIcon: React.ComponentType<{ className?: string }>;
  tagline: string;
  itemCount: number;
  image: string;
  ctaText: string;
  highlights: string[];
  eyebrow: string;
  theme: 'amber' | 'red' | 'emerald' | 'purple';
}

const DEFAULT_CURATED_CARDS: Record<string, CuratedCollectionConfig> = {
  halloween: {
    id: 'halloween',
    title: 'Halloween',
    categoryKey: 'Halloween',
    badge: 'Holiday Priority',
    badgeIcon: Flame,
    tagline: 'Limited-edition Halloween reveal candles & bath treats with cash and jewelry inside',
    itemCount: 83,
    image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369',
    ctaText: 'Shop Halloween Collection',
    highlights: ['🎃 Cash or Jewelry Inside', '🕯️ 100% Natural Soy Wax', '⚡ Limited Holiday Release'],
    eyebrow: 'Upcoming Holiday Priority',
    theme: 'amber',
  },
  'christmas-candles-1': {
    id: 'christmas-candles-1',
    title: 'Christmas Candles',
    categoryKey: 'Christmas Candles',
    badge: 'Holiday Priority',
    badgeIcon: Gift,
    tagline: 'Magical Christmas reveal candles and seasonal celebration scents with hidden treasures',
    itemCount: 98,
    image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
    ctaText: 'Shop Christmas Collection',
    highlights: ['🎁 Real Cash Up To $2,500', '💍 Genuine Jewelry Ring', '🎄 Festive Seasonal Aroma'],
    eyebrow: 'Upcoming Holiday Priority',
    theme: 'red',
  },
  'cash-candles': {
    id: 'cash-candles',
    title: 'Cash Candles',
    categoryKey: 'Cash Candles',
    badge: 'Win Up To $2,500',
    badgeIcon: DollarSign,
    tagline: 'Real cash prizes ($2 – $2,500) hidden inside every single candle',
    itemCount: 495,
    image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
    ctaText: 'Shop Cash Candles',
    highlights: ['💵 Real Cash Guaranteed', '💰 Up to $2,500 Cash Bill', '⭐ Signature Bestseller'],
    eyebrow: 'Signature Cash Reveal Experience',
    theme: 'emerald',
  },
  'zodiac-cash-money-candles': {
    id: 'zodiac-cash-money-candles',
    title: 'Zodiac Cash Candles',
    categoryKey: 'ZODIAC CASH MONEY CANDLES',
    badge: 'Real Cash Inside',
    badgeIcon: Sparkles,
    tagline: 'Astrology horoscope cash candles with real money prizes up to $2,500',
    itemCount: 12,
    image: '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
    ctaText: 'Shop Zodiac Cash Candles',
    highlights: ['♈ All 12 Horoscope Signs', '💵 Real Cash Inside Each', '✨ Perfect Zodiac Gift'],
    eyebrow: 'Signature Cash Reveal Experience',
    theme: 'purple',
  },
};

export const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({
  cart = [],
  wishlistIds = [],
  onSelectCategory,
  onSelectCollection,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
}) => {
  const [homepageConfig, setHomepageConfig] = useState(() => adminService.getHomepageContent());
  const [collectionProducts, setCollectionProducts] = useState<Record<string, Product[]>>({});
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  useEffect(() => {
    const handleUpdate = () => {
      setHomepageConfig(adminService.getHomepageContent());
    };
    window.addEventListener('ils_homepage_content_updated', handleUpdate);
    return () => window.removeEventListener('ils_homepage_content_updated', handleUpdate);
  }, []);

  // Guarantee Founder Hierarchy:
  // Row 1: Halloween & Christmas (Upcoming Holiday Priority)
  // Row 2: Cash Candles & Zodiac Cash Candles (Signature Cash Reveals)
  const { row1Cards, row2Cards, allFeaturedCards } = useMemo(() => {
    const cards = homepageConfig.featuredCards || [];

    const resolveCard = (id: string, defaultCard: CuratedCollectionConfig): CuratedCollectionConfig => {
      const found = cards.find((c) => c.id === id);
      if (!found) return defaultCard;
      return {
        ...defaultCard,
        title: found.title || defaultCard.title,
        badge: found.badge || defaultCard.badge,
        tagline: found.tagline || defaultCard.tagline,
        ctaText: found.ctaText || defaultCard.ctaText,
        image: found.image || defaultCard.image,
        itemCount: found.itemCount || defaultCard.itemCount,
      };
    };

    const halloween = resolveCard('halloween', DEFAULT_CURATED_CARDS.halloween);
    const christmas = resolveCard('christmas-candles-1', DEFAULT_CURATED_CARDS['christmas-candles-1']);
    const cash = resolveCard('cash-candles', DEFAULT_CURATED_CARDS['cash-candles']);
    const zodiac = resolveCard('zodiac-cash-money-candles', DEFAULT_CURATED_CARDS['zodiac-cash-money-candles']);

    return {
      row1Cards: [halloween, christmas],
      row2Cards: [cash, zodiac],
      allFeaturedCards: [halloween, christmas, cash, zodiac],
    };
  }, [homepageConfig]);

  // Fetch products for all featured collections (max 10 products per collection)
  useEffect(() => {
    let isCancelled = false;
    setIsFetching(true);

    const fetchAllCollections = async () => {
      try {
        const results = await Promise.all(
          allFeaturedCards.map(async (col) => {
            try {
              const res = await productService.getProductsByCollection(col.id, {
                page: 1,
                limit: 10,
                sort: 'featured',
              });
              const prods = deduplicateProducts(res?.products || []).slice(0, 10);
              return { id: col.id, products: prods };
            } catch (err) {
              console.warn(`Error fetching products for collection ${col.id}:`, err);
              return { id: col.id, products: [] };
            }
          })
        );

        if (!isCancelled) {
          const map: Record<string, Product[]> = {};
          results.forEach((r) => {
            map[r.id] = r.products;
          });
          setCollectionProducts(map);
          setIsFetching(false);
        }
      } catch (err) {
        console.warn('Error fetching featured collection products:', err);
        if (!isCancelled) {
          setIsFetching(false);
        }
      }
    };

    fetchAllCollections();

    return () => {
      isCancelled = true;
    };
  }, [allFeaturedCards]);

  const handleViewCollection = (handle: string, categoryKey?: string) => {
    if (onSelectCollection) {
      onSelectCollection(handle);
    } else if (onSelectCategory && categoryKey) {
      onSelectCategory(categoryKey);
    } else {
      const cleanUrl =
        handle === 'cash-candles' || handle === 'zodiac-cash-money-candles' || handle === 'candles'
          ? `/candles/${handle}`
          : `/${handle}`;
      window.history.pushState(
        { view: 'collection', collectionHandle: handle },
        '',
        cleanUrl
      );
      window.dispatchEvent(new CustomEvent('ils_route_change', { detail: { route: 'collection', handle } }));
      window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'collection', collectionHandle: handle } }));
    }
  };

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = onAddToCart || ((product: Product) => onSelectProduct?.(product));

  const renderCollectionGrid = (col: CuratedCollectionConfig) => {
    const prods = collectionProducts[col.id] || [];
    const isCardLoading = isFetching;
    const BadgeIcon = col.badgeIcon;
    const testId = `featured-collection-${col.id}`;

    return (
      <div
        key={col.id}
        id={testId}
        data-testid={testId}
        className="mb-10 sm:mb-14 last:mb-0"
      >
        {/* Header (No tabs - clean title & View All CTA, matching Trending structure) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-[#f4edf2]">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2">
              <BadgeIcon className="w-3.5 h-3.5" />
              <span>{col.badge || 'Curated Collection'}</span>
            </div>

            <h3
              onClick={() => handleViewCollection(col.id, col.categoryKey)}
              className="text-2xl sm:text-3xl font-black text-[#141219] tracking-tight m-0 font-display hover:text-[#D30915] cursor-pointer transition-colors"
            >
              {col.title}
            </h3>
            {col.tagline && (
              <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1 max-w-xl mx-auto sm:mx-0">
                {col.tagline}
              </p>
            )}
          </div>

          {/* Top View All CTA */}
          <button
            type="button"
            onClick={() => handleViewCollection(col.id, col.categoryKey)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D30915] hover:text-[#B60711] hover:underline active:scale-95 transition-all self-center sm:self-end cursor-pointer"
          >
            <span>View All {col.title}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Grid - Exactly max 10 products, responsive layout identical to Trending */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
          {isCardLoading || prods.length === 0
            ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : prods.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  cartQuantity={getProductQuantity(product.id)}
                  onAddToCart={handleAddToCart}
                  onUpdateQuantity={onUpdateQuantity}
                  onToggleWishlist={() => onWishlistToggle?.(product)}
                  onSelectProduct={onSelectProduct}
                  isWishlisted={wishlistSet.has(product.id)}
                />
              ))}
        </div>

        {/* COLLECTION NAME UNDERNEATH & COLLECTION LINK/VIEW ALL */}
        {!isCardLoading && prods.length > 0 && (
          <div className="mt-8 sm:mt-12 text-center flex flex-col items-center justify-center">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#716d77] mb-2">
              {col.title}
            </span>
            <button
              type="button"
              onClick={() => handleViewCollection(col.id, col.categoryKey)}
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#141219] hover:bg-[#D30915] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
            >
              <span>Explore All {col.title}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      id="featured-collections"
      className="relative max-w-[1460px] mx-auto px-2.5 sm:px-6 pt-2 pb-6 sm:pb-10 box-border overflow-hidden"
      aria-label="Featured Collections"
    >
      {/* Row 1: Holiday Collections (Halloween & Christmas) */}
      <div className="mb-10 sm:mb-14">
        {/* Product Grids for Row 1 collections */}
        <div className="space-y-10 sm:space-y-14">
          {row1Cards.map((col) => renderCollectionGrid(col))}
        </div>
      </div>

      {/* Row 2: Signature Cash Candles (Cash Candles & Zodiac Cash Candles) */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 mb-6 pb-2 border-b border-[#eedbe6]/70">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs shrink-0">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm sm:text-base font-black text-[#141219] uppercase tracking-wider font-display m-0">
              Signature Cash Candles
            </h3>
          </div>

          <div className="hidden min-[480px]:inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-emerald-200">
            <Gem className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>Guaranteed Real Cash Inside ($2 – $2,500)</span>
          </div>
        </div>

        {/* Product Grids for Row 2 collections */}
        <div className="space-y-10 sm:space-y-14">
          {row2Cards.map((col) => renderCollectionGrid(col))}
        </div>
      </div>
    </section>
  );
};
