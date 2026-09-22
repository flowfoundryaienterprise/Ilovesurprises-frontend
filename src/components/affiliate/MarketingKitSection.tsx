import React from 'react';
import {
  Download,
  Share2,
  Sparkles,
  Gift,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';

interface MarketingKitSectionProps {
  repUsername: string;
  referralLink: string;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const MarketingKitSection: React.FC<MarketingKitSectionProps> = ({
  repUsername,
  referralLink,
  onShowToast,
}) => {
  const handleDownloadAsset = (assetName: string) => {
    onShowToast(`Downloading "${assetName}" marketing pack...`, {
      title: 'Rep Toolkit Download',
      type: 'success',
    });
  };

  const samplePostScript = `✨ Unboxing real cash & fine jewelry inside candles! 🕯️💸 I just lit my I Love Surprises candle and found genuine prizes! Every single candle is guaranteed to contain real cash ($2-$2,500) or luxury jewelry. Shop via my official rep link for fast dispatch: ${referralLink} #ILoveSurprises #CandleReveal #Unboxing`;

  const handleCopyScript = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(samplePostScript);
      onShowToast('Viral social post caption copied to clipboard!', {
        title: 'Script Copied',
        type: 'success',
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#fff1f2] via-white to-[#fdf2f8] rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 lg:p-8 border border-[#fecdd3] shadow-[0_10px_30px_rgba(211, 9, 21,0.06)] relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#D30915]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-2.5 sm:px-3 py-1 rounded-full border border-[#fecdd3] inline-flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official Representative Marketing Vault</span>
          </span>

          <h2 className="text-lg sm:text-2xl font-black text-[#141219] font-display m-0 mb-1 sm:mb-1.5">
            Representative Sales & Social Media Toolkit
          </h2>

          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed m-0">
            High-converting promotional assets, social video scripts, unboxing graphics, and printable party order forms to help you maximize your 20% personal sales and 5-tier team growth.
          </p>
        </div>
      </div>

      {/* 2. Downloadable Promo Graphics & Flyer Packs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Pack 1: Instagram & TikTok Story Graphics */}
        <div className="bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] hover:border-[#D30915]/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-xs sm:text-sm font-black text-[#141219] m-0 mb-1 font-display">
              Instagram Stories & Reels Kit
            </h3>
            <p className="text-xs text-[#716d77] leading-relaxed mb-3 sm:mb-4">
              12 High-resolution animated reveal banners, prize cards, and sticker overlays formatted for 9:16 vertical video.
            </p>

            <ul className="text-[11px] text-[#55505a] space-y-1 mb-3 sm:mb-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>$2,500 Cash prize reveal templates</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Diamond & Gold ring badge stickers</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadAsset('Instagram Stories & Reels Pack')}
            className="w-full h-[36px] sm:h-[38px] rounded-[11px] sm:rounded-[12px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white font-black text-xs uppercase tracking-wider border border-[#fecdd3] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP (14 MB)</span>
          </button>
        </div>

        {/* Pack 2: Printable Candle Party Forms */}
        <div className="bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] hover:border-[#D30915]/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-xs sm:text-sm font-black text-[#141219] m-0 mb-1 font-display">
              In-Person Pop-Up & Party Kit
            </h3>
            <p className="text-xs text-[#716d77] leading-relaxed mb-3 sm:mb-4">
              Printable PDF order tally sheets, scent sampler voting cards, and prize reveal certificates for live host events.
            </p>

            <ul className="text-[11px] text-[#55505a] space-y-1 mb-3 sm:mb-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Custom Rep QR Code Flyer</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Customer Order Intake Sheets</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => handleDownloadAsset('Party & Pop-Up PDF Pack')}
            className="w-full h-[36px] sm:h-[38px] rounded-[11px] sm:rounded-[12px] bg-purple-50 hover:bg-purple-700 text-purple-700 hover:text-white font-black text-xs uppercase tracking-wider border border-purple-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download PDF Pack</span>
          </button>
        </div>

        {/* Pack 3: VIP Customer Sample Coupon Pack */}
        <div className="bg-white rounded-[18px] sm:rounded-[22px] p-4 sm:p-5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] hover:border-[#D30915]/40 transition-all flex flex-col justify-between group">
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-xs sm:text-sm font-black text-[#141219] m-0 mb-1 font-display">
              Rep Sample & Discount Passes
            </h3>
            <p className="text-xs text-[#716d77] leading-relaxed mb-3 sm:mb-4">
              Generate custom 10% coupon codes for your first-time buyers and order rep demo sample candles at 20% rep wholesale.
            </p>

            <ul className="text-[11px] text-[#55505a] space-y-1 mb-3 sm:mb-4">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Rep Code: <strong className="font-mono text-[#D30915]">@{repUsername}10</strong></span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant 20% Wholesale Sample Access</span>
              </li>
            </ul>
          </div>

          <button
            type="button"
            onClick={() => onShowToast(`Rep wholesale code applied to your account!`, { type: 'success' })}
            className="w-full h-[36px] sm:h-[38px] rounded-[11px] sm:rounded-[12px] bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white font-black text-xs uppercase tracking-wider border border-amber-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Order Demo Samples</span>
          </button>
        </div>
      </div>

      {/* 3. Ready-To-Post Viral Social Captions */}
      <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5eaf1]">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915]">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Copy & Paste Scripts</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              Ready-to-Post Viral Unboxing Caption
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCopyScript}
            className="h-[36px] px-4 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer w-full sm:w-auto"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Copy Caption Script</span>
          </button>
        </div>

        <div className="p-3.5 sm:p-4 rounded-[14px] sm:rounded-[16px] bg-[#fffafc] border border-[#eedbe6] text-xs text-[#141219] font-mono leading-relaxed select-all">
          {samplePostScript}
        </div>

        <div className="flex items-center gap-2 text-xs text-[#716d77]">
          <span>💡 <strong>Rep Pro-Tip:</strong> Post an unboxing video with trending sound on TikTok/Reels and link your bio to your Rep URL for 3-5x higher conversions!</span>
        </div>
      </div>
    </div>
  );
};
