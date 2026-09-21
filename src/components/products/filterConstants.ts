export interface FilterState {
  categories: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  surpriseTypes: string[];
  inStockOnly: boolean;
  minDiscount: number | null;
  bestSellersOnly: boolean;
  newArrivalsOnly: boolean;
  sortBy: 'featured' | 'best-sellers' | 'price-asc' | 'price-desc' | 'rating';
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  surpriseTypes: [],
  inStockOnly: false,
  minDiscount: null,
  bestSellersOnly: false,
  newArrivalsOnly: false,
  sortBy: 'featured',
};

// Preset price bands based on actual catalog
export const PRICE_PRESETS = [
  { id: 'under-20', label: 'Under $20', min: null, max: 20 },
  { id: '20-25', label: '$20 to $25', min: 20, max: 25 },
  { id: '25-30', label: '$25 to $30', min: 25, max: 30 },
  { id: '30-35', label: '$30 to $35', min: 30, max: 35 },
  { id: '35-plus', label: '$35 & Above', min: 35, max: null },
];

export const DISCOUNT_PRESETS = [
  { id: 10, label: '10% Off or more' },
  { id: 20, label: '20% Off or more' },
  { id: 30, label: '30% Off or more' },
  { id: 40, label: '40% Super Savings' },
];

export const SORT_OPTIONS: { id: FilterState['sortBy']; label: string; icon?: string }[] = [
  { id: 'featured', label: 'Featured Reveals' },
  { id: 'best-sellers', label: '🔥 Best Sellers' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating', label: 'Customer Rating: High to Low' },
];
