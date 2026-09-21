import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Flame,
  Award,
  Users,
  Heart,
  Truck,
  DollarSign,
  Gem,
  ArrowRight,
  Leaf,
  Droplets,
  Star,
  Package,
  Gift,
} from 'lucide-react';

interface AboutProps {
  onNavigateToShop: () => void;
  onNavigateToAffiliate: () => void;
}

export const About: React.FC<AboutProps> = ({
  onNavigateToShop,
  onNavigateToAffiliate,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<'cash' | 'jewelry' | 'bath' | 'zodiac'>('cash');

  const categoryHighlights = {
    cash: {
      title: 'Real Cash Candles ($2 to $2,500)',
      description:
        'Our legendary best-seller. Hand-poured 100% soy wax candles with authentic, legal US tender concealed in protective gold foil beneath the wax. Every single candle is a guaranteed cash winner!',
      image: '/assets/ilovesurprises/products/Coke_CSH_Sodapop-CND_JC.jpg',
      badge: '100% Cash Guarantee',
      stats: 'Burn Time: 50-70 hrs • Made in USA',
    },
    jewelry: {
      title: 'Fine Jewelry Candles ($100 to $7,500)',
      description:
        'Uncover stunning solid .925 sterling silver, 14k white/yellow gold rings, necklaces, and earrings with genuine stones. Each piece includes an official certified jewelry appraisal verification tag.',
      image: '/assets/ilovesurprises/products/16_Mockup_Jewelry_JewelryCandles_6df1cda4-8954-4272-b3aa-01cc070d5a21.jpg',
      badge: 'Certified Appraisals',
      stats: 'Sizes 5-10 • Certified Value Tags',
    },
    bath: {
      title: 'Cash Bath Bombs & Treats',
      description:
        'Transform bath time into an aromatic oasis. Handcrafted with moisturizing organic shea butter, essential oils, and an authentic cash surprise safely sealed in waterproof capsules.',
      image: '/assets/ilovesurprises/hero/hero-mini-1.png',
      badge: 'Moisturizing Shea',
      stats: 'Ultra-Fizzy • Skin Nourishing',
    },
    zodiac: {
      title: 'Zodiac Horoscope Astrology Jars',
      description:
        'Curated fragrance profiles aligned with your astrological element (Fire, Earth, Air, Water). Complete with personalized horoscope reading cards and hidden cash or gemstone surprises.',
      image: '/assets/ilovesurprises/products/AQUARIUSZODIACCANDLE.webp',
      badge: 'Astrology Curated',
      stats: '12 Star Signs • Custom Blends',
    },
  };

  const currentHighlight = categoryHighlights[activeCategoryTab];

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-4 sm:py-10 lg:py-14 text-[#141219] overflow-x-hidden">
      <div className="max-w-[1360px] mx-auto px-2.5 sm:px-4 lg:px-6 space-y-6 sm:space-y-12 lg:space-y-16">
        
        {/* 1. Ultra-Luxe Hero Banner & Brand Intro */}
        <div className="bg-gradient-to-br from-[#fff1f2] via-[#fff8fb] to-[#fbf4ff] rounded-[20px] sm:rounded-[32px] p-4 sm:p-10 lg:p-16 border-2 border-[#fecdd3] shadow-[0_12px_40px_rgba(211, 9, 21,0.08)] relative overflow-hidden text-center">
          {/* Ambient Glows */}
          <div className="absolute -top-12 -left-12 w-64 sm:w-80 h-64 sm:h-80 bg-[#D30915]/12 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 sm:w-88 h-64 sm:h-88 bg-purple-500/12 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white text-[#D30915] border border-[#fecdd3] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
              <span>Our Brand Story & Craftsmanship</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#141219] font-display tracking-tight leading-[1.15] m-0">
              Where Luxury Fragrance Meets the Thrill of Real Surprises
            </h1>

            <p className="text-xs sm:text-base text-[#55505a] leading-relaxed max-w-2xl mx-auto font-medium m-0">
              Hand-poured 100% natural soy wax candles crafted with artisan care in the USA. Every single candle, bath treat, and wax melt is guaranteed to conceal authentic cash (<strong className="text-[#141219] font-black">$2 to $2,500</strong>) or luxury fine jewelry (<strong className="text-[#141219] font-black">appraised up to $7,500</strong>).
            </p>

            {/* Quick KPI Trust Ribbon (2x2 on mobile, 4-col on tablet/desktop) */}
            <div className="pt-3 sm:pt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[20px] bg-white border border-[#eedbe6] shadow-xs group hover:border-[#D30915] transition-all">
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-[#D30915] uppercase mb-0.5">
                  <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>100% Pure</span>
                </div>
                <strong className="text-base sm:text-xl font-black text-[#141219] block">Natural Soy</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77]">Clean, Vegan Wax</span>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[20px] bg-white border border-[#eedbe6] shadow-xs group hover:border-[#D30915] transition-all">
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-purple-600 uppercase mb-0.5">
                  <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>85,000+</span>
                </div>
                <strong className="text-base sm:text-xl font-black text-[#141219] block">Unboxings</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77]">Nationwide Fans</span>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[20px] bg-white border border-[#eedbe6] shadow-xs group hover:border-[#D30915] transition-all">
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-emerald-600 uppercase mb-0.5">
                  <DollarSign className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>$2 to $2.5K</span>
                </div>
                <strong className="text-base sm:text-xl font-black text-[#141219] block">Real Cash</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77]">100% Win Guarantee</span>
              </div>

              <div className="p-2.5 sm:p-3.5 rounded-[14px] sm:rounded-[20px] bg-white border border-[#eedbe6] shadow-xs group hover:border-[#D30915] transition-all">
                <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-black text-amber-600 uppercase mb-0.5">
                  <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                  <span>Up to $7,500</span>
                </div>
                <strong className="text-base sm:text-xl font-black text-[#141219] block">Fine Jewelry</strong>
                <span className="text-[9px] sm:text-[10px] text-[#716d77]">Certified Appraisals</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Our Origin Story Section & Signature Multi-Product Art */}
        <div className="bg-white rounded-[20px] sm:rounded-[32px] p-4 sm:p-8 lg:p-12 border-2 border-[#fecdd3] shadow-[0_12px_40px_rgba(211, 9, 21,0.06)] relative overflow-hidden">
          {/* Subtle Ambient Lighting */}
          <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#D30915]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center relative z-10">
            {/* Left Column: Styled Story Narrative & 3 Feature Cards */}
            <div className="lg:col-span-6 space-y-3.5 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 sm:px-3.5 py-1 rounded-full border border-[#fecdd3] inline-flex items-center gap-1.5 shadow-2xs">
                  <Heart className="w-3.5 h-3.5 text-[#D30915] fill-[#D30915]" />
                  <span>How It All Began</span>
                </span>

                <h2 className="text-xl sm:text-3xl lg:text-[34px] font-black text-[#141219] font-display tracking-tight leading-tight m-0">
                  Transforming Daily Self-Care into an{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#E51D29] to-[#B60711] font-black">
                    Unforgettable Event
                  </span>
                </h2>
              </div>

              {/* Story Narrative Box */}
              <div className="p-3.5 sm:p-5 rounded-[16px] sm:rounded-[22px] bg-gradient-to-br from-[#fff1f2] via-[#fff8fb] to-[#fbf4ff] border border-[#fecdd3] space-y-2.5 sm:space-y-3 shadow-2xs">
                <p className="text-xs sm:text-[13px] text-[#423d47] leading-relaxed font-medium m-0">
                  <strong className="text-[#141219] font-black">I Love Surprises</strong> was founded on a simple, delightful premise: self-care should smell heavenly, burn cleanly, and deliver an authentic rush of anticipation. We grew tired of plain candles that promised magic but delivered empty jars.
                </p>

                <p className="text-xs sm:text-[13px] text-[#423d47] leading-relaxed font-medium m-0">
                  We set out to create the world's most joyful unboxing experience by hand-pouring clean American soy candles and sealing genuine US currency (<strong className="text-[#D30915] font-black">$2 to $2,500</strong>) and certified fine jewelry (<strong className="text-purple-700 font-black">up to $7,500</strong>) deep beneath the wax in heat-resistant protective gold foil.
                </p>
              </div>

              {/* 3 Elevated Feature Cards */}
              <div className="space-y-2 sm:space-y-2.5">
                {/* Feature 1 */}
                <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#f0fdf4] border border-emerald-200/80 flex items-start gap-2.5 sm:gap-3.5 transition-all hover:border-emerald-400 group shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs sm:text-sm font-black text-[#141219]">
                      Zero Gimmick Policy
                    </strong>
                    <span className="text-[10px] sm:text-xs text-[#55505a] leading-tight block mt-0.5">
                      100% of products contain an authentic real surprise inside — real cash or certified fine jewelry.
                    </span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fff1f2] border border-[#fecdd3] flex items-start gap-2.5 sm:gap-3.5 transition-all hover:border-[#D30915] group shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Leaf className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs sm:text-sm font-black text-[#141219]">
                      Clean-Burning American Soy Wax
                    </strong>
                    <span className="text-[10px] sm:text-xs text-[#55505a] leading-tight block mt-0.5">
                      100% natural soy wax crafted with master-curated, phthalate-free, cruelty-free fragrance oils.
                    </span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="p-3 sm:p-3.5 rounded-[14px] sm:rounded-[18px] bg-[#fbf5ff] border border-purple-200 flex items-start gap-2.5 sm:gap-3.5 transition-all hover:border-purple-400 group shadow-2xs">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] sm:rounded-[12px] bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <strong className="block text-xs sm:text-sm font-black text-[#141219]">
                      Handcrafted with USA Precision
                    </strong>
                    <span className="text-[10px] sm:text-xs text-[#55505a] leading-tight block mt-0.5">
                      Hand-poured in small artisanal batches with lead-free cotton wicks for an even, soot-free burn.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Exact Home Hero Multi-Product Composition */}
            <div className="lg:col-span-6">
              <div className="relative rounded-[20px] sm:rounded-[28px] overflow-hidden border-2 border-[#fecdd3] shadow-[0_12px_36px_rgba(50,31,63,0.08)] bg-gradient-to-br from-[#fff1f2] via-[#fff8fb] to-[#fbf4ff] h-[300px] sm:h-[420px] lg:h-[480px] flex items-center justify-center">
                {/* Radial White/Pink Backdrop Glow Aura */}
                <div
                  className="absolute w-[240px] sm:w-[360px] lg:w-[420px] h-[240px] sm:h-[360px] lg:h-[420px] left-1/2 -translate-x-1/2 top-[6%] rounded-full pointer-events-none animate-aura-glow"
                  style={{
                    background:
                      'radial-gradient(circle, #ffffff 0%, #ffffff 32%, #ffe6ef 70%, rgba(255, 255, 255, 0) 72%)',
                  }}
                />

                {/* Ground Contact Shadow under Main Candle */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[76%] sm:top-[80%] w-[55%] h-[20px] sm:h-[24px] bg-gradient-to-r from-transparent via-[#2d1223]/20 to-transparent rounded-full blur-[10px] sm:blur-[12px] pointer-events-none z-0" />

                {/* Main Centerpiece Product: Cash Candle */}
                <img
                  src="/assets/ilovesurprises/hero/hero-main-product.png"
                  alt="Premium Cash Candle with Real Cash"
                  className="absolute left-1/2 -translate-x-1/2 top-[4%] w-[56%] sm:w-[54%] max-h-[260px] sm:max-h-[380px] object-contain drop-shadow-[0_14px_18px_rgba(35,14,30,0.16)] drop-shadow-[0_30px_42px_rgba(58,25,52,0.22)] drop-shadow-[0_50px_70px_rgba(211, 9, 21,0.18)] z-10 transition-all duration-500 hover:scale-105"
                />

                {/* Mini Products Ground Contact Shadows */}
                <div className="absolute bottom-[2%] left-[6%] sm:left-[8%] w-[24%] h-[10px] sm:h-[12px] bg-gradient-to-r from-transparent via-[#2d1223]/24 to-transparent rounded-full blur-[6px] pointer-events-none z-10" />
                <div className="absolute bottom-[2%] left-1/2 -translate-x-1/2 w-[24%] h-[10px] sm:h-[12px] bg-gradient-to-r from-transparent via-[#2d1223]/24 to-transparent rounded-full blur-[6px] pointer-events-none z-10" />
                <div className="absolute bottom-[2%] right-[6%] sm:right-[8%] w-[24%] h-[10px] sm:h-[12px] bg-gradient-to-r from-transparent via-[#2d1223]/24 to-transparent rounded-full blur-[6px] pointer-events-none z-10" />

                {/* Mini Product 1: Cash Bath Bomb (Left) */}
                <img
                  src="/assets/ilovesurprises/hero/hero-mini-1.png"
                  alt="Cash Bath Bomb with Surprise"
                  className="absolute bottom-[3%] left-[4%] sm:left-[6%] w-[26%] sm:w-[25%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_18px_26px_rgba(58,25,52,0.20)] drop-shadow-[0_28px_40px_rgba(211, 9, 21,0.15)] z-20 hover:scale-110 transition-all duration-300"
                />

                {/* Mini Product 2: Birthday Cake Cash Slime (Center) */}
                <img
                  src="/assets/ilovesurprises/hero/hero-mini-2.png"
                  alt="Birthday Cake Cash Slime with Surprise"
                  className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-[26%] sm:w-[25%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_18px_26px_rgba(58,25,52,0.20)] drop-shadow-[0_28px_40px_rgba(211, 9, 21,0.15)] z-20 hover:scale-110 transition-all duration-300"
                />

                {/* Mini Product 3: Surprise Bath Bomb with Ring (Right) */}
                <img
                  src="/assets/ilovesurprises/hero/hero-mini-3.png"
                  alt="Surprise Bath Bomb"
                  className="absolute bottom-[3%] right-[4%] sm:right-[6%] w-[26%] sm:w-[25%] aspect-square object-contain drop-shadow-[0_8px_12px_rgba(35,14,30,0.14)] drop-shadow-[0_18px_26px_rgba(58,25,52,0.20)] drop-shadow-[0_28px_40px_rgba(211, 9, 21,0.15)] z-20 hover:scale-110 transition-all duration-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Interactive "How The Reveal Works" Step-by-Step */}
        <div className="bg-white rounded-[20px] sm:rounded-[30px] p-4 sm:p-8 lg:p-10 border-2 border-[#fecdd3] shadow-[0_8px_30px_rgba(50,31,63,0.04)] space-y-6 sm:space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              The Unboxing Experience
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#141219] font-display m-0">
              How the Surprise Reveal Works in 3 Simple Steps
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77] m-0">
              Every step is engineered for maximum scent throw, safe retrieval, and genuine excitement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-5">
            {/* Step 1 */}
            <div className="p-4 sm:p-6 rounded-[18px] sm:rounded-[24px] bg-gradient-to-br from-[#fffafc] to-[#fff1f2] border border-[#fecdd3] flex flex-col justify-between group hover:border-[#D30915] transition-all space-y-3">
              <div className="space-y-2 sm:space-y-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-[#D30915] text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  01
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] font-display m-0">
                  Light & Enjoy Fragrance
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed m-0">
                  Light your natural cotton wick and let master-curated fragrance fill your room with warmth for 15 to 20 hours of clean burn.
                </p>
              </div>
              <div className="pt-2.5 sm:pt-3 border-t border-[#fecdd3]/60 text-[10px] sm:text-[11px] font-bold text-[#D30915] flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>50-70+ Hours Burn Time</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 sm:p-6 rounded-[18px] sm:rounded-[24px] bg-gradient-to-br from-[#fffafc] to-[#fbf5ff] border border-purple-200 flex flex-col justify-between group hover:border-purple-400 transition-all space-y-3">
              <div className="space-y-2 sm:space-y-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-purple-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  02
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] font-display m-0">
                  The Gold Foil Emerges
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed m-0">
                  As the soy wax gently melts down, a protective heat-resistant gold foil package will reveal itself beneath the melt pool.
                </p>
              </div>
              <div className="pt-2.5 sm:pt-3 border-t border-purple-200 text-[10px] sm:text-[11px] font-bold text-purple-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Heat-Sealed Foil Protection</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 sm:p-6 rounded-[18px] sm:rounded-[24px] bg-gradient-to-br from-[#fffafc] to-[#f0fdf4] border border-emerald-200 flex flex-col justify-between group hover:border-emerald-400 transition-all space-y-3">
              <div className="space-y-2 sm:space-y-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[12px] sm:rounded-[14px] bg-emerald-600 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-xs">
                  03
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] font-display m-0">
                  Extinguish & Unwrap
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed m-0">
                  Extinguish the flame, let cool, and use tweezers to remove your package to unwrap your authentic cash or fine jewelry prize!
                </p>
              </div>
              <div className="pt-2.5 sm:pt-3 border-t border-emerald-200 text-[10px] sm:text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 shrink-0" />
                <span>100% Guaranteed Winner</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Interactive Product Collections Showcase */}
        <div className="bg-white rounded-[20px] sm:rounded-[30px] p-4 sm:p-8 lg:p-10 border-2 border-[#eedbe6] shadow-[0_8px_30px_rgba(50,31,63,0.04)] space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-[#f5eaf1]">
            <div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
                Product Lineup
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-[#141219] font-display m-0 mt-1">
                Explore Our Artisan Surprise Collections
              </h3>
            </div>

            {/* Tab Pill Switcher (Horizontal scroll on mobile) */}
            <div className="flex items-center gap-1.5 bg-[#fbf7fc] p-1 sm:p-1.5 rounded-[14px] sm:rounded-[16px] border border-[#eedbe6] overflow-x-auto scrollbar-none snap-x -mx-1 px-1 sm:mx-0 sm:px-0">
              <button
                type="button"
                onClick={() => setActiveCategoryTab('cash')}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start min-h-[36px] sm:min-h-[38px] ${
                  activeCategoryTab === 'cash'
                    ? 'bg-[#D30915] text-white shadow-2xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                }`}
              >
                💵 Real Cash Candles
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('jewelry')}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start min-h-[36px] sm:min-h-[38px] ${
                  activeCategoryTab === 'jewelry'
                    ? 'bg-[#D30915] text-white shadow-2xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                }`}
              >
                💍 Fine Jewelry
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('bath')}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start min-h-[36px] sm:min-h-[38px] ${
                  activeCategoryTab === 'bath'
                    ? 'bg-[#D30915] text-white shadow-2xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                }`}
              >
                🛁 Bath & Slimes
              </button>

              <button
                type="button"
                onClick={() => setActiveCategoryTab('zodiac')}
                className={`px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-[10px] sm:rounded-[12px] text-[11px] sm:text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 snap-start min-h-[36px] sm:min-h-[38px] ${
                  activeCategoryTab === 'zodiac'
                    ? 'bg-[#D30915] text-white shadow-2xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                }`}
              >
                ⭐ Zodiac Signs
              </button>
            </div>
          </div>

          {/* Active Category Presentation Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-center p-3.5 sm:p-6 rounded-[18px] sm:rounded-[24px] bg-[#fffafc] border border-[#fecdd3]/80">
            <div className="lg:col-span-4 flex items-center justify-center bg-white rounded-[16px] sm:rounded-[20px] p-3 sm:p-4 border border-[#eedbe6]">
              <img
                src={currentHighlight.image}
                alt={currentHighlight.title}
                className="max-h-[180px] sm:max-h-[240px] w-auto object-contain drop-shadow-md transition-all duration-300 hover:scale-105"
              />
            </div>

            <div className="lg:col-span-8 space-y-2.5 sm:space-y-3">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-white px-2.5 sm:px-3 py-1 rounded-full border border-[#fecdd3] inline-block shadow-2xs">
                {currentHighlight.badge}
              </span>
              <h4 className="text-lg sm:text-2xl font-black text-[#141219] font-display m-0">
                {currentHighlight.title}
              </h4>
              <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium m-0">
                {currentHighlight.description}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <span className="text-[11px] sm:text-xs font-bold text-[#716d77]">
                  {currentHighlight.stats}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToShop}
                  className="h-[38px] sm:h-[40px] px-5 rounded-[11px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
                >
                  <span>Browse Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. The 4 Artisan Craftsmanship Pillars */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-1.5 sm:space-y-2">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              The Quality Difference
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#141219] font-display m-0">
              Our 4 Pillars of Craftsmanship & Authenticity
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77]">
              Every candle is poured in small batches with premium, sustainable ingredients.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Pillar 1: 100% Pure Soy Wax */}
            <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border border-[#eedbe6] shadow-[0_6px_20px_rgba(50,31,63,0.03)] hover:border-[#D30915]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] mb-1 sm:mb-1.5 font-display">
                  100% Pure Soy Wax
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed">
                  Renewable American-grown soybean wax that burns up to 50% longer than traditional paraffin, leaving zero toxic black residue.
                </p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-3 sm:mt-4 self-start">
                Clean & Vegan
              </span>
            </div>

            {/* Pillar 2: Phthalate-Free Fragrances */}
            <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border border-[#eedbe6] shadow-[0_6px_20px_rgba(50,31,63,0.03)] hover:border-[#D30915]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-red-50 text-[#D30915] border border-[#fecdd3] flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <Droplets className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] mb-1.5 font-display">
                  Master Curated Scents
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed">
                  Custom-blended fragrance oils with complex top, heart, and base notes. 100% phthalate-free, paraben-free, and cruelty-free.
                </p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3] mt-3 sm:mt-4 self-start">
                Phthalate-Free
              </span>
            </div>

            {/* Pillar 3: Lead-Free Cotton Wicks */}
            <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border border-[#eedbe6] shadow-[0_6px_20px_rgba(50,31,63,0.03)] hover:border-[#D30915]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] mb-1.5 font-display">
                  Lead-Free Cotton Wicks
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed">
                  Natural braided cotton wicks designed for an even, soot-free melt pool and optimal room-filling scent throw.
                </p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 mt-3 sm:mt-4 self-start">
                Safe & Even Burn
              </span>
            </div>

            {/* Pillar 4: Guaranteed Real Cash & Jewelry */}
            <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border border-[#eedbe6] shadow-[0_6px_20px_rgba(50,31,63,0.03)] hover:border-[#D30915]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <Gem className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-[#141219] mb-1.5 font-display">
                  100% Genuine Reveal
                </h3>
                <p className="text-xs text-[#55505a] leading-relaxed">
                  Real US cash up to $2,500 or certified solid sterling silver and 14k gold jewelry appraised up to $7,500 in every single jar.
                </p>
              </div>
              <span className="text-[9px] sm:text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 mt-3 sm:mt-4 self-start">
                Certified Appraisals
              </span>
            </div>
          </div>
        </div>

        {/* 6. Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Mission */}
          <div className="bg-gradient-to-br from-white via-[#fffafc] to-[#fff3f8] rounded-[20px] sm:rounded-[28px] p-4 sm:p-8 border-2 border-[#fecdd3] shadow-[0_8px_30px_rgba(211, 9, 21,0.06)] space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] block">Our Mission</span>
            <h3 className="text-lg sm:text-xl font-black text-[#141219] font-display m-0">
              To Deliver Wonder, Warmth & Joy to Every Home
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium m-0">
              We exist to elevate ordinary evenings into celebration. By marrying exquisite home fragrance with the magic of real discovery, we inspire shared family unboxing moments and authentic excitement with zero hollow promises.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-gradient-to-br from-white via-[#fbf7fe] to-[#f6ecfc] rounded-[20px] sm:rounded-[28px] p-4 sm:p-8 border-2 border-purple-200 shadow-[0_8px_30px_rgba(147,51,234,0.06)] space-y-2.5 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-700 block">Our Vision</span>
            <h3 className="text-lg sm:text-xl font-black text-[#141219] font-display m-0">
              Empowering an Inclusive Community of Creators & Reps
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium m-0">
              We envision a nationwide community where anyone can build meaningful independent income as a representative. Our 20% direct commission and 5-tier sponsor plan empowers everyday passion into a thriving lifestyle business.
            </p>
          </div>
        </div>

        {/* 7. Core Values */}
        <div className="bg-white rounded-[20px] sm:rounded-[28px] p-4 sm:p-8 lg:p-10 border border-[#eedbe6] shadow-[0_8px_30px_rgba(50,31,63,0.04)] space-y-4 sm:space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1 sm:space-y-1.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              Guiding Principles
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#141219] font-display m-0">
              The Values That Drive Everything We Do
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            <div className="p-3.5 sm:p-4 rounded-[14px] sm:rounded-[20px] bg-[#fffafc] border border-[#eedbe6]">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#D30915] mb-1.5 sm:mb-2" />
              <h4 className="text-xs sm:text-sm font-black text-[#141219] mb-0.5 sm:mb-1">Authenticity First</h4>
              <p className="text-[11px] sm:text-xs text-[#716d77] leading-relaxed m-0">
                100% of our products contain a real surprise prize. Transparent appraisals and genuine currency.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-[14px] sm:rounded-[20px] bg-[#fffafc] border border-[#eedbe6]">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 mb-1.5 sm:mb-2" />
              <h4 className="text-xs sm:text-sm font-black text-[#141219] mb-0.5 sm:mb-1">Artisan Quality</h4>
              <p className="text-[11px] sm:text-xs text-[#716d77] leading-relaxed m-0">
                We never cut corners on wax quality, wicks, or fragrance concentrations. Hand-poured with love.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-[14px] sm:rounded-[20px] bg-[#fffafc] border border-[#eedbe6]">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mb-1.5 sm:mb-2" />
              <h4 className="text-xs sm:text-sm font-black text-[#141219] mb-0.5 sm:mb-1">Generous Earning</h4>
              <p className="text-[11px] sm:text-xs text-[#716d77] leading-relaxed m-0">
                20% direct commissions plus 5-level overrides up to 35% total program payout with monthly direct payouts on the 15th.
              </p>
            </div>

            <div className="p-3.5 sm:p-4 rounded-[14px] sm:rounded-[20px] bg-[#fffafc] border border-[#eedbe6]">
              <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 mb-1.5 sm:mb-2" />
              <h4 className="text-xs sm:text-sm font-black text-[#141219] mb-0.5 sm:mb-1">Fast & Reliable</h4>
              <p className="text-[11px] sm:text-xs text-[#716d77] leading-relaxed m-0">
                2-3 day nationwide express shipping, secure protective gift packaging, and responsive support.
              </p>
            </div>
          </div>
        </div>

        {/* 8. Dual CTA Light Luxury Footer Banner */}
        <div className="bg-gradient-to-br from-[#fff1f2] via-[#fff8fb] to-[#fbf4ff] rounded-[20px] sm:rounded-[30px] p-5 sm:p-10 lg:p-12 border-2 border-[#fecdd3] shadow-[0_12px_36px_rgba(211, 9, 21,0.08)] relative overflow-hidden">
          {/* Soft Ambient Backlights */}
          <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-[#D30915]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-1/3 w-60 sm:w-80 h-60 sm:h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="max-w-xl space-y-1.5 sm:space-y-2.5">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-white px-3 sm:px-3.5 py-1 rounded-full border border-[#fecdd3] shadow-2xs inline-flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-[#D30915] fill-[#D30915]" />
                <span>Ready to Experience the Magic?</span>
              </span>

              <h3 className="text-xl sm:text-3xl font-black text-[#141219] font-display m-0">
                Discover Your Next Surprise or Start Earning Today
              </h3>

              <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium m-0">
                Explore our best-selling cash and jewelry candles, or join thousands of thriving independent representatives earning 20% commission on every order.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 sm:gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={onNavigateToShop}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[46px] px-5 sm:px-7 rounded-[13px] sm:rounded-[14px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(211, 9, 21,0.28)] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Shop Surprise Candles</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onNavigateToAffiliate}
                className="w-full sm:w-auto min-h-[44px] sm:min-h-[46px] px-5 sm:px-6 rounded-[13px] sm:rounded-[14px] bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] border border-[#eedbe6] hover:border-[#fecdd3] font-black text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Join Rep Program (20%)</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
