import React, { useState, useRef } from 'react';
import { authService } from '../../services/auth';
import type { UserProfile } from '../../types';

interface GoogleAuthButtonProps {
  onSuccess: (user: UserProfile) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  onSuccess,
  onError,
  disabled = false,
  label = 'Continue with Google',
  className = '',
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const isSubmittingRef = useRef(false);

  const handleClick = async () => {
    if (isSubmittingRef.current || isLoading || disabled) return;

    isSubmittingRef.current = true;
    setIsLoading(true);

    try {
      const result = await authService.loginWithGoogle();
      if (result.success && result.user) {
        onSuccess(result.user);
      } else if (result.error) {
        onError?.(result.error);
      }
    } catch (err: any) {
      onError?.(err?.message || 'Unable to sign in with Google. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      id="btn-google-auth"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`w-full h-[44px] sm:h-[46px] rounded-[13px] bg-white hover:bg-[#fff7f8] border border-[#e5dce2] hover:border-[#f1b8cb] text-[#1f1d24] text-xs sm:text-sm font-bold flex items-center justify-center gap-3 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={label}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-[#716d77]">
          <span className="w-4 h-4 border-2 border-[#D30915] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold">Connecting to Google...</span>
        </div>
      ) : (
        <>
          {/* Official Google Multicolor G Logo */}
          <svg className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span className="tracking-tight">{label}</span>
        </>
      )}
    </button>
  );
};
