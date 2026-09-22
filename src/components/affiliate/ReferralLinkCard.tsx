import React, { useState } from 'react';
import {
  Copy,
  Check,
  Share2,
  QrCode,
  Sparkles,
  Edit2,
  Globe,
  X,
  ExternalLink,
  Download,
  Flame,
} from 'lucide-react';
import type { AffiliateStats } from '../../types';
import { affiliateService } from '../../services/affiliateService';

interface ReferralLinkCardProps {
  stats: AffiliateStats;
  onUpdateStats: (stats: AffiliateStats) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const ReferralLinkCard: React.FC<ReferralLinkCardProps> = ({
  stats,
  onUpdateStats,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(stats.repUsername);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(stats.referralLink);
    }
    setCopied(true);
    onShowToast('Personal Rep referral link copied to clipboard!', {
      title: 'Link Copied',
      type: 'success',
    });
    setTimeout(() => setCopied(false), 2400);
  };

  const handleSaveUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    const updated = affiliateService.updateRepUsername(newUsername);
    onUpdateStats(updated);
    setIsEditingUsername(false);
    onShowToast(`Rep handle updated to "@${updated.repUsername}"`, {
      title: 'Storefront Handle Updated',
      type: 'success',
    });
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    stats.referralLink
  )}`;

  const shareText = encodeURIComponent(
    `Unbox real cash up to $2,500 and genuine fine jewelry inside luxury scented candles! Shop with my official rep link:`
  );
  const shareUrl = encodeURIComponent(stats.referralLink);

  return (
    <div className="bg-gradient-to-br from-white via-[#fff8fb] to-[#fff1f2] rounded-[20px] sm:rounded-[26px] p-4 sm:p-6 lg:p-8 border-2 border-[#fecdd3] shadow-[0_12px_36px_rgba(211, 9, 21,0.08)] relative overflow-hidden">
      {/* Soft Ambient Backlight */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#D30915]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 space-y-4 sm:space-y-5">
        {/* Header Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-2.5 sm:px-3 py-1 rounded-full border border-[#fecdd3] inline-flex items-center gap-1.5 shadow-2xs">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D30915]" />
                <span>20% Direct Commission Active</span>
              </span>

              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 sm:px-3 py-1 rounded-full border border-purple-200 inline-flex items-center gap-1">
                <Flame className="w-3 h-3 text-purple-700" />
                <span>Custom Rep Storefront</span>
              </span>
            </div>

            <h3 className="text-base sm:text-xl font-black text-[#141219] m-0 font-display">
              Your Personal Representative Link & Storefront
            </h3>

            <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
              Every candle ordered through your rep link earns you <strong className="text-[#D30915] font-black">20% commission</strong> with monthly payouts on the 15th of each month.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="h-[36px] sm:h-[38px] px-3.5 sm:px-4 rounded-[12px] bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#55505a] hover:text-[#D30915] text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-2xs self-start sm:self-auto cursor-pointer shrink-0"
          >
            <QrCode className="w-4 h-4 text-[#D30915]" />
            <span>Show QR Code</span>
          </button>
        </div>

        {/* High-Tech Link Bar & Copy Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
          <div className="flex-1 flex items-center bg-white rounded-[14px] sm:rounded-[16px] border-2 border-[#f0dae7] focus-within:border-[#D30915] px-3 sm:px-4 py-2 sm:py-2.5 shadow-xs transition-all overflow-hidden">
            <Globe className="w-4 h-4 text-[#D30915] shrink-0 mr-2 sm:mr-2.5" />
            <span className="font-mono text-[11px] sm:text-sm text-[#141219] truncate font-bold select-all flex-1">
              {stats.referralLink}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`min-h-[44px] sm:min-h-[46px] px-5 sm:px-7 rounded-[13px] sm:rounded-[15px] font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95 shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white shadow-[0_6px_20px_rgba(16,185,129,0.3)]'
                : 'bg-[#D30915] hover:bg-[#B60711] text-white shadow-[0_6px_20px_rgba(211, 9, 21,0.28)]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Link Copied! ✓</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Rep Link</span>
              </>
            )}
          </button>
        </div>

        {/* Custom Handle Editor & 1-Click Social Share */}
        <div className="pt-3 sm:pt-3.5 border-t border-[#f5e2ed] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Custom Handle */}
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingUsername ? (
              <form onSubmit={handleSaveUsername} className="flex items-center gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="custom_handle"
                  className="h-[34px] px-3 rounded-[10px] bg-white border border-[#D30915] text-xs font-mono font-bold text-[#141219] outline-none shadow-xs flex-1 sm:flex-initial"
                />
                <button
                  type="submit"
                  className="h-[34px] px-3.5 rounded-[10px] bg-[#D30915] text-white text-xs font-black cursor-pointer shadow-2xs shrink-0"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingUsername(false)}
                  className="h-[34px] px-2.5 rounded-[10px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span className="text-[10px] sm:text-[11px] text-[#716d77] font-semibold">Rep Handle:</span>
                <span className="font-mono font-bold text-[#141219] bg-white px-2 sm:px-2.5 py-0.5 rounded-lg border border-[#eee2eb] shadow-2xs text-[11px] sm:text-xs">
                  @{stats.repUsername}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setNewUsername(stats.repUsername);
                    setIsEditingUsername(true);
                  }}
                  className="text-[10px] sm:text-[11px] font-black text-[#D30915] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Customize Handle</span>
                </button>
              </div>
            )}
          </div>

          {/* Social Share Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="text-[10px] sm:text-[11px] text-[#716d77] font-semibold flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Share:</span>
            </span>

            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-[9px] bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <span>WhatsApp</span>
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-[9px] bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <span>Facebook</span>
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 sm:px-3 py-1.5 rounded-[9px] bg-stone-100 hover:bg-stone-200 text-[#141219] border border-stone-300 text-[10px] sm:text-[11px] font-bold transition-all flex items-center gap-1"
            >
              <span>Twitter / X</span>
            </a>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-[24px] sm:rounded-[28px] p-5 sm:p-6 border border-[#eedbe6] shadow-2xl text-center animate-modal-pop">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#f4edf2]">
              <h4 className="text-sm font-black text-[#141219] m-0 font-display">
                In-Person Pop-Up QR Code
              </h4>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] flex items-center justify-center cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* High-Contrast Dynamic QR */}
            <div className="w-44 sm:w-52 h-44 sm:h-52 mx-auto bg-white p-3 sm:p-3.5 rounded-[20px] sm:rounded-[22px] border-2 border-[#D30915] shadow-md flex items-center justify-center mb-3">
              <img
                src={qrCodeUrl}
                alt="Representative QR Code"
                className="w-full h-full object-contain"
              />
            </div>

            <p className="text-xs text-[#141219] font-black mb-0.5">
              @{stats.repUsername} Official Storefront
            </p>
            <p className="text-[11px] text-[#716d77] mb-4 leading-relaxed">
              Customers scan this code with their phone camera to enter your storefront with 20% commission auto-tracked.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={stats.referralLink}
                target="_blank"
                rel="noreferrer"
                className="h-[38px] px-3 rounded-[12px] bg-[#fff1f2] hover:bg-[#ffe3ee] text-[#D30915] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Visit Store</span>
              </a>

              <a
                href={qrCodeUrl}
                download={`ILoveSurprises_QR_${stats.repUsername}.png`}
                className="h-[38px] px-3 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save QR</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
