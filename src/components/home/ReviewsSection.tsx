import React, { useState, useEffect } from 'react';
import { Star, CheckCircle, Sparkles, Gem, DollarSign, PackageCheck, ShieldCheck, Award } from 'lucide-react';
import type { Review } from '../../types';
import { reviewsData } from '../../data/reviews';
import { Skeleton } from '../ui/Skeleton';

interface ReviewsSectionProps {
  isLoading?: boolean;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = React.memo(({ isLoading = false }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'cash' | 'jewelry'>('all');
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const stored = localStorage.getItem('ilovesurprises_reviews_v1');
      const parsed = stored ? JSON.parse(stored) : [];
      return [...parsed, ...reviewsData];
    } catch {
      return reviewsData;
    }
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('ilovesurprises_reviews_v1');
        const parsed = stored ? JSON.parse(stored) : [];
        setReviews([...parsed, ...reviewsData]);
      } catch {
        setReviews(reviewsData);
      }
    };
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const filteredReviews = React.useMemo(() => {
    return reviews.filter((rev) => {
      if (activeFilter === 'cash') {
        return rev.revealedSurprise?.toLowerCase().includes('cash') || rev.revealedSurprise?.includes('$50') || rev.revealedSurprise?.includes('$100');
      }
      if (activeFilter === 'jewelry') {
        return rev.revealedSurprise?.toLowerCase().includes('ring') || rev.revealedSurprise?.toLowerCase().includes('earring') || rev.revealedSurprise?.toLowerCase().includes('jewelry');
      }
      return true;
    });
  }, [reviews, activeFilter]);

  const { cashCount, jewelryCount } = React.useMemo(() => {
    const cash = reviews.filter(r => r.revealedSurprise?.toLowerCase().includes('cash') || r.revealedSurprise?.includes('$50') || r.revealedSurprise?.includes('$100')).length;
    const jewelry = reviews.filter(r => r.revealedSurprise?.toLowerCase().includes('ring') || r.revealedSurprise?.toLowerCase().includes('earring') || r.revealedSurprise?.toLowerCase().includes('jewelry')).length;
    return { cashCount: cash, jewelryCount: jewelry };
  }, [reviews]);

  const avgRating = React.useMemo(() => {
    if (reviews.length === 0) return '5.0';
    return (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <section id="reviews" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-4 sm:py-6 overflow-hidden">

      {/* Master Customer Reveal & Social Proof Showcase Card */}
      <div className="relative rounded-[24px] sm:rounded-[30px] border border-[#ebd2e2] bg-gradient-to-br from-[#fff1f2] via-[#fffafc] to-[#fbf6ff] p-5 sm:p-7 lg:p-8 shadow-[0_16px_45px_rgba(50,31,63,0.08)] overflow-hidden">

        {/* Soft Ambient Radial Backlight */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#D30915]/8 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header: Title, Subtitle & Trust Rating Summary */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6 z-10 relative">

          <div className="max-w-2xl">
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#D30915]/10 text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-2.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
              <span>Real Customer Reveals</span>
            </div>

            {/* Main Headline */}
            <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-2">
              Unboxings, Real Cash &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#E51D29] to-[#B60711]">
                Fine Jewelry Reveals
              </span>
            </h2>

            {/* Subtext */}
            <p className="text-xs sm:text-sm lg:text-[14px] text-[#55505a] leading-relaxed m-0 font-medium">
              Every hand-poured candle and bath treat has a genuine prize sealed safely inside.
            </p>
          </div>

          {/* Elevated Trust Rating Summary Box */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 sm:p-3.5 rounded-[18px] bg-white/95 backdrop-blur-md border border-[#ebdce6] shadow-sm shrink-0">
            <div className="flex items-center gap-2 pr-3 border-r border-[#f0e4eb]">
              <div className="text-2xl sm:text-3xl font-black text-[#141219] leading-none hero-title-font">
                {avgRating}
              </div>
              <div>
                <div className="flex items-center text-amber-400 gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400 drop-shadow-[0_1px_2px_rgba(251,191,36,0.4)]" />
                  ))}
                </div>
                <span className="text-[10px] font-extrabold text-[#716d77] block mt-0.5">
                  {reviews.length > 0 ? `${reviews.length} Verified Review${reviews.length === 1 ? '' : 's'}` : '0 Verified Reviews'}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1 text-[11px] font-bold text-[#141219]">
              <div className="flex items-center gap-1.5 text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                <span>100% Win in Every Order</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#D30915]">
                <Award className="w-3.5 h-3.5 text-[#D30915]" />
                <span>Real Prizes in Every Item</span>
              </div>
            </div>
          </div>

        </div>

        {/* Interactive Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 active:scale-95 ${activeFilter === 'all'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211,9,21,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] shadow-2xs hover:shadow-xs'
              }`}
          >
            All Reveals ({reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('cash')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${activeFilter === 'cash'
                ? 'bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-emerald-500 hover:text-emerald-700 shadow-2xs hover:shadow-xs'
              }`}
          >
            <DollarSign className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Cash Wins ({cashCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('jewelry')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all duration-200 cursor-pointer shrink-0 flex items-center gap-1.5 active:scale-95 ${activeFilter === 'jewelry'
                ? 'bg-purple-600 text-white shadow-[0_4px_14px_rgba(147,51,234,0.3)]'
                : 'bg-white text-[#55505a] border border-[#e8dfe5] hover:border-purple-500 hover:text-purple-700 shadow-2xs hover:shadow-xs'
              }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>Jewelry Reveals ({jewelryCount})</span>
          </button>
        </div>

        {/* Dynamic Responsive Reviews Grid */}
        {isLoading ? (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-6"
            role="status"
            aria-label="Loading customer reviews"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="p-4 rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gray-700 skeleton-shimmer shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3.5 w-24 rounded-md" />
                        <Skeleton className="h-2.5 w-16 rounded-md" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-4/5 rounded-md mb-2" />
                  <Skeleton className="h-3 w-full rounded-md mb-1.5" />
                  <Skeleton className="h-3 w-3/4 rounded-md mb-3" />
                </div>
                <Skeleton className="h-7 w-full rounded-[10px]" />
              </div>
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="py-12 px-4 rounded-[20px] bg-white border border-[#eedbe6] text-center mb-6">
            <Sparkles className="w-10 h-10 text-[#D30915] mx-auto mb-3 opacity-60" />
            <h3 className="text-base sm:text-lg font-black text-[#141219] mb-1 font-display">
              No Customer Reviews Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto">
              Be the first to reveal an authentic cash or jewelry surprise and share your unboxing story!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
            {filteredReviews.map((review) => {
              const isCash = review.revealedSurprise?.toLowerCase().includes('cash') || review.revealedSurprise?.includes('$50') || review.revealedSurprise?.includes('$100');
              const isJewelry = review.revealedSurprise?.toLowerCase().includes('ring') || review.revealedSurprise?.toLowerCase().includes('necklace') || review.revealedSurprise?.toLowerCase().includes('earring');

              return (
                <div
                  key={review.id}
                  className="p-4 rounded-[20px] bg-white border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] hover:shadow-[0_16px_36px_rgba(211, 9, 21,0.12)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>

                    {/* Top Customer Info Row with Real Unboxer Avatar */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={review.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                          alt={review.author}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover border border-[#fecdd3] bg-[#fff1f2] shrink-0"
                          loading="lazy"
                          decoding="async"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <strong className="text-xs font-black text-[#141219] truncate">
                              {review.author}
                            </strong>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 shrink-0" />
                          </div>
                          <span className="text-[10px] text-[#716d77] block truncate">
                            {review.location} • {review.date}
                          </span>
                        </div>
                      </div>

                      {/* 5-Star Rating Pill */}
                      <div className="flex items-center text-amber-400 bg-amber-50/80 px-1.5 py-0.5 rounded-full border border-amber-200 shrink-0">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    {/* Review Title with Quotes */}
                    <h4 className="text-xs sm:text-[13px] font-black text-[#141219] leading-snug m-0 mb-1.5 group-hover:text-[#D30915] transition-colors line-clamp-2">
                      "{review.title}"
                    </h4>

                    {/* Review Text */}
                    <p className="text-[11px] sm:text-xs text-[#55505a] leading-relaxed m-0 mb-3.5 line-clamp-3 font-medium">
                      {review.comment}
                    </p>

                  </div>

                  <div>

                    {/* Prize / Reveal Highlight Banner (Key Focal Element) */}
                    {review.revealedSurprise && (
                      <div
                        className={`mb-3 p-2 rounded-[12px] border flex items-center gap-2 text-[11px] font-black transition-transform duration-200 group-hover:scale-[1.02] ${isCash
                            ? 'bg-gradient-to-r from-emerald-50 to-teal-50/50 border-emerald-200 text-emerald-800'
                            : isJewelry
                              ? 'bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] border-[#fecdd3] text-[#D30915]'
                              : 'bg-gradient-to-r from-purple-50 to-pink-50/50 border-purple-200 text-purple-800'
                          }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCash
                              ? 'bg-emerald-100 text-emerald-700'
                              : isJewelry
                                ? 'bg-[#ffe4ee] text-[#D30915]'
                                : 'bg-purple-100 text-purple-700'
                            }`}
                        >
                          {isCash ? (
                            <DollarSign className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isJewelry ? (
                            <Gem className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[9px] uppercase tracking-wider block opacity-75 font-bold leading-none mb-0.5">
                            {isCash ? 'Cash Unboxed' : isJewelry ? 'Jewelry Prize' : 'Surprise Charm'}
                          </span>
                          <span className="truncate block leading-tight">
                            {review.revealedSurprise}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Product Unboxed Footer Tag */}
                    <div className="pt-2 border-t border-[#f4edf2] flex items-center justify-between text-[10px] text-[#716d77]">
                      <div className="flex items-center gap-1.5 truncate">
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold">{review.productName}</span>
                      </div>
                      <span className="text-emerald-700 font-black bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">
                        Verified
                      </span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Social Proof & Trust Strip */}
        <div className="pt-4 border-t border-[#f0e2ec] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <div className="flex items-center text-amber-500 gap-0.5 mb-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <strong className="text-xs font-black text-[#141219]">{avgRating} / 5.0 Rating</strong>
            <span className="text-[10px] text-[#716d77]">
              {reviews.length > 0 ? `${reviews.length} Customer Reveal${reviews.length === 1 ? '' : 's'}` : '100% Genuine Reveals'}
            </span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
            <strong className="text-xs font-black text-[#141219]">100% Win Guarantee</strong>
            <span className="text-[10px] text-[#716d77]">Every product holds a prize</span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <Gem className="w-4 h-4 text-[#D30915] mb-1" />
            <strong className="text-xs font-black text-[#141219]">Appraised Jewelry</strong>
            <span className="text-[10px] text-[#716d77]">Sterling Silver & 14K Gold</span>
          </div>

          <div className="p-2.5 rounded-[14px] bg-white/80 border border-[#f2e6ec] flex flex-col items-center justify-center">
            <DollarSign className="w-4 h-4 text-emerald-600 mb-1 stroke-[3]" />
            <strong className="text-xs font-black text-[#141219]">Real US Currency</strong>
            <span className="text-[10px] text-[#716d77]">Cash bills from $2 to $2,500</span>
          </div>

        </div>

      </div>
    </section>
  );
});

ReviewsSection.displayName = 'ReviewsSection';

