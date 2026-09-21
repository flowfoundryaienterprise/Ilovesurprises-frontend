import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ShoppingBag,
  Heart,
  PackageCheck,
  CheckCircle2,
  Info,
  X,
  ArrowRight,
} from 'lucide-react';

export type ToastType = 'cart' | 'wishlist' | 'order' | 'success' | 'info';

export interface ToastData {
  id: string;
  message: string;
  title?: string;
  type?: ToastType;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastNotificationProps {
  toast: ToastData | null;
  onDismiss: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toast,
  onDismiss,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast) return;

    const initTimer = setTimeout(() => {
      setIsExiting(false);
      setProgress(100);
    }, 0);

    const duration = toast.duration || 3200;
    const interval = 25;
    const step = (interval / duration) * 100;

    const progressTimer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - step));
    }, interval);

    const dismissTimer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 200);
    }, duration);

    return () => {
      clearTimeout(initTimer);
      clearInterval(progressTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast, onDismiss]);

  if (!toast || typeof document === 'undefined') return null;

  const handleManualDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 200);
  };

  const getIconAndColors = () => {
    switch (toast.type) {
      case 'cart':
        return {
          icon: <ShoppingBag className="w-4 h-4 text-white" />,
          bg: 'bg-gradient-to-r from-[#D30915] to-[#B60711]',
          badgeText: 'Added to Bag',
          borderColor: 'border-[#fecdd3]',
          glowColor: 'shadow-[0_14px_36px_rgba(211, 9, 21,0.28)]',
        };
      case 'wishlist':
        return {
          icon: <Heart className="w-4 h-4 text-white fill-white" />,
          bg: 'bg-gradient-to-r from-[#D30915] to-[#ff4081]',
          badgeText: 'Wishlist Updated',
          borderColor: 'border-[#fecdd3]',
          glowColor: 'shadow-[0_14px_36px_rgba(211, 9, 21,0.28)]',
        };
      case 'order':
        return {
          icon: <PackageCheck className="w-4 h-4 text-white" />,
          bg: 'bg-gradient-to-r from-emerald-600 to-teal-600',
          badgeText: 'Order Placed',
          borderColor: 'border-emerald-200',
          glowColor: 'shadow-[0_14px_36px_rgba(16,185,129,0.28)]',
        };
      case 'success':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-white" />,
          bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          badgeText: 'Success',
          borderColor: 'border-emerald-200',
          glowColor: 'shadow-[0_14px_36px_rgba(16,185,129,0.25)]',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-4 h-4 text-white" />,
          bg: 'bg-gradient-to-r from-[#141219] to-[#301c38]',
          badgeText: 'Notice',
          borderColor: 'border-[#eedbe6]',
          glowColor: 'shadow-[0_14px_36px_rgba(50,31,63,0.18)]',
        };
    }
  };

  const styleConfig = getIconAndColors();

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed top-3 sm:top-5 left-1/2 -translate-x-1/2 z-[100000] w-[calc(100%-20px)] sm:w-auto sm:min-w-[360px] sm:max-w-lg pointer-events-auto"
    >
      <div
        className={`relative overflow-hidden rounded-[20px] bg-white/95 backdrop-blur-xl border-2 ${styleConfig.borderColor} ${styleConfig.glowColor} p-3 sm:p-3.5 flex items-center justify-between gap-3 transition-all duration-200 ease-out select-none ${
          isExiting
            ? 'opacity-0 -translate-y-4 scale-95'
            : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-top-4 duration-300'
        }`}
      >
        {/* Left Icon Pill with Gradient & Pulsing Glow */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-[13px] ${styleConfig.bg} flex items-center justify-center shrink-0 shadow-md`}
          >
            {styleConfig.icon}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 leading-none mb-0.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915]">
                {toast.title || styleConfig.badgeText}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <p className="text-xs sm:text-[13px] font-extrabold text-[#141219] m-0 truncate leading-snug">
              {toast.message}
            </p>
          </div>
        </div>

        {/* Action Button (e.g. "View Bag →") */}
        {toast.actionLabel && toast.onAction && (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.();
              handleManualDismiss();
            }}
            className="h-[32px] px-3 rounded-[10px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer shrink-0"
          >
            <span>{toast.actionLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={handleManualDismiss}
          className="w-7 h-7 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#8a858f] hover:text-[#141219] flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-90"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Animated Countdown Progress Line */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#f7edf3]">
          <div
            className="h-full bg-gradient-to-r from-[#D30915] to-[#ff3b81] transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
