import React, { useState, useEffect } from 'react';
import { Gem, Gift, Store, Users, ShieldCheck } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { HeroContentConfig } from '../../types/admin';

interface HeroProps {
  onShopSurprises?: () => void;
  onBecomeConsultant?: () => void;
  config?: HeroContentConfig;
}

const ICON_MAP = {
  Gem,
  Gift,
  Store,
  Users,
  Sparkles: Gift,
  ShieldCheck,
};

export const Hero: React.FC<HeroProps> = ({
  onShopSurprises,
  onBecomeConsultant,
  config: propConfig,
}) => {
  const [storedHeroConfig, setStoredHeroConfig] = useState<HeroContentConfig>(() => {
    const content = adminService.getHomepageContent();
    return content.hero || {
      desktopBannerImage: '/assets/ilovesurprises/banners/Neww banner.jpeg',
      mobileBannerImage: '/assets/ilovesurprises/banners/mobile-banner.jpg',
      headline: 'ILoveSurprises.com — Discover jewelry, cash, and surprises inside every candle & bath bomb',
      subheadline: 'Every candle holds a real surprise inside!',
      benefitTiles: [
        { id: 'hidden-jewelry', title: 'Hidden Jewelry Reveals', subtitle: 'Real jewelry in every product', iconName: 'Gem', actionType: 'shop' },
        { id: 'viral-unboxing', title: 'Viral Unboxing Fun', subtitle: 'Share, surprise, repeat', iconName: 'Gift', actionType: 'shop' },
        { id: 'start-store', title: 'Start Your Store', subtitle: 'Your business. Your way.', iconName: 'Store', actionType: 'consultant' },
        { id: 'earn-5-levels', title: 'Earn From 5 Levels', subtitle: 'Build your team. Grow together.', iconName: 'Users', actionType: 'consultant' },
      ],
    };
  });

  useEffect(() => {
    const updateHero = () => {
      const current = adminService.getHomepageContent().hero;
      if (current) {
        setStoredHeroConfig(current);
      }
    };
    window.addEventListener('ils_homepage_content_updated', updateHero);
    return () => {
      window.removeEventListener('ils_homepage_content_updated', updateHero);
    };
  }, []);

  const heroConfig = propConfig || storedHeroConfig;

  const handleShopClick = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onShopSurprises) {
      onShopSurprises();
    } else {
      const el = document.getElementById('featured') || document.getElementById('categories');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleConsultantClick = (e: React.MouseEvent) => {
    if (onBecomeConsultant) {
      e.preventDefault();
      onBecomeConsultant();
    } else {
      const el = document.getElementById('affiliate');
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const benefitTiles = heroConfig.benefitTiles && heroConfig.benefitTiles.length > 0
    ? heroConfig.benefitTiles
    : [
        { id: 'hidden-jewelry', title: 'Hidden Jewelry Reveals', subtitle: 'Real jewelry in every product', iconName: 'Gem' as const, actionType: 'shop' as const },
        { id: 'viral-unboxing', title: 'Viral Unboxing Fun', subtitle: 'Share, surprise, repeat', iconName: 'Gift' as const, actionType: 'shop' as const },
        { id: 'start-store', title: 'Start Your Store', subtitle: 'Your business. Your way.', iconName: 'Store' as const, actionType: 'consultant' as const },
        { id: 'earn-5-levels', title: 'Earn From 5 Levels', subtitle: 'Build your team. Grow together.', iconName: 'Users' as const, actionType: 'consultant' as const },
      ];

  return (
    <section id="hero" className="max-w-[1460px] mx-auto px-2 sm:px-6 pt-0.5 sm:pt-2.5 pb-1 sm:pb-2.5">
      {/* Outer Banner Card matching the client reference layout with 16K Studio Presentation */}
      <div className="relative rounded-[18px] sm:rounded-[28px] lg:rounded-[34px] overflow-hidden border border-[#eedde6] shadow-[0_10px_30px_-10px_rgba(40,15,30,0.12),0_4px_14px_rgba(211,9,21,0.05)] bg-[#fcf9f8] transition-all">
        
        {/* Visually Hidden H1 for SEO & Accessibility */}
        <h1 className="sr-only">
          {heroConfig.headline || 'ILoveSurprises.com — Discover jewelry, cash, and surprises inside every candle & bath bomb'}
        </h1>

        {/* TOP HERO AREA: BLINKIT-STYLE FULL-BLEED HERO BANNER */}
        <div 
          onClick={handleShopClick}
          className="group relative w-full overflow-hidden cursor-pointer select-none bg-[#fdf5f7] aspect-[16/10] min-h-[235px] max-h-[330px] sm:aspect-auto sm:min-h-[280px] sm:max-h-none md:min-h-[340px] lg:min-h-0 lg:aspect-[3/1] flex items-center justify-center transition-all"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleShopClick();
            }
          }}
          aria-label={heroConfig.headline || 'Shop Surprises at ILoveSurprises.com - Discover jewelry, cash, and surprises inside every candle and bath bomb'}
        >
          {/* Responsive Banner Image */}
          <picture className="w-full h-full block">
            <source
              media="(max-width: 639px)"
              srcSet={heroConfig.mobileBannerImage || '/assets/ilovesurprises/banners/mobile-banner.jpg'}
            />
            <img
              src={heroConfig.desktopBannerImage || '/assets/ilovesurprises/banners/Neww banner.jpeg'}
              alt={heroConfig.headline || 'ILoveSurprises.com - Discover jewelry, cash, and surprises inside every candle & bath bomb'}
              className="w-full h-full object-cover object-center select-none transform-gpu backface-hidden [transform:translateZ(0)] transition-all duration-700 ease-out group-hover:scale-[1.012]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              style={{
                imageRendering: '-webkit-optimize-contrast',
                filter: 'contrast(103%) brightness(101%) saturate(105%)',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            />
          </picture>

          {/* 16K Studio Depth Light Sheen Vignette */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/[0.01] via-transparent to-black/[0.03] mix-blend-multiply" />
        </div>

        {/* BENEFIT STRIP DIRECTLY BELOW HERO (2 boxes per line on mobile, 4 columns on desktop) */}
        <div className="border-t border-[#f0e3ea] bg-white/98 backdrop-blur-xs px-2 min-[375px]:px-2.5 sm:px-8 py-2 sm:py-3 transition-all">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 min-[375px]:gap-2 sm:gap-6 lg:gap-4 lg:divide-x lg:divide-[#f0e2ea] items-stretch">
            {benefitTiles.map((item) => {
              const IconComponent = (item.iconName && ICON_MAP[item.iconName]) ? ICON_MAP[item.iconName] : Gem;
              const isConsultant = item.actionType === 'consultant';
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={(e) => isConsultant ? handleConsultantClick(e) : handleShopClick(e)}
                  className="group flex items-center gap-1.5 min-[360px]:gap-2 sm:gap-3.5 py-1.5 min-[360px]:py-2 px-1.5 min-[360px]:px-2 sm:py-1.5 sm:px-3 text-left rounded-xl bg-[#faf6f8]/80 sm:bg-transparent border border-[#f2e6ee] sm:border-transparent transition-all duration-200 hover:bg-[#fff7f9] cursor-pointer h-full min-h-[50px] sm:min-h-0"
                >
                  {/* Thin Outline Icon matching Reference */}
                  <div className="w-7 h-7 min-[360px]:w-8 min-[360px]:h-8 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-xl bg-white sm:bg-[#faf4f7] border border-[#ecdde7] sm:border-[#f0e3ec] group-hover:border-[#D30915]/30 group-hover:bg-[#fff1f3] text-[#D30915] sm:text-[#141219] group-hover:text-[#D30915] flex items-center justify-center shrink-0 transition-all duration-200 shadow-2xs sm:shadow-none">
                    <IconComponent className="w-3.5 h-3.5 min-[360px]:w-4 min-[360px]:h-4 sm:w-5 sm:h-5 stroke-[1.8] sm:stroke-[1.6]" />
                  </div>

                  {/* Title & Supporting Text */}
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h3 className="text-[10.5px] min-[360px]:text-[11.5px] min-[400px]:text-[12.5px] sm:text-[14px] font-bold text-[#141219] group-hover:text-[#D30915] leading-snug tracking-tight truncate m-0 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[8.5px] min-[360px]:text-[9.5px] min-[400px]:text-[10.5px] sm:text-[12px] text-[#716d77] leading-snug mt-0.5 line-clamp-2 sm:line-clamp-1 font-medium m-0">
                      {item.subtitle}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
