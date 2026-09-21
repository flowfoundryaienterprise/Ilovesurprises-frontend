import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  PackageX,
  ArrowRight,
} from 'lucide-react';
import { productService } from '../services/productService';
import { ProductCard } from '../components/products/ProductCard';
import { ProductCardSkeleton } from '../components/ui/ProductCardSkeleton';
import type { Product, Collection, CartItem } from '../types';

interface CollectionPageProps {
  collectionHandle: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  cart?: CartItem[];
  wishlistIds?: string[];
  onNavigateToShop?: () => void;
  onNavigateToHome?: () => void;
  onBackToHome?: () => void;
}

type SortOption = 'featured' | 'price-asc' | 'price-desc' | 'newest';

export const CollectionPage: React.FC<CollectionPageProps> = ({
  collectionHandle,
  onSelectProduct,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  cart = [],
  wishlistIds = [],
  onNavigateToShop,
  onNavigateToHome,
}) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

  // Cart quantity map
  const cartQuantityMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.product.id, item.quantity);
    });
    return map;
  }, [cart]);

  // Load collection and products whenever handle, page, or sort changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    productService
      .getProductsByCollection(collectionHandle, {
        page: currentPage,
        limit: 15,
        sort: sortBy,
      })
      .then((res) => {
        if (!isCancelled) {
          setCollection(res.collection);
          setProducts(res.products);
          setTotalCount(res.total);
          setTotalPages(res.totalPages);
          setIsLoading(false);

          if (res.collection) {
            document.title = `${res.collection.title} | I Love Surprises`;
          }
        }
      })
      .catch((err) => {
        console.warn('Error loading collection:', err);
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [collectionHandle, currentPage, sortBy]);

  // Reset page when collection handle changes
  useEffect(() => {
    setCurrentPage(1);
    setIsDescriptionExpanded(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [collectionHandle]);

  const hasLongDescription = Boolean(collection?.bodyHtml && collection.bodyHtml.length > 350);

  return (
    <div className="w-full max-w-[1460px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 animate-in fade-in duration-300">
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#716d77] mb-6">
        <button
          type="button"
          onClick={onNavigateToHome}
          className="hover:text-[#D30915] transition-colors cursor-pointer"
        >
          Home
        </button>
        <span>/</span>
        <button
          type="button"
          onClick={onNavigateToShop}
          className="hover:text-[#D30915] transition-colors cursor-pointer"
        >
          Collections
        </button>
        <span>/</span>
        <span className="text-[#141219] font-bold truncate max-w-[240px]">
          {collection?.title || collectionHandle.replace(/-/g, ' ')}
        </span>
      </nav>

      {/* 2. Collection Header Banner */}
      <header className="mb-8 pb-6 border-b border-[#f4edf2]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[11px] font-black uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Authentic Collection</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#141219] tracking-tight font-display m-0 capitalize">
              {collection?.title || collectionHandle.replace(/-/g, ' ')}
            </h1>

            {/* Authoritative Shopify Body HTML / Collection Write-up */}
            {collection?.bodyHtml && (
              <div className="mt-3 relative">
                <div
                  className={`text-xs sm:text-sm text-[#55505a] leading-relaxed transition-all duration-300 font-medium ${
                    !isDescriptionExpanded && hasLongDescription ? 'max-h-[85px] overflow-hidden' : ''
                  }`}
                  dangerouslySetInnerHTML={{ __html: collection.bodyHtml }}
                />

                {hasLongDescription && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#D30915] hover:text-[#b60711] transition-colors cursor-pointer"
                  >
                    <span>{isDescriptionExpanded ? 'Show Less' : 'Read Full Description'}</span>
                    {isDescriptionExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            )}

            <div className="mt-4">
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#f8f5f7] border border-[#ebdce5] text-xs font-black text-[#141219]">
                {totalCount.toLocaleString()} {totalCount === 1 ? 'Product' : 'Products'}
              </span>
            </div>
          </div>

          {/* Authentic Collection Image Showcase */}
          {collection?.imageUrl && (
            <div className="hidden lg:block lg:w-72 lg:h-48 rounded-2xl overflow-hidden border border-[#eedbe6] shadow-sm shrink-0 relative isolate group">
              <img
                src={collection.imageUrl}
                alt={collection.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 left-3 right-3 text-white text-[11px] font-bold truncate drop-shadow-sm pointer-events-none">
                {collection.title}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* 3. Toolbar: Product Count & Sorting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-[#f4edf2]">
        <div className="text-xs sm:text-sm text-[#716d77] font-medium">
          Showing <span className="font-bold text-[#141219]">{products.length}</span> of{' '}
          <span className="font-bold text-[#141219]">{totalCount.toLocaleString()}</span> products
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label htmlFor="collection-sort" className="text-xs text-[#716d77] font-semibold">
            Sort by:
          </label>
          <div className="relative">
            <select
              id="collection-sort"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="appearance-none bg-white border border-[#e5dfe5] hover:border-[#D30915] rounded-[10px] px-3 py-1.5 pr-8 text-xs font-bold text-[#141219] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D30915]/20 shadow-2xs transition-colors"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#716d77] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 4. Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={cartQuantityMap.get(product.id) || 0}
              onAddToCart={onAddToCart}
              onUpdateQuantity={onUpdateQuantity}
              onToggleWishlist={(productId) => {
                const prod = products.find((p) => p.id === productId);
                if (prod) onWishlistToggle(prod);
              }}
              onSelectProduct={onSelectProduct}
              isWishlisted={wishlistIds.includes(product.id)}
            />
          ))}
        </div>
      ) : (
        /* Genuine 0-product Empty State */
        <div className="text-center py-16 px-4 bg-[#fffafb] rounded-[24px] border border-[#f5edf2] my-8">
          <div className="w-16 h-16 rounded-full bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center mx-auto mb-4 text-[#D30915]">
            <PackageX className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-[#141219] mb-1 font-display">
            No Products Currently in This Collection
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto mb-6 font-medium">
            This collection ({collection?.title || collectionHandle}) has 0 inventory items currently in the catalog. Explore other popular surprise collections below!
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onNavigateToShop}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#D30915] text-white text-xs font-bold shadow-sm hover:bg-[#b60711] transition-all cursor-pointer"
            >
              <span>Explore All Products</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-stone-300 text-stone-700 text-xs font-bold hover:bg-stone-50 transition-all cursor-pointer"
            >
              <span>Back to Home</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Pagination Controls */}
      {totalPages > 1 && !isLoading && (
        <div className="flex items-center justify-center gap-2 mt-12 pt-6 border-t border-[#f4edf2]">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-[10px] text-xs font-bold border border-[#e5dfe5] bg-white text-[#141219] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors cursor-pointer"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              let pageNum = idx + 1;
              if (totalPages > 5 && currentPage > 3) {
                pageNum = currentPage - 2 + idx;
                if (pageNum > totalPages) pageNum = totalPages - (4 - idx);
              }
              const isActive = pageNum === currentPage;
              return (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => {
                    setCurrentPage(pageNum);
                    window.scrollTo({ top: 200, behavior: 'smooth' });
                  }}
                  className={`w-8 h-8 rounded-[8px] text-xs font-black transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#D30915] text-white shadow-2xs'
                      : 'bg-white border border-[#e5dfe5] text-[#716d77] hover:text-[#141219] hover:bg-stone-50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            className="px-3.5 py-1.5 rounded-[10px] text-xs font-bold border border-[#e5dfe5] bg-white text-[#141219] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#fff1f2] hover:text-[#D30915] transition-colors cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
