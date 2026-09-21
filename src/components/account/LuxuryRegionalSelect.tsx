import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Search,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

import type { RegionalCategory, RegionalOption } from '../../constants/regional';

interface LuxuryRegionalSelectProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  options: RegionalOption[];
  value: string;
  onChange: (value: string, option: RegionalOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  type?: 'currency' | 'language';
  className?: string;
}

export const LuxuryRegionalSelect: React.FC<LuxuryRegionalSelectProps> = ({
  label,
  description,
  icon,
  options,
  value,
  onChange,
  placeholder: _placeholder = 'Select option...',
  searchPlaceholder = 'Search by name, country, or code...',
  type = 'language',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<RegionalCategory>('All');
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  const closeDropdown = () => {
    setIsOpen(false);
    setSearchQuery('');
    setSelectedRegion('All');
  };

  // Screen size check for mobile drawer vs desktop popover
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll on mobile sheet open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, isMobile]);

  // Find currently selected option with fallback support for legacy values
  const selectedOption = useMemo(() => {
    return (
      options.find(
        (opt) =>
          opt.value === value ||
          opt.label === value ||
          opt.id === value ||
          (value === 'Spanish' && (opt.id === 'es' || opt.label.includes('Español'))) ||
          (value === 'French' && (opt.id === 'fr' || opt.label.includes('Français')))
      ) || options[0]
    );
  }, [options, value]);

  // Close dropdown on outside click (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (isMobile) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isMobile]);

  // Filter options by search query and active region pill
  const filteredOptions = useMemo(() => {
    return options.filter((opt) => {
      const matchesRegion = selectedRegion === 'All' || opt.region === selectedRegion;
      if (!matchesRegion) return false;

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        opt.label.toLowerCase().includes(query) ||
        opt.subLabel.toLowerCase().includes(query) ||
        opt.value.toLowerCase().includes(query) ||
        opt.id.toLowerCase().includes(query) ||
        (opt.nativeName && opt.nativeName.toLowerCase().includes(query)) ||
        (opt.symbol && opt.symbol.toLowerCase().includes(query)) ||
        (opt.badge && opt.badge.toLowerCase().includes(query)) ||
        opt.region.toLowerCase().includes(query)
      );
    });
  }, [options, selectedRegion, searchQuery]);

  // Distinct regions available in current dataset
  const availableRegions = useMemo(() => {
    const set = new Set<RegionalCategory>(['All']);
    options.forEach((opt) => set.add(opt.region));
    return Array.from(set);
  }, [options]);

  const handleSelectOption = (option: RegionalOption) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col min-w-0 ${className}`}>
      {/* Label & Description Header */}
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <label className="block text-xs font-bold text-[#141219] truncate">
          {label}
        </label>
        {description && (
          <span className="text-[10px] text-[#8a858f] font-medium hidden sm:inline-block">
            {description}
          </span>
        )}
      </div>

      {/* Luxury Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[58px] p-2.5 sm:p-3 rounded-[18px] text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer select-none active:scale-[0.99] border ${
          isOpen
            ? 'bg-white border-[#D30915] ring-3 ring-[#D30915]/15 shadow-[0_8px_24px_rgba(211, 9, 21,0.12)]'
            : 'bg-[#fffafc] border-[#eedbe6] hover:border-[#D30915]/60 hover:bg-white hover:shadow-[0_4px_16px_rgba(50,31,63,0.06)]'
        }`}
      >
        {/* Left Side: Avatar / Flag & Details */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Flag / Currency Avatar Box */}
          <div
            className={`w-10 h-10 rounded-[14px] flex items-center justify-center shrink-0 border transition-transform duration-200 ${
              isOpen
                ? 'bg-[#fff1f2] border-[#fecdd3] scale-105'
                : 'bg-white border-[#f0dfeb] shadow-2xs'
            }`}
          >
            {type === 'currency' ? (
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="text-base leading-none" role="img" aria-label={selectedOption.label}>
                  {selectedOption.flag}
                </span>
                <span className="text-[9px] font-black text-[#D30915] mt-0.5">
                  {selectedOption.symbol || '$'}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center leading-none">
                <span className="text-lg leading-none" role="img" aria-label={selectedOption.label}>
                  {selectedOption.flag}
                </span>
              </div>
            )}
          </div>

          {/* Texts */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-black text-[#141219] tracking-tight truncate block font-display">
                {selectedOption.label}
              </span>
              {selectedOption.nativeName && selectedOption.nativeName !== selectedOption.label && (
                <span className="text-[10px] text-[#8a858f] font-semibold hidden md:inline truncate">
                  ({selectedOption.nativeName})
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#716d77] font-medium block truncate mt-0.5">
              {selectedOption.subLabel}
            </span>
          </div>
        </div>

        {/* Right Side: Badge & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedOption.badge && (
            <span
              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider border hidden sm:inline-flex items-center gap-1 ${
                selectedOption.badgeColor ||
                'bg-[#fff1f2] text-[#D30915] border-[#fecdd3]'
              }`}
            >
              {selectedOption.badge === 'Primary' || selectedOption.badge === 'Default' ? (
                <Sparkles className="w-2.5 h-2.5 text-[#D30915]" />
              ) : null}
              <span>{selectedOption.badge}</span>
            </span>
          )}

          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
              isOpen ? 'bg-[#fff1f2] text-[#D30915] rotate-180' : 'bg-transparent text-[#8a858f]'
            }`}
          >
            <ChevronDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </button>

      {/* 1. DESKTOP FLOATING POPOVER (>= 640px) */}
      {isOpen && !isMobile && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-2 z-50 bg-white rounded-[22px] border-2 border-[#f2dbe8] shadow-[0_20px_50px_rgba(20,18,25,0.18)] p-2.5 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 min-w-full"
        >
          {/* Search Header */}
          <div className="relative mb-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f] pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-[40px] pl-9.5 pr-8 rounded-[12px] bg-[#fffafc] border border-[#ecdbe6] focus:border-[#D30915] text-xs text-[#141219] placeholder:text-[#9c95a0] outline-none font-bold shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#f3e5ee] text-[#716d77] flex items-center justify-center hover:bg-[#D30915] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Region Filter Pills */}
          {availableRegions.length > 2 && (
            <div className="flex items-center gap-1.5 px-0.5 pb-2 overflow-x-auto scrollbar-none border-b border-[#f6ebf2] mb-2">
              {availableRegions.map((region) => {
                const isActive = selectedRegion === region;
                const count =
                  region === 'All'
                    ? options.length
                    : options.filter((o) => o.region === region).length;
                return (
                  <button
                    key={region}
                    type="button"
                    onClick={() => setSelectedRegion(region)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-tight shrink-0 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#D30915] text-white shadow-2xs'
                        : 'bg-[#f8f2f6] text-[#716d77] hover:bg-[#fff1f2] hover:text-[#D30915]'
                    }`}
                  >
                    {region} <span className="opacity-75 font-normal">({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Options Scrollable List */}
          <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected =
                  option.value === selectedOption.value || option.id === selectedOption.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelectOption(option)}
                    className={`w-full p-2.5 rounded-[14px] text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      isSelected
                        ? 'bg-[#fff1f2] text-[#D30915] border-2 border-[#D30915] shadow-xs'
                        : 'bg-white border border-transparent hover:border-[#fecdd3] hover:bg-[#fff9fc] text-[#141219]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Flag / Symbol Box */}
                      <div
                        className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 border text-base ${
                          isSelected
                            ? 'bg-white border-[#fecdd3] shadow-2xs'
                            : 'bg-[#fcf8fa] border-[#eee1ea] group-hover:bg-white group-hover:border-[#fecdd3]'
                        }`}
                      >
                        <span role="img" aria-label={option.label}>
                          {option.flag}
                        </span>
                      </div>

                      {/* Text */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs font-black block truncate ${
                              isSelected ? 'text-[#D30915]' : 'text-[#141219]'
                            }`}
                          >
                            {option.label}
                          </span>
                          {option.nativeName && (
                            <span className="text-[10px] text-[#8a858f] font-semibold truncate hidden lg:inline">
                              • {option.nativeName}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#716d77] block truncate mt-0.5">
                          {option.subLabel}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Badge / Sample Price / Checkmark */}
                    <div className="flex items-center gap-2 shrink-0">
                      {option.samplePrice && !isSelected && (
                        <span className="text-[10px] font-bold text-[#8a858f] bg-[#f8f3f6] px-2 py-0.5 rounded-md hidden md:inline">
                          {option.samplePrice}
                        </span>
                      )}

                      {option.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isSelected
                              ? 'bg-[#D30915] text-white'
                              : 'bg-[#f6ebf2] text-[#716d77]'
                          }`}
                        >
                          {option.badge}
                        </span>
                      )}

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-[#eedbe6] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[#D30915]">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-8 text-center px-4">
                <p className="text-xs font-bold text-[#141219] mb-1">No matching options found</p>
                <p className="text-[11px] text-[#8a858f] mb-3">
                  Try searching with a different country name or language code
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedRegion('All');
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#fff1f2] text-[#D30915] text-xs font-bold border border-[#fecdd3] hover:bg-[#D30915] hover:text-white transition-colors cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="pt-2 mt-2 border-t border-[#f5eaf1] flex items-center justify-between text-[10px] text-[#8a858f] px-1">
            <span>
              Showing {filteredOptions.length} of {options.length} options
            </span>
            <span className="font-semibold text-[#D30915] flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Auto-saves instantly
            </span>
          </div>
        </div>
      )}

      {/* 2. REAL APP MOBILE BOTTOM SHEET DRAWER (< 640px) */}
      {isOpen && isMobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Drawer */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-[28px] border-t-2 border-[#f2dbe8] shadow-[0_-12px_40px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-sheet-in pb-[max(1rem,env(safe-area-inset-bottom))]">
            {/* Grabber Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            {/* Sheet Header */}
            <div className="px-5 py-3 border-b border-[#f5eaf1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                {icon && <div className="text-[#D30915] shrink-0">{icon}</div>}
                <div>
                  <h3 className="text-base font-black text-[#141219] m-0 font-display">
                    {label}
                  </h3>
                  <p className="text-[11px] text-[#716d77] m-0">
                    Select your preferred setting
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f8f2f6] text-[#716d77] flex items-center justify-center cursor-pointer active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sticky Search Bar */}
            <div className="p-4 bg-[#fcf9fb] border-b border-[#f3e5ee] shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f] pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-[44px] pl-10 pr-9 rounded-[14px] bg-white border border-[#e8dfe5] focus:border-[#D30915] text-sm text-[#141219] placeholder:text-[#9c95a0] outline-none font-bold shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#f5eaf1] text-[#716d77] flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Pills */}
              {availableRegions.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                  {availableRegions.map((region) => {
                    const isActive = selectedRegion === region;
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => setSelectedRegion(region)}
                        className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
                          isActive
                            ? 'bg-[#D30915] text-white shadow-2xs'
                            : 'bg-white border border-[#e8dfe5] text-[#716d77]'
                        }`}
                      >
                        {region}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Options List for Mobile */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected =
                    option.value === selectedOption.value || option.id === selectedOption.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(option)}
                      className={`w-full min-h-[54px] px-3.5 py-2.5 rounded-[16px] text-left transition-all flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer ${
                        isSelected
                          ? 'bg-[#fff1f2] text-[#D30915] font-black border-2 border-[#D30915] shadow-xs'
                          : 'bg-white border border-[#f0e4ec] text-[#141219]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-[12px] bg-[#fcf8fa] border border-[#f0e4ec] flex items-center justify-center text-xl shrink-0">
                          <span role="img" aria-label={option.label}>
                            {option.flag}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black block truncate">
                              {option.label}
                            </span>
                            {option.nativeName && (
                              <span className="text-[11px] text-[#8a858f] font-semibold truncate">
                                • {option.nativeName}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#716d77] block truncate mt-0.5">
                            {option.subLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {option.badge && (
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-[#D30915] text-white'
                                : 'bg-[#f6ebf2] text-[#716d77]'
                            }`}
                          >
                            {option.badge}
                          </span>
                        )}
                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-[#8a858f]">
                  No matching options found
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
