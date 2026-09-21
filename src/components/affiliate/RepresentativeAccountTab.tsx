import React from 'react';
import {
  Mail,
  ShieldCheck,
  CreditCard,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import type { UserProfile, AffiliateStats } from '../../types';
import { RepresentativeMembershipCard } from './RepresentativeMembershipCard';

interface RepresentativeAccountTabProps {
  user?: UserProfile | null;
  stats: AffiliateStats;
  onShowToast?: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const RepresentativeAccountTab: React.FC<RepresentativeAccountTabProps> = ({
  user,
  stats,
  onShowToast,
}) => {
  const [copied, setCopied] = React.useState(false);

  const repName = user?.name || (stats.repUsername ? `@${stats.repUsername}` : 'Representative');
  const repEmail = user?.email || '';
  const repUsername = stats.repUsername || user?.repUsername || '';
  const storeUrl = typeof window !== 'undefined' ? `${window.location.origin}/shop?rep=${repUsername}` : `https://ilovesurprises.com/shop?rep=${repUsername}`;
  const avatarUrl = user?.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp';

  const handleCopyStore = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    if (onShowToast) {
      onShowToast('Storefront URL copied to clipboard!', { title: 'Copied', type: 'success' });
    }
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. Consultant Profile Overview Card */}
      <div className="rounded-[22px] bg-white border border-[#eee0e9] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={avatarUrl}
                alt={repName}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-[#fff1f2] border border-[#fecdd3] shadow-xs"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-black text-[#141219] font-display m-0">
                  {repName}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#D30915]/10 text-[#D30915] text-[10px] font-black uppercase">
                  <Sparkles className="w-3 h-3" />
                  <span>{stats.currentRank}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#716d77]">
                <Mail className="w-3.5 h-3.5 text-[#9c95a0]" />
                <span>{repEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Representative Status</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#fffafb] border border-[#f5e6ee] space-y-1.5 min-w-[240px]">
            <span className="text-[10px] uppercase font-bold text-[#8a858f] tracking-wider block">
              Personal Storefront URL
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono font-bold text-[#D30915] truncate">
                ilovesurprises.com/{repUsername}
              </span>
              <button
                type="button"
                onClick={handleCopyStore}
                className="p-1.5 rounded-lg bg-white border border-[#ecdfe2] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] transition-all cursor-pointer shrink-0"
                title="Copy Storefront URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <span className="text-[9px] text-[#9c95a0] block leading-tight">
              *Public profile displays your name & photo. Phone numbers are strictly private.
            </span>
          </div>
        </div>
      </div>

      {/* 2. Membership Management Card (Active / Pending / Past Due / Suspended / Reactivation) */}
      <RepresentativeMembershipCard
        repUsername={repUsername}
        onShowToast={onShowToast}
      />

      {/* 3. Membership Billing History Ledger */}
      <div className="rounded-[22px] bg-white border border-[#eee0e9] shadow-[0_10px_32px_rgba(50,31,63,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#f4ebf1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D30915]" />
            <h4 className="text-base font-black text-[#141219] font-display m-0">
              Membership Dues & Billing Invoices
            </h4>
          </div>
          <span className="text-xs text-[#716d77]">$19.99/month automatic recurring</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#faf5f8] border-b border-[#f0e4ec] text-[11px] uppercase font-black tracking-wider text-[#716d77]">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7eff4]">
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-[#8a858f]">
                  No billing invoices yet. Your membership dues and subscription receipts will appear here once processed.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
