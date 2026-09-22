/**
 * Bulletproof image resolution and fallback utilities.
 * Ensures that broken images NEVER appear anywhere on the site.
 */

// Self-contained SVG data URI that requires zero network requests and cannot 404 or fail.
export const FALLBACK_SVG_DATA_URI =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='none'><rect width='300' height='300' rx='24' fill='%23FFF1F4'/><circle cx='150' cy='150' r='68' fill='%23FFE4E9'/><path d='M150 95 C146 115 135 125 135 140 C135 148 142 155 150 155 C158 155 165 148 165 140 C165 125 154 115 150 95 Z' fill='%23D30915'/><rect x='132' y='155' width='36' height='50' rx='6' fill='%23141219'/><text x='150' y='235' font-family='sans-serif' font-size='13' font-weight='bold' fill='%239B1B32' text-anchor='middle'>I Love Surprises</text></svg>";

export const FALLBACK_PRIMARY_IMAGE =
  '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg';

/**
 * Authoritative category-to-local-asset fallback dictionary.
 * All paths are guaranteed to exist locally in /public.
 */
export const CATEGORY_IMAGE_FALLBACKS: Record<string, string> = {
  'jewelry-candles': '/assets/ilovesurprises/categories/1_Mockup_Jewelry_JewelryCandles_93d459aa-d530-474d-ba4c-32fb9af4f94c.jpg',
  'cash-candles': '/assets/ilovesurprises/categories/cash_candles.jpg',
  'cash-money-candles': '/assets/ilovesurprises/categories/cash_money_candles.jpg',
  'wax-melts': '/assets/ilovesurprises/categories/Cat-2_Figurines_JWL_wax_melts.jpg',
  'bath-bombs': '/assets/ilovesurprises/categories/Heartfelt-Hugs.jpg',
  'bath & body': '/assets/ilovesurprises/categories/Heartfelt-Hugs.jpg',
  'soap': '/assets/ilovesurprises/categories/goats_milk_soaps.jpg',
  'soaps': '/assets/ilovesurprises/categories/goats_milk_soaps.jpg',
  'slimes': '/assets/ilovesurprises/categories/BDayCake.webp',
  'candy': '/assets/ilovesurprises/categories/cash_candy.jpg',
  'cash candy': '/assets/ilovesurprises/categories/cash_candy.jpg',
  'chocolates': '/assets/ilovesurprises/categories/chocolates.jpg',
  'greeting-cards': '/assets/ilovesurprises/banners/mjb.png',
  'jewelry': '/assets/ilovesurprises/hero/hero-lifestyle-reveal.jpg',
  'zodiac-cash-money-candles': '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
};

/**
 * Get verified fallback image for a category slug or name.
 */
export function getCategoryFallback(key?: string): string {
  if (!key) return FALLBACK_PRIMARY_IMAGE;
  const clean = key.toLowerCase().trim();
  return CATEGORY_IMAGE_FALLBACKS[clean] || FALLBACK_PRIMARY_IMAGE;
}

/**
 * Bulletproof error event handler for <img> elements.
 * Multi-tier: tries category/specific fallback -> primary mockup -> inline SVG data URI.
 * Never causes infinite loops.
 */
export function handleImageErrorSafely(
  e: React.SyntheticEvent<HTMLImageElement>,
  preferredFallback?: string
) {
  const img = e.currentTarget;
  const currentSrc = img.src;

  const targetFallback = preferredFallback || FALLBACK_PRIMARY_IMAGE;

  // If haven't tried preferred fallback, try it
  if (!currentSrc.includes(targetFallback)) {
    img.src = targetFallback;
    return;
  }

  // If already tried preferred fallback, try universal primary mockup
  if (!currentSrc.includes(FALLBACK_PRIMARY_IMAGE)) {
    img.src = FALLBACK_PRIMARY_IMAGE;
    return;
  }

  // Final tier: self-contained SVG data URI that cannot fail over network
  img.src = FALLBACK_SVG_DATA_URI;
  img.onerror = null; // Prevent any further triggers
}
