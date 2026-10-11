import { Home, ShoppingBag, Sparkles } from 'lucide-react';

interface NotFoundProps {
  onNavigateToHome?: () => void;
  onNavigateToShop?: () => void;
  onNavigateToCollection?: (handle: string) => void;
}

export const NotFound: React.FC<NotFoundProps> = ({
  onNavigateToHome,
  onNavigateToShop,
  onNavigateToCollection,
}) => {
  return (
    <div className="w-full min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 bg-[#fcf9fb]">
      <div className="max-w-xl w-full text-center bg-white rounded-3xl border border-[#eedbe6] p-8 sm:p-12 shadow-sm animate-in fade-in duration-300">
        {/* Surprise Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-xs font-black uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Surprise Not Found</span>
        </div>

        {/* 404 Visual Heading */}
        <h1 className="text-6xl sm:text-7xl font-black text-[#141219] font-display tracking-tight leading-none mb-3">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight mb-3">
          We Couldn't Find That Page
        </h2>

        <p className="text-sm text-[#716d77] leading-relaxed mb-8 max-w-md mx-auto">
          The page you are looking for may have been moved, renamed, or does not exist. Explore our popular surprise collections below to discover real cash and jewelry reveals!
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Home</span>
          </button>

          <button
            type="button"
            onClick={onNavigateToShop}
            className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] border border-[#ebdce5] text-xs sm:text-sm font-black uppercase tracking-wider shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Surprise Catalog</span>
          </button>
        </div>

        {/* Quick Collection Links */}
        <div className="pt-6 border-t border-[#f2edf1]">
          <p className="text-xs font-black uppercase tracking-wider text-[#8a858f] mb-3">
            Popular Collections:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { name: 'Cash Candles', handle: 'cash-candles' },
              { name: 'Jewelry Candles', handle: 'jewelry-candles' },
              { name: 'Wax Melts', handle: 'wax-melts' },
              { name: 'Bath Bombs', handle: 'bath-bombs' },
              { name: 'Sensory Slimes', handle: 'slimes' },
            ].map((col) => (
              <button
                key={col.handle}
                type="button"
                onClick={() => onNavigateToCollection?.(col.handle)}
                className="px-3 py-1.5 rounded-xl bg-[#fffbfd] border border-[#ebdce5] text-xs font-bold text-[#55505a] hover:text-[#D30915] hover:border-[#D30915] hover:bg-[#fff5f6] transition-all cursor-pointer"
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
