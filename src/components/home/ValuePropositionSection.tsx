import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { adminService } from '../../services/adminService';
import type { ValuePropositionConfig } from '../../types/admin';

export const ValuePropositionSection: React.FC = () => {
  const [config, setConfig] = useState<ValuePropositionConfig>(() => {
    return (
      adminService.getHomepageContent().valueProposition || {
        eyebrow: 'Why Choose I Love Surprises',
        title: 'The Original Real Cash & Luxury Jewelry Reveal Experience',
        description:
          'Every candle and bath bomb is hand-poured in the USA using 100% natural soy wax, concealing certified jewelry or real US paper cash from $2 up to $2,500.',
        points: [
          'Guaranteed Real Cash or Certified Jewelry in every item',
          '100% Natural Soy Wax with lead-free cotton wicks',
          'Artisan hand-poured small batches in the USA',
          'Fast insured delivery with hassle-free 30-day returns',
        ],
      }
    );
  });

  useEffect(() => {
    const handleUpdate = () => {
      const current = adminService.getHomepageContent().valueProposition;
      if (current) setConfig(current);
    };
    window.addEventListener('ils_homepage_content_updated', handleUpdate);
    return () => window.removeEventListener('ils_homepage_content_updated', handleUpdate);
  }, []);

  return (
    <section
      id="value-proposition"
      aria-label="Value Proposition"
      className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-10"
    >
      <div className="bg-gradient-to-br from-[#fff7f9] via-white to-[#fdf2f4] rounded-[22px] sm:rounded-[32px] p-5 sm:p-8 lg:p-10 border border-[#eedbe6] shadow-[0_4px_20px_rgba(211,9,21,0.04)] relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#D30915]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3 mb-6 sm:mb-8 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
            <span>{config.eyebrow}</span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-[32px] font-black text-[#141219] font-display tracking-tight leading-tight m-0">
            {config.title}
          </h2>

          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed max-w-2xl mx-auto font-medium m-0">
            {config.description}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 relative z-10">
          {(config.points || []).map((point, idx) => (
            <div
              key={idx}
              className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white border border-[#eedbe6] hover:border-[#D30915]/40 transition-all shadow-2xs flex items-start gap-2.5 sm:gap-3 group"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform shadow-2xs">
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs sm:text-[13px] font-bold text-[#141219] group-hover:text-[#D30915] transition-colors leading-snug block">
                  {point}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
