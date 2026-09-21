import React from 'react';
import { ShieldCheck, Truck, RotateCcw, Lock } from 'lucide-react';
import { categoriesData } from '../../data/categories';
import { CategorySkeleton } from '../ui/CategorySkeleton';
import { handleImageErrorSafely, getCategoryFallback } from '../../utils/imageUtils';

interface CategorySectionProps {
  selectedCategory?: string;
  isLoading?: boolean;
  onSelectCategory?: (categoryId: string) => void;
  onSelectCollection?: (handle: string) => void;
  onViewAllCategories?: () => void;
}

export const CategorySection: React.FC<CategorySectionProps> = React.memo(({
  selectedCategory,
  isLoading = false,
  onSelectCategory,
  onSelectCollection,
  onViewAllCategories: _onViewAllCategories,
}) => {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const displayedCategories = React.useMemo(() => {
    return isExpanded ? categoriesData : categoriesData.slice(0, 6);
  }, [isExpanded]);

  const handleToggleCollections = () => {
    setIsExpanded((prev) => !prev);
  };

  const handleCardClick = (category: typeof categoriesData[0]) => {
    if (onSelectCollection) {
      onSelectCollection(category.slug);
    } else if (onSelectCategory) {
      onSelectCategory(category.name);
    }
  };

  return (
    <section id="categories" aria-label="Explore Collections" className="max-w-[1460px] mx-auto px-3 sm:px-6 pt-3 pb-6 sm:py-8">

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-2 mb-5 sm:mb-6">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-[0.18em] text-[#D30915] mb-1">
            Explore
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight m-0 font-display">
            Shop by Surprise
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
            Choose your favorite way to reveal something unexpected.
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleCollections}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#D30915] hover:text-[#B60711] hover:underline active:scale-95 transition-all self-center sm:self-end cursor-pointer"
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Show less collections' : `View all ${categoriesData.length} collections`}</span>
          <span className="text-[13px]">{isExpanded ? '↑' : '→'}</span>
        </button>
      </div>

      {/* 12 Category Cards Grid (3 per line on mobile, 6 on desktop by default; expandable to all 12) */}
      {isLoading ? (
        <div
          className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8"
          role="status"
          aria-label="Loading collections"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6 sm:mb-8 transition-all duration-300">
          {displayedCategories.map((category) => {
            const isSelected = selectedCategory === category.name || selectedCategory === category.id || selectedCategory === category.slug;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => handleCardClick(category)}
                className={`p-2 min-[375px]:p-2.5 sm:p-4 rounded-[16px] sm:rounded-[20px] border transition-all duration-300 flex flex-col items-center text-center cursor-pointer group hover:-translate-y-1.5 active:translate-y-0 active:scale-95 animate-in fade-in zoom-in-95 duration-200 ${isSelected
                  ? 'border-[#D30915] bg-[#fff1f2] shadow-[0_8px_24px_rgba(211,9,21,0.18)]'
                  : 'border-[#eee7ed] bg-white hover:border-[#f1b8cb] hover:bg-[#fff9fb] shadow-[0_4px_16px_rgba(50,31,63,0.03)] hover:shadow-[0_12px_28px_rgba(50,31,63,0.08)]'
                  }`}
              >
                {/* Category Image */}
                <div className="w-13 h-13 min-[375px]:w-15 min-[375px]:h-15 sm:w-20 sm:h-20 rounded-[14px] sm:rounded-[16px] overflow-hidden bg-gradient-to-b from-[#fffafb] to-[#fff1f6] p-1 flex items-center justify-center mb-1.5 sm:mb-3 shadow-2xs isolate">
                  <img
                    src={category.image}
                    alt={category.name}
                    width={80}
                    height={80}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => handleImageErrorSafely(e, getCategoryFallback(category.slug))}
                    className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                  />
                </div>

                {/* Title */}
                <strong className={`block text-[11px] min-[375px]:text-xs sm:text-[13px] font-black leading-tight mb-0.5 sm:mb-1 truncate w-full ${isSelected ? 'text-[#D30915]' : 'text-[#141219] group-hover:text-[#D30915]'
                  }`}>
                  {category.name}
                </strong>

                {/* Tagline */}
                <span className="text-[9px] min-[375px]:text-[10px] sm:text-[11px] text-[#716d77] leading-tight line-clamp-2 font-medium">
                  {category.tagline}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4-Item Guarantees Trust Bar (2 per line on mobile, exact same size and line heights) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 items-stretch w-full">
        {/* Item 1 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              100% Guarantee
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Love it or make it right
            </span>
          </div>
        </div>

        {/* Item 2 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              Free Shipping $75+
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Fast & reliable delivery
            </span>
          </div>
        </div>

        {/* Item 3 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              30-Day Returns
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Hassle-free process
            </span>
          </div>
        </div>

        {/* Item 4 */}
        <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-white border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-2xs h-full min-h-[58px] sm:min-h-[68px]">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate leading-tight">
              Secure Checkout
            </strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate leading-tight mt-0.5 font-medium">
              Safe & encrypted
            </span>
          </div>
        </div>
      </div>

    </section>
  );
});

CategorySection.displayName = 'CategorySection';
