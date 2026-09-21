import { useState, useEffect } from 'react';

export const HIDE_LAYOUT_ROUTES = [
  '/checkout',
  '/checkout/shipping',
  '/payment',
  '/buy-now',
  '/thank-you',
  '/order-success',
  '/order-confirmation',
];

/**
 * Checks whether a given path or view belongs to the checkout flow,
 * where the main Header & Footer must be hidden.
 */
export function isCheckoutRoute(pathname: string, currentView?: string): boolean {
  if (currentView === 'checkout' || currentView === 'order-confirmation') {
    return true;
  }
  const cleanPath = (pathname || '').split('?')[0].split('#')[0];
  return HIDE_LAYOUT_ROUTES.some((route) => {
    return cleanPath === route || cleanPath.startsWith(`${route}/`) || cleanPath.startsWith(route);
  });
}

/**
 * Reactive hook that returns current window.location.pathname.
 * Updates on popstate, pushState, replaceState, and custom events.
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(() => {
    if (typeof window === 'undefined') return '/';
    return window.location.pathname;
  });

  useEffect(() => {
    const handlePathUpdate = () => {
      if (typeof window !== 'undefined') {
        setPathname(window.location.pathname);
      }
    };

    window.addEventListener('popstate', handlePathUpdate);
    window.addEventListener('ils_route_change', handlePathUpdate);

    // Intercept pushState & replaceState so usePathname remains reactive
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const res = originalPushState.apply(this, args);
      handlePathUpdate();
      return res;
    };

    window.history.replaceState = function (...args) {
      const res = originalReplaceState.apply(this, args);
      handlePathUpdate();
      return res;
    };

    return () => {
      window.removeEventListener('popstate', handlePathUpdate);
      window.removeEventListener('ils_route_change', handlePathUpdate);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  return pathname;
}

/**
 * useLocation hook providing { pathname, search, hash }
 */
export function useLocation() {
  const pathname = usePathname();
  const [locationState, setLocationState] = useState(() => ({
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/',
    search: typeof window !== 'undefined' ? window.location.search : '',
    hash: typeof window !== 'undefined' ? window.location.hash : '',
  }));

  useEffect(() => {
    const handleUpdate = () => {
      if (typeof window !== 'undefined') {
        setLocationState({
          pathname: window.location.pathname,
          search: window.location.search,
          hash: window.location.hash,
        });
      }
    };

    window.addEventListener('popstate', handleUpdate);
    window.addEventListener('ils_route_change', handleUpdate);
    return () => {
      window.removeEventListener('popstate', handleUpdate);
      window.removeEventListener('ils_route_change', handleUpdate);
    };
  }, []);

  return {
    pathname,
    search: locationState.search,
    hash: locationState.hash,
  };
}
