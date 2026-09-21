import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Gem,
  DollarSign,
  ShieldCheck,
  Truck,
  Star,
  CheckCircle2,
  Package,
  Flame,
  Gift,
} from 'lucide-react';
import { categoriesData } from '../data/categories';
import { productsData } from '../data/products';
import { deduplicateProducts } from '../utils/productUtils';
import { Skeleton } from '../components/ui/Skeleton';
import { sessionTracker } from '../utils/sessionTracker';

interface CategoriesProps {
  onSelectCategory: (categoryName: string) => void;
  onBackToHome: () => void;
}

type RevealFilter = 'all' | 'jewelry' | 'cash' | 'bath';

export const Categories: React.FC<CategoriesProps> = ({
  onSelectCategory,
  onBackToHome,
}) => {
  const [activeFilter, setActiveFilter] = useState<RevealFilter>('all');
  const [isLoading, setIsLoading] = useState(() => sessionTracker.isFirstVisit('categories'));

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const filteredCategories = categoriesData.filter((cat) => {
    if (activeFilter === 'jewelry') return cat.name.includes('Jewelry') || cat.name === 'Wax Melts';
    if (activeFilter === 'cash') return cat.name.includes('Cash');
    if (activeFilter === 'bath') return cat.name === 'Bath & Body' || cat.name === 'Soaps' || cat.name === 'Slimes';
    return true;
  });

  return (
    <div className="max-w-[1460px] mx-auto px-3 sm:px-6 py-3 sm:py-8 animate-in fade-in duration-300">
      
      {/* 1. Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6 pb-2.5 sm:pb-3 border-b border-[#f2edf1]">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#D30915] hover:underline cursor-pointer active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs text-[#716d77] font-medium">
          <span>Home</span>
          <span>/</span>
          <span className="text-[#141219] font-bold">All Collections</span>
        </div>
      </div>

      {/* 2. Premium Hero Showcase Banner */}
      <div className="relative rounded-[20px] sm:rounded-[34px] overflow-hidden border border-[#f1dbe8] bg-[radial-gradient(circle_at_85%_20%,rgba(255,203,222,0.45),transparent_45%),linear-gradient(135deg,#fffafb_0%,#fff3f8_45%,#faf4ff_100%)] p-4 sm:p-8 lg:p-12 mb-6 sm:mb-10 shadow-[0_12px_36px_rgba(50,31,63,0.05)]">
        
        {/* Soft Radial Ambient Glow */}
        <div className="absolute top-0 right-0 w-72 sm:w-96 h-72 sm:h-96 bg-gradient-to-br from-[#D30915]/12 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Eyebrow Pill Tag */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#D30915]/10 border border-[#fecdd3] text-[#D30915] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.16em] mb-2.5 sm:mb-3.5 shadow-2xs">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-pulse text-[#D30915]" />
            <span>Discover Collections</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#141219] tracking-tight leading-[1.15] sm:leading-[1.1] m-0 mb-2.5 sm:mb-3.5 font-display">
            Explore All Collections{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#ff3880] to-[#B60711]">
              with Guaranteed Wins
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xs sm:text-sm lg:text-base text-[#55505a] leading-relaxed m-0 mb-4 sm:mb-6 font-medium max-w-2xl">
            Browse our complete collection of handcrafted surprise reveals. Every candle, melt, bath bomb, and soap is guaranteed to contain authentic cash bills or certified fine jewelry.
          </p>

          {/* 3 Quick Value Badges (Mobile Compact & Touch Friendly) */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-3 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-[12px] sm:rounded-[15px] bg-white/95 border border-[#ebdce5] shadow-2xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 shadow-2xs">
                <Gem className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">Up to $7,500</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77] block truncate">Fine Jewelry</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-[12px] sm:rounded-[15px] bg-white/95 border border-[#ebdce5] shadow-2xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                <DollarSign className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">Up to $2,500</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77] block truncate">Real Cash</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-center text-center sm:text-left gap-1 sm:gap-2.5 p-2 sm:px-3.5 sm:py-2.5 rounded-[12px] sm:rounded-[15px] bg-white/95 border border-[#ebdce5] shadow-2xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-[8px] sm:rounded-[10px] bg-[#fbf5ff] text-[#54217f] flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">100% Win</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77] block truncate">Guaranteed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Reveal Filter Tabs (Smooth Horizontal Swipe on Mobile) */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 mb-5 sm:mb-6 scrollbar-none snap-x -mx-3 px-3 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[
            { id: 'all', label: 'All Collections', count: categoriesData.length },
            { id: 'jewelry', label: '💍 Jewelry Reveals', count: 3 },
            { id: 'cash', label: '💵 Cash Reveals', count: 2 },
            { id: 'bath', label: '✨ Bath & Body', count: 3 },
          ].map((tab) => {
            const isSelected = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id as RevealFilter)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer snap-start shrink-0 flex items-center gap-1.5 active:scale-95 ${
                  isSelected
                    ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.3)]'
                    : 'bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] border border-[#ebdce5]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#716d77]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <span className="hidden sm:inline-block text-xs font-bold text-[#716d77] shrink-0">
          Showing {filteredCategories.length} Collections
        </span>
      </div>

      {/* 4. Responsive Categories Grid */}
      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 mb-8 sm:mb-14"
          role="status"
          aria-label="Loading collections"
        >
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[22px] sm:rounded-[28px] bg-white border border-[#eee7ed] p-4 sm:p-6 flex flex-col justify-between shadow-2xs"
            >
              <div className="w-full aspect-4/3 sm:aspect-16/10 rounded-[18px] sm:rounded-[22px] bg-gray-700 skeleton-shimmer mb-3 sm:mb-4" />
              <Skeleton className="h-5 w-3/4 rounded-md mb-2" />
              <Skeleton className="h-3.5 w-full rounded-md mb-1.5" />
              <Skeleton className="h-3.5 w-2/3 rounded-md" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6 mb-8 sm:mb-14">
          {filteredCategories.map((category) => {
          const categoryProducts = productsData.filter((p) => p.category === category.name);
          const productCount = categoryProducts.length;
          const isCash = category.name.includes('Cash');
          
          // Calculate lowest starting price in this category
          const minPrice = categoryProducts.length > 0
            ? Math.min(...categoryProducts.map((p) => p.price))
            : 18.95;

          // Top 3 companion product thumbnails
          const previewThumbs = deduplicateProducts(categoryProducts).slice(0, 3);

          return (
            <div
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              className="group relative rounded-[22px] sm:rounded-[28px] bg-white border border-[#eee7ed] hover:border-[#f1b8cb] active:border-[#D30915] p-4 sm:p-6 flex flex-col justify-between shadow-[0_4px_20px_rgba(50,31,63,0.03)] hover:shadow-[0_20px_45px_rgba(211, 9, 21,0.12)] sm:hover:-translate-y-1.5 active:scale-[0.985] transition-all duration-200 cursor-pointer"
            >
              <div>
                {/* Image Showcase Container with Glassmorphic Badge */}
                <div className="relative w-full aspect-4/3 sm:aspect-16/10 rounded-[18px] sm:rounded-[22px] overflow-hidden bg-gradient-to-b from-[#fffafb] to-[#fff1f6] p-3 sm:p-4 flex items-center justify-center mb-3 sm:mb-4 isolate">
                  <img
                    src={category.image}
                    alt={category.name}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-108 will-change-transform"
                  />

                  {/* Dynamic Product Count Badge */}
                  <span className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/95 backdrop-blur-md text-[#141219] text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-2xs border border-[#f2e6ec]">
                    {productCount} {productCount === 1 ? 'Product' : 'Products'}
                  </span>

                  {/* Surprise Type Tag */}
                  <div className="absolute bottom-2.5 left-2.5 sm:bottom-3 sm:left-3 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#f2e6ec] flex items-center gap-1 shadow-2xs">
                    {isCash ? (
                      <>
                        <DollarSign className="w-3 h-3 text-emerald-600 stroke-[3]" />
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-800">Cash Reveals</span>
                      </>
                    ) : (
                      <>
                        <Gem className="w-3 h-3 text-[#D30915]" />
                        <span className="text-[9px] sm:text-[10px] font-extrabold text-[#D30915]">Jewelry Reveals</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Category Name & Tagline */}
                <div className="mb-1.5 sm:mb-2">
                  <span className="block text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] mb-0.5 sm:mb-1">
                    {category.tagline}
                  </span>
                  <h3 className="text-base sm:text-xl font-black text-[#141219] group-hover:text-[#D30915] transition-colors m-0 font-display">
                    {category.name}
                  </h3>
                </div>

                {/* Description */}
                <p className="text-[11px] sm:text-xs text-[#716d77] leading-relaxed m-0 mb-3 sm:mb-4 line-clamp-2 font-medium">
                  {category.description}
                </p>

                {/* Mini Preview Product Bubbles */}
                {previewThumbs.length > 0 && (
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 p-1.5 sm:p-2 rounded-[12px] sm:rounded-[14px] bg-[#fffafc] border border-[#f5edf2]">
                    <span className="text-[9px] sm:text-[10px] font-bold text-[#8a858f] mr-0.5">Preview:</span>
                    <div className="flex items-center -space-x-1.5 sm:-space-x-2">
                      {previewThumbs.map((p) => (
                        <img
                          key={p.id}
                          src={p.image}
                          alt={p.name}
                          title={p.name}
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border-2 border-white shadow-2xs"
                        />
                      ))}
                    </div>
                    <span className="text-[10px] sm:text-[11px] font-black text-[#141219] ml-auto">
                      From ${minPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button Strip */}
              <div className="pt-2.5 sm:pt-3.5 border-t border-[#f7edf3] flex items-center justify-between">
                <span className="text-xs font-black text-[#D30915] group-hover:underline flex items-center gap-1">
                  Explore Collection{' '}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                </span>

                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold">
                  {isCash ? (
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Win up to $2,500
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[#D30915] bg-[#fff1f2] px-2 sm:px-2.5 py-0.5 rounded-full border border-[#fecdd3]">
                      Valued up to $7,500
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* 5. "How It Works" 3-Step Unboxing Experience Strip (Light Luxury Theme) */}
      <div className="rounded-[20px] sm:rounded-[28px] bg-[radial-gradient(circle_at_85%_15%,rgba(255,203,222,0.35),transparent_40%),linear-gradient(135deg,#fffafb_0%,#fff5f8_50%,#fbf6ff_100%)] p-4 sm:p-8 lg:p-10 mb-8 sm:mb-12 shadow-[0_12px_36px_rgba(50,31,63,0.04)] border border-[#ebdce5] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 sm:w-80 h-72 sm:h-80 bg-gradient-to-br from-[#D30915]/8 to-purple-500/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center mb-5 sm:mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#D30915]/10 border border-[#fecdd3] text-[#D30915] text-[9px] sm:text-[11px] font-black uppercase tracking-wider mb-2 shadow-2xs">
            <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-[#D30915] animate-pulse" />
            <span>The Magic Unboxing</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#141219] m-0 mb-1.5 sm:mb-2 font-display">
            How The Real Surprise Reveal Works
          </h2>
          <p className="text-[11px] sm:text-xs lg:text-sm text-[#55505a] max-w-lg mx-auto m-0 font-medium">
            Every product is hand-poured in the USA with 100% organic soy wax and genuine hidden treasures.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 relative z-10 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="rounded-[18px] sm:rounded-[22px] bg-white/95 backdrop-blur-md p-4 sm:p-6 border border-[#eedce6] shadow-2xs hover:shadow-md hover:border-[#f1b8cb] flex flex-col items-center text-center transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mb-2.5 sm:mb-3.5 shadow-2xs">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-[#D30915] tracking-wider mb-0.5 sm:mb-1">Step 01</span>
            <h4 className="text-sm sm:text-base font-black text-[#141219] mb-1 sm:mb-1.5 m-0 font-display">Light & Enjoy Scent</h4>
            <p className="text-[11px] sm:text-xs text-[#716d77] m-0 leading-relaxed font-medium">
              Burn your candle or drop your bath bomb to fill your home with soothing, premium essential oils.
            </p>
          </div>

          {/* Step 2 */}
          <div className="rounded-[18px] sm:rounded-[22px] bg-white/95 backdrop-blur-md p-4 sm:p-6 border border-[#eedce6] shadow-2xs hover:shadow-md hover:border-amber-200 flex flex-col items-center text-center transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-2.5 sm:mb-3.5 shadow-2xs">
              <Package className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-amber-600 tracking-wider mb-0.5 sm:mb-1">Step 02</span>
            <h4 className="text-sm sm:text-base font-black text-[#141219] mb-1 sm:mb-1.5 m-0 font-display">Find The Pouch</h4>
            <p className="text-[11px] sm:text-xs text-[#716d77] m-0 leading-relaxed font-medium">
              As the wax melts down, a sealed foil pouch and protective capsule emerges safely from the core.
            </p>
          </div>

          {/* Step 3 */}
          <div className="rounded-[18px] sm:rounded-[22px] bg-white/95 backdrop-blur-md p-4 sm:p-6 border border-[#eedce6] shadow-2xs hover:shadow-md hover:border-emerald-200 flex flex-col items-center text-center transition-all">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[14px] sm:rounded-[16px] bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-2.5 sm:mb-3.5 shadow-2xs">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-700 tracking-wider mb-0.5 sm:mb-1">Step 03</span>
            <h4 className="text-sm sm:text-base font-black text-[#141219] mb-1 sm:mb-1.5 m-0 font-display">Reveal Your Prize</h4>
            <p className="text-[11px] sm:text-xs text-[#716d77] m-0 leading-relaxed font-medium">
              Unwrap your authentic prize: crisp cash up to $2,500 or real appraised fine jewelry up to $7,500!
            </p>
          </div>
        </div>
      </div>

      {/* 6. Trust & Guarantee Strip (2-Column Grid on Mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 p-3.5 sm:p-5 rounded-[18px] sm:rounded-[24px] bg-[#fffafc] border border-[#f2e6ee] shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-white border border-[#fecdd3] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">100% Win Rate</strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate">In every item</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-white border border-[#fecdd3] text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">Free Shipping</strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate">Orders $50+</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-white border border-[#fecdd3] text-[#D30915] flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">Made in USA</strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate">100% Soy Wax</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[14px] bg-white border border-[#fecdd3] text-amber-500 flex items-center justify-center shrink-0 shadow-2xs">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 fill-amber-500" />
          </div>
          <div className="min-w-0">
            <strong className="block text-[11px] sm:text-xs font-black text-[#141219] truncate">4.9 / 5 Stars</strong>
            <span className="text-[9px] sm:text-[11px] text-[#716d77] block truncate">2,400+ Reviews</span>
          </div>
        </div>
      </div>

    </div>
  );
};
