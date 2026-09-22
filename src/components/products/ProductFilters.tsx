import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Star,
  DollarSign,
  Gem,
  Check,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  PackageCheck,
  Sparkles,
  Search,
} from 'lucide-react';
import { categoriesData } from '../../data/categories';
import type { Product } from '../../types';
import {
  type FilterState,
  PRICE_PRESETS,
  DISCOUNT_PRESETS,
  SORT_OPTIONS,
} from './filterConstants';

export type { FilterState };

interface FilterComponentProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  onApplyFilters?: () => void;
  onClose?: () => void;
  allProducts: Product[];
  totalResultsCount?: number;
}

// -------------------------------------------------------------
// 1. DESKTOP FILTER MEGA-PANEL (Dashboard-Style Top Expandable)
// -------------------------------------------------------------
export const DesktopFilterMegaPanel: React.FC<FilterComponentProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  onClose,
  allProducts,
  totalResultsCount,
}) => {
  const [customMin, setCustomMin] = useState(filters.minPrice !== null ? String(filters.minPrice) : '');
  const [customMax, setCustomMax] = useState(filters.maxPrice !== null ? String(filters.maxPrice) : '');

  // Toggle Category Checkbox
  const handleCategoryToggle = (categoryName: string) => {
    const isSelected = filters.categories.includes(categoryName);
    const updated = isSelected
      ? filters.categories.filter((c) => c !== categoryName)
      : [...filters.categories, categoryName];
    onFilterChange({ ...filters, categories: updated });
  };

  // Toggle Surprise Type Checkbox
  const handleSurpriseTypeToggle = (type: string) => {
    const isSelected = filters.surpriseTypes.includes(type);
    const updated = isSelected
      ? filters.surpriseTypes.filter((t) => t !== type)
      : [...filters.surpriseTypes, type];
    onFilterChange({ ...filters, surpriseTypes: updated });
  };

  // Apply Custom Price Min/Max
  const handleApplyCustomPrice = (e: React.FormEvent) => {
    e.preventDefault();
    const min = customMin.trim() !== '' ? Math.max(0, Number(customMin)) : null;
    const max = customMax.trim() !== '' ? Math.max(0, Number(customMax)) : null;
    if (min !== null && max !== null && min > max) {
      onFilterChange({ ...filters, minPrice: max, maxPrice: min });
    } else {
      onFilterChange({ ...filters, minPrice: min, maxPrice: max });
    }
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.minPrice !== null ||
    filters.maxPrice !== null ||
    filters.minRating !== null ||
    filters.surpriseTypes.length > 0 ||
    filters.inStockOnly ||
    filters.minDiscount !== null ||
    filters.bestSellersOnly;

  return (
    <div className="w-full bg-white rounded-[24px] border border-[#ebdce5] p-5 sm:p-6 shadow-[0_12px_40px_rgba(50,31,63,0.06)] mb-6 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-5 border-b border-[#f2e8ef]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#fff1f2] text-[#D30915] flex items-center justify-center border border-[#fecdd3]">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#141219] m-0 font-display">
              Filter Product Catalog
            </h3>
            <p className="text-[11px] text-[#716d77] m-0 font-medium">
              Select your criteria and click <strong>Search by Filter</strong> to reveal matches
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-black text-[#D30915] hover:underline flex items-center gap-1 cursor-pointer px-2.5 py-1 rounded-[8px] hover:bg-[#fff1f2]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#fffafc] border border-[#ebdce5] text-[#716d77] hover:text-[#141219] hover:border-[#D30915] flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
              aria-label="Close Filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 4-Column Filter Grid: All 4 Boxes with Exact Same Height (h-[270px]) and Exact Same Line Alignment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        
        {/* Box 1: Categories Card */}
        <div className="h-[270px] bg-[#fffbfc] border border-[#f3e4ed] rounded-[20px] p-4 flex flex-col justify-between shadow-2xs">
          <div className="h-[32px] flex items-center justify-between pb-2 mb-2 border-b border-[#f5ebf1] shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#141219]">
              Categories
            </span>
            <span className="text-[10px] text-[#D30915] font-bold">
              {categoriesData.length} Collections
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {categoriesData.map((cat) => {
              const isSelected = filters.categories.includes(cat.name);
              const count = allProducts.filter((p) => p.category === cat.name).length;
              return (
                <label
                  key={cat.id}
                  className={`flex items-center justify-between text-xs py-1 px-2 rounded-[8px] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                      : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleCategoryToggle(cat.name)}
                      className="w-3.5 h-3.5 rounded border-[#d1c4cd] text-[#D30915] focus:ring-[#D30915] cursor-pointer accent-[#D30915]"
                    />
                    <span className="truncate">{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-[#8a858f] font-semibold">({count})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Box 2: Price Presets & Custom Range Card */}
        <div className="h-[270px] bg-[#fffbfc] border border-[#f3e4ed] rounded-[20px] p-4 flex flex-col justify-between shadow-2xs">
          <div className="h-[32px] flex items-center justify-between pb-2 mb-2 border-b border-[#f5ebf1] shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#141219]">
              Price Range
            </span>
            <span className="text-[10px] text-[#8a858f] font-semibold">USD</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {PRICE_PRESETS.map((preset) => {
              const isSelected =
                filters.minPrice === preset.min && filters.maxPrice === preset.max;
              const count = allProducts.filter((p) => {
                if (preset.min !== null && p.price < preset.min) return false;
                if (preset.max !== null && p.price > preset.max) return false;
                return true;
              }).length;

              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      onFilterChange({ ...filters, minPrice: null, maxPrice: null });
                      setCustomMin('');
                      setCustomMax('');
                    } else {
                      onFilterChange({ ...filters, minPrice: preset.min, maxPrice: preset.max });
                      setCustomMin(preset.min !== null ? String(preset.min) : '');
                      setCustomMax(preset.max !== null ? String(preset.max) : '');
                    }
                  }}
                  className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-[8px] transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                      : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
                  }`}
                >
                  <span>{preset.label}</span>
                  <span className="text-[10px] text-[#8a858f]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Custom Min / Max Inputs */}
          <form onSubmit={handleApplyCustomPrice} className="pt-2 mt-auto border-t border-[#f4edf2] shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#8a858f] font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Min"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  className="w-full h-7 pl-4 pr-1 rounded-[8px] bg-white border border-[#ebdce5] text-xs font-bold text-[#141219] focus:border-[#D30915] outline-none"
                />
              </div>
              <span className="text-xs text-[#8a858f] font-bold">–</span>
              <div className="relative flex-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#8a858f] font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  placeholder="Max"
                  value={customMax}
                  onChange={(e) => setCustomMax(e.target.value)}
                  className="w-full h-7 pl-4 pr-1 rounded-[8px] bg-white border border-[#ebdce5] text-xs font-bold text-[#141219] focus:border-[#D30915] outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-7 px-2 rounded-[8px] bg-[#D30915] hover:bg-[#B60711] text-white text-[11px] font-black uppercase shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
              >
                Go
              </button>
            </div>
          </form>
        </div>

        {/* Box 3: Ratings & Surprise Reveal Type Card */}
        <div className="h-[270px] bg-[#fffbfc] border border-[#f3e4ed] rounded-[20px] p-4 flex flex-col justify-between shadow-2xs">
          <div className="h-[32px] flex items-center justify-between pb-2 mb-2 border-b border-[#f5ebf1] shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#141219]">
              Rating & Reveal
            </span>
            <span className="text-[10px] text-amber-500 font-bold">★ Verified</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {[
              { score: 4.8, label: '4.8★ Top Rated' },
              { score: 4.5, label: '4.5★ Highly Rated' },
              { score: 4.0, label: '4.0★ Great Reviews' },
              { score: 3.5, label: '3.5★ Good Reviews' },
            ].map((ratingItem) => {
              const isSelected = filters.minRating === ratingItem.score;
              const count = allProducts.filter((p) => p.rating >= ratingItem.score).length;

              return (
                <button
                  key={ratingItem.score}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      minRating: isSelected ? null : ratingItem.score,
                    })
                  }
                  className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-[8px] transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                      : 'hover:bg-white text-[#36323d] hover:text-[#D30915]'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.floor(ratingItem.score)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-xs">{ratingItem.score}★ & Up</span>
                  </div>
                  <span className="text-[10px] text-[#8a858f] font-bold">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-auto border-t border-[#f4edf2] space-y-1 shrink-0">
            {[
              { id: 'jewelry', label: 'Fine Jewelry Inside', icon: Gem, color: 'text-[#D30915]' },
              { id: 'cash', label: 'Real Cash Bills Inside', icon: DollarSign, color: 'text-emerald-700' },
              { id: 'mystery', label: 'Mystery Jackpot Item', icon: Sparkles, color: 'text-purple-600' },
            ].map((item) => {
              const isSelected = filters.surpriseTypes.includes(item.id);
              const count = allProducts.filter((p) => p.surpriseType === item.id).length;
              const Icon = item.icon;

              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between text-xs py-1 px-2 rounded-[8px] cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                      : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSurpriseTypeToggle(item.id)}
                      className="w-3.5 h-3.5 rounded border-[#d1c4cd] text-[#D30915] focus:ring-[#D30915] cursor-pointer accent-[#D30915]"
                    />
                    <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] text-[#8a858f]">({count})</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Box 4: Discounts & Availability Card */}
        <div className="h-[270px] bg-[#fffbfc] border border-[#f3e4ed] rounded-[20px] p-4 flex flex-col justify-between shadow-2xs">
          <div className="h-[32px] flex items-center justify-between pb-2 mb-2 border-b border-[#f5ebf1] shrink-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#141219]">
              Deals & Status
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">In Stock</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            {DISCOUNT_PRESETS.map((disc) => {
              const isSelected = filters.minDiscount === disc.id;
              const count = allProducts.filter((p) => {
                if (!p.originalPrice || p.originalPrice <= p.price) return false;
                const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
                return pct >= disc.id;
              }).length;

              return (
                <button
                  key={disc.id}
                  type="button"
                  onClick={() =>
                    onFilterChange({
                      ...filters,
                      minDiscount: isSelected ? null : disc.id,
                    })
                  }
                  className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-[8px] transition-all text-left cursor-pointer ${
                    isSelected
                      ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                      : 'hover:bg-white text-[#36323d] hover:text-[#D30915] font-bold'
                  }`}
                >
                  <span>{disc.label}</span>
                  <span className="text-[10px] text-[#8a858f]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 mt-auto border-t border-[#f4edf2] space-y-1 shrink-0">
            <label className={`flex items-center justify-between text-xs py-1 px-2 rounded-[8px] cursor-pointer transition-all ${
              filters.bestSellersOnly
                ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.bestSellersOnly}
                  onChange={(e) => onFilterChange({ ...filters, bestSellersOnly: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#d1c4cd] text-[#D30915] focus:ring-[#D30915] cursor-pointer accent-[#D30915]"
                />
                <span>🔥 Best Sellers</span>
              </div>
              <span className="text-[10px] text-[#8a858f]">
                ({allProducts.filter((p) => p.isBestSeller).length})
              </span>
            </label>

            <label className={`flex items-center justify-between text-xs py-1 px-2 rounded-[8px] cursor-pointer transition-all ${
              filters.newArrivalsOnly
                ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.newArrivalsOnly}
                  onChange={(e) => onFilterChange({ ...filters, newArrivalsOnly: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#d1c4cd] text-[#D30915] focus:ring-[#D30915] cursor-pointer accent-[#D30915]"
                />
                <span>✨ New Arrivals</span>
              </div>
              <span className="text-[10px] text-[#8a858f]">
                ({allProducts.filter((p) => p.isNew).length})
              </span>
            </label>

            <label className={`flex items-center justify-between text-xs py-1 px-2 rounded-[8px] cursor-pointer transition-all ${
              filters.inStockOnly
                ? 'bg-[#fff1f2] text-[#D30915] font-black border border-[#fecdd3]'
                : 'text-[#36323d] hover:bg-white hover:text-[#D30915] font-bold'
            }`}>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.inStockOnly}
                  onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
                  className="w-3.5 h-3.5 rounded border-[#d1c4cd] text-[#D30915] focus:ring-[#D30915] cursor-pointer accent-[#D30915]"
                />
                <span className="flex items-center gap-1">
                  <PackageCheck className="w-3 h-3 text-emerald-600" />
                  <span>In Stock Only</span>
                </span>
              </div>
              <span className="text-[10px] text-[#8a858f]">
                ({allProducts.filter((p) => p.inStock).length})
              </span>
            </label>
          </div>
        </div>

      </div>

      {/* Bottom Action Strip */}
      <div className="mt-6 pt-4 border-t border-[#f2e8ef] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#fffafc] -mx-5 -mb-5 p-4 rounded-b-[24px]">
        <div className="flex items-center gap-2 text-xs font-bold text-[#716d77]">
          <Sparkles className="w-4 h-4 text-[#D30915]" />
          <span>
            Matching <strong className="text-[#141219] font-black">{totalResultsCount}</strong> reveals based on your criteria
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-[40px] rounded-[12px] bg-white border border-[#ebdce5] text-[#141219] text-xs font-black hover:border-[#D30915] hover:text-[#D30915] active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={onApplyFilters}
            className="px-6 h-[40px] rounded-[12px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_8px_24px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search by Filter</span>
            {totalResultsCount !== undefined && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px]">
                ({totalResultsCount})
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// 2. ACTIVE FILTER CHIPS BAR
// -------------------------------------------------------------
interface ActiveFilterChipsProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

export const ActiveFilterChips: React.FC<ActiveFilterChipsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const chips: { id: string; label: string; onRemove: () => void }[] = [];

  // Categories
  filters.categories.forEach((cat) => {
    chips.push({
      id: `cat-${cat}`,
      label: cat,
      onRemove: () => {
        onFilterChange({
          ...filters,
          categories: filters.categories.filter((c) => c !== cat),
        });
      },
    });
  });

  // Price range
  if (filters.minPrice !== null || filters.maxPrice !== null) {
    let label = '';
    if (filters.minPrice !== null && filters.maxPrice !== null) {
      label = `$${filters.minPrice} – $${filters.maxPrice}`;
    } else if (filters.minPrice !== null) {
      label = `$${filters.minPrice}+`;
    } else if (filters.maxPrice !== null) {
      label = `Under $${filters.maxPrice}`;
    }
    chips.push({
      id: 'price',
      label: `Price: ${label}`,
      onRemove: () => onFilterChange({ ...filters, minPrice: null, maxPrice: null }),
    });
  }

  // Rating
  if (filters.minRating !== null) {
    chips.push({
      id: 'rating',
      label: `${filters.minRating}★ & above`,
      onRemove: () => onFilterChange({ ...filters, minRating: null }),
    });
  }

  // Surprise Types
  filters.surpriseTypes.forEach((type) => {
    chips.push({
      id: `type-${type}`,
      label: type === 'cash' ? '💵 Cash Reveal' : '💍 Jewelry Reveal',
      onRemove: () => {
        onFilterChange({
          ...filters,
          surpriseTypes: filters.surpriseTypes.filter((t) => t !== type),
        });
      },
    });
  });

  // Discount
  if (filters.minDiscount !== null) {
    chips.push({
      id: 'discount',
      label: `${filters.minDiscount}%+ Off`,
      onRemove: () => onFilterChange({ ...filters, minDiscount: null }),
    });
  }

  // Best Sellers
  if (filters.bestSellersOnly) {
    chips.push({
      id: 'bestseller',
      label: '🔥 Best Sellers',
      onRemove: () => onFilterChange({ ...filters, bestSellersOnly: false }),
    });
  }

  // New Arrivals
  if (filters.newArrivalsOnly) {
    chips.push({
      id: 'newarrivals',
      label: '✨ New Arrivals',
      onRemove: () => onFilterChange({ ...filters, newArrivalsOnly: false }),
    });
  }

  // In Stock
  if (filters.inStockOnly) {
    chips.push({
      id: 'instock',
      label: 'In Stock',
      onRemove: () => onFilterChange({ ...filters, inStockOnly: false }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-bold text-[#716d77]">Active Filters:</span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] text-xs font-black shadow-2xs animate-in fade-in zoom-in-95 duration-150"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={chip.onRemove}
            className="w-4 h-4 rounded-full hover:bg-[#D30915] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label={`Remove filter ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={onResetFilters}
        className="text-xs font-black text-[#716d77] hover:text-[#D30915] hover:underline ml-1 cursor-pointer"
      >
        Clear All
      </button>
    </div>
  );
};

// -------------------------------------------------------------
// 3. MOBILE FULL-SCREEN / BOTTOM-SHEET FILTER PANEL
// -------------------------------------------------------------
interface MobileFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  onApplyFilters?: () => void;
  allProducts: Product[];
  totalResultsCount: number;
}

export const MobileFilterModal: React.FC<MobileFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onResetFilters,
  onApplyFilters,
  allProducts,
  totalResultsCount,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#141219]/60 backdrop-blur-xs transition-opacity ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={handleClose}
      />

      {/* Slide-Up Sheet Container */}
      <div
        className={`relative bg-white rounded-t-[28px] border-t border-[#eedbe6] shadow-2xl z-10 max-h-[88vh] flex flex-col justify-between overflow-hidden ${
          isClosing ? 'animate-sheet-out' : 'animate-sheet-in'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#f2edf1] flex items-center justify-between bg-gradient-to-r from-[#fff5f5] to-[#ffffff] shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#D30915]" />
            <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider m-0">
              Filter Surprises
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-black text-[#D30915] hover:underline cursor-pointer px-2 py-1"
            >
              Reset All
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white border border-[#eedbe6] text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Body */}
        <div className="p-4 overflow-y-auto space-y-5">
          {/* Category */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-[#141219] mb-2">
              Categories
            </span>
            <div className="grid grid-cols-2 gap-2">
              {categoriesData.map((cat) => {
                const isSelected = filters.categories.includes(cat.name);
                const count = allProducts.filter((p) => p.category === cat.name).length;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? filters.categories.filter((c) => c !== cat.name)
                        : [...filters.categories, cat.name];
                      onFilterChange({ ...filters, categories: updated });
                    }}
                    className={`p-2.5 rounded-[12px] text-xs font-bold flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-[#D30915] text-white shadow-2xs font-black'
                        : 'bg-[#fffafc] border border-[#f0e4ec] text-[#141219]'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-[#8a858f]'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-[#141219] mb-2">
              Price Range
            </span>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {PRICE_PRESETS.map((preset) => {
                const isSelected =
                  filters.minPrice === preset.min && filters.maxPrice === preset.max;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        onFilterChange({ ...filters, minPrice: null, maxPrice: null });
                      } else {
                        onFilterChange({ ...filters, minPrice: preset.min, maxPrice: preset.max });
                      }
                    }}
                    className={`p-2.5 rounded-[12px] text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'bg-[#D30915] text-white shadow-2xs font-black'
                        : 'bg-[#fffafc] border border-[#f0e4ec] text-[#141219]'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Customer Rating */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-[#141219] mb-2">
              Customer Rating
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[4, 3, 2].map((stars) => {
                const isSelected = filters.minRating === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        minRating: isSelected ? null : stars,
                      })
                    }
                    className={`p-2.5 rounded-[12px] text-xs font-black flex items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'bg-[#D30915] text-white shadow-2xs'
                        : 'bg-[#fffafc] border border-[#f0e4ec] text-[#141219]'
                    }`}
                  >
                    <Star className={`w-3.5 h-3.5 ${isSelected ? 'fill-white text-white' : 'fill-amber-400 text-amber-400'}`} />
                    <span>{stars}★ & Up</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Surprise Prize Type */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-[#141219] mb-2">
              Surprise Type
            </span>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'jewelry', label: 'Fine Jewelry', icon: Gem },
                { id: 'cash', label: 'Real Cash', icon: DollarSign },
              ].map((t) => {
                const isSelected = filters.surpriseTypes.includes(t.id);
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      const updated = isSelected
                        ? filters.surpriseTypes.filter((x) => x !== t.id)
                        : [...filters.surpriseTypes, t.id];
                      onFilterChange({ ...filters, surpriseTypes: updated });
                    }}
                    className={`p-2.5 rounded-[12px] text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#D30915] text-white shadow-2xs font-black'
                        : 'bg-[#fffafc] border border-[#f0e4ec] text-[#141219]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Discounts */}
          <div>
            <span className="block text-xs font-black uppercase tracking-wider text-[#141219] mb-2">
              Discounts
            </span>
            <div className="grid grid-cols-3 gap-2">
              {DISCOUNT_PRESETS.map((d) => {
                const isSelected = filters.minDiscount === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      onFilterChange({
                        ...filters,
                        minDiscount: isSelected ? null : d.id,
                      })
                    }
                    className={`p-2 rounded-[12px] text-xs font-black transition-all ${
                      isSelected
                        ? 'bg-[#D30915] text-white shadow-2xs'
                        : 'bg-[#fffafc] border border-[#f0e4ec] text-[#141219]'
                    }`}
                  >
                    {d.id}%+ Off
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Toggles */}
          <div className="space-y-2 pt-2 border-t border-[#f4edf2]">
            <label className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#fffafc] border border-[#f0e4ec] text-xs font-bold text-[#141219] cursor-pointer">
              <span>🔥 Best Sellers Only</span>
              <input
                type="checkbox"
                checked={filters.bestSellersOnly}
                onChange={(e) => onFilterChange({ ...filters, bestSellersOnly: e.target.checked })}
                className="w-4 h-4 rounded accent-[#D30915]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#fffafc] border border-[#f0e4ec] text-xs font-bold text-[#141219] cursor-pointer">
              <span>✨ New Arrivals Only</span>
              <input
                type="checkbox"
                checked={filters.newArrivalsOnly}
                onChange={(e) => onFilterChange({ ...filters, newArrivalsOnly: e.target.checked })}
                className="w-4 h-4 rounded accent-[#D30915]"
              />
            </label>

            <label className="flex items-center justify-between p-2.5 rounded-[12px] bg-[#fffafc] border border-[#f0e4ec] text-xs font-bold text-[#141219] cursor-pointer">
              <span>📦 In Stock Only</span>
              <input
                type="checkbox"
                checked={filters.inStockOnly}
                onChange={(e) => onFilterChange({ ...filters, inStockOnly: e.target.checked })}
                className="w-4 h-4 rounded accent-[#D30915]"
              />
            </label>
          </div>
        </div>

        {/* Sticky Bottom Bar */}
        <div className="p-4 border-t border-[#f2edf1] bg-white flex items-center gap-3 shrink-0 shadow-lg">
          <button
            type="button"
            onClick={onResetFilters}
            className="flex-1 h-[44px] rounded-[13px] bg-[#fff1f2] text-[#D30915] text-xs font-black uppercase tracking-wider border border-[#fecdd3] hover:bg-[#ffe5ef] active:scale-95 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyFilters?.();
              handleClose();
            }}
            className="flex-2 h-[44px] rounded-[13px] bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96050e] text-white text-xs font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_8px_24px_rgba(211,9,21,0.38)] active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <span>Show Results</span>
            <span>({totalResultsCount})</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// -------------------------------------------------------------
// 4. MOBILE SORT BOTTOM SHEET
// -------------------------------------------------------------
interface MobileSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: FilterState['sortBy'];
  onSelectSort: (sortBy: FilterState['sortBy']) => void;
}

export const MobileSortModal: React.FC<MobileSortModalProps> = ({
  isOpen,
  onClose,
  currentSort,
  onSelectSort,
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 280);
  };

  if (!isOpen && !isClosing) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-[#141219]/60 backdrop-blur-xs transition-opacity ${
          isClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'
        }`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white rounded-t-[28px] border-t border-[#eedbe6] shadow-2xl z-10 overflow-hidden ${
          isClosing ? 'animate-sheet-out' : 'animate-sheet-in'
        }`}
      >
        <div className="p-4 border-b border-[#f2edf1] flex items-center justify-between bg-gradient-to-r from-[#fff5f5] to-[#ffffff]">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#D30915]" />
            <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider m-0">
              Sort By
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white border border-[#eedbe6] text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-1.5">
          {SORT_OPTIONS.map((opt) => {
            const isSelected = currentSort === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelectSort(opt.id);
                  handleClose();
                }}
                className={`w-full p-3 rounded-[14px] flex items-center justify-between text-left text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] font-black shadow-2xs'
                    : 'hover:bg-[#fff9fb] text-[#141219]'
                }`}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#D30915] text-white flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
};
