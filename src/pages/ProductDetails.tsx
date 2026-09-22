import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Star,
  Plus,
  Minus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  RotateCcw,
  Zap,
  DollarSign,
  Gem,
  CheckCircle2,
  Sparkles,
  X,
  MessageSquare,
  Check,
  Clock,
  ChevronDown,
  Flame,
} from 'lucide-react';
import { ProductGallery } from '../components/products/ProductGallery';
import { ProductCard } from '../components/products/ProductCard';
import { productsData } from '../data/products';
import { reviewsData } from '../data/reviews';
import { deduplicateProducts } from '../utils/productUtils';
import type { Product, CartItem, Review } from '../types';
import { representativeService, type PublicRepresentative } from '../services/representativeService';

interface ProductDetailsProps {
  product: Product;
  cart?: CartItem[];
  wishlistIds?: string[];
  onBackToShop: () => void;
  onAddToCart: (
    product: Product,
    quantity?: number,
    options?: { selectedRingSize?: number; selectedJewelryType?: string; selectedSize?: string }
  ) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onWishlistToggle: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onOpenCart?: () => void;
  onBuyNow?: (
    product: Product,
    quantity?: number,
    options?: { selectedRingSize?: number; selectedJewelryType?: string; selectedSize?: string }
  ) => void;
  onNavigateToAppraisal?: () => void;
  onShowToast?: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

const LOCAL_REVIEWS_KEY = 'ilovesurprises_user_reviews_v1';
const RING_SIZES = [5, 6, 7, 8, 9, 10];
const JEWELRY_TYPES = ['Ring', 'Necklace', 'Earrings', 'Bracelet'];

// Authoritative 20 Scents in exact founder non-alphabetized order
export const FOUNDER_SCENTS = [
  'Birthday Cake',
  'Black Raspberry Vanilla',
  'Fresh Baked Sugar Cookies',
  'Baked Apple Pie',
  'French Vanilla',
  'Fresh Linen',
  'Blueberry Muffin',
  'Cinnamon Apple',
  'Lavender Vanilla',
  'Cinnamon Bun',
  'Bahama Mama',
  'Calming Lavender',
  'Strawberry Fields',
  'Pumpkin Spice',
  'Jamaican Me Crazy',
  'Cafe Mocha',
  'Fresh Cut Roses',
  'Honeysuckle Jasmine',
  'Cozy Cabin',
  'Unscented',
];

export const ProductDetails: React.FC<ProductDetailsProps> = ({
  product,
  cart = [],
  wishlistIds = [],
  onBackToShop,
  onAddToCart,
  onUpdateQuantity,
  onWishlistToggle,
  onSelectProduct,
  onOpenCart,
  onBuyNow,
  onNavigateToAppraisal,
  onShowToast,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize] = useState('Classic 14oz');

  // Detect whether this is a jewelry surprise product
  const isJewelrySurprise = useMemo(() => {
    return (
      product.surpriseType === 'jewelry' ||
      (product.category || '').toLowerCase().includes('jewelry') ||
      (product.name || '').toLowerCase().includes('ring') ||
      (product.name || '').toLowerCase().includes('jewelry') ||
      Boolean(product.surpriseValue && (product.surpriseValue || '').toLowerCase().includes('jewelry'))
    );
  }, [product]);

  // Detect Halloween product
  const isHalloween = useMemo(() => {
    const combined = `${product.name} ${product.slug} ${product.category}`.toLowerCase();
    return combined.includes('halloween');
  }, [product.name, product.slug, product.category]);

  // Order scents: Pumpkin Spice is ALWAYS #1 for Halloween products, then the remaining 19 scents in exact founder order
  const orderedScents = useMemo(() => {
    if (isHalloween) {
      return ['Pumpkin Spice', ...FOUNDER_SCENTS.filter((s) => s !== 'Pumpkin Spice')];
    }
    return FOUNDER_SCENTS;
  }, [isHalloween]);

  const [selectedScent, setSelectedScent] = useState<string>(() => orderedScents[0]);

  useEffect(() => {
    setSelectedScent(orderedScents[0]);
  }, [orderedScents]);

  // Real-time urgency countdown timer (JewelryCandles conversion style)
  const [productTimerSecs, setProductTimerSecs] = useState(() => {
    const now = Date.now();
    const cycleDuration = 4 * 3600 * 1000 + 38 * 60 * 1000 + 40 * 1000;
    return Math.floor((cycleDuration - (now % cycleDuration)) / 1000);
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setProductTimerSecs((prev) => (prev > 1 ? prev - 1 : 4 * 3600));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pTimerHours = String(Math.floor(productTimerSecs / 3600)).padStart(2, '0');
  const pTimerMinutes = String(Math.floor((productTimerSecs % 3600) / 60)).padStart(2, '0');
  const pTimerSeconds = String(productTimerSecs % 60).padStart(2, '0');

  // Dynamic Options (from product schema)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product.options && product.options.length > 0) {
      const initial: Record<string, string> = {};
      product.options.forEach((opt) => {
        if (opt.values && opt.values.length > 0) {
          initial[opt.name] = opt.values[0];
        }
      });
      setSelectedOptions(initial);
    } else {
      setSelectedOptions({});
    }
  }, [product.id, product.options]);

  // Find matching variant based on selected options
  const matchedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    if (!product.options || product.options.length === 0) return product.variants[0];

    return (
      product.variants.find((v) => {
        if (v.option1Name && selectedOptions[v.option1Name] && v.option1Value !== selectedOptions[v.option1Name]) {
          return false;
        }
        if (v.option2Name && selectedOptions[v.option2Name] && v.option2Value !== selectedOptions[v.option2Name]) {
          return false;
        }
        if (v.option3Name && selectedOptions[v.option3Name] && v.option3Value !== selectedOptions[v.option3Name]) {
          return false;
        }
        return true;
      }) || product.variants[0]
    );
  }, [product.variants, product.options, selectedOptions]);

  const currentPrice = matchedVariant?.price ?? product.price;
  const currentCompareAtPrice = matchedVariant?.compareAtPrice ?? product.originalPrice;
  const currentSku = matchedVariant?.sku ?? product.sku;
  const isVariantInStock = matchedVariant ? matchedVariant.inStock : product.inStock;

  // Jewelry Variant States (Ring Size & Jewelry Type fallback)
  const [selectedJewelryType, setSelectedJewelryType] = useState<string>('Ring');
  const [selectedRingSize, setSelectedRingSize] = useState<number>(7);

  // Consultant Attribution
  const [rep, setRep] = useState<PublicRepresentative | null>(() =>
    representativeService.getAttributedRepresentative()
  );

  // Review System States
  const [allReviews, setAllReviews] = useState<Review[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_REVIEWS_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      return [...parsed, ...reviewsData];
    } catch {
      return reviewsData;
    }
  });

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [newTitle, setNewTitle] = useState('');
  const [newComment, setNewComment] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const handleRep = (e: Event) => {
      const customEvent = e as CustomEvent<PublicRepresentative | null>;
      setRep(customEvent.detail || representativeService.getAttributedRepresentative());
    };
    window.addEventListener('ils_representative_attributed', handleRep);
    return () => window.removeEventListener('ils_representative_attributed', handleRep);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product.id]);

  const discountPercent =
    currentCompareAtPrice && currentCompareAtPrice > currentPrice
      ? Math.round(((currentCompareAtPrice - currentPrice) / currentCompareAtPrice) * 100)
      : null;

  // Filter reviews for this product or category
  const relevantReviews = useMemo(() => {
    const specific = allReviews.filter(
      (r) => r.productId === product.id || r.productName.toLowerCase() === product.name.toLowerCase()
    );
    if (specific.length > 0) return specific;
    return allReviews;
  }, [allReviews, product]);

  // Related products from the same category strictly deduplicated
  const relatedProducts = useMemo(() => {
    const filtered = productsData.filter(
      (p) => p.category === product.category && p.id !== product.id && p.slug !== product.slug
    );
    return deduplicateProducts(filtered).slice(0, 4);
  }, [product.category, product.id, product.slug]);

  // Authentic alternate images strictly for THIS product (never cross-pollinating with different products)
  const alternateImages = useMemo(() => {
    if (product.images && product.images.length > 1) {
      return product.images.slice(1);
    }
    return [];
  }, [product.images]);

  const handleAddToCartClick = () => {
    const customizedProduct = {
      ...product,
      price: currentPrice,
      originalPrice: currentCompareAtPrice || undefined,
      sku: currentSku || undefined,
    };
    const otherOpts =
      product.options && product.options.length > 0
        ? Object.entries(selectedOptions)
            .filter(([k]) => !k.toLowerCase().includes('scent') && !k.toLowerCase().includes('fragrance'))
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : '';
    const formattedSize = [selectedScent ? `Scent: ${selectedScent}` : '', otherOpts || selectedSize]
      .filter(Boolean)
      .join(' | ');

    onAddToCart(customizedProduct, quantity, {
      selectedRingSize: isJewelrySurprise && selectedJewelryType === 'Ring' ? selectedRingSize : undefined,
      selectedJewelryType: isJewelrySurprise ? selectedJewelryType : undefined,
      selectedSize: formattedSize,
    });
  };

  const handleBuyNowClick = () => {
    const customizedProduct = {
      ...product,
      price: currentPrice,
      originalPrice: currentCompareAtPrice || undefined,
      sku: currentSku || undefined,
    };
    const otherOpts =
      product.options && product.options.length > 0
        ? Object.entries(selectedOptions)
            .filter(([k]) => !k.toLowerCase().includes('scent') && !k.toLowerCase().includes('fragrance'))
            .map(([k, v]) => `${k}: ${v}`)
            .join(', ')
        : '';
    const formattedSize = [selectedScent ? `Scent: ${selectedScent}` : '', otherOpts || selectedSize]
      .filter(Boolean)
      .join(' | ');

    const options = {
      selectedRingSize: isJewelrySurprise && selectedJewelryType === 'Ring' ? selectedRingSize : undefined,
      selectedJewelryType: isJewelrySurprise ? selectedJewelryType : undefined,
      selectedSize: formattedSize,
    };
    if (onBuyNow) {
      onBuyNow(customizedProduct, quantity, options);
    } else {
      onAddToCart(customizedProduct, quantity, options);
      onOpenCart?.();
    }
  };

  // Review submission
  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim()) {
      setReviewError('Please enter your name.');
      return;
    }
    if (!newTitle.trim()) {
      setReviewError('Please provide a review headline.');
      return;
    }
    if (!newComment.trim() || newComment.trim().length < 10) {
      setReviewError('Please write at least 10 characters in your review.');
      return;
    }

    const createdReview: Review = {
      id: `rev-user-${Date.now()}`,
      productId: product.id,
      productName: product.name,
      author: newAuthor.trim(),
      location: 'Verified Buyer',
      rating: newRating,
      date: 'Just now',
      title: newTitle.trim(),
      comment: newComment.trim(),
      verified: true,
      revealedSurprise: isJewelrySurprise
        ? `Selected Size ${selectedRingSize} Jewelry Reveal`
        : 'Guaranteed Authentic Prize Inside',
    };

    const updated = [createdReview, ...allReviews];
    setAllReviews(updated);

    try {
      const stored = localStorage.getItem(LOCAL_REVIEWS_KEY);
      const existingUserReviews: Review[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(LOCAL_REVIEWS_KEY, JSON.stringify([createdReview, ...existingUserReviews]));
    } catch {
      // fallback
    }

    onShowToast?.('Thank you! Your verified review has been published.', {
      title: 'Review Submitted',
      type: 'success',
    });

    setIsReviewModalOpen(false);
    setNewTitle('');
    setNewComment('');
    setNewAuthor('');
    setReviewError(null);
  };

  return (
    <div className="w-full max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-8 overflow-hidden animate-in fade-in duration-300">
      {/* Breadcrumb Navigation & Back to Shop Action */}
      <div className="flex items-center justify-between gap-2 mb-6 pb-3 border-b border-[#f2edf1] w-full max-w-full overflow-hidden">
        <button
          type="button"
          onClick={onBackToShop}
          className="inline-flex items-center gap-1.5 text-xs font-black text-[#D30915] hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50 rounded-lg px-2 py-1 -ml-2 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Surprises</span>
        </button>

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#716d77] font-medium">
          <span>Home</span>
          <span>/</span>
          <span>Shop</span>
          <span>/</span>
          <span className="text-[#141219] font-bold truncate max-w-[200px]">{product.name}</span>
        </div>
      </div>

      {/* Main Product Details Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-10 mb-14 w-full max-w-full overflow-hidden items-start">
        {/* Left Column: Interactive Image Gallery with Hover Zoom & Lightbox */}
        <div className="lg:col-span-6 xl:col-span-5 w-full max-w-full overflow-hidden lg:sticky lg:top-[110px]">
          <ProductGallery
            mainImage={product.image}
            productName={product.name}
            alternateImages={alternateImages}
            badge={product.badge}
            surpriseValue={product.surpriseValue}
          />
        </div>

        {/* Right Column: Product Info, Surprise Card & Purchase Controls */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between w-full max-w-full overflow-hidden">
          <div>
            {/* Category & Ratings Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
                {product.category}
              </span>

              <div className="flex items-center gap-1 text-xs font-extrabold text-[#141219]">
                <div className="flex items-center gap-0.5 text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-current" />
                </div>
                <span>{product.rating.toFixed(1)}</span>
                <span className="text-[#8a858f] font-normal">
                  ({allReviews.length} verified {allReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            {/* Representative Endorsement Pill */}
            {rep && (
              <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fff5f6] border border-[#ffd8dc]">
                <img
                  src={rep.avatar}
                  alt={rep.name}
                  className="w-4 h-4 rounded-full object-cover ring-1 ring-[#D30915]/40"
                />
                <span className="text-[11px] text-[#645c68]">
                  Shopping with <strong className="text-[#141219] font-bold">{rep.name}</strong>
                </span>
              </div>
            )}

            {/* Product Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#141219] tracking-tight leading-tight m-0 mb-3 font-display">
              {product.name}
            </h1>

            {/* Price & Savings Pill */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
              <div className="text-2xl sm:text-3xl font-black text-[#141219]">
                ${currentPrice.toFixed(2)}
              </div>

              {currentCompareAtPrice && currentCompareAtPrice > currentPrice && (
                <div className="text-sm sm:text-base text-[#8a858f] line-through font-medium">
                  ${currentCompareAtPrice.toFixed(2)}
                </div>
              )}

              {discountPercent && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#D30915] text-white text-[10.5px] sm:text-xs font-black uppercase tracking-wider shrink-0 shadow-2xs">
                  Save {discountPercent}%
                </span>
              )}

              <span className={`text-[10.5px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                isVariantInStock
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                {isVariantInStock ? 'In Stock & Ready to Ship' : 'Limited Stock'}
              </span>
            </div>

            {/* Authoritative SKU display (Preserve blank/null if blank/null in authoritative source) */}
            {currentSku && (
              <div className="text-[11px] text-[#8a858f] font-mono mb-3">
                SKU: <span className="text-[#36323b] font-bold">{currentSku}</span>
              </div>
            )}

            {/* Real-time Urgency Countdown Timer (JewelryCandles Conversion Feature) */}
            <div className="mb-4 p-3 sm:p-3.5 rounded-[16px] bg-gradient-to-r from-[#fff1f2] via-[#fff7f8] to-[#fff1f2] border border-[#fecdd3] flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Clock className="w-4 h-4 animate-spin-slow" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] sm:text-xs font-black text-[#141219] uppercase tracking-wider flex items-center gap-1.5 truncate">
                    <span>Limited Surprise Batch</span>
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#D30915] animate-ping" />
                  </div>
                  <div className="text-[10.5px] sm:text-[11px] text-[#716d77] font-medium truncate">
                    Order in next {pTimerHours}h {pTimerMinutes}m to ship today!
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 font-mono">
                <div className="bg-[#141219] text-white px-2 py-1 rounded-[8px] text-xs font-black text-center min-w-[28px]">
                  {pTimerHours}h
                </div>
                <span className="font-bold text-[#D30915]">:</span>
                <div className="bg-[#141219] text-white px-2 py-1 rounded-[8px] text-xs font-black text-center min-w-[28px]">
                  {pTimerMinutes}m
                </div>
                <span className="font-bold text-[#D30915]">:</span>
                <div className="bg-[#D30915] text-white px-2 py-1 rounded-[8px] text-xs font-black text-center min-w-[28px] animate-pulse">
                  {pTimerSeconds}s
                </div>
              </div>
            </div>

            {/* Surprise Reveal Guarantee Feature Card */}
            <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#fff5f5] via-[#fff8fb] to-[#fff5f5] border border-[#fecdd3] mb-5 shadow-2xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0">
                  {product.surpriseType === 'cash' ? (
                    <DollarSign className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Gem className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0 leading-tight">
                    {product.surpriseType === 'cash'
                      ? 'Guaranteed Real Cash Prize Inside'
                      : 'Guaranteed Fine Jewelry Inside'}
                  </h4>
                  <p className="text-[11px] text-[#D30915] font-black m-0">
                    {product.surpriseValue || 'Authentic Reveal in Every Jar'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[#55505a] leading-relaxed m-0 font-medium pl-9">
                Every single handcrafted product holds a sealed, waterproof, heat-resistant capsule with your guaranteed surprise. Burn or unwrap to reveal your treasure!
              </p>
            </div>

            {/* Clean Dropdown Scent Selection (Exact 20 Scents in Founder Order) */}
            <div className="mb-5 p-4 rounded-[18px] bg-[#fffbfd] border border-[#eedbe6] shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="scent-dropdown" className="text-[11px] font-black uppercase tracking-wider text-[#141219] flex items-center gap-1.5 cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
                  <span>Choose Scent / Fragrance (Required):</span>
                </label>
                <span className="text-xs font-bold text-[#D30915]">{selectedScent}</span>
              </div>
              <div className="relative">
                <select
                  id="scent-dropdown"
                  value={selectedScent}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedScent(val);
                    setSelectedOptions((prev) => ({ ...prev, Scent: val, Fragrance: val }));
                  }}
                  className="w-full h-[46px] px-3.5 pr-10 rounded-[14px] bg-white border border-[#eedbe6] hover:border-[#D30915] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/20 text-xs sm:text-sm font-bold text-[#141219] appearance-none cursor-pointer transition-all outline-none shadow-2xs"
                >
                  {orderedScents.map((scent, idx) => (
                    <option key={scent} value={scent} className="text-sm font-medium text-[#141219]">
                      {idx + 1}. {scent} {idx === 0 && isHalloween ? '🎃 (Halloween Priority Scent)' : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5 text-[#716d77]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-[11px] text-[#716d77] m-0 mt-2 font-medium flex items-center gap-1">
                {isHalloween ? (
                  <>
                    <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>Pumpkin Spice is curated #1 holiday favorite for this item.</span>
                  </>
                ) : (
                  <span>✨ 20 signature scents hand-crafted with premium fragrance oils.</span>
                )}
              </p>
            </div>

            {/* AUTHORITATIVE PRODUCT OPTIONS (Non-Scent options like Size/Style) */}
            {product.options &&
              product.options
                .filter((opt) => !opt.name.toLowerCase().includes('scent') && !opt.name.toLowerCase().includes('fragrance'))
                .length > 0 && (
                <div className="mb-5 space-y-4">
                  {product.options
                    .filter((opt) => !opt.name.toLowerCase().includes('scent') && !opt.name.toLowerCase().includes('fragrance'))
                    .map((opt) => {
                      const currentVal = selectedOptions[opt.name] || opt.values[0];
                      return (
                        <div key={opt.name} className="p-3.5 rounded-[16px] bg-[#fffbfd] border border-[#eedbe6]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-black uppercase tracking-wider text-[#141219]">
                              {opt.name}:
                            </span>
                            <span className="text-xs font-bold text-[#D30915]">{currentVal}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {opt.values.map((val) => {
                              const isSelected = currentVal === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setSelectedOptions((prev) => ({ ...prev, [opt.name]: val }))}
                                  className={`py-2 px-3 rounded-[12px] text-xs font-bold border transition-all cursor-pointer ${
                                    isSelected
                                      ? 'border-[#D30915] bg-[#fff1f2] text-[#D30915] font-black shadow-xs ring-2 ring-[#D30915]/15'
                                      : 'border-[#ebdce5] bg-white text-[#55505a] hover:border-[#f1b8cb] hover:bg-[#fffdfd]'
                                  }`}
                                >
                                  {val}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

            {isJewelrySurprise && (
              <div className="mb-6 p-4 rounded-[18px] bg-[#fffbfd] border border-[#eedbe6] space-y-4">
                {/* Jewelry Type Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#141219] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
                      <span>Select Jewelry Reveal Type:</span>
                    </span>
                    <span className="text-xs font-bold text-[#D30915]">{selectedJewelryType}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {JEWELRY_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedJewelryType(type)}
                        className={`py-2 px-2.5 rounded-[12px] text-center border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          selectedJewelryType === type
                            ? 'border-[#D30915] bg-[#fff1f2] text-[#D30915] font-black shadow-xs ring-2 ring-[#D30915]/15'
                            : 'border-[#ebdce5] bg-white text-[#55505a] hover:border-[#f1b8cb]'
                        }`}
                      >
                        <Gem className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ring Size Selector (When Jewelry Type is Ring) */}
                {selectedJewelryType === 'Ring' && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-[#141219] flex items-center gap-1">
                        <span>Select Ring Size (US):</span>
                      </span>
                      <span className="text-xs font-bold text-[#D30915]">Size {selectedRingSize}</span>
                    </div>
                    <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                      {RING_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => setSelectedRingSize(size)}
                          className={`py-2 px-1 rounded-[12px] text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                            selectedRingSize === size
                              ? 'border-[#D30915] bg-[#fff1f2] text-[#D30915] font-black shadow-xs ring-2 ring-[#D30915]/20 scale-105'
                              : 'border-[#ebdce5] bg-white text-[#55505a] hover:border-[#f1b8cb] hover:bg-[#fffdfd]'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-black">{size}</span>
                          <span className="text-[9px] opacity-70">US</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#716d77] m-0 mt-2 font-medium">
                      ✨ Your ring surprise will be tailored in Size {selectedRingSize} appraised $10 to $7,500.
                    </p>
                    {onNavigateToAppraisal && (
                      <button
                        type="button"
                        onClick={onNavigateToAppraisal}
                        className="mt-2 text-xs font-bold text-[#D30915] hover:text-[#B60711] hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Gem className="w-3.5 h-3.5" />
                        <span>Already revealed your jewelry? Check appraisal value & certificate →</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Scent Notes & Aroma Profile */}
            {product.scentNotes && product.scentNotes.length > 0 && (
              <div className="mb-5">
                <span className="block text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
                  Aromatic Scent Notes
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {product.scentNotes.map((note, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-[10px] bg-white border border-[#ebdce5] text-xs font-bold text-[#141219] shadow-2xs"
                    >
                      🌸 {note}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Authoritative Description & Write-up (Preserves HTML) */}
            <div className="mb-6">
              <span className="block text-[11px] font-black uppercase tracking-wider text-[#8a858f] mb-1.5">
                Product Details & Experience
              </span>
              {product.description && product.description.includes('<') ? (
                <div
                  className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium space-y-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_iframe]:w-full [&_iframe]:max-w-[560px] [&_iframe]:aspect-video [&_iframe]:rounded-xl [&_iframe]:my-3"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed m-0 font-medium">
                  {product.description ||
                    'Crafted with 100% natural organic soy wax, clean aromatic oils, and lead-free cotton wicks for a long-lasting, clean burn. Hand-poured in the USA.'}
                </p>
              )}
            </div>

            {/* Quantity Stepper & Add to Cart Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-6 pt-4 border-t border-[#f2edf1]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Stepper with Large Accessible Tap Targets */}
                <div className="flex items-center shrink-0 h-[48px] rounded-[16px] bg-[#f8f5f7] border border-[#ebdce5] p-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className={`w-9 sm:w-10 h-full rounded-[12px] flex items-center justify-center font-black transition-all cursor-pointer shadow-2xs active:scale-90 ${
                      quantity <= 1
                        ? 'bg-white/60 text-[#a8a3ad] cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] hover:shadow-xs'
                    }`}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                  </button>

                  <span className="w-8 sm:w-10 text-center font-black text-xs sm:text-sm text-[#141219] select-none">
                    {quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 sm:w-10 h-full rounded-[12px] bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] flex items-center justify-center font-black transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-90"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[2.5]" />
                  </button>
                </div>

                {/* Add to Cart CTA */}
                <button
                  type="button"
                  onClick={handleAddToCartClick}
                  className="flex-1 min-h-[48px] px-3 sm:px-6 rounded-[16px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border-2 border-[#D30915] text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xs hover:shadow-[0_8px_24px_rgba(211,9,21,0.3)] active:scale-97 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 sm:gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50 focus-visible:ring-offset-2"
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span className="truncate">Add to Cart — ${(product.price * quantity).toFixed(2)}</span>
                </button>
              </div>

              {/* Ultra-Premium Buy Now CTA */}
              <div className="w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleBuyNowClick}
                  className="w-full sm:w-auto min-h-[50px] px-6 sm:px-8 rounded-[16px] bg-gradient-to-r from-[#D30915] via-[#ff2e79] to-[#B60711] hover:from-[#B60711] hover:to-[#b81850] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_10px_28px_rgba(211,9,21,0.38)] hover:shadow-[0_14px_36px_rgba(211,9,21,0.52)] active:scale-[0.98] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 group relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50 focus-visible:ring-offset-2"
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <div className="w-6 h-6 rounded-full bg-white/20 border border-white/40 flex items-center justify-center shrink-0">
                    <Zap className="w-3.5 h-3.5 text-white fill-white animate-pulse" />
                  </div>
                  <span>Buy Now — Fast Checkout</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/15 text-white font-extrabold tracking-normal ml-0.5 border border-white/25">
                    1-Click
                  </span>
                </button>
              </div>
            </div>

            {/* 4 Guarantees Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-[16px] bg-[#fffafc] border border-[#f2e6ee] text-[11px] font-bold text-[#55505a]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Win Guarantee</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Free Shipping $50+</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                <span>30-Day Returns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#D30915] shrink-0" />
                <span>Made in USA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 REQUIREMENT: PRODUCT REVIEWS SECTION */}
      <section className="mb-14 pt-8 border-t border-[#f2edf1]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-xs font-black uppercase tracking-wider mb-2">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Verified Customer Feedback</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#141219] font-display m-0">
              Customer Reviews &amp; Reveal Stories
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
              Authentic unboxings and genuine jewelry &amp; cash reveals from real buyers.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="px-5 py-3 rounded-2xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Write a Review</span>
          </button>
        </div>

        {/* Rating Breakdown & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Rating Summary Card */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#fffbfd] border border-[#eedbe6] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-[#716d77] block mb-1">
                Overall Customer Rating
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-black text-[#141219] font-display">
                  {product.rating.toFixed(1)}
                </span>
                <span className="text-base font-bold text-[#8a858f]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 my-2 text-amber-500">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-xs text-[#716d77] m-0">
                Based on <strong>{allReviews.length}</strong> authentic customer {allReviews.length === 1 ? 'unboxing' : 'unboxings'}
              </p>
            </div>

            <div className="pt-4 border-t border-[#f0dce6] space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-[#141219] font-bold">
                <span>100% Win Guarantee</span>
                <span className="text-emerald-700">Verified ✓</span>
              </div>
              <div className="flex items-center justify-between text-[#141219] font-bold">
                <span>Appraised Jewelry Inside</span>
                <span className="text-[#D30915]">$10 - $7,500</span>
              </div>
            </div>
          </div>

          {/* Star Breakdown Bars */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-white border border-[#eedbe6] space-y-3 flex flex-col justify-center">
            {[
              { stars: 5, pct: 88, count: Math.round(product.reviewCount * 0.88) },
              { stars: 4, pct: 9, count: Math.round(product.reviewCount * 0.09) },
              { stars: 3, pct: 2, count: Math.round(product.reviewCount * 0.02) },
              { stars: 2, pct: 1, count: Math.round(product.reviewCount * 0.01) },
              { stars: 1, pct: 0, count: 0 },
            ].map((bar) => (
              <div key={bar.stars} className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1 w-14 shrink-0 font-bold text-[#141219]">
                  <span>{bar.stars}</span>
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                </div>
                <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-[#D30915] rounded-full transition-all duration-500"
                    style={{ width: `${bar.pct}%` }}
                  />
                </div>
                <span className="w-10 text-right font-semibold text-[#716d77]">{bar.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Reviews List */}
        <div className="space-y-4">
          {relevantReviews.length === 0 ? (
            <div className="p-8 sm:p-12 rounded-2xl sm:rounded-3xl bg-white border border-[#eedbe6] text-center space-y-3">
              <Sparkles className="w-10 h-10 text-[#D30915] mx-auto opacity-50" />
              <h4 className="text-base font-bold text-[#141219] m-0">No reviews for this product yet</h4>
              <p className="text-xs text-[#716d77] max-w-md mx-auto m-0">
                Be the first to reveal your surprise and share your authentic unboxing experience!
              </p>
            </div>
          ) : (
            relevantReviews.map((rev) => (
              <div
                key={rev.id}
                className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-[#eedbe6] shadow-xs space-y-3"
              >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#fff1f2] border border-[#fecdd3] flex items-center justify-center font-black text-xs text-[#D30915]">
                    {rev.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#141219]">{rev.author}</span>
                      {rev.verified && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Verified Buyer</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8a858f]">
                      {rev.location ? `${rev.location} • ` : ''}
                      {rev.date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= rev.rating ? 'fill-current' : 'text-gray-200'}`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-black text-[#141219] m-0 mb-1">{rev.title}</h4>
                <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed m-0 font-medium">
                  {rev.comment}
                </p>
              </div>

              {rev.revealedSurprise && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#fff8fb] border border-[#f3dbe8] text-xs text-[#141219]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
                  <span className="text-[11px] text-[#716d77]">Revealed:</span>
                  <span className="font-bold text-[#D30915] text-[11px]">{rev.revealedSurprise}</span>
                </div>
              )}
            </div>
          )))}
        </div>
      </section>

      {/* WRITE A REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#eedbe6] p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f2edf1]">
              <div>
                <h3 className="text-lg font-black text-[#141219] font-display m-0">
                  Write a Product Review
                </h3>
                <p className="text-xs text-[#716d77] m-0 mt-0.5">
                  Share your unboxing experience for {product.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReviewModalOpen(false);
                  setReviewError(null);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-[#141219] flex items-center justify-center cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reviewError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {reviewError}
              </div>
            )}

            <form onSubmit={handleSubmitReview} className="space-y-4">
              {/* Star Rating Picker */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1.5">
                  Overall Rating
                </label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setNewRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          (hoverRating || newRating) >= star
                            ? 'text-amber-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-[#716d77] ml-2">
                    {newRating} of 5 Stars
                  </span>
                </div>
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  placeholder="Your name"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              {/* Review Headline */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Review Headline
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Found a gorgeous $250 Sterling Silver ring!"
                  className="w-full h-10 px-3.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              {/* Review Comment */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Review Details &amp; Reveal Story
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Describe the fragrance, candle burn time, and your treasure unboxing surprise..."
                  className="w-full p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsReviewModalOpen(false);
                    setReviewError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#716d77] hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="pt-8 border-t border-[#f2edf1]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="block text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#D30915] mb-1">
                More in {product.category}
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#141219] m-0 font-display">
                You May Also Love
              </h3>
            </div>
            <button
              type="button"
              onClick={onBackToShop}
              className="text-xs sm:text-sm font-bold text-[#D30915] hover:underline cursor-pointer"
            >
              View Full Collection →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 lg:gap-5">
            {relatedProducts.map((relProduct) => {
              const relCartItem = cart.find((item) => item.product.id === relProduct.id);
              const relWishlisted = wishlistIds.includes(relProduct.id);

              return (
                <ProductCard
                  key={relProduct.id}
                  product={relProduct}
                  cartQuantity={relCartItem?.quantity || 0}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={(id, qty) => {
                    const currentQty = relCartItem?.quantity || 0;
                    onUpdateQuantity(id, qty - currentQty);
                  }}
                  onToggleWishlist={() => onWishlistToggle(relProduct)}
                  onSelectProduct={onSelectProduct}
                  isWishlisted={relWishlisted}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
