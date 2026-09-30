import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface AdminSelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ReactNode;
  description?: string;
}

interface AdminCustomSelectProps {
  options: AdminSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'filter' | 'form' | 'pill';
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  id?: string;
}

export const AdminCustomSelect: React.FC<AdminCustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  icon,
  size = 'md',
  variant = 'filter',
  disabled = false,
  className = '',
  dropdownClassName = '',
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  // Sizing definitions
  const sizeClasses = {
    sm: 'h-8 px-2.5 text-xs rounded-lg',
    md: 'h-10 px-3.5 text-xs rounded-xl',
    lg: 'h-11 px-4 text-sm rounded-xl',
  }[size];

  // Variant definitions
  const variantClasses = {
    filter: 'bg-[#faf7f9] border-[#eedbe6] text-[#141219] hover:border-[#D30915]/40 hover:bg-white',
    form: 'bg-[#faf7f9] border-[#eedbe6] text-[#141219] focus:bg-white hover:border-[#D30915]/50',
    pill: 'bg-white border-[#eedbe6] rounded-full text-[#141219] hover:border-[#D30915]',
  }[variant];

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full border font-semibold transition-all flex items-center justify-between gap-2 text-left cursor-pointer shadow-2xs ${sizeClasses} ${variantClasses} ${isOpen
            ? 'border-[#D30915] ring-3 ring-[#D30915]/10 bg-white'
            : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {icon && (
            <span
              className={`shrink-0 transition-colors ${isOpen ? 'text-[#D30915]' : 'text-[#8a858f]'
                }`}
            >
              {icon}
            </span>
          )}

          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedOption.icon && (
                <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="font-bold text-[#141219] truncate">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 tracking-wider ${selectedOption.badgeColor || 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3]'
                    }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[#8a858f] font-medium truncate">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-[#8a858f] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-[#D30915]' : ''
            }`}
        />
      </button>

      {/* Popover Options Menu */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-[calc(100%+6px)] left-0 right-0 z-50 bg-white rounded-2xl border border-[#eedbe6] shadow-[0_16px_40px_rgba(20,18,25,0.12),0_4px_12px_rgba(211,9,21,0.06)] p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 max-h-[300px] overflow-y-auto min-w-[200px] scrollbar-thin ${dropdownClassName}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs transition-all flex items-center justify-between gap-2.5 cursor-pointer text-left ${isSelected
                    ? 'bg-[#fff1f2] text-[#D30915] font-black shadow-2xs'
                    : 'text-[#453f4a] font-semibold hover:bg-[#faf7f9] hover:text-[#141219]'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.icon && (
                    <span
                      className={`shrink-0 ${isSelected ? 'text-[#D30915]' : 'text-[#8a858f]'
                        }`}
                    >
                      {opt.icon}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="truncate">{opt.label}</span>
                      {opt.badge && (
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full shrink-0 tracking-wider ${opt.badgeColor || 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3]'
                            }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    {opt.description && (
                      <p className="text-[10px] text-[#716d77] font-normal truncate mt-0.5 m-0">
                        {opt.description}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#D30915] shrink-0 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminCustomSelect;
