import React, { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  autoComplete?: string;
  rightAction?: React.ReactNode;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  id,
  name = 'password',
  label = 'Password',
  placeholder = '••••••••••••',
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  autoComplete = 'current-password',
  rightAction,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        {label && (
          <label htmlFor={id} className="block text-[11px] sm:text-xs font-bold text-[#141219]">
            {label}
            {required && <span className="text-[#D30915] ml-0.5">*</span>}
          </label>
        )}
        {rightAction}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a858f] pointer-events-none">
          <Lock className="w-4 h-4" />
        </div>

        <input
          id={id}
          name={name}
          type={showPassword ? 'text' : 'password'}
          required={required}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          className={`w-full h-[42px] sm:h-[44px] pl-10 pr-10 rounded-[13px] bg-[#fffafb] border text-xs sm:text-sm font-medium text-[#141219] placeholder:text-[#9c95a0] transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-red-400 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100'
              : 'border-[#ebdce5] hover:border-[#f1b8cb] focus:border-[#D30915] focus:bg-white focus:ring-2 focus:ring-[#D30915]/10'
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />

        <button
          type="button"
          disabled={disabled}
          onClick={() => setShowPassword((prev) => !prev)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-[#8a858f] hover:text-[#D30915] active:scale-90 transition-all cursor-pointer rounded-lg hover:bg-[#fff1f2]"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 stroke-[2.2]" />
          ) : (
            <Eye className="w-4 h-4 stroke-[2.2]" />
          )}
        </button>
      </div>

      {error && (
        <p id={`${id}-error`} className="text-[11px] text-red-500 mt-1 font-medium flex items-center gap-1">
          <span>⚠️</span>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
