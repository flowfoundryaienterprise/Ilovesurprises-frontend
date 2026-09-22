export interface Category {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  itemCount: number;
  image: string;
  featured?: boolean;
  accentColor?: string;
}

export type SurpriseType = 'jewelry' | 'cash' | 'trinket' | 'charm' | 'mystery' | 'both';

export interface Collection {
  id: string;
  handle: string;
  title: string;
  bodyHtml?: string;
  description?: string;
  productsCount: number;
  imageUrl?: string;
  sortOrder?: string;
}

export interface ProductVariant {
  variantId: string;
  productId: string;
  title?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  inStock?: boolean;
  option1Name?: string;
  option1Value?: string;
  option2Name?: string;
  option2Value?: string;
  option3Name?: string;
  option3Value?: string;
}

export interface ProductOption {
  name: string;
  position: number;
  values: string[];
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  originalPrice?: number;
  surpriseType: SurpriseType;
  surpriseValue?: string; // e.g. "Jewelry inside worth $10 - $7,500" or "Real Cash $2 - $2,500 inside"
  rating: number;
  reviewCount: number;
  image: string;
  images?: string[];
  variants?: ProductVariant[];
  options?: ProductOption[];
  badge?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  inStock: boolean;
  scentNotes?: string[];
  description?: string;
  sku?: string;
  ringSizes?: number[];
  jewelryTypes?: string[];
}

export interface Review {
  id: string;
  productId?: string;
  author: string;
  location?: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  productName: string;
  revealedSurprise?: string;
  avatar?: string;
}

export interface NavItem {
  label: string;
  href: string;
  badge?: string;
  children?: { label: string; href: string; description?: string }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSurpriseOption?: string;
  selectedRingSize?: number;
  selectedJewelryType?: string;
  selectedSize?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  role: 'customer' | 'representative' | 'admin';
  repUsername?: string;
  avatar?: string;
  createdAt?: string;
  sponsorUsername?: string;
}

export * from './order';
export * from './affiliate';
export * from './admin';

export interface LoginPayload {
  identifier: string; // Email
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role?: 'customer' | 'representative';
  repUsername?: string;
  sponsorUsername?: string;
}
