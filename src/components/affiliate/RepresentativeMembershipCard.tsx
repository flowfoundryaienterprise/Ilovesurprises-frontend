import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Package,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

export type MembershipState = 'active' | 'pending' | 'past_due' | 'suspended' | 'reactivation';

interface RepresentativeMembershipCardProps {
  initialState?: MembershipState;
  repUsername?: string;
  onShowToast?: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const RepresentativeMembershipCard: React.FC<RepresentativeMembershipCardProps> = ({
  initialState = 'active',
  repUsername = '',
  onShowToast,
}) => {
  const [membershipState, setMembershipState] = useState<MembershipState>(initialState);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semi_annual' | 'annual'>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  const nextBillingDate = React.useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, []);

  const handleRetryPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMembershipState('active');
      if (onShowToast) {
        onShowToast('Payment of $19.99 verified! Your storefront and commissions are fully active.', {
          title: 'Membership Active',
          type: 'success',
        });
      }
    }, 900);
  };

  const handleReactivate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setMembershipState('active');
      if (onShowToast) {
        onShowToast('Storefront successfully reactivated! Your URL and team tree have been restored.', {
          title: 'Reactivation Complete',
          type: 'success',
        });
      }
    }, 900);
  };

  return (
    <div className="rounded-[22px] bg-white border border-[#eee0e9] shadow-[0_10px_32px_rgba(50,31,63,0.05)] overflow-hidden">
      {/* Top Header with Status Simulator Pill */}
      <div className="p-4 sm:p-5 border-b border-[#f4ebf1] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white via-[#fffbfe] to-white">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-black text-[#141219] font-display m-0">
              Representative Membership
            </h3>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                membershipState === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : membershipState === 'pending'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : membershipState === 'past_due'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : membershipState === 'suspended'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'
              }`}
            >
              {membershipState === 'active' && '● Active'}
              {membershipState === 'pending' && '⏱ Pending'}
              {membershipState === 'past_due' && '⚠ Past Due (Grace)'}
              {membershipState === 'suspended' && '✕ Suspended'}
              {membershipState === 'reactivation' && '⟳ Reactivation'}
            </span>
          </div>
          <p className="text-xs text-[#716d77] mt-0.5">
            Auto-renewing consultant license & personal storefront attribution
          </p>
        </div>

        {/* State Preview Switcher for Development / Verification */}
        <div className="flex items-center gap-1 bg-[#f7f0f4] p-1 rounded-xl border border-[#ebdbe5] text-[10px] font-bold">
          <span className="text-[#8a858f] px-1.5 hidden md:inline">Preview:</span>
          {(['active', 'pending', 'past_due', 'suspended', 'reactivation'] as MembershipState[]).map(
            (st) => (
              <button
                key={st}
                type="button"
                onClick={() => setMembershipState(st)}
                className={`px-2 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                  membershipState === st
                    ? 'bg-white text-[#D30915] shadow-xs font-black'
                    : 'text-[#645c68] hover:text-[#141219]'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* STATE 1: ACTIVE */}
      {membershipState === 'active' && (
        <div className="p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#fffafb] border border-[#f5e6ee]">
              <span className="text-[11px] text-[#8a858f] font-semibold block">Current Plan</span>
              <span className="text-base font-black text-[#141219] block mt-0.5">$19.99 / month</span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> Auto-Renewing
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fffafb] border border-[#f5e6ee]">
              <span className="text-[11px] text-[#8a858f] font-semibold block">Next Billing Date</span>
              <span className="text-base font-black text-[#141219] block mt-0.5">{nextBillingDate}</span>
              <span className="text-[10px] text-[#716d77] font-medium block mt-1">Automatic recurring dues</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#fffafb] border border-[#f5e6ee]">
              <span className="text-[11px] text-[#8a858f] font-semibold block">Personal Storefront</span>
              <span className="text-xs font-mono font-bold text-[#D30915] block mt-0.5 truncate">
                {repUsername ? `ilovesurprises.com/${repUsername}` : 'Pending handle setup'}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" /> Attributing 20% + 5 Levels
              </span>
            </div>
          </div>

          {/* Prepaid Upgrade Options */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-[#fff5f6] to-[#fffbfc] border border-[#ffd8dc]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <strong className="text-xs sm:text-sm font-black text-[#141219] block">
                  Save with Prepaid Membership Discounts
                </strong>
                <span className="text-[11px] text-[#645c68]">
                  Lock in your rate and save up to 15% upfront
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-[#D30915] bg-white px-2 py-0.5 rounded-md border border-[#ffd8dc]">
                Configured in Admin
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white border-[#D30915] ring-2 ring-[#D30915]/20 shadow-xs'
                    : 'bg-white/60 border-[#ecdfe2] hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#141219]">Monthly</span>
                  <span className="text-xs font-black text-[#141219]">$19.99/mo</span>
                </div>
                <span className="text-[10px] text-[#8a858f] block mt-0.5">Standard recurring</span>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('semi_annual')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  billingCycle === 'semi_annual'
                    ? 'bg-white border-[#D30915] ring-2 ring-[#D30915]/20 shadow-xs'
                    : 'bg-white/60 border-[#ecdfe2] hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#141219]">6-Month Prepaid</span>
                  <span className="text-xs font-black text-emerald-700">10% OFF</span>
                </div>
                <span className="text-[10px] text-[#8a858f] block mt-0.5">$107.95 total ($17.99/mo)</span>
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-white border-[#D30915] ring-2 ring-[#D30915]/20 shadow-xs'
                    : 'bg-white/60 border-[#ecdfe2] hover:bg-white'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-[#141219]">12-Month Prepaid</span>
                  <span className="text-xs font-black text-emerald-700">15% OFF</span>
                </div>
                <span className="text-[10px] text-[#8a858f] block mt-0.5">$203.90 total ($16.99/mo)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: PENDING */}
      {membershipState === 'pending' && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-xs sm:text-sm font-black text-amber-900 block">
                Enrollment & Payment Verification In Progress
              </strong>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Your application and payment of $19.99 (or Starter Kit purchase) are currently undergoing verification.
                Your custom storefront link will go live automatically once finalized.
              </p>
            </div>
          </div>

          {/* Starter Kit Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-xl border border-[#ebdbe5] bg-[#fffafb]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#141219] mb-1">
                <Package className="w-4 h-4 text-[#D30915]" />
                <span>$49 Essential Starter Kit</span>
              </div>
              <p className="text-[11px] text-[#716d77] leading-tight">
                Includes best-selling surprise candles, unboxing marketing collateral & fragrance samples.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                Warehouse Preparing Dispatch
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-[#ebdbe5] bg-[#fffafb]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#141219] mb-1">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>$99 Pro Ambassador Kit</span>
              </div>
              <p className="text-[11px] text-[#716d77] leading-tight">
                Full catalog sample suite, ring sizers, cash candle reveal testers & VIP backdrop kit.
              </p>
              <span className="inline-block mt-2 text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                Available to add anytime
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: PAST DUE (GRACE PERIOD) */}
      {membershipState === 'past_due' && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-xs sm:text-sm font-black text-orange-900 block">
                  Membership Payment Past Due — Grace Period Active
                </strong>
                <span className="text-[10px] font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded-full">
                  3 Days Remaining
                </span>
              </div>
              <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                Your monthly recurring charge of $19.99 was declined on March 1, 2026. Your personal storefront link
                remains temporarily active during your 7-day grace period. Please update your payment method to avoid
                storefront suspension.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleRetryPayment}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Retrying Payment...' : 'Retry Payment ($19.99)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: SUSPENDED */}
      {membershipState === 'suspended' && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="text-xs sm:text-sm font-black text-red-900 block">
                Representative Storefront Suspended
              </strong>
              <p className="text-xs text-red-800 mt-1 leading-relaxed">
                Your personal URL (<strong>ilovesurprises.com/{repUsername}</strong>) has been paused due to an expired
                or unpaid membership. Referral traffic and commissions are currently paused. Your genealogy downline
                and historical records remain safely preserved.
              </p>
              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReactivate}
                  className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  <span>{isProcessing ? 'Reactivating...' : 'Reactivate Storefront ($19.99)'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 5: REACTIVATION */}
      {membershipState === 'reactivation' && (
        <div className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
          <div className="p-4 rounded-xl bg-purple-50 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <strong className="text-sm font-black text-purple-900">
                Reactivate Your Representative Account
              </strong>
            </div>
            <p className="text-xs text-purple-800 leading-relaxed">
              Welcome back! Complete your membership dues to immediately restore your personal URL
              (<strong>ilovesurprises.com/{repUsername}</strong>), re-enable customer commissions, and reconnect to your
              entire 5-level team downline.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-white border border-purple-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#141219] block">Standard Monthly Reactivation</span>
                <span className="text-[11px] text-[#716d77]">Billed $19.99/mo, cancel anytime</span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleReactivate}
                className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#b80712] text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isProcessing ? 'Processing...' : 'Pay $19.99 & Restore URL'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Starter Kits Footer Information */}
      <div className="px-5 py-3.5 bg-[#fffafb] border-t border-[#f4ebf1] flex flex-wrap items-center justify-between gap-3 text-xs text-[#716d77]">
        <div className="flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-[#D30915]" />
          <span>Starter Kits: <strong>$49 Essential</strong> & <strong>$99 Pro</strong> available at enrollment</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Idempotent Webhook Billing Protection Verified</span>
        </div>
      </div>
    </div>
  );
};
