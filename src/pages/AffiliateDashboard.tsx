import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  DollarSign,
  Users,
  CreditCard,
  ArrowLeft,
  TrendingUp,
  Award,
  Copy,
  Check,
  Briefcase,
  Flame,
  ShieldCheck,
  Navigation,
} from 'lucide-react';
import type { UserProfile, AffiliateStats, CommissionRecord, PayoutRecord } from '../types';
import { affiliateService } from '../services/affiliateService';
import { AffiliateOverview } from '../components/affiliate/AffiliateOverview';
import { ReferralLinkCard } from '../components/affiliate/ReferralLinkCard';
import { EarningsChart } from '../components/affiliate/EarningsChart';
import { CommissionHistoryTable } from '../components/affiliate/CommissionHistoryTable';
import { ReferralTeamList } from '../components/affiliate/ReferralTeamList';
import { GenealogyTree } from '../components/affiliate/GenealogyTree';
import { WithdrawModal } from '../components/affiliate/WithdrawModal';
import { MarketingKitSection } from '../components/affiliate/MarketingKitSection';
import { SalesRosterTable } from '../components/affiliate/SalesRosterTable';
import { TrafficAnalyticsCard } from '../components/affiliate/TrafficAnalyticsCard';
import { PayoutsManagerCard } from '../components/affiliate/PayoutsManagerCard';
import { RepresentativeAccountTab } from '../components/affiliate/RepresentativeAccountTab';
import { AffiliateCustomSelect, type AffiliateSelectOption } from '../components/affiliate/AffiliateCustomSelect';

export type AffiliateTab =
  | 'overview'
  | 'sales'
  | 'commissions'
  | 'traffic'
  | 'team'
  | 'account'
  | 'payouts'
  | 'marketing';

interface AffiliateDashboardProps {
  user?: UserProfile | null;
  initialTab?: AffiliateTab;
  onNavigateToHome?: () => void;
  onNavigateToAccount?: () => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AffiliateDashboard: React.FC<AffiliateDashboardProps> = ({
  user: _user,
  initialTab = 'overview',
  onNavigateToHome,
  onNavigateToAccount: _onNavigateToAccount,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<AffiliateTab>(initialTab);
  const [stats, setStats] = useState<AffiliateStats>(() => affiliateService.getStats());
  const [commissions, setCommissions] = useState<CommissionRecord[]>(() => affiliateService.getCommissions());
  const [payouts, setPayouts] = useState<PayoutRecord[]>(() => affiliateService.getPayouts());
  const [treeData] = useState(() => affiliateService.getGenealogyTree());
  const [flatMembers] = useState(() => affiliateService.getAllReferralsFlat());
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [quickCopied, setQuickCopied] = useState(false);

  // Sync listener for affiliate data updates
  useEffect(() => {
    const handleUpdate = () => {
      setStats(affiliateService.getStats());
      setCommissions(affiliateService.getCommissions());
      setPayouts(affiliateService.getPayouts());
    };

    window.addEventListener('ils_affiliate_updated', handleUpdate);
    return () => window.removeEventListener('ils_affiliate_updated', handleUpdate);
  }, []);

  const handleTabChange = (tab: AffiliateTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickCopyLink = async () => {
    const link = stats.referralLink || `https://8zhcds6b-5174.inc1.devtunnels.ms/shop?rep=${stats.repUsername}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(link);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = link;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setQuickCopied(true);
      onShowToast('Representative Store Link copied to clipboard! Share to earn 20% direct.', {
        title: 'Store Link Copied',
        type: 'success',
      });
      setTimeout(() => setQuickCopied(false), 2500);
    } catch {
      onShowToast('Link copied to clipboard!', { type: 'success' });
    }
  };

  // Rank progress calculation
  const nextRankTarget = 3000;
  const progressPercent = Math.min(100, Math.round((stats.totalEarnings / nextRankTarget) * 100));

  const tabOptions: AffiliateSelectOption[] = [
    {
      value: 'overview',
      label: 'Overview',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      value: 'sales',
      label: 'Sales Orders',
      badge: `${commissions.length}`,
      badgeColor: 'bg-emerald-50 text-emerald-800',
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    {
      value: 'commissions',
      label: 'Commissions',
      badge: '20% + 5-Tier',
      badgeColor: 'bg-[#fff1f2] text-[#D30915]',
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    {
      value: 'traffic',
      label: 'Traffic & Visits',
      icon: <TrendingUp className="w-3.5 h-3.5" />,
    },
    {
      value: 'team',
      label: 'Team & Downline',
      badge: `${stats.totalReferrals}`,
      badgeColor: 'bg-purple-50 text-purple-700',
      icon: <Users className="w-3.5 h-3.5" />,
    },
    {
      value: 'account',
      label: 'Account & Membership',
      badge: '$19.99/mo',
      badgeColor: 'bg-amber-100 text-amber-900',
      icon: <Award className="w-3.5 h-3.5" />,
    },
    {
      value: 'payouts',
      label: 'Payouts',
      badge: `$${stats.availableBalance.toFixed(0)}`,
      badgeColor: 'bg-emerald-50 text-emerald-700',
      icon: <CreditCard className="w-3.5 h-3.5" />,
    },
    {
      value: 'marketing',
      label: 'Toolkit & Media',
      badge: 'New',
      badgeColor: 'bg-stone-100 text-stone-800',
      icon: <Briefcase className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-3 sm:py-8 lg:py-10 text-[#141219] overflow-x-hidden">
      <div className="max-w-[1460px] mx-auto px-2.5 sm:px-4 lg:px-6 space-y-4 sm:space-y-6">

        {/* 1. Header Banner & Rank Card */}
        <div className="bg-gradient-to-r from-[#fff1f2] via-[#fff7fa] to-[#fbf4ff] rounded-[20px] sm:rounded-[28px] p-4 sm:p-6 lg:p-8 border border-[#eedbe6] shadow-[0_8px_30px_rgba(211, 9, 21,0.05)] relative overflow-hidden">
          {/* Soft Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#D30915]/8 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {onNavigateToHome && (
                  <button
                    type="button"
                    onClick={onNavigateToHome}
                    className="h-7 px-2.5 rounded-full bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#55505a] hover:text-[#D30915] text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Shop</span>
                  </button>
                )}

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#fecdd3] text-[#D30915] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
                  <Sparkles className="w-3 h-3 text-[#D30915]" />
                  <span>Representative & Partner Hub</span>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-black uppercase">
                  <Award className="w-3 h-3" />
                  <span>20% Direct + 5 Tiers Active</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-[#141219] font-display tracking-tight leading-tight m-0">
                Welcome to Your Representative & Partner Portal
              </h1>

              <p className="text-xs sm:text-sm text-[#55505a] max-w-2xl leading-relaxed m-0 font-medium">
                Earn <strong className="text-[#141219] font-black">20% on every customer candle order</strong> plus up to <strong className="text-purple-700 font-black">15% team override commissions</strong> across your 5-tier sponsor organization.
              </p>
            </div>

            {/* Quick Actions & Rank Milestone Meter */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0">
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleQuickCopyLink}
                  className="h-[40px] px-3.5 sm:px-4 rounded-[12px] bg-white hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] border border-[#eedbe6] hover:border-[#fecdd3] font-black text-xs uppercase tracking-wider shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {quickCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#D30915]" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="h-[40px] px-4 sm:px-5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_16px_rgba(211, 9, 21,0.28)] active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Withdraw (${stats.availableBalance.toFixed(2)})</span>
                </button>
              </div>

              {/* Next Rank Progress Card */}
              <div className="bg-white/90 backdrop-blur-xs p-2.5 sm:p-3 rounded-[14px] border border-[#eedbe6] shadow-2xs w-full sm:w-72">
                <div className="flex items-center justify-between text-xs font-bold text-[#141219] mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Flame className="w-3.5 h-3.5 text-[#D30915]" />
                    <span>Next Rank: {stats.currentRank}</span>
                  </span>
                  <span className="text-purple-700 font-mono text-[11px]">{progressPercent}%</span>
                </div>

                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-1">
                  <div
                    className="h-full bg-gradient-to-r from-[#D30915] to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#716d77]">
                  <span>${stats.totalEarnings.toFixed(0)} Earned</span>
                  <span className="text-[#D30915]">Goal: ${nextRankTarget.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Mobile Quick Dropdown Selector (< sm) */}
        <div className="block sm:hidden">
          <label className="flex items-center gap-1 text-[11px] font-black uppercase text-[#716d77] mb-1.5">
            <Navigation className="w-3 h-3 text-[#D30915]" />
            <span>Select Dashboard View</span>
          </label>
          <AffiliateCustomSelect
            options={tabOptions}
            value={activeTab}
            onChange={(val) => handleTabChange(val as AffiliateTab)}
          />
        </div>

        {/* 3. Top Navigation Tabs Ribbon (Smooth horizontal desktop & tablet scroll) */}
        <div className="hidden sm:flex bg-white rounded-[18px] sm:rounded-[22px] p-1.5 sm:p-2.5 border border-[#eedbe6] shadow-[0_4px_18px_rgba(50,31,63,0.03)] items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none snap-x snap-mandatory">
          {/* Tab: Overview */}
          <button
            type="button"
            onClick={() => handleTabChange('overview')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'overview'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Overview</span>
          </button>

          {/* Tab: Sales */}
          <button
            type="button"
            onClick={() => handleTabChange('sales')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'sales'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Sales</span>
          </button>

          {/* Tab: Commissions */}
          <button
            type="button"
            onClick={() => handleTabChange('commissions')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'commissions'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Commissions</span>
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'commissions' ? 'bg-white text-[#D30915]' : 'bg-[#fff1f2] text-[#D30915]'
              }`}
            >
              20%
            </span>
          </button>

          {/* Tab: Traffic */}
          <button
            type="button"
            onClick={() => handleTabChange('traffic')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'traffic'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <TrendingUp className="w-4 h-4 shrink-0" />
            <span>Traffic</span>
          </button>

          {/* Tab: Team */}
          <button
            type="button"
            onClick={() => handleTabChange('team')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'team'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>Team</span>
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'team' ? 'bg-white text-[#D30915]' : 'bg-purple-50 text-purple-700'
              }`}
            >
              {stats.totalReferrals}
            </span>
          </button>

          {/* Tab: Account & Membership */}
          <button
            type="button"
            onClick={() => handleTabChange('account')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'account'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <Award className="w-4 h-4 shrink-0" />
            <span>Account</span>
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'account' ? 'bg-white text-[#D30915]' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              $19.99
            </span>
          </button>

          {/* Tab: Payouts */}
          <button
            type="button"
            onClick={() => handleTabChange('payouts')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'payouts'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <CreditCard className="w-4 h-4 shrink-0" />
            <span>Payouts</span>
            <span
              className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeTab === 'payouts' ? 'bg-white text-[#D30915]' : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              ${stats.availableBalance.toFixed(0)}
            </span>
          </button>

          {/* Tab: Marketing */}
          <button
            type="button"
            onClick={() => handleTabChange('marketing')}
            className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-[13px] font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 snap-start ${
              activeTab === 'marketing'
                ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.25)]'
                : 'hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915]'
            }`}
          >
            <Briefcase className="w-4 h-4 shrink-0" />
            <span>Toolkit</span>
          </button>
        </div>

        {/* 4. Dynamic Tab Content View */}
        <div className="space-y-4 sm:space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Referral Link Quick Share Card */}
              <ReferralLinkCard
                stats={stats}
                onUpdateStats={setStats}
                onShowToast={onShowToast}
              />

              {/* Overview Metrics Cards, 5-Tier Compensation Overview & Interactive Simulator */}
              <AffiliateOverview
                stats={stats}
                onOpenWithdraw={() => setIsWithdrawOpen(true)}
                onNavigateTab={handleTabChange}
              />

              {/* Interactive Performance Graph */}
              <EarningsChart />
            </>
          )}

          {activeTab === 'sales' && (
            <SalesRosterTable commissions={commissions} />
          )}

          {activeTab === 'commissions' && (
            <CommissionHistoryTable commissions={commissions} />
          )}

          {activeTab === 'traffic' && (
            <TrafficAnalyticsCard stats={stats} />
          )}

          {activeTab === 'team' && (
            <div className="space-y-5">
              <GenealogyTree
                treeData={treeData}
                onShowToast={onShowToast}
              />
              <ReferralTeamList members={flatMembers} />
            </div>
          )}

          {activeTab === 'account' && (
            <RepresentativeAccountTab
              user={_user}
              stats={stats}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'payouts' && (
            <PayoutsManagerCard
              stats={stats}
              payouts={payouts}
              onOpenWithdraw={() => setIsWithdrawOpen(true)}
            />
          )}

          {activeTab === 'marketing' && (
            <MarketingKitSection
              repUsername={stats.repUsername}
              referralLink={stats.referralLink}
              onShowToast={onShowToast}
            />
          )}
        </div>

        {/* 5. Trust Guarantee Footer Badge */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eedbe6] flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-xs sm:text-sm font-black text-[#141219] block">
                Official I Love Surprises 5-Level Compensation Plan
              </strong>
              <span className="text-[11px] text-[#716d77]">
                Monthly payouts — processed on the 15th of each month via PayPal & Bank Transfer with zero payout fees.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWithdrawOpen(true)}
            className="h-[38px] px-5 rounded-[11px] bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-xs transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            Manage Payouts
          </button>
        </div>

        {/* Withdraw Balance Modal */}
        <WithdrawModal
          isOpen={isWithdrawOpen}
          stats={stats}
          payouts={payouts}
          onClose={() => setIsWithdrawOpen(false)}
          onUpdateStats={setStats}
          onUpdatePayouts={setPayouts}
          onShowToast={onShowToast}
        />

      </div>
    </div>
  );
};
