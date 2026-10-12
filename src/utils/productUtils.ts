import type { Product } from '../types';

/**
 * Deduplicates an array of products strictly by product.id (with fallback to slug).
 * Preserves first-seen product order and attributes.
 */
export function deduplicateProducts(products: Product[]): Product[] {
  if (!products || products.length === 0) return [];
  const seenIds = new Set<string>();
  const seenHandles = new Set<string>();
  const unique: Product[] = [];

  for (const product of products) {
    if (!product) continue;
    const id = product.id !== undefined && product.id !== null ? String(product.id).trim().toLowerCase() : '';
    const handle = product.slug !== undefined && product.slug !== null ? String(product.slug).trim().toLowerCase() : '';

    if (id) {
      if (seenIds.has(id)) {
        continue;
      }
      seenIds.add(id);
      if (handle) {
        seenHandles.add(handle);
      }
      unique.push(product);
    } else if (handle) {
      if (seenHandles.has(handle)) {
        continue;
      }
      seenHandles.add(handle);
      unique.push(product);
    } else {
      unique.push(product);
    }
  }

  return unique;
}

/**
 * Ranks search results by relevance across title, slug/handle, category, description,
 * scent notes, badge, surprise type, and surprise value.
 * Handles hyphens, punctuation, casing, singular/plural stems, and multi-word token queries.
 */
export function rankProductsBySearch(products: Product[], query: string, limit?: number): Product[] {
  const rawQ = (query || '').toLowerCase().trim();
  if (!rawQ) return deduplicateProducts(products);

  const normalizedQ = rawQ.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  const tokens = normalizedQ.split(' ').filter(Boolean);
  if (tokens.length === 0) return [];

  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    if (!product) continue;
    const name = (product.name || '').toLowerCase();
    const nameNorm = name.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const slug = (product.slug || product.id || '').toLowerCase();
    const slugNorm = slug.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const cat = (product.category || '').toLowerCase();
    const catNorm = cat.replace(/[-_]/g, ' ').replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const desc = (product.description || '').toLowerCase();
    const badge = (product.badge || '').toLowerCase();
    const surpriseType = (product.surpriseType || '').toLowerCase();
    const surpriseVal = (product.surpriseValue || '').toLowerCase();
    const scents = Array.isArray(product.scentNotes) ? product.scentNotes.join(' ').toLowerCase() : '';

    let score = 0;

    // 1. Direct and Exact Matches (Highest Priority)
    if (name === rawQ || nameNorm === normalizedQ || slug === rawQ || slugNorm === normalizedQ) {
      score += 25000;
    } else if (name.startsWith(rawQ) || nameNorm.startsWith(normalizedQ)) {
      score += 12000;
    } else if (slug.startsWith(rawQ) || slugNorm.startsWith(normalizedQ)) {
      score += 10000;
    } else if (name.includes(rawQ) || nameNorm.includes(normalizedQ)) {
      score += 6000;
    } else if (slug.includes(rawQ) || slugNorm.includes(normalizedQ)) {
      score += 5000;
    }

    // 2. Multi-token and Partial Word Matching
    let tokensMatched = 0;
    let tokensInTitleOrSlug = 0;

    for (const t of tokens) {
      const stem = t.endsWith('s') && t.length > 3 ? t.slice(0, -1) : t;
      const inTitle = nameNorm.includes(t) || nameNorm.includes(stem);
      const inSlug = slugNorm.includes(t) || slugNorm.includes(stem);
      const inCat = catNorm.includes(t) || catNorm.includes(stem);
      const inDesc = desc.includes(t) || desc.includes(stem);
      const inBadge = badge.includes(t) || badge.includes(stem);
      const inType = surpriseType.includes(t) || surpriseVal.includes(t);
      const inScent = scents.includes(t) || scents.includes(stem);

      if (inTitle || inSlug || inCat || inDesc || inBadge || inType || inScent) {
        tokensMatched++;
        if (inTitle || inSlug) {
          tokensInTitleOrSlug++;
        }
      }
    }

    if (tokensMatched === tokens.length) {
      score += 3500 + tokensInTitleOrSlug * 800;
    } else if (tokens.length > 1 && tokensMatched >= Math.ceil(tokens.length * 0.7)) {
      score += tokensMatched * 400 + tokensInTitleOrSlug * 300;
    }

    // 3. Keyword / Surprise Type Matches
    if (rawQ === 'cash' && surpriseType === 'cash') score += 1500;
    if ((rawQ === 'jewelry' || rawQ === 'ring' || rawQ === 'necklace') && surpriseType === 'jewelry') score += 1500;

    // Apply bestseller boost strictly when product has already matched
    if (score > 0 && product.isBestSeller) {
      score += 50;
    }

    // Only include products with legitimate relevance
    if (score > 0) {
      scored.push({ product, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  const deduplicated = deduplicateProducts(scored.map((s) => s.product));
  return limit ? deduplicated.slice(0, limit) : deduplicated;
}
