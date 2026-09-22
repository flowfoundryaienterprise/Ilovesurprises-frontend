import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AffiliateSelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
}

interface AffiliateCustomSelectProps {
  options: AffiliateSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const AffiliateCustomSelect: React.FC<AffiliateCustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  icon,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[40px] sm:h-[42px] px-3.5 rounded-[13px] bg-white border transition-all flex items-center justify-between gap-2 text-left cursor-pointer shadow-2xs ${
          isOpen
            ? 'border-[#D30915] ring-2 ring-[#D30915]/15'
            : 'border-[#eedbe6] hover:border-[#D30915]/50'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && <span className="text-[#D30915] shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-bold text-[#141219] truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 ${
                    selectedOption.badgeColor || 'bg-[#fff1f2] text-[#D30915]'
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-[#8a858f] font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#8a858f] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-[#D30915]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-[18px] border-2 border-[#fecdd3] shadow-[0_12px_32px_rgba(211, 9, 21,0.15)] p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150 max-h-[260px] overflow-y-auto scrollbar-thin">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-2 rounded-[11px] text-xs font-bold transition-all flex items-center justify-between gap-2 cursor-pointer text-left ${
                  isSelected
                    ? 'bg-[#fff1f2] text-[#D30915] font-black'
                    : 'text-[#55505a] hover:bg-[#fff8fb] hover:text-[#141219]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {opt.badge && (
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                        opt.badgeColor || (isSelected ? 'bg-white text-[#D30915]' : 'bg-stone-100 text-[#716d77]')
                      }`}
                    >
                      {opt.badge}
                    </span>
                  )}
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#D30915] stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
