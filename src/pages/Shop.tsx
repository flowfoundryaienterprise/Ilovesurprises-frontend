import React, { useState, useMemo, useEffect } from 'react';
import {
  DesktopFilterMegaPanel,
  ActiveFilterChips,
  MobileFilterModal,
  MobileSortModal,
} from '../components/products/ProductFilters';
import {
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  type FilterState,
} from '../components/products/filterConstants';
import { ProductGrid } from '../components/products/ProductGrid';
import { productsData } from '../data/products';
import { productService } from '../services/productService';
import { deduplicateProducts } from '../utils/productUtils';
import type { Product, CartItem, SurpriseType } from '../types';
import {
  SlidersHorizontal,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react';

interface ShopProps {
  cart?: CartItem[];
  wishlistIds?: string[];
  initialCategory?: string;
  initialSearchQuery?: string;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

// Helper to filter products against any FilterState
function filterProducts(
  products: Product[],
  filters: FilterState,
  searchQuery: string
): Product[] {
  return products
    .filter((p) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesSurprise = p.surpriseValue?.toLowerCase().includes(q) ?? false;
        const matchesScent = p.scentNotes?.some((s) => s.toLowerCase().includes(q)) ?? false;
        const matchesDesc = p.description?.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesCategory && !matchesSurprise && !matchesScent && !matchesDesc) {
          return false;
        }
      }

      // 2. Categories filter (OR logic among selected categories with smart hierarchy matching)
      if (filters.categories.length > 0) {
        const matchesCat = filters.categories.some((cat) => {
          if (cat === p.category) return true;
          const catNorm = cat.toLowerCase().trim();
          const prodCatNorm = p.category.toLowerCase().trim();

          // Parent category umbrellas
          if (catNorm === 'candles' && prodCatNorm.includes('candle')) return true;
          if ((catNorm === 'bath + bombs' || catNorm === 'bath & body') && (prodCatNorm.includes('bath') || prodCatNorm.includes('body'))) return true;
          if (catNorm === 'wax melts' && prodCatNorm.includes('wax')) return true;
          if (catNorm === 'soaps' && prodCatNorm.includes('soap')) return true;
          if (catNorm === 'slimes' && prodCatNorm.includes('slime')) return true;
          if (catNorm === 'jewelry' && (prodCatNorm.includes('jewelry') || p.surpriseType === 'jewelry')) return true;

          // Subcategory name / keyword matching against product name or description
          if (catNorm.includes('zodiac') && (p.name.toLowerCase().includes('zodiac') || p.description?.toLowerCase().includes('zodiac'))) return true;
          const rootNorm = catNorm.replace(/s$/i, '');
          if (p.name.toLowerCase().includes(catNorm) || p.name.toLowerCase().includes(rootNorm)) return true;
          if (p.description?.toLowerCase().includes(catNorm) || p.description?.toLowerCase().includes(rootNorm)) return true;
          if (p.scentNotes?.some((s) => s.toLowerCase().includes(catNorm) || s.toLowerCase().includes(rootNorm))) return true;

          return false;
        });

        if (!matchesCat) {
          return false;
        }
      }

      // 3. Price range filter
      if (filters.minPrice !== null && p.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== null && p.price > filters.maxPrice) {
        return false;
      }

      // 4. Customer Rating filter
      if (filters.minRating !== null && p.rating < filters.minRating) {
        return false;
      }

      // 5. Surprise Prize Type filter (OR logic)
      if (filters.surpriseTypes.length > 0) {
        if (!filters.surpriseTypes.includes(p.surpriseType)) {
          return false;
        }
      }

      // 6. Discount filter
      if (filters.minDiscount !== null) {
        if (!p.originalPrice || p.originalPrice <= p.price) return false;
        const discountPct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        if (discountPct < filters.minDiscount) return false;
      }

      // 7. Best Sellers Only
      if (filters.bestSellersOnly && !p.isBestSeller) {
        return false;
      }

      // 8. New Arrivals Only
      if (filters.newArrivalsOnly && !p.isNew) {
        return false;
      }

      // 9. In Stock Only
      if (filters.inStockOnly && !p.inStock) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price-asc') return a.price - b.price;
      if (filters.sortBy === 'price-desc') return b.price - a.price;
      if (filters.sortBy === 'rating') return b.rating - a.rating;
      if (filters.sortBy === 'best-sellers') return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      return 0; // Default Featured preserved
    });
}

export const Shop: React.FC<ShopProps> = ({
  cart = [],
  wishlistIds = [],
  initialCategory = 'All Surprises',
  initialSearchQuery = '',
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  // Active filters currently applied to the product catalog
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => {
    return {
      ...DEFAULT_FILTERS,
      categories:
        initialCategory && initialCategory !== 'All Surprises'
          ? [initialCategory]
          : [],
    };
  });

  // Draft filters chosen in the sidebar / modal before pressing "Search by Filter"
  const [draftFilters, setDraftFilters] = useState<FilterState>(appliedFilters);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isMobileSortOpen, setIsMobileSortOpen] = useState(false);
  const [isDesktopFilterOpen, setIsDesktopFilterOpen] = useState(false);
  const [isDesktopClosing, setIsDesktopClosing] = useState(false);
  const [isDesktopSortOpen, setIsDesktopSortOpen] = useState(false);

  const handleOpenDesktopFilter = () => {
    setDraftFilters(appliedFilters);
    setIsDesktopClosing(false);
    setIsDesktopFilterOpen(true);
  };

  const handleCloseDesktopFilter = () => {
    setIsDesktopClosing(true);
    setTimeout(() => {
      setIsDesktopFilterOpen(false);
      setIsDesktopClosing(false);
    }, 300);
  };

  const handleToggleDesktopFilter = () => {
    if (isDesktopFilterOpen) {
      handleCloseDesktopFilter();
    } else {
      handleOpenDesktopFilter();
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [prevCategory, setPrevCategory] = useState(initialCategory);
  if (initialCategory !== prevCategory) {
    setPrevCategory(initialCategory);
    const newInitial = {
      ...DEFAULT_FILTERS,
      categories:
        initialCategory && initialCategory !== 'All Surprises'
          ? [initialCategory]
          : [],
    };
    setAppliedFilters(newInitial);
    setDraftFilters(newInitial);
    setCurrentPage(1);
  }

  const [prevSearchQuery, setPrevSearchQuery] = useState(initialSearchQuery);
  if (initialSearchQuery !== prevSearchQuery) {
    setPrevSearchQuery(initialSearchQuery);
    setSearchQuery(initialSearchQuery);
    setCurrentPage(1);
  }
  const [serverProducts, setServerProducts] = useState<Product[] | null>(null);
  const [serverTotal, setServerTotal] = useState<number | null>(null);
  const [serverTotalPages, setServerTotalPages] = useState<number>(1);
  const [isFetchingProducts, setIsFetchingProducts] = useState<boolean>(true);

  useEffect(() => {
    let isCancelled = false;

    const sortParam =
      appliedFilters.sortBy === 'price-asc'
        ? 'price-asc'
        : appliedFilters.sortBy === 'price-desc'
        ? 'price-desc'
        : appliedFilters.sortBy === 'rating'
        ? 'rating'
        : appliedFilters.sortBy === 'best-sellers'
        ? 'best-sellers'
        : 'featured';

    productService
      .getProducts({
        page: currentPage,
        limit: 15,
        category: appliedFilters.categories[0],
        searchQuery,
        minPrice: appliedFilters.minPrice,
        maxPrice: appliedFilters.maxPrice,
        surpriseTypes: appliedFilters.surpriseTypes as SurpriseType[],
        sort: sortParam,
      })
      .then((res) => {
        if (!isCancelled && res) {
          setServerProducts(res.products);
          setServerTotal(res.total);
          setServerTotalPages(res.totalPages);
          setIsFetchingProducts(false);
        }
      })
      .catch((err) => {
        console.warn('Error fetching products from service:', err);
        if (!isCancelled) {
          setIsFetchingProducts(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [currentPage, appliedFilters, searchQuery]);

  // Active applied products shown in the grid (fallback in-memory)
  const filteredProducts = useMemo(() => {
    return filterProducts(productsData, appliedFilters, searchQuery);
  }, [searchQuery, appliedFilters]);

  const activeProducts = useMemo(() => {
    if (serverProducts !== null) {
      return deduplicateProducts(serverProducts);
    }
    const from = (currentPage - 1) * 15;
    const to = from + 15;
    return deduplicateProducts(filteredProducts).slice(from, to);
  }, [serverProducts, filteredProducts, currentPage]);

  const totalPages = serverProducts !== null ? serverTotalPages : Math.max(1, Math.ceil(filteredProducts.length / 15));

  const displayTotalCount = serverTotal ?? productsData.length;

  // Draft matching products (shown on the "Search by Filter (X)" button)
  const draftFilteredProducts = useMemo(() => {
    return filterProducts(productsData, draftFilters, searchQuery);
  }, [searchQuery, draftFilters]);

  // Apply draft filters when "Search by Filter" / "Show Results" is clicked and auto-close filter panel
  const handleApplyFilters = () => {
    setAppliedFilters(draftFilters);
    setIsDesktopFilterOpen(false);
    setIsMobileFilterOpen(false);
  };

  // Reset both draft and applied filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
  };

  // When a chip is removed directly from active filters
  const handleActiveFilterChipChange = (newFilters: FilterState) => {
    setAppliedFilters(newFilters);
    setDraftFilters(newFilters);
  };

  // Direct Sort Change
  const handleSortChange = (newSort: FilterState['sortBy']) => {
    setAppliedFilters((prev) => ({ ...prev, sortBy: newSort }));
    setDraftFilters((prev) => ({ ...prev, sortBy: newSort }));
  };

  const activeFiltersCount =
    appliedFilters.categories.length +
    (appliedFilters.minPrice !== null || appliedFilters.maxPrice !== null ? 1 : 0) +
    (appliedFilters.minRating !== null ? 1 : 0) +
    appliedFilters.surpriseTypes.length +
    (appliedFilters.minDiscount !== null ? 1 : 0) +
    (appliedFilters.bestSellersOnly ? 1 : 0) +
    (appliedFilters.newArrivalsOnly ? 1 : 0) +
    (appliedFilters.inStockOnly ? 1 : 0);

  const currentSortLabel =
    SORT_OPTIONS.find((s) => s.id === appliedFilters.sortBy)?.label || 'Featured Reveals';

  return (
    <div className="max-w-[1460px] mx-auto px-2.5 sm:px-6 pt-1 sm:pt-6 pb-4 sm:pb-8 animate-in fade-in duration-300">

      {/* Mobile Sticky / Top Filter & Sort Bar */}
      <div className="lg:hidden sticky top-[54px] z-30 bg-white/95 backdrop-blur-md py-1.5 px-0 mb-2 border-b border-[#f2e6ee] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            setDraftFilters(appliedFilters);
            setIsMobileFilterOpen(true);
          }}
          className={`flex-1 h-[38px] sm:h-[42px] rounded-[11px] sm:rounded-[13px] border flex items-center justify-center gap-2 text-xs font-black active:scale-95 transition-all cursor-pointer shadow-2xs ${activeFiltersCount > 0
            ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915]'
            : 'bg-white border-[#ebdce5] hover:border-[#D30915] text-[#141219]'
            }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#D30915] text-white text-[9px] sm:text-[10px] flex items-center justify-center font-black">
              {activeFiltersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setIsMobileSortOpen(true)}
          className="flex-1 h-[38px] sm:h-[42px] rounded-[11px] sm:rounded-[13px] bg-white border border-[#ebdce5] hover:border-[#D30915] text-[#141219] flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 transition-all cursor-pointer shadow-2xs"
        >
          <ArrowUpDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#716d77]" />
          <span className="truncate max-w-[120px]">{currentSortLabel}</span>
        </button>
      </div>

      {/* Main Top Control Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5 sm:mb-4 pb-2.5 sm:pb-3.5 border-b border-[#f2edf1]">

        {/* Left: Desktop Filters Toggle Button + Count */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleDesktopFilter}
            className={`hidden lg:flex items-center gap-2 h-[38px] px-3.5 rounded-[12px] border font-black text-xs active:scale-95 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-xs ${isDesktopFilterOpen || activeFiltersCount > 0
              ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915]'
              : 'bg-white border-[#ebdce5] text-[#141219] hover:border-[#D30915] hover:text-[#D30915]'
              }`}
            aria-expanded={isDesktopFilterOpen}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>{isDesktopFilterOpen ? 'Hide Filters' : 'Filters'}</span>
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#D30915] text-white text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#141219] m-0 tracking-tight font-display">
              Surprise Catalog
            </h1>
            <p className="text-xs text-[#716d77] m-0 font-medium">
              Showing <strong className="text-[#141219] font-black">{activeProducts.length}</strong> of{' '}
              <strong className="text-[#141219] font-black">{displayTotalCount}</strong> reveals
            </p>
          </div>
        </div>

        {/* Right: Desktop Sort Dropdown */}
        <div className="hidden sm:flex items-center gap-2 relative">
          <span className="text-xs font-bold text-[#716d77]">Sort by:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDesktopSortOpen(!isDesktopSortOpen)}
              className="flex items-center gap-2 h-[38px] px-3.5 rounded-[12px] bg-white border border-[#ebdce5] hover:border-[#D30915] text-xs font-black text-[#141219] shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer"
              aria-expanded={isDesktopSortOpen}
            >
              <span>{currentSortLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#716d77] transition-transform ${isDesktopSortOpen ? 'rotate-180 text-[#D30915]' : ''
                  }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDesktopSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 p-1.5 bg-white rounded-[16px] border border-[#f0dae7] shadow-[0_12px_36px_rgba(50,31,63,0.15)] z-40 animate-in fade-in zoom-in-95 duration-150">
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = appliedFilters.sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        handleSortChange(opt.id);
                        setIsDesktopSortOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-[10px] text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${isSelected
                        ? 'bg-[#fff1f2] text-[#D30915] font-black'
                        : 'hover:bg-[#fff9fb] text-[#141219]'
                        }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <span className="text-xs font-black text-[#D30915]">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Desktop Filter Mega Panel (Expands smoothly beneath top toolbar) */}
      {(isDesktopFilterOpen || isDesktopClosing) && (
        <div
          className={`hidden lg:block ${isDesktopClosing
            ? 'animate-panel-collapse pointer-events-none'
            : 'animate-panel-expand'
            }`}
        >
          <DesktopFilterMegaPanel
            filters={draftFilters}
            onFilterChange={setDraftFilters}
            onResetFilters={handleResetFilters}
            onApplyFilters={handleApplyFilters}
            onClose={handleCloseDesktopFilter}
            allProducts={productsData}
            totalResultsCount={draftFilteredProducts.length}
          />
        </div>
      )}

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={appliedFilters}
        onFilterChange={handleActiveFilterChipChange}
        onResetFilters={handleResetFilters}
      />

      {/* Product Grid Area (Full width with stable layout) */}
      <div id="shop-product-grid" className="w-full">
        <ProductGrid
          isLoading={isFetchingProducts && !serverProducts}
          products={activeProducts}
          searchQuery={searchQuery}
          cart={cart}
          wishlistIds={wishlistIds}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onWishlistToggle={onWishlistToggle}
          onSelectProduct={onSelectProduct}
          onResetFilters={handleResetFilters}
          isFullWidth={true}
          emptyMessage={
            searchQuery
              ? `No surprise products matching "${searchQuery}" with the selected filters.`
              : 'No surprise products match all your selected filters. Try broadening your criteria.'
          }
        />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 mb-4">
            <button
              type="button"
              onClick={() => {
                setCurrentPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage <= 1}
              className="px-4 py-2 rounded-xl border border-[#ebdce5] bg-white text-xs font-bold text-[#141219] hover:bg-[#faf5f8] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              Previous
            </button>
            <span className="text-xs font-black text-[#716d77] px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => {
                setCurrentPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={currentPage >= totalPages}
              className="px-4 py-2 rounded-xl border border-[#ebdce5] bg-white text-xs font-bold text-[#141219] hover:bg-[#faf5f8] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile Full-Screen Filter Panel Portal */}
      <MobileFilterModal
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={draftFilters}
        onFilterChange={setDraftFilters}
        onResetFilters={handleResetFilters}
        onApplyFilters={handleApplyFilters}
        allProducts={productsData}
        totalResultsCount={draftFilteredProducts.length}
      />

      {/* Mobile Sort Bottom Sheet Portal */}
      <MobileSortModal
        isOpen={isMobileSortOpen}
        onClose={() => setIsMobileSortOpen(false)}
        currentSort={appliedFilters.sortBy}
        onSelectSort={handleSortChange}
      />

    </div>
  );
};
