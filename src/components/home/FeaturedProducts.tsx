import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { productService } from '../../services/productService';
import { deduplicateProducts } from '../../utils/productUtils';
import { ProductCard } from '../products/ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product, CartItem } from '../../types';

interface FeaturedProductsProps {
  cart?: CartItem[];
  wishlistIds?: string[];
  searchQuery?: string;
  selectedCategory?: string;
  isLoading?: boolean;
  onSelectCategory?: (category: string) => void;
  onSelectCollection?: (handle: string) => void;
  onNavigateToShop?: () => void;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, delta: number) => void;
  onWishlistToggle?: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

const FEATURED_COLLECTION_HANDLE = 'cash-candles';

export const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
  cart = [],
  wishlistIds = [],
  isLoading = false,
  onSelectCollection,
  onNavigateToShop,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const [products, setProducts] = useState<Product[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;
    setIsFetching(true);

    productService
      .getCuratedTrendingProducts(10)
      .then((items) => {
        if (!isCancelled) {
          setProducts(deduplicateProducts(items).slice(0, 10));
          setIsFetching(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching curated trending products:', err);
        if (!isCancelled) {
          setIsFetching(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleViewAllClick = () => {
    if (onSelectCollection) {
      onSelectCollection(FEATURED_COLLECTION_HANDLE);
    } else if (onNavigateToShop) {
      onNavigateToShop();
    } else {
      window.history.pushState({ view: 'collection', collectionHandle: FEATURED_COLLECTION_HANDLE }, '', `/candles/${FEATURED_COLLECTION_HANDLE}`);
      window.dispatchEvent(new CustomEvent('ils_route_change', { detail: { route: 'collection', handle: FEATURED_COLLECTION_HANDLE } }));
      window.dispatchEvent(new PopStateEvent('popstate', { state: { view: 'collection', collectionHandle: FEATURED_COLLECTION_HANDLE } }));
    }
  };

  const getProductQuantity = (productId: string) => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const isCardLoading = isLoading || isFetching;
  const displayedProducts = products.slice(0, 10);

  return (
    <section
      id="featured"
      data-section="best-sellers"
      aria-label="Trending Best Sellers"
      className="relative max-w-[1460px] mx-auto px-2.5 sm:px-6 py-6 sm:py-10"
    >
      <div id="best-sellers" className="absolute -top-20" />

      {/* Header (No tabs - clean title & View All CTA) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 pb-4 border-b border-[#f4edf2]">
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left w-full sm:w-auto">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Curated Collection</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-[#141219] tracking-tight m-0 font-display">
            Trending Best Sellers
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1 max-w-xl mx-auto sm:mx-0">
            Discover real hidden cash prizes ($2–$2,500) and authentic reveals in our highest-rated creations.
          </p>
        </div>

        {/* Top View All CTA */}
        <button
          type="button"
          onClick={handleViewAllClick}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D30915] hover:text-[#B60711] hover:underline active:scale-95 transition-all self-center sm:self-end cursor-pointer"
        >
          <span>View All Cash Candles</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Product Grid - Exactly max 10 products, responsive layout */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
        {isCardLoading
          ? Array.from({ length: 10 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQuantity={getProductQuantity(product.id)}
                onAddToCart={onAddToCart}
                onUpdateQuantity={onUpdateQuantity}
                onToggleWishlist={() => onWishlistToggle?.(product)}
                onSelectProduct={onSelectProduct}
                isWishlisted={wishlistSet.has(product.id)}
              />
            ))}
      </div>

      {/* Bottom CTA to the exact collection page */}
      {!isCardLoading && displayedProducts.length > 0 && (
        <div className="mt-8 sm:mt-12 text-center">
          <button
            type="button"
            onClick={handleViewAllClick}
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full bg-[#141219] hover:bg-[#D30915] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
          >
            <span>Explore All Cash Candles</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
