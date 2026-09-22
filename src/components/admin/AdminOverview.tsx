import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  CreditCard,
  Percent,
  Clock,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Download,
} from 'lucide-react';
import type { AdminKPIs, AdminActivityItem, AdminTab, AdminCollectionItem, RepresentativeAdminRecord } from '../../types/admin';
import { adminService } from '../../services/adminService';

interface AdminOverviewProps {
  kpis: AdminKPIs;
  activities: AdminActivityItem[];
  onNavigateTab: (tab: AdminTab) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  kpis,
  activities,
  onNavigateTab,
  onShowToast,
}) => {
  const [activeChartPeriod, setActiveChartPeriod] = useState<'7d' | '30d'>('7d');

  const hasSales = kpis.grossRevenue > 0 && kpis.totalOrders > 0;

  const chartData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    if (!hasSales) {
      return days.map((day) => ({ day, sales: 0, orders: 0, height: '4px' }));
    }
    const avgDaily = kpis.grossRevenue / 7;
    return days.map((day) => ({
      day,
      sales: avgDaily,
      orders: Math.max(1, Math.round(kpis.totalOrders / 7)),
      height: '50%',
    }));
  }, [hasSales, kpis.grossRevenue, kpis.totalOrders]);

  const handleExportSummary = () => {
    onShowToast('Exporting executive KPI summary report (CSV)...', {
      title: 'Report Queued',
      type: 'info',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Welcome & Quick Actions Strip */}
      <div className="bg-gradient-to-r from-[#fff1f2] via-[#fff7fa] to-[#fbf4ff] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-[#eedbe6] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D30915]/10 text-[#D30915] text-[11px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Command Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#141219] hero-title-font m-0 tracking-tight">
            Platform Overview & Performance
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 font-medium">
            Real-time sales velocity, representative downlines, active memberships, and commission liability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportSummary}
            className="px-3.5 py-2 rounded-xl bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#D30915]" />
            <span>Export Summary</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('representatives')}
            className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Manage Reps</span>
          </button>
        </div>
      </div>

      {/* 2. Seven Core Overview Cards (Requirement 1) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-[#716d77] tracking-wider">
            Operational Overview & Shortcuts
          </span>
          <span className="text-[11px] text-[#716d77]">Click any card to jump directly to management</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 sm:gap-3">
          {/* Card 1: Products */}
          <div
            onClick={() => onNavigateTab('products')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Products</span>
              <div className="w-7 h-7 rounded-lg bg-red-50 text-[#D30915] flex items-center justify-center group-hover:bg-[#D30915] group-hover:text-white transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              {adminService.getCommerceProducts().length.toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Catalog Active</span>
            </div>
          </div>

          {/* Card 2: Collections */}
          <div
            onClick={() => onNavigateTab('collections')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Collections</span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              {adminService.getCollections().length}
            </div>
            <div className="text-[10px] text-purple-700 font-bold">
              {adminService.getCollections().filter((c: AdminCollectionItem) => c.featured).length} Featured
            </div>
          </div>

          {/* Card 3: Orders */}
          <div
            onClick={() => onNavigateTab('orders')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Orders</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShoppingBag className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              {kpis.totalOrders}
            </div>
            <div className="text-[10px] text-[#716d77] font-medium">
              ${kpis.grossRevenue.toFixed(0)} volume
            </div>
          </div>

          {/* Card 4: Customers */}
          <div
            onClick={() => onNavigateTab('customers')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Customers</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              {adminService.getCustomers().length}
            </div>
            <div className="text-[10px] text-emerald-700 font-bold">
              Active Profiles
            </div>
          </div>

          {/* Card 5: Affiliates & Reps */}
          <div
            onClick={() => onNavigateTab('representatives')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Affiliates</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              {kpis.activeRepresentatives}
            </div>
            <div className="text-[10px] text-amber-800 font-bold">
              {adminService.getRepresentatives().filter((r: RepresentativeAdminRecord) => r.approvalStatus === 'pending').length} Pending
            </div>
          </div>

          {/* Card 6: Commissions */}
          <div
            onClick={() => onNavigateTab('commissions')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Commissions</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center group-hover:bg-rose-700 group-hover:text-white transition-colors">
                <Percent className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#D30915]">
              ${kpis.pendingCommissionLiability.toFixed(0)}
            </div>
            <div className="text-[10px] text-[#716d77] font-medium">
              Pending Ledger
            </div>
          </div>

          {/* Card 7: Appraisals */}
          <div
            onClick={() => onNavigateTab('appraisals')}
            className="bg-white rounded-2xl border border-[#eedbe6] p-3.5 shadow-xs hover:border-[#D30915] transition-all cursor-pointer group space-y-1 col-span-2 sm:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#716d77]">Appraisals</span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center group-hover:bg-indigo-700 group-hover:text-white transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black text-[#141219]">
              50+
            </div>
            <div className="text-[10px] text-indigo-700 font-bold">
              Certificates
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Financial Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Gross Sales */}
        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#716d77]">Gross Sales (MTD)</span>
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D30915] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
              ${kpis.grossRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{kpis.grossRevenueMoM}% vs last month</span>
          </div>
        </div>

        {/* KPI 2: Total Orders */}
        <div
          onClick={() => onNavigateTab('orders')}
          className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-[#D30915] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#716d77]">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
              {kpis.totalOrders.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{kpis.totalOrdersMoM}% order volume</span>
          </div>
        </div>

        {/* KPI 3: Active Reps */}
        <div
          onClick={() => onNavigateTab('representatives')}
          className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-[#D30915] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#716d77]">Active Representatives</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
              {kpis.activeRepresentatives}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+{kpis.activeRepresentativesMoM}% enrolled</span>
          </div>
        </div>

        {/* KPI 4: Active Memberships (MRR) */}
        <div
          onClick={() => onNavigateTab('memberships')}
          className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs relative overflow-hidden cursor-pointer hover:border-[#D30915] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#716d77]">Memberships (MRR)</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
              ${kpis.monthlyRecurringRevenue.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-[#716d77]">/mo</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#55505a]">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{kpis.activeMemberships} active subscribers</span>
          </div>
        </div>
      </div>

      {/* 3. Secondary Metrics Bar (Commissions & AOV) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div
          onClick={() => onNavigateTab('commissions')}
          className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#D30915] transition-all"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#716d77]">Pending Commission Liability</span>
            <div className="text-xl font-black text-[#D30915]">
              ${kpis.pendingCommissionLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#716d77] font-medium">Scheduled for monthly batch release (15th)</span>
          </div>
          <Percent className="w-6 h-6 text-[#D30915]/40" />
        </div>

        <div
          onClick={() => onNavigateTab('commissions')}
          className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-[#D30915] transition-all"
        >
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#716d77]">Total Commissions Disbursed</span>
            <div className="text-xl font-black text-emerald-600">
              ${kpis.totalCommissionsPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <span className="text-[10px] text-[#716d77] font-medium">35% Max approved distribution</span>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500/40" />
        </div>

        <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-[#716d77]">Average Order Value (AOV)</span>
            <div className="text-xl font-black text-[#141219]">
              ${kpis.averageOrderValue.toFixed(2)}
            </div>
            <span className="text-[10px] text-[#716d77] font-medium">High gift bundle conversion</span>
          </div>
          <TrendingUp className="w-6 h-6 text-[#141219]/30" />
        </div>
      </div>

      {/* 4. Charts & Live Activity Feed (Side by Side) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Sales Velocity Chart Card (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Weekly Revenue Velocity
              </h3>
              <p className="text-xs text-[#716d77] m-0">
                Daily store volume and completed checkout transactions
              </p>
            </div>

            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveChartPeriod('7d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartPeriod === '7d' ? 'bg-white shadow-2xs text-[#D30915]' : 'text-[#716d77]'
                }`}
              >
                Last 7 Days
              </button>
              <button
                type="button"
                onClick={() => setActiveChartPeriod('30d')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChartPeriod === '30d' ? 'bg-white shadow-2xs text-[#D30915]' : 'text-[#716d77]'
                }`}
              >
                30 Days
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="pt-4">
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 px-2 pb-2 border-b border-gray-100">
              {chartData.map((item) => (
                <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-bold text-[#716d77] opacity-0 group-hover:opacity-100 transition-opacity">
                    ${(item.sales / 1000).toFixed(1)}k
                  </span>
                  <div className="w-full max-w-[42px] bg-[#fff1f2] group-hover:bg-[#D30915]/20 rounded-t-lg relative flex items-end transition-all h-full">
                    <div
                      style={{ height: item.height }}
                      className="w-full bg-gradient-to-t from-[#D30915] to-[#F0444E] rounded-t-lg group-hover:brightness-110 transition-all"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#55505a]">{item.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#716d77] pt-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#D30915]" />
              <span>Completed Orders</span>
            </div>
            <span className="font-bold text-[#141219]">
              {hasSales ? 'Peak day: Saturday' : 'No sales recorded yet'}
            </span>
          </div>
        </div>

        {/* Live Activity Feed (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D30915]" />
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Live Audit Activity
              </h3>
            </div>
            <span className="text-[11px] font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              Real-time
            </span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8a858f] font-medium">
                No recent activity yet
              </div>
            ) : (
              activities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-xl bg-[#faf7f9] border border-[#f2e6ee] hover:bg-white hover:border-[#eedbe6] transition-all space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${act.badgeColor || 'bg-gray-100 text-gray-700'}`}>
                      {act.badge}
                    </span>
                    <span className="text-[10px] text-[#8a858f]">{act.timestamp}</span>
                  </div>
                  <div className="font-bold text-[#141219]">{act.title}</div>
                  <div className="text-[11px] text-[#716d77] leading-relaxed">{act.description}</div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="w-full py-2.5 rounded-xl border border-[#eedbe6] hover:bg-[#fff1f2] text-xs font-bold text-[#141219] hover:text-[#D30915] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>View Complete Historical Audit Log</span>
          </button>
        </div>
      </div>
    </div>
  );
};
