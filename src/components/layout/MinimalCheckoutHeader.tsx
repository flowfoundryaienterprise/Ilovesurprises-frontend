import React from 'react';
import { Lock, ShieldCheck, ArrowLeft } from 'lucide-react';

interface MinimalCheckoutHeaderProps {
  onNavigateHome?: () => void;
  onBackToShop?: () => void;
}

export const MinimalCheckoutHeader: React.FC<MinimalCheckoutHeaderProps> = ({
  onNavigateHome,
  onBackToShop,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#ebdbe6] shadow-[0_4px_20px_rgba(40,15,30,0.04)]">
      {/* Main Bar: 3-column layout with centered logo */}
      <div className="max-w-[1460px] mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
        {/* Left column: Return to Store link */}
        <div className="w-24 min-[420px]:w-32 sm:w-48 flex items-center shrink-0">
          {onBackToShop ? (
            <button
              type="button"
              onClick={onBackToShop}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer py-1 -ml-1 rounded-lg focus:outline-none"
              title="Return to shopping"
            >
              <ArrowLeft className="w-4 h-4 text-[#716d77] shrink-0" />
              <span className="hidden sm:inline">Continue Shopping</span>
              <span className="sm:hidden text-[11px]">Back</span>
            </button>
          ) : (
            <div className="w-4" />
          )}
        </div>

        {/* Center column: Centered Brand Logo (strictly preserving existing logo asset and proportions) */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigateHome) {
                onNavigateHome();
              } else if (onBackToShop) {
                onBackToShop();
              }
            }}
            className="inline-flex items-center justify-center shrink-0 group focus:outline-none"
            aria-label="ILoveSurprises Home"
          >
            <img
              src="/assets/ilovesurprises/logo/logo-16k.png"
              alt="I Love Surprises Logo"
              width={8192}
              height={2728}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-[42px] min-[360px]:h-[46px] min-[390px]:h-[50px] min-[420px]:h-[52px] sm:h-[52px] md:h-[58px] lg:h-[62px] w-auto max-w-[170px] min-[360px]:max-w-[195px] min-[390px]:max-w-[215px] min-[420px]:max-w-[230px] sm:max-w-[215px] md:max-w-[245px] lg:max-w-[270px] object-contain transition-transform duration-200 group-hover:scale-102"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            />
          </a>
      </div>

      {/* Right column: Secure Checkout Badge (No menu, no search, no cart) */}
      <div className="w-24 min-[420px]:w-32 sm:w-48 flex items-center justify-end shrink-0">
        <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] shadow-2xs">
          <Lock className="w-3.5 h-3.5 text-[#16a34a] shrink-0" />
          <span className="text-[10px] min-[420px]:text-[11px] sm:text-xs font-black uppercase tracking-wider whitespace-nowrap">
            <span className="hidden sm:inline">100% </span>Secure<span className="hidden md:inline"> Checkout</span>
          </span>
        </div>
      </div>
    </div>

      {/* Trust encryption sub-strip for maximum shopper confidence */ }
  <div className="bg-gradient-to-r from-[#fff7f9] via-[#fffbfd] to-[#fcf7ff] border-t border-[#f4ebf1] py-1 px-3 sm:px-6 text-center">
    <div className="max-w-[1460px] mx-auto flex items-center justify-center gap-2 text-[10px] sm:text-[11px] font-bold text-[#716d77]">
      <ShieldCheck className="w-3 h-3 text-[#16a34a] shrink-0" />
      <span>256-Bit SSL Encrypted</span>
      <span className="text-[#e2d5de]">•</span>
      <span className="hidden min-[480px]:inline">Guaranteed Safe &amp; Secure Checkout</span>
      <span className="min-[480px]:hidden">Safe Checkout</span>
    </div>
  </div>
    </header >
  );
};
