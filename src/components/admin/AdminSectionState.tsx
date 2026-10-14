import React from 'react';
import { AlertTriangle, RefreshCw, PlugZap } from 'lucide-react';

/**
 * Shared loading / error / unavailable states for admin panels.
 *
 * Styled with the existing admin palette and card treatment so panels gain
 * honest state handling without any visual redesign.
 */

interface AdminSectionErrorProps {
  title?: string;
  message: string;
  onRetry?: () => void | Promise<void>;
}

/** Retryable error state for a panel whose data failed to load. */
export const AdminSectionError: React.FC<AdminSectionErrorProps> = ({
  title = 'Could not load this data',
  message,
  onRetry,
}) => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (!onRetry || isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      className="w-full bg-white rounded-2xl border border-rose-200 p-5 sm:p-6 shadow-xs space-y-4"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 shrink-0 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm sm:text-base font-extrabold text-[#141219]">{title}</h3>
          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed break-words">
            {message}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#b00711] text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-2xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Retrying…' : 'Try again'}</span>
        </button>
      )}
    </div>
  );
};

interface AdminFeatureUnavailableProps {
  feature: string;
  /** What the backend still needs to expose for this panel to work. */
  requirement: string;
  /** Set when the panel still shows browser-local data the user can edit. */
  localOnly?: boolean;
}

/**
 * Shown when a panel has no backend endpoint.
 *
 * This is deliberately explicit: without it, an empty table reads as "the
 * store has no data", and locally edited values read as saved records.
 */
export const AdminFeatureUnavailable: React.FC<AdminFeatureUnavailableProps> = ({
  feature,
  requirement,
  localOnly = false,
}) => (
  <div className="w-full bg-[#fff9fb] rounded-2xl border border-[#f4e0ec] p-5 sm:p-6 shadow-xs">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
        <PlugZap className="w-5 h-5" />
      </div>
      <div className="min-w-0 space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider">
          Not connected
        </div>
        <h3 className="text-sm sm:text-base font-extrabold text-[#141219]">
          {feature} is not connected to the database yet
        </h3>
        <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed">
          {requirement}
        </p>
        {localOnly && (
          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed">
            Anything you change here is stored in this browser only. It is not
            saved to the store and will not appear for customers or on other
            devices.
          </p>
        )}
      </div>
    </div>
  </div>
);

interface AdminEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

/** Accurate empty state for a panel that loaded successfully with no rows. */
export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  title,
  description,
  icon,
}) => (
  <div className="w-full bg-white rounded-2xl border border-[#eedbe6] p-8 sm:p-10 shadow-xs text-center">
    {icon && (
      <div className="w-14 h-14 rounded-2xl bg-[#fff9fb] border border-[#f4e0ec] text-[#D30915] flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
    )}
    <h3 className="text-base sm:text-lg font-extrabold text-[#141219] mb-1.5">{title}</h3>
    <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed max-w-md mx-auto">
      {description}
    </p>
  </div>
);
