import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronDown, Check, ExternalLink, X, ShieldCheck } from 'lucide-react';
import {
  representativeService,
  type PublicRepresentative,
  DEFAULT_REPRESENTATIVES,
} from '../../services/representativeService';

interface ShoppingWithRepBannerProps {
  onNavigateToAffiliate?: () => void;
}

export const ShoppingWithRepBanner: React.FC<ShoppingWithRepBannerProps> = ({
  onNavigateToAffiliate,
}) => {
  const [rep, setRep] = useState<PublicRepresentative | null>(() =>
    representativeService.getAttributedRepresentative()
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangeMenuOpen, setIsChangeMenuOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    // Listen for attribution changes
    const handleAttributionChange = (e: Event) => {
      const customEvent = e as CustomEvent<PublicRepresentative | null>;
      setRep(customEvent.detail || representativeService.getAttributedRepresentative());
    };

    window.addEventListener('ils_representative_attributed', handleAttributionChange);
    return () => {
      window.removeEventListener('ils_representative_attributed', handleAttributionChange);
    };
  }, []);

  // Listen for query params e.g. ?rep=emily_sparkles
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const repParam = params.get('rep') || params.get('consultant');
      if (repParam) {
        const updated = representativeService.setAttributedRepresentative(repParam);
        if (updated) {
          setTimeout(() => setRep(updated), 0);
        }
      }
    }
  }, []);

  if (!rep) return null;

  const handleSelectRep = (selected: PublicRepresentative) => {
    representativeService.setAttributedRepresentative(selected);
    setRep(selected);
    setIsChangeMenuOpen(false);
  };

  const handleCopyRepLink = () => {
    if (!rep) return;
    navigator.clipboard.writeText(rep.storeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <>
      {/* Persistent Top Shopping-With Banner */}
      <aside 
        aria-label="Representative attribution banner"
        className={`w-full border-b py-1.5 px-3 sm:px-6 relative z-30 transition-all duration-300 ${
          rep.isSuspended
            ? 'bg-gradient-to-r from-[#fffbeb] via-[#fffdf5] to-[#fef3c7] border-amber-200'
            : 'bg-gradient-to-r from-[#fff5f6] via-[#fff9fa] to-[#fff0f2] border-[#ffd8dc]'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 text-xs sm:text-sm">
          {rep.isSuspended ? (
            /* Inactive Representative Banner */
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                Inactive
              </span>
              <span className="text-[#92400e] text-[11px] sm:text-xs font-bold truncate">
                Consultant Storefront Temporarily Inactive ({rep.name})
              </span>
              <span className="hidden md:inline text-[11px] text-[#b45309]">
                • Orders are currently not credited to this consultant.
              </span>
            </div>
          ) : (
            /* Active Representative Banner */
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <img
                  src={rep.avatar}
                  alt={rep.name}
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover ring-2 ring-[#D30915]/30 shadow-sm"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>

              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[#645c68] text-[11px] sm:text-xs whitespace-nowrap">
                  You are shopping with
                </span>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="font-semibold text-[#141219] hover:text-[#D30915] transition-colors truncate max-w-[140px] sm:max-w-none flex items-center gap-1 group text-[12px] sm:text-xs"
                >
                  <span>{rep.name}</span>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-[#D30915]/10 text-[#D30915] ml-1">
                    {rep.rank}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {rep.isSuspended ? (
              <button
                type="button"
                onClick={() => {
                  representativeService.clearAttributedRepresentative();
                  setRep(representativeService.getAttributedRepresentative());
                }}
                className="text-[11px] font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              >
                Shop Direct
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-medium text-[#D30915] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Profile</span>
              </button>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsChangeMenuOpen((prev) => !prev)}
                className="text-[11px] text-[#645c68] hover:text-[#141219] font-medium flex items-center gap-0.5 bg-white/80 hover:bg-white active:scale-95 px-2 py-0.5 rounded-md border border-[#ecdfe2] hover:border-[#D30915] transition-all cursor-pointer shadow-2xs"
                title="Change Consultant"
              >
                <span className="hidden sm:inline">Change</span>
                <ChevronDown className="w-3 h-3 text-[#9c95a0]" />
              </button>

              {isChangeMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-[#ecdfe2] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 border-b border-[#f4edf0] text-[10px] uppercase font-bold tracking-wider text-[#9c95a0]">
                    Select Verified Consultant
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-[#f9f5f7]">
                    {DEFAULT_REPRESENTATIVES.length === 0 ? (
                      <div className="p-4 text-center text-xs text-stone-400">
                        No other consultants available
                      </div>
                    ) : (
                      DEFAULT_REPRESENTATIVES.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectRep(item)}
                          className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-[#fff5f6] transition-colors ${
                            item.id === rep.id ? 'bg-[#fff0f2]' : ''
                          }`}
                        >
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-6 h-6 rounded-full object-cover ring-1 ring-[#D30915]/20"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#141219] truncate">{item.name}</p>
                            <p className="text-[10px] text-[#9c95a0] truncate">{item.rank}</p>
                          </div>
                          {item.id === rep.id && (
                            <Check className="w-3.5 h-3.5 text-[#D30915] flex-shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Consultant Profile Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#f0e4e7] overflow-hidden">
            {/* Header / Banner */}
            <div className="h-24 bg-gradient-to-r from-[#D30915] via-[#e52e39] to-[#b80712] relative p-4 flex justify-between items-start">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-semibold">
                <Sparkles className="w-3 h-3" />
                <span>Independent Surprise Consultant</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Avatar & Info */}
            <div className="px-6 pb-6 pt-0 relative">
              <div className="-mt-12 flex items-end justify-between mb-4">
                <div className="relative">
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white shadow-lg"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Representative</span>
                </div>
              </div>

              <h2 className="text-xl font-bold text-[#141219] tracking-tight">{rep.name}</h2>
              <p className="text-xs text-[#D30915] font-semibold mb-2">{rep.rank} • Active since {rep.joinedYear}</p>
              <p className="text-sm text-[#645c68] leading-relaxed mb-4">{rep.tagline}</p>

              {/* Consultant Highlights */}
              <div className="bg-[#fff9fa] rounded-xl p-3.5 border border-[#ffd8dc] space-y-2 mb-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9c95a0]">Favorite Surprise:</span>
                  <span className="font-semibold text-[#141219] text-right truncate max-w-[200px]">
                    {rep.favoriteProduct}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9c95a0]">Storefront Link:</span>
                  <span className="font-mono text-[11px] text-[#D30915] font-semibold truncate max-w-[200px]">
                    ilovesurprises.com/{rep.repUsername}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#9c95a0]">Attribution Window:</span>
                  <span className="font-medium text-emerald-700">60-day active cookie</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyRepLink}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#ecdfe2] text-xs font-semibold text-[#141219] hover:bg-[#fff5f6] hover:border-[#D30915] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied Store URL!' : 'Share Her Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    if (onNavigateToAffiliate) onNavigateToAffiliate();
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#D30915] text-white text-xs font-semibold hover:bg-[#b80712] transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Join Her Team</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
