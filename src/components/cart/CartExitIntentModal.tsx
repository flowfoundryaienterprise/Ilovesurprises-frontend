import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Gift,
  X,
  Clock,
  ArrowRight,
  Tag,
  Copy,
  Check,
  ShoppingBag,
} from 'lucide-react';
import type { CartItem } from '../../types';

interface CartExitIntentModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onClaimDiscount: (code: string) => void;
  onViewCart?: () => void;
}

export const CartExitIntentModal: React.FC<CartExitIntentModalProps> = ({
  isOpen,
  onClose,
  cart,
  onClaimDiscount,
  onViewCart,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60); // 15:00 countdown timer

  // 15-minute urgency timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Keyboard Escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || cart.length === 0) {
    return null;
  }

  const promoCode = 'SURPRISE15';
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const savings = cartSubtotal * 0.15;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(promoCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleClaim = () => {
    onClaimDiscount(promoCode);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[#eedbe6] text-[#141219] animate-in zoom-in-95 duration-200">
        {/* Brand Background Ambient Flare */}
        <div
          className="absolute -top-16 -left-16 w-48 h-48 rounded-full bg-[#D30915]/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-amber-400/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#faf7f9] hover:bg-[#f1e5ed] text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Header Badge */}
          <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-[#fff0f3] border border-[#fecdd3] text-[#D30915] text-[11px] font-black uppercase tracking-wider mx-auto w-fit mb-3">
            <Gift className="w-3.5 h-3.5" />
            <span>Wait! Don't Leave Your Surprise Behind</span>
          </div>

          {/* Headline */}
          <h2
            id="exit-modal-title"
            className="text-xl sm:text-2xl font-black text-center text-[#141219] font-display leading-tight mb-2"
          >
            A Real Cash or Jewelry Prize Is Waiting Inside Your Order!
          </h2>

          <p className="text-xs sm:text-sm text-[#716d77] text-center max-w-sm mx-auto mb-5 leading-relaxed">
            Every candle & bath treat holds a guaranteed legal tender cash prize
            ($2–$2,500) or luxury fine jewelry. Complete your reveal now with an
            exclusive discount!
          </p>

          {/* Cart Items Mini Preview */}
          <div className="bg-[#faf7f9] border border-[#eedbe6] rounded-2xl p-3 mb-5">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#716d77] mb-2 px-1">
              <span>Items In Your Bag ({cart.length})</span>
              <span>Subtotal: ${cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {cart.slice(0, 2).map((item) => {
                const itemImage =
                  item.product.images?.[0] ||
                  item.product.image ||
                  '/placeholder.svg';
                return (
                  <div
                    key={`${item.product.id}-${item.selectedSurpriseOption || 'default'}-${
                      item.selectedRingSize || 'none'
                    }`}
                    className="flex items-center gap-3 bg-white p-2 rounded-xl border border-[#eedbe6]/60 text-left"
                  >
                    <img
                      src={itemImage}
                      alt={item.product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-gray-50 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#141219] truncate">
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-[#716d77] truncate">
                        Qty: {item.quantity}
                        {item.selectedSurpriseOption
                          ? ` • ${item.selectedSurpriseOption}`
                          : ''}
                        {item.selectedRingSize
                          ? ` • Size ${item.selectedRingSize}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-xs font-black text-[#141219] shrink-0">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                );
              })}
              {cart.length > 2 && (
                <div className="text-[10px] text-center text-[#716d77] font-semibold pt-1">
                  + {cart.length - 2} more surprise item
                  {cart.length - 2 > 1 ? 's' : ''} in cart
                </div>
              )}
            </div>
          </div>

          {/* Exclusive Exit Offer Callout */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fff0f3] via-[#fff5f6] to-[#fff0f3] border-2 border-[#D30915]/30 text-center mb-5 relative overflow-hidden">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-[#D30915]" />
              <span className="text-xs font-black text-[#D30915] uppercase tracking-wider">
                Instant 15% VIP Savings
              </span>
              <Sparkles className="w-4 h-4 text-[#D30915]" />
            </div>

            <div className="text-2xl font-black text-[#141219] mb-1 font-display">
              Save ${savings.toFixed(2)} Right Now
            </div>

            {/* Promo Code Pill & Copy Button */}
            <div className="inline-flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#fecdd3] shadow-2xs mt-1">
              <Tag className="w-3.5 h-3.5 text-[#D30915]" />
              <span className="font-mono text-xs font-black tracking-widest text-[#141219]">
                {promoCode}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] font-bold text-[#D30915] hover:text-[#B60711] flex items-center gap-0.5 cursor-pointer"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Urgency Countdown */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#716d77] mt-2">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>
                Offer expires in{' '}
                <span className="font-mono font-black text-amber-700">
                  {formattedTime}
                </span>
              </span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleClaim}
              className="w-full h-12 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_24px_rgba(211,9,21,0.35)] transition-all active:scale-[0.98]"
            >
              <span>Apply 15% Off & Checkout Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onViewCart && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewCart();
                }}
                className="w-full py-2 text-xs font-bold text-[#716d77] hover:text-[#141219] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Review Shopping Bag First</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full text-center text-[11px] text-[#8a858f] hover:text-[#55505a] hover:underline cursor-pointer block pt-1"
            >
              No thanks, I'll pass on this 15% savings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
