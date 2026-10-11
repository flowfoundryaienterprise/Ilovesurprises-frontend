import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { useProducts } from '../hooks/useProducts';
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
  onClearSearch?: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export const Shop: React.FC<ShopProps> = ({
  cart = [],
  wishlistIds = [],
  initialCategory = 'All Surprises',
  initialSearchQuery = '',
  onClearSearch,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q') || params.get('search');
      if (q) return q;
    }
    return initialSearchQuery;
  });

  // Active filters currently applied to the product catalog
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(() => {
    let cat = initialCategory && initialCategory !== 'All Surprises' ? [initialCategory] : [];
    let minPrice: number | null = null;
    let maxPrice: number | null = null;
    let sortBy: FilterState['sortBy'] = 'featured';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCat = params.get('category');
      if (urlCat && urlCat !== 'All Surprises' && urlCat !== 'All') {
        cat = [urlCat];
      }
      const urlMin = params.get('minPrice');
      if (urlMin && !isNaN(Number(urlMin))) {
        minPrice = Number(urlMin);
      }
      const urlMax = params.get('maxPrice');
      if (urlMax && !isNaN(Number(urlMax))) {
        maxPrice = Number(urlMax);
      }
      const urlSort = params.get('sort');
      if (urlSort) {
        sortBy = urlSort as any;
      }
    }

    return {
      ...DEFAULT_FILTERS,
      categories: cat,
      minPrice,
      maxPrice,
      sortBy,
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

  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const page = params.get('page');
      if (page && !isNaN(Number(page))) {
        return Math.max(1, Number(page));
      }
    }
    return 1;
  });
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
    // When a storewide search is performed or search query changes, clear category filters
    setAppliedFilters((prev) => ({
      ...prev,
      categories: [],
    }));
    setDraftFilters((prev) => ({
      ...prev,
      categories: [],
    }));
    setCurrentPage(1);
  }
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  // Responsive limit: 15 on Laptop/Desktop (3 complete rows of 5), 16 on Mobile/Tablet (8 complete rows of 2)
  const [isDesktop, setIsDesktop] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
  });

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageLimit = isDesktop ? 15 : 16;

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

  const {
    products: queryProducts,
    total: queryTotal,
    totalPages: queryTotalPages,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useProducts({
    page: currentPage,
    limit: pageLimit,
    category: appliedFilters.categories[0],
    searchQuery,
    minPrice: appliedFilters.minPrice,
    maxPrice: appliedFilters.maxPrice,
    surpriseTypes: appliedFilters.surpriseTypes as SurpriseType[],
    sort: sortParam,
  });

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  }, [refetch]);

  const isFetchingProducts = isQueryLoading && queryProducts.length === 0;
  const fetchError = queryError
    ? queryError.message ||
      'Unable to connect to the product catalog service. Please check your internet connection and try again.'
    : null;

  // Strict client-side price filter enforcement and pagination slice
  const activeProducts = useMemo(() => {
    let prods = deduplicateProducts(queryProducts);
    if (appliedFilters.minPrice !== null) {
      prods = prods.filter((p) => Number(p.price) >= Number(appliedFilters.minPrice));
    }
    if (appliedFilters.maxPrice !== null) {
      prods = prods.filter((p) => Number(p.price) <= Number(appliedFilters.maxPrice));
    }
    if (isDesktop && prods.length > 15) {
      return prods.slice(0, 15);
    }
    return prods;
  }, [queryProducts, isDesktop, appliedFilters.minPrice, appliedFilters.maxPrice]);

  // Synchronize search query, filter state, sorting, and page with URL query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (searchQuery.trim()) {
        url.searchParams.set('q', searchQuery.trim());
      } else {
        url.searchParams.delete('q');
        url.searchParams.delete('search');
      }
      if (appliedFilters.categories.length > 0) {
        url.searchParams.set('category', appliedFilters.categories[0]);
      } else {
        url.searchParams.delete('category');
      }
      if (appliedFilters.minPrice !== null) {
        url.searchParams.set('minPrice', String(appliedFilters.minPrice));
      } else {
        url.searchParams.delete('minPrice');
      }
      if (appliedFilters.maxPrice !== null) {
        url.searchParams.set('maxPrice', String(appliedFilters.maxPrice));
      } else {
        url.searchParams.delete('maxPrice');
      }
      if (appliedFilters.sortBy && appliedFilters.sortBy !== 'featured') {
        url.searchParams.set('sort', appliedFilters.sortBy);
      } else {
        url.searchParams.delete('sort');
      }
      if (currentPage > 1) {
        url.searchParams.set('page', String(currentPage));
      } else {
        url.searchParams.delete('page');
      }
      window.history.replaceState(null, '', url.pathname + url.search);
    } catch {
      // ignore
    }
  }, [searchQuery, appliedFilters, currentPage]);

  const totalPages = queryTotalPages || 1;
  const displayTotalCount = queryTotal ?? 0;

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
    setCurrentPage(1);
    onClearSearch?.();
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
            allProducts={queryProducts || []}
            totalResultsCount={queryTotal ?? undefined}
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
          isLoading={isFetchingProducts && !fetchError}
          products={activeProducts}
          searchQuery={searchQuery}
          cart={cart}
          wishlistIds={wishlistIds}
          errorMessage={fetchError}
          onRetry={handleRetry}
          isRetrying={isRetrying}
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
        allProducts={queryProducts || []}
        totalResultsCount={queryTotal ?? 0}
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
