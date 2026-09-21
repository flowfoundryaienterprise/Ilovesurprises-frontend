import type { Product } from '../types';

/**
 * Deduplicates an array of products strictly by product.id (with fallback to slug).
 * Preserves first-seen product order and attributes.
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!products || products.length === 0) return [];
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  const unique: Product[] = [];

  for (const product of products) {
    if (!product) continue;
    const id = product.id?.trim();
    const slug = product.slug?.trim();

    // Check ID uniqueness if ID exists
    if (id && seenIds.has(id)) {
      continue;
    }
    // Check slug uniqueness if slug exists
    if (slug && seenSlugs.has(slug)) {
      continue;
    }

    if (id) seenIds.add(id);
    if (slug) seenSlugs.add(slug);
    unique.push(product);
  }

  return unique;
}

/**
 * Ranks search results by relevance:
 * 1. Exact name match
 * 2. Starts with query
 * 3. Word boundary match
 * 4. Earliest occurrence in name
 * 5. Description / category match
 * 6. Shorter / cleaner titles
 */
export function rankProductsBySearch(products: Product[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return deduplicateProducts(products);

  const scored = products.map((product) => {
    const name = (product.name || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    const desc = (product.description || '').toLowerCase();
    let score = 0;

    if (name === q) {
      score += 10000;
    } else if (name.startsWith(q)) {
      score += 5000;
    } else if (name.includes(' ' + q) || name.includes('-' + q)) {
      score += 3000;
    } else if (name.includes(q)) {
      const idx = name.indexOf(q);
      score += Math.max(1000 - idx * 10, 500);
    } else if (category.includes(q)) {
      score += 200;
    } else if (desc.includes(q)) {
      score += 100;
    }

    // Boost best sellers slightly for equal relevance
    if (product.isBestSeller) score += 20;

    // Favor concise relevant titles over bloated titles
    score -= Math.min(name.length, 100);

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return deduplicateProducts(scored.map((s) => s.product));
}
