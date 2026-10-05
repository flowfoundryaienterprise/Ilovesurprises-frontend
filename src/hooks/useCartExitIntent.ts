import { useState, useEffect, useCallback } from 'react';
import type { CartItem } from '../types';

const SESSION_KEY = 'ils_cart_exit_intent_session_v1';
const DISMISSED_TIMESTAMP_KEY = 'ils_cart_exit_intent_last_dismissed_v1';
const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours cooldown

export interface UseCartExitIntentOptions {
  cart: CartItem[];
  enabled?: boolean;
}

export function useCartExitIntent({ cart, enabled = true }: UseCartExitIntentOptions) {
  const [isOpen, setIsOpen] = useState(false);

  // Check whether exit intent is allowed to display
  const canShow = useCallback(() => {
    if (!enabled || cart.length === 0) return false;
    if (typeof window === 'undefined') return false;

    try {
      // 1. Check session storage (show at most once per session)
      const sessionShown = sessionStorage.getItem(SESSION_KEY);
      if (sessionShown === 'true') return false;

      // 2. Check 24h cooldown in local storage
      const lastDismissed = localStorage.getItem(DISMISSED_TIMESTAMP_KEY);
      if (lastDismissed) {
        const timeSince = Date.now() - parseInt(lastDismissed, 10);
        if (timeSince < COOLDOWN_MS) {
          return false;
        }
      }
    } catch {
      // ignore storage access errors
    }

    return true;
  }, [cart.length, enabled]);

  // Handle desktop mouseleave towards browser tab bar
  useEffect(() => {
    if (!enabled || cart.length === 0) return;

    let hasTriggered = false;

    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves out of top viewport (towards URL/tab bar)
      if (e.clientY <= 15 && !hasTriggered && canShow()) {
        hasTriggered = true;
        setIsOpen(true);
        try {
          sessionStorage.setItem(SESSION_KEY, 'true');
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cart.length, canShow, enabled]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    try {
      localStorage.setItem(DISMISSED_TIMESTAMP_KEY, Date.now().toString());
      sessionStorage.setItem(SESSION_KEY, 'true');
    } catch {
      // ignore
    }
  }, []);

  const openModalManually = useCallback(() => {
    setIsOpen(true);
  }, []);

  return {
    isExitIntentOpen: isOpen,
    closeExitIntent: closeModal,
    openExitIntent: openModalManually,
  };
}
