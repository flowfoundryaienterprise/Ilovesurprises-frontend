/**
 * I Love Surprises - Production Service Worker
 * Standalone frontend asset pre-caching & offline fallback
 * 
 * STRICT SECURITY RULES:
 * - NEVER cache API responses (/api/*, api.ilovesurprises.com).
 * - NEVER cache Authorization headers or authenticated sessions.
 * - Cache only safe, public, static frontend assets (HTML shell, CSS, JS bundles, images, icons, fonts).
 */

const CACHE_NAME = 'ils-static-v1';

// Critical static assets to pre-cache on service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.png',
  '/favicon.ico',
  '/logo.png',
  '/robots.txt',
];

// Helper: determine if a request is safe for static caching
function isSafeStaticRequest(request) {
  const url = new URL(request.url);

  // 1. Never cache non-GET requests
  if (request.method !== 'GET') {
    return false;
  }

  // 2. Never cache Express REST API endpoints or external API domains
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('api.ilovesurprises.com') ||
    url.hostname.includes('nominatim.openstreetmap.org')
  ) {
    return false;
  }

  // 3. Never cache requests with Authorization header
  if (request.headers.has('Authorization')) {
    return false;
  }

  // 4. Cache same-origin static assets or authorized CDNs (fonts, images)
  const isSameOrigin = url.origin === self.location.origin;
  const isFontCdn =
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';
  const isCdnAsset =
    url.hostname.includes('cdn.shopify.com') ||
    url.hostname.includes('images.unsplash.com');

  return isSameOrigin || isFontCdn || isCdnAsset;
}

// Installation: pre-cache core static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        // Attempt to pre-cache critical shell assets
        return cache.addAll(PRECACHE_ASSETS).catch((err) => {
          // Non-blocking in case individual development assets are unavailable
          console.warn('[SW] Non-fatal precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activation: purge previous cache generations
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME && name.startsWith('ils-static-')) {
              return caches.delete(name);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for static assets, network-first for navigation, network-only for API
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Strict API bypass: always go directly to network
  if (!isSafeStaticRequest(request)) {
    return;
  }

  // Navigation (HTML page visit) -> Network first, fall back to cached shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Static Assets (scripts, styles, images, fonts) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            networkResponse.type === 'basic'
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline and no network, return cached response
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});
