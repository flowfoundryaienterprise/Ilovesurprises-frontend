import React, { useState } from 'react';
import { Heart, Plus, Minus, Star, Sparkles } from 'lucide-react';
import type { Product } from '../../types';
import { resolveProductImage } from '../../services/productService';
import { handleImageErrorSafely, getCategoryFallback } from '../../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  cartQuantity?: number;
  onAddToCart?: (product: Product) => void;
  onUpdateQuantity?: (productId: string, quantity: number) => void;
  onToggleWishlist?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({
  product,
  cartQuantity = 0,
  onAddToCart,
  onUpdateQuantity,
  onToggleWishlist,
  onSelectProduct,
  isWishlisted = false,
}) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const resolved = resolveProductImage(product.image, product.name, product.category);
  const imageSrc =
    failedSrc === resolved ? resolveProductImage(null, product.name, product.category) : resolved;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (failedSrc !== resolved) {
      setFailedSrc(resolved);
    } else {
      handleImageErrorSafely(e, getCategoryFallback(product.category));
    }
  };

  const handleCardClick = () => {
    onSelectProduct?.(product);
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(product.id, cartQuantity + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateQuantity?.(product.id, Math.max(0, cartQuantity - 1));
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleWishlist?.(product.id);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      id={`product-${product.id}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`View product details for ${product.name}`}
      className="group relative rounded-[16px] sm:rounded-[20px] bg-white border border-[#eee7ed] hover:border-[#f1b8cb] p-2.5 sm:p-3.5 flex flex-col justify-between shadow-[0_2px_10px_rgba(50,31,63,0.03)] hover:shadow-[0_12px_32px_rgba(50,31,63,0.08)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden max-w-full touch-manipulation select-none"
    >
      {/* Product Image Container with Hardware-Accelerated Isolated Overflow Clipping */}
      <div className="relative w-full max-w-full aspect-square rounded-[12px] sm:rounded-[14px] overflow-hidden bg-white border border-[#f5edf2] mb-2 sm:mb-2.5 flex items-center justify-center isolate">
        <img
          src={imageSrc}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full max-w-full object-contain p-1 sm:p-1.5 transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
          decoding="async"
          onError={handleImageError}
        />

        {/* Top-Left Badges Stack with Proper Flex Spacing & No Overlap */}
        <div className="absolute top-1.5 left-1.5 flex flex-col items-start gap-1 max-w-[calc(100%-32px)] sm:max-w-[calc(100%-36px)] z-10 pointer-events-none">
          {discountPercent && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-full bg-[#D30915] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs">
              {discountPercent}% OFF
            </span>
          )}

          {product.badge && !discountPercent && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-[6px] sm:rounded-full bg-[#141219] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-wider shadow-xs truncate max-w-[76px] sm:max-w-[90px]">
              {product.badge}
            </span>
          )}
        </div>

        {/* Wishlist Button with Hover Glow */}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className={`absolute top-1.5 right-1.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs active:scale-90 z-20 focus-visible:ring-2 focus-visible:ring-[#D30915]/50 focus-visible:outline-none ${
            isWishlisted
              ? 'bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] shadow-[0_4px_12px_rgba(211,9,21,0.22)] scale-105'
              : 'bg-white/90 hover:bg-white text-[#716d77] hover:text-[#D30915] hover:shadow-[0_4px_12px_rgba(211,9,21,0.2)] hover:scale-110'
          }`}
        >
          <Heart
            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-200 ${
              isWishlisted
                ? 'fill-[#D30915] text-[#D30915] scale-110'
                : 'text-[#716d77] hover:text-[#D30915]'
            }`}
          />
        </button>

        {/* Surprise Pill Tag at Bottom of Image with Strict Truncation and No Overflow */}
        {product.surpriseValue && (
          <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-white/95 backdrop-blur-xs rounded-[6px] sm:rounded-[8px] px-1.5 sm:px-2 py-0.5 border border-[#f2e6ec] flex items-center gap-1 shadow-2xs z-10 pointer-events-none overflow-hidden max-w-[calc(100%-12px)]">
            <Sparkles className="w-2.5 h-2.5 text-[#D30915] shrink-0 animate-pulse" />
            <span className="text-[8.5px] sm:text-[10px] font-bold text-[#141219] truncate leading-tight">
              {product.surpriseValue}
            </span>
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="px-0.5 sm:px-1 pt-1 sm:pt-1.5 flex-1 flex flex-col justify-between">
        <div>
          {/* Rating & Category */}
          <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[10px] mb-1">
            <span className="font-bold text-[#716d77] uppercase tracking-wider truncate max-w-[62%] sm:max-w-[68%]">
              {product.category}
            </span>
            <div className="flex items-center gap-0.5 font-extrabold text-[#141219] shrink-0">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#ffa000] text-[#ffa000]" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-[#8a858f] font-normal text-[8.5px] sm:text-[9px]">({product.reviewCount})</span>
            </div>
          </div>

          {/* Product Name */}
          <h3 className="text-[11.5px] sm:text-[13px] font-bold text-[#141219] leading-snug line-clamp-2 m-0 mb-1 group-hover:text-[#D30915] transition-colors min-h-[1.9rem] sm:min-h-[2.1rem]">
            {product.name}
          </h3>
        </div>

        {/* Price & Quick ADD Stepper Row */}
        <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-[#f5edf2] flex items-center justify-between gap-1">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-black text-[#141219] leading-none">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-[9px] sm:text-[10px] text-[#817c85] line-through mt-0.5 leading-none">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Quick-Commerce ADD Button with Hover Elevation & Glow */}
          {cartQuantity === 0 ? (
            <button
              type="button"
              onClick={handleAdd}
              className="h-[28px] sm:h-[34px] px-2.5 sm:px-3.5 rounded-[8px] sm:rounded-[10px] bg-[#fff5f5] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] hover:border-[#D30915] text-[10.5px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-0.5 sm:gap-1 shadow-2xs hover:shadow-[0_6px_20px_rgba(211,9,21,0.32)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50 shrink-0"
              aria-label={`Add ${product.name} to cart`}
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              <span>ADD</span>
            </button>
          ) : (
            <div className="h-[28px] sm:h-[34px] rounded-[8px] sm:rounded-[10px] bg-[#D30915] text-white flex items-center px-0.5 sm:px-1 font-black text-[11px] sm:text-xs shadow-[0_6px_18px_rgba(211,9,21,0.28)] shrink-0">
              <button
                type="button"
                onClick={handleDecrement}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] sm:rounded-[7px] flex items-center justify-center hover:bg-black/15 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                aria-label={`Decrease ${product.name} quantity`}
              >
                <Minus className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </button>

              <span className="w-4 sm:w-6 text-center text-[11px] sm:text-xs font-black select-none">
                {cartQuantity}
              </span>

              <button
                type="button"
                onClick={handleIncrement}
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-[6px] sm:rounded-[7px] flex items-center justify-center hover:bg-black/15 active:scale-90 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
                aria-label={`Increase ${product.name} quantity`}
              >
                <Plus className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 stroke-[3]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';
