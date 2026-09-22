import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, Sparkles, Star, ArrowRight } from 'lucide-react';
import { ProductCardSkeleton } from '../ui/ProductCardSkeleton';
import type { Product } from '../../types';
import { productsData } from '../../data/products';
import { deduplicateProducts } from '../../utils/productUtils';
import { productService } from '../../services/productService';

interface WishlistSectionProps {
  wishlistIds: string[];
  onWishlistToggle: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onNavigateToShop: () => void;
}

export const WishlistSection: React.FC<WishlistSectionProps> = ({
  wishlistIds,
  onWishlistToggle,
  onAddToCart,
  onSelectProduct,
  onNavigateToShop,
}) => {
  const [liveProducts, setLiveProducts] = useState<Product[]>(() =>
    deduplicateProducts(productsData.filter((p) => wishlistIds.includes(p.id)))
  );
  const [isLoading, setIsLoading] = useState(() => wishlistIds.length > 0);

  useEffect(() => {
    let isCancelled = false;

    if (wishlistIds.length > 0) {
      productService.getProductsByIds(wishlistIds).then((resolved) => {
        if (!isCancelled && resolved.length > 0) {
          setLiveProducts(resolved);
        }
      }).finally(() => {
        if (!isCancelled) setIsLoading(false);
      });
    } else {
      setLiveProducts([]);
      setIsLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [wishlistIds]);

  const wishlistProducts = liveProducts;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-3.5 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#f5eaf1] mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
                My Saved Wishlist
              </h2>
              <span className="text-[11px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2.5 py-0.5 rounded-full border border-[#fecdd3]">
                {wishlistProducts.length} {wishlistProducts.length === 1 ? 'Item' : 'Items'}
              </span>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Curated mystery candles, bath treats, and surprise gifts saved for future unboxings
            </p>
          </div>

          {wishlistProducts.length > 0 && (
            <button
              type="button"
              onClick={onNavigateToShop}
              className="hidden sm:flex items-center gap-1.5 text-xs font-black text-[#D30915] hover:underline cursor-pointer"
            >
              <span>Explore More</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content State: Skeleton vs Empty vs Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4" role="status" aria-label="Loading saved items">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : wishlistProducts.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-[20px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
            <div className="w-16 h-16 rounded-full bg-[#fff1f2] text-[#D30915] border-2 border-[#fecdd3] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-[#141219] mb-1 font-display">
              Your Wishlist is Empty
            </h3>
            <p className="text-xs text-[#716d77] max-w-sm mx-auto mb-5 leading-relaxed">
              You haven't saved any surprise candles yet. Explore our bestsellers with guaranteed real cash ($2-$2,500) or genuine jewelry inside.
            </p>
            <button
              type="button"
              onClick={onNavigateToShop}
              className="h-[42px] px-7 rounded-[13px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Best-Selling Candles</span>
            </button>
          </div>
        ) : (
          /* Wishlist Grid - 2 products per row on mobile */
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
            {wishlistProducts.map((product) => (
              <div
                key={product.id}
                className="p-2.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-[#fffafc] border border-[#eedbe6] hover:border-[#fecdd3] transition-all flex flex-col justify-between group shadow-2xs hover:shadow-[0_6px_20px_rgba(211,9,21,0.08)]"
              >
                <div>
                  <div className="relative w-full aspect-square rounded-[12px] sm:rounded-[16px] bg-white border border-[#eee2eb] p-1.5 sm:p-2 overflow-hidden flex items-center justify-center cursor-pointer mb-2 sm:mb-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      onClick={() => onSelectProduct(product)}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />

                    {product.badge && (
                      <span className="absolute top-1.5 left-1.5 sm:top-2.5 sm:left-2.5 px-1.5 sm:px-2 py-0.5 rounded-full bg-[#D30915] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
                        {product.badge}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => onWishlistToggle(product)}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/90 hover:bg-white text-red-500 absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 flex items-center justify-center shadow-xs transition-colors cursor-pointer border border-[#fecdd3]"
                      title="Remove from wishlist"
                    >
                      <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-amber-500 text-[10px] sm:text-xs font-bold mb-1">
                    <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-400 text-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-[#8a858f] font-normal text-[8.5px] sm:text-xs">({product.reviewCount})</span>
                  </div>

                  <h4
                    onClick={() => onSelectProduct(product)}
                    className="text-[11.5px] sm:text-sm font-black text-[#141219] m-0 line-clamp-2 hover:text-[#D30915] cursor-pointer"
                  >
                    {product.name}
                  </h4>

                  <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold block mt-1 truncate">
                    {product.surpriseType === 'cash' ? '💵 Real Cash $2-$2.5K Inside' : '💍 Guaranteed Luxury Jewelry'}
                  </span>
                </div>

                <div className="pt-2 mt-2 sm:pt-3 sm:mt-3 border-t border-[#f4edf2] flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-black text-[#141219]">
                    ${product.price.toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(product, 1);
                    }}
                    className="h-[28px] sm:h-[34px] px-2 sm:px-3.5 rounded-[8px] sm:rounded-[10px] bg-[#D30915] hover:bg-[#B60711] text-white text-[10.5px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
