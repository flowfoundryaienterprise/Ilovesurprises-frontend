import React, { useState, useEffect } from 'react';
import { Hero } from '../components/home/Hero';
import { FeaturedCollectionsSection } from '../components/home/FeaturedCollectionsSection';
import { CategorySection } from '../components/home/CategorySection';
import { AffiliateSection } from '../components/home/AffiliateSection';
import { FeaturedProducts } from '../components/home/FeaturedProducts';
import { ReviewsSection } from '../components/home/ReviewsSection';
import { sessionTracker } from '../utils/sessionTracker';
import type { Product, CartItem } from '../types';

interface HomeProps {
  cart?: CartItem[];
  wishlistIds?: string[];
  searchQuery?: string;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSelectCollection?: (handle: string) => void;
  onNavigateToShop?: () => void;
  onViewAllCategories?: () => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct?: (product: Product) => void;
}

export const Home: React.FC<HomeProps> = ({
  cart = [],
  wishlistIds = [],
  searchQuery: _searchQuery = '',
  selectedCategory = 'All Surprises',
  onSelectCategory,
  onSelectCollection,
  onNavigateToShop,
  onViewAllCategories,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
}) => {
  // Skeleton only shows on first open & page refresh; subsequent visits in same session render immediately
  const [isLoading, setIsLoading] = useState(() => sessionTracker.isFirstVisit('home'));
  const [userSelectedCategory, setUserSelectedCategory] = useState<string | null>(null);
  const homeCategory = userSelectedCategory ?? selectedCategory ?? 'All Surprises';

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [isLoading]);

  return (
    <main className="w-full overflow-x-hidden animate-in fade-in duration-300">
      {/* 1. Hero Showcase Banner */}
      <div className="transition-all duration-300">
        <Hero />
      </div>

      {/* 2. Explore Section (Shop by Surprise & Trust Badges) - Directly below Main Banner */}
      <div className="transition-all duration-300">
        <CategorySection
          isLoading={isLoading}
          selectedCategory={homeCategory}
          onSelectCategory={onSelectCategory}
          onSelectCollection={onSelectCollection}
          onViewAllCategories={onViewAllCategories}
        />
      </div>

      {/* 3. Featured Curated Collections (Holiday & Signature Collections) */}
      <div className="transition-all duration-300">
        <FeaturedCollectionsSection
          onSelectCategory={onSelectCategory}
          onSelectCollection={onSelectCollection}
          onSelectProduct={onSelectProduct}
        />
      </div>

      {/* 4. Trending Best Sellers (Curated Products, Zero Tabs, Max 10 Products) */}
      <div className="transition-all duration-300">
        <FeaturedProducts
          isLoading={isLoading}
          cart={cart}
          wishlistIds={wishlistIds}
          searchQuery=""
          selectedCategory={homeCategory}
          onSelectCategory={(cat) => setUserSelectedCategory(cat)}
          onSelectCollection={onSelectCollection}
          onNavigateToShop={onNavigateToShop || (() => onSelectCategory?.('All Surprises'))}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
          onWishlistToggle={onWishlistToggle}
          onSelectProduct={onSelectProduct}
        />
      </div>

      {/* 5. Affiliate Program (Earn More with I Love Surprises & Commission Structure) */}
      <div className="transition-all duration-300">
        <AffiliateSection isLoading={isLoading} />
      </div>

      {/* 6. Customer Reviews & Social Proof Numbers Strip */}
      <div className="transition-all duration-300">
        <ReviewsSection isLoading={isLoading} />
      </div>
    </main>
  );
};
