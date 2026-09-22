import type { Category } from '../types';
import { categoriesData } from '../data/categories';

export const categoryService = {
  /**
   * Retrieves all categories from local categoriesData
   */
  async getCategories(): Promise<Category[]> {
    return categoriesData;
  },

  /**
   * Retrieves a single category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category | null> {
    return categoriesData.find((c) => c.slug === slug || c.id === slug) || null;
  },
};
