import React, { useMemo, useCallback } from 'react';
import { ShoppingBag, RefreshCw, AlertTriangle } from 'lucide-react';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import { deduplicateProducts } from '../../utils/productUtils';
import type { Product, CartItem } from '../../types';

interface ProductGridProps {
  products: Product[];
  cart?: CartItem[];
  wishlistIds?: string[];
  isLoading?: boolean;
  skeletonCount?: number;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
  emptyMessage?: string;
  errorMessage?: string | null;
  onRetry?: () => void;
  isRetrying?: boolean;
  onResetFilters?: () => void;
  isFullWidth?: boolean;
  searchQuery?: string;
}

// Default skeleton count is 16 (covers 8 complete 2-col rows on mobile or 4 complete 4-col rows on desktop)
export const ProductGrid: React.FC<ProductGridProps> = React.memo(({
  products,
  cart = [],
  wishlistIds = [],
  isLoading = false,
  skeletonCount = 16,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
  emptyMessage = 'No surprise products match your selected filters.',
  errorMessage = null,
  onRetry,
  isRetrying = false,
  onResetFilters,
  isFullWidth: _isFullWidth = false,
  searchQuery: _searchQuery = '',
}) => {
  const gridClasses = 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';

  // Strictly deduplicate products to guarantee no repeated product cards
  const displayedProducts = useMemo(() => {
    return deduplicateProducts(products);
  }, [products]);

  const cartQuantityMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (let i = 0; i < cart.length; i++) {
      map[cart[i].product.id] = cart[i].quantity;
    }
    return map;
  }, [cart]);

  const wishlistSet = useMemo(() => new Set(wishlistIds), [wishlistIds]);

  const handleUpdate = useCallback(
    (productId: string, newQty: number) => {
      const currentQty = cartQuantityMap[productId] || 0;
      onUpdateQuantity(productId, newQty - currentQty);
    },
    [cartQuantityMap, onUpdateQuantity]
  );

  const handleToggle = useCallback(
    (productId: string) => {
      const target = displayedProducts.find((p) => p.id === productId);
      if (target) {
        onWishlistToggle(target);
      }
    },
    [displayedProducts, onWishlistToggle]
  );

  if (isLoading) {
    return (
      <div
        className={`grid gap-2.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300 ${gridClasses}`}
        role="status"
        aria-label="Loading products"
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Error state display when product loading fails
  if (errorMessage && products.length === 0) {
    return (
      <div className="w-full py-14 px-4 text-center rounded-[24px] bg-[#fff8f8] border border-[#fecdd3] my-6 shadow-xs animate-in fade-in duration-300">
        <div className="w-14 h-14 rounded-full bg-[#ffe4e6] text-[#D30915] border border-[#fca5a5] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-[#141219] mb-1 font-display">
          Unable to Load Surprise Products
        </h3>
        <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto mb-5 font-medium leading-relaxed">
          {errorMessage || 'We encountered a temporary network issue connecting to the product catalog. Please retry to load your surprise collection.'}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={isRetrying}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] disabled:bg-gray-400 text-white text-xs font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Retrying Catalog...' : 'Retry Loading Products'}</span>
            </button>
          )}
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-white border border-[#eedbe6] text-[#141219] hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
            >
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full py-16 px-4 text-center rounded-[24px] bg-[#fffafc] border border-[#f1dbe8] my-6">
        <div className="w-14 h-14 rounded-full bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h3 className="text-base sm:text-lg font-black text-[#141219] mb-1 font-display">
          No Products Found
        </h3>
        <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto mb-5 font-medium">
          {emptyMessage}
        </p>
        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`grid gap-2.5 sm:gap-4 lg:gap-5 w-full transition-all duration-300 ${gridClasses}`}>
      {displayedProducts.map((product) => {
        const qty = cartQuantityMap[product.id] || 0;
        const isWishlisted = wishlistSet.has(product.id);

        return (
          <div key={product.id} className="product-card-appear">
            <ProductCard
              product={product}
              cartQuantity={qty}
              onAddToCart={onAddToCart}
              onUpdateQuantity={handleUpdate}
              onToggleWishlist={handleToggle}
              onSelectProduct={onSelectProduct}
              isWishlisted={isWishlisted}
            />
          </div>
        );
      })}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';
