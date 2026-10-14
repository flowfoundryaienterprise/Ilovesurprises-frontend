import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, Users, Loader2 } from 'lucide-react';
import { ApiError } from '../../services/apiClient';

/**
 * Loading, error, and not-enrolled states for the representative dashboard.
 *
 * Earnings, balances, and downline data are server-calculated, so until the
 * backend responds there is nothing truthful to display. These states replace
 * what would otherwise be placeholder figures.
 */

export type AffiliateLoadState = 'loading' | 'ready' | 'error' | 'not_enrolled';

/** Turns a failure into an actionable message for a representative. */
export function describeAffiliateError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.isUnauthorized) {
      return 'Your session has expired. Please sign in again to view your earnings.';
    }
    if (err.isForbidden) {
      return 'Your account does not have access to the representative dashboard.';
    }
    if (err.kind === 'network') {
      return 'We could not reach the server to load your earnings. Check your connection and try again.';
    }
    if (err.kind === 'timeout') {
      return 'Loading your earnings took too long. Please try again.';
    }
    return err.displayMessage;
  }
  if (err instanceof Error) return err.message;
  return 'Your representative dashboard could not be loaded.';
}

interface AffiliateDashboardStateProps {
  state: AffiliateLoadState;
  message?: string | null;
  onRetry: () => void | Promise<void>;
  onNavigateToHome?: () => void;
}

export const AffiliateDashboardState: React.FC<AffiliateDashboardStateProps> = ({
  state,
  message,
  onRetry,
  onNavigateToHome,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#fcf9fb] px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-[1460px] mx-auto space-y-4 animate-pulse">
          {/* Header block */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-5 sm:p-6 shadow-xs space-y-3">
            <div className="w-56 h-6 bg-gray-200 rounded-md" />
            <div className="w-80 max-w-full h-4 bg-gray-100 rounded-md" />
          </div>

          {/* Balance cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-24 h-3.5 bg-gray-200 rounded-md" />
                  <div className="w-8 h-8 bg-gray-200 rounded-xl" />
                </div>
                <div className="w-28 h-7 bg-gray-300 rounded-lg" />
                <div className="w-20 h-3 bg-gray-100 rounded-md" />
              </div>
            ))}
          </div>

          {/* Chart + table */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-5 shadow-xs">
            <div className="w-40 h-5 bg-gray-200 rounded-md mb-4" />
            <div className="w-full h-48 bg-gray-100 rounded-xl" />
          </div>

          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#716d77] pt-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your verified earnings…</span>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'not_enrolled') {
    return (
      <div className="min-h-screen bg-[#fcf9fb] flex items-center justify-center p-4 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#eedbe6] p-6 sm:p-8 shadow-xl text-center space-y-5 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D30915]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="w-16 h-16 rounded-2xl bg-[#fff1f2] border border-[#f4e0ec] text-[#D30915] flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-black text-[#141219] hero-title-font">
              You are not enrolled as a representative yet
            </h3>
            <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed">
              This dashboard shows your referral link, team, and commission
              earnings once your representative account is created. You do not
              have one on this account yet, so there are no earnings to show.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2.5 rounded-xl border border-[#eedbe6] hover:border-[#D30915] bg-white text-xs font-bold text-[#141219] hover:text-[#D30915] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Check again</span>
            </button>

            {onNavigateToHome && (
              <button
                type="button"
                onClick={onNavigateToHome}
                className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#b00711] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to store</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9fb] flex items-center justify-center p-4 sm:p-8">
      <div
        role="alert"
        className="max-w-md w-full bg-white rounded-3xl border border-rose-200 p-6 sm:p-8 shadow-xl text-center space-y-5"
      >
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-[#141219] hero-title-font">
            Could not load your earnings
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed">
            {message || 'Your representative dashboard could not be loaded.'}
          </p>
          <p className="text-[11px] text-[#9a949f] leading-relaxed">
            Nothing is shown rather than estimated figures, so your commission
            totals are never misreported.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            type="button"
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#b00711] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Retrying…' : 'Try again'}</span>
          </button>

          {onNavigateToHome && (
            <button
              type="button"
              onClick={onNavigateToHome}
              className="px-4 py-2.5 rounded-xl border border-[#eedbe6] hover:border-[#D30915] bg-white text-xs font-bold text-[#141219] hover:text-[#D30915] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to store</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
