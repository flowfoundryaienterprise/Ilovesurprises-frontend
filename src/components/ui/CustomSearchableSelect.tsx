import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface CustomSearchableSelectProps {
  label: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  icon?: React.ReactNode;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const CustomSearchableSelect: React.FC<CustomSearchableSelectProps> = ({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  searchPlaceholder = 'Search...',
  icon,
  error,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Screen size check for mobile sheet vs desktop popover
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Lock body scroll when mobile bottom sheet is open
  useEffect(() => {
    if (isOpen && isMobile) {
      const originalStyle = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, isMobile]);

  // Current selected option
  const selectedOption = options.find((opt) => opt.value === value || opt.label === value);

  // Close dropdown on outside click (desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, isMobile]);

  // Focus search when dropdown/sheet opens
  useEffect(() => {
    if (isOpen) {
      const focusTimer = setTimeout(() => {
        if (isMobile) {
          mobileSearchInputRef.current?.focus();
        } else {
          searchInputRef.current?.focus();
        }
      }, 60);
      return () => clearTimeout(focusTimer);
    } else {
      const resetTimer = setTimeout(() => {
        setSearchQuery('');
      }, 0);
      return () => clearTimeout(resetTimer);
    }
  }, [isOpen, isMobile]);

  // Filtered options based on search query
  const filteredOptions = React.useMemo(() => {
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (opt.badge && opt.badge.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [options, searchQuery]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative flex flex-col min-w-0 ${className}`}>
      {/* Label */}
      <label className="block text-xs font-bold text-[#141219] mb-1.5 truncate">
        {label} {required && <span className="text-[#D30915]">*</span>}
      </label>

      {/* Trigger Button - Mobile App Sized */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full min-h-[46px] sm:min-h-[44px] px-3.5 rounded-[14px] bg-[#fffafb] border text-left transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer shadow-xs active:scale-[0.99] min-w-0 ${
          isOpen
            ? 'border-[#D30915] ring-3 ring-[#D30915]/15 bg-white shadow-[0_4px_16px_rgba(211, 9, 21,0.08)]'
            : error
            ? 'border-red-500 bg-red-50/20'
            : 'border-[#e8dfe5] hover:border-[#D30915] hover:bg-white'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && (
            <div className={`shrink-0 transition-colors ${isOpen ? 'text-[#D30915]' : 'text-[#8a858f]'}`}>
              {icon}
            </div>
          )}
          <div className="min-w-0 flex-1 truncate">
            {selectedOption ? (
              <span className="text-sm sm:text-xs md:text-sm font-bold text-[#141219] truncate block">
                {selectedOption.label}
              </span>
            ) : (
              <span className="text-sm sm:text-xs md:text-sm text-[#9c95a0] font-medium truncate block">
                {placeholder}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOption?.badge && (
            <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3] hidden sm:inline-block">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-[#8a858f] transition-transform duration-250 shrink-0 ${
              isOpen ? 'rotate-180 text-[#D30915]' : ''
            }`}
          />
        </div>
      </button>

      {/* Error Message */}
      {error && <p className="text-[11px] text-red-600 mt-1 font-semibold truncate">{error}</p>}

      {/* 1. DESKTOP FLOATING DROPDOWN POPOVER (>= 640px) */}
      {isOpen && !isMobile && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-[18px] border border-[#f3dbe8] shadow-[0_18px_45px_rgba(20,18,25,0.18)] p-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 min-w-full"
        >
          {/* Search bar if options count is large */}
          {options.length > 5 && (
            <div className="relative mb-2 px-1 pt-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a858f] pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-[36px] pl-8 pr-7 rounded-[10px] bg-[#fffafc] border border-[#ecdbe6] focus:border-[#D30915] text-xs text-[#141219] placeholder:text-[#9c95a0] outline-none font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a858f] hover:text-[#141219]"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Options List */}
          <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = option.value === value || option.label === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(option.value)}
                    className={`w-full p-2.5 rounded-[12px] text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#fff1f2] text-[#D30915] font-black shadow-2xs border border-[#fecdd3]'
                        : 'hover:bg-[#fff7fa] text-[#141219] hover:text-[#D30915]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && (
                        <div className={`shrink-0 ${isSelected ? 'text-[#D30915]' : 'text-[#8a858f]'}`}>
                          {option.icon}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 truncate">
                        <span className="text-xs sm:text-sm font-bold block truncate">
                          {option.label}
                        </span>
                        {option.subLabel && (
                          <span className="text-[10px] text-[#716d77] block truncate">
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
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
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D30915] stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#8a858f]">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. REAL APP MOBILE BOTTOM SHEET MODAL (< 640px) */}
      {isOpen && isMobile && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          {/* Bottom Sheet Sheet Drawer */}
          <div
            className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-[28px] border-t border-[#f2dbe8] shadow-[0_-12px_40px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden animate-sheet-in pb-[max(1rem,env(safe-area-inset-bottom))]"
          >
            {/* Grabber Handle */}
            <div className="pt-3 pb-1 flex justify-center shrink-0">
              <div className="w-12 h-1.5 bg-stone-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-3 border-b border-[#f5eaf1] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {icon && <div className="text-[#D30915] shrink-0">{icon}</div>}
                <h3 className="text-base font-black text-[#141219] m-0 truncate font-display">
                  {label}
                </h3>
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
            <div className="p-4 bg-[#fcf9fb] border-b border-[#f3e5ee] shrink-0">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f] pointer-events-none" />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full h-[44px] pl-10 pr-9 rounded-[14px] bg-white border border-[#e8dfe5] focus:border-[#D30915] text-sm text-[#141219] placeholder:text-[#9c95a0] outline-none font-medium shadow-2xs"
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
            </div>

            {/* Options List with Touch-Friendly Hit Targets */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 max-h-[50vh]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => {
                  const isSelected = option.value === value || option.label === value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`w-full min-h-[50px] px-4 py-3 rounded-[16px] text-left transition-all flex items-center justify-between gap-3 active:scale-[0.98] cursor-pointer ${
                        isSelected
                          ? 'bg-[#fff1f2] text-[#D30915] font-black border-2 border-[#D30915] shadow-xs'
                          : 'bg-white border border-[#f0e4ec] text-[#141219] hover:bg-[#fff9fc]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {option.icon && (
                          <div className={`shrink-0 ${isSelected ? 'text-[#D30915]' : 'text-[#8a858f]'}`}>
                            {option.icon}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold block truncate">
                            {option.label}
                          </span>
                          {option.subLabel && (
                            <span className="text-xs text-[#716d77] block truncate mt-0.5">
                              {option.subLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {option.badge && (
                          <span
                            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
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
