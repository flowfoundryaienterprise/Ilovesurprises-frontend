import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Download,
  ArrowUpRight,
  DollarSign,
  Users,
  ShoppingCart,
  Award,
  TrendingUp,
  Search,
} from 'lucide-react';
import type {
  AdminReportData,
  AdminOrderItem,
} from '../../types/admin';
import { adminService } from '../../services/adminService';

interface AdminReportsProps {
  reportData: AdminReportData;
  onTimeframeChange: (timeframe: '7d' | '30d' | '90d' | 'ytd') => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export type ReportTab = 'overview' | 'sales_orders' | 'customers' | 'commissions' | 'top_affiliates';

function downloadCsv(filename: string, rows: (string | number)[][], headers: string[]) {
  const escapeCell = (val: string | number) => {
    const s = String(val ?? '');
    return `"${s.replace(/"/g, '""')}"`;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const AdminReports: React.FC<AdminReportsProps> = ({
  reportData,
  onTimeframeChange,
  onShowToast,
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | 'ytd'>('30d');
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Live real datasets for reporting
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const customers = useMemo(() => adminService.getCustomers(), []);
  const representatives = useMemo(() => adminService.getRepresentatives(), []);
  const commissions = useMemo(() => adminService.getCommissionLedger(), []);

  useEffect(() => {
    adminService.getCommerceOrders().then((liveOrders) => {
      setOrders(liveOrders);
    });
  }, []);

  const handleTimeframeClick = (tf: '7d' | '30d' | '90d' | 'ytd') => {
    setSelectedTimeframe(tf);
    onTimeframeChange(tf);
    onShowToast(`Report updated for timeframe: ${tf.toUpperCase()}`, { type: 'info' });
  };

  // CSV Exporters for each individual report screen
  const exportOverviewCsv = () => {
    const headers = ['Metric', 'Value', 'Details'];
    const rows = [
      ['Gross Sales', `$${reportData.grossSales.toFixed(2)}`, `Timeframe: ${selectedTimeframe.toUpperCase()}`],
      ['Net Sales', `$${reportData.netSales.toFixed(2)}`, 'After refunds & promotional discounts'],
      ['Conversion Rate', `${reportData.conversionRate}%`, `From ${reportData.visitors.toLocaleString()} sessions`],
      ['Average Order Value', `$${reportData.averageOrderValue.toFixed(2)}`, 'Per completed checkout'],
      ['Membership MRR', `$${reportData.membershipMRR.toFixed(2)}`, `${reportData.activeRepresentatives} active subscribers`],
      ['Commission Liability', `$${reportData.commissionLiability.toFixed(2)}`, `$${reportData.totalPayoutsDisbursed.toLocaleString()} disbursed`],
    ];
    downloadCsv(`ILS_Executive_Overview_${selectedTimeframe}_${Date.now()}.csv`, rows, headers);
    onShowToast('Downloaded Executive Financial Overview CSV', { type: 'success' });
  };

  const exportSalesOrdersCsv = () => {
    const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Date', 'Items Count', 'Total ($)', 'Payment Status', 'Fulfillment Status', 'Items Summary'];
    const rows = orders.map((o) => [
      o.orderNumber,
      o.customerName,
      o.customerEmail,
      o.createdAt,
      o.itemCount,
      o.total.toFixed(2),
      o.paymentStatus,
      o.status,
      o.itemsSummary || '',
    ]);
    downloadCsv(`ILS_Sales_Orders_Report_${Date.now()}.csv`, rows, headers);
    onShowToast(`Downloaded Sales & Orders Report CSV (${orders.length} records)`, { type: 'success' });
  };

  const exportCustomersCsv = () => {
    const headers = ['Customer Name', 'Email', 'Phone', 'Orders Count', 'Total Spent ($)', 'Referred By', 'Last Order Date', 'Status'];
    const rows = customers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.ordersCount,
      c.totalSpent.toFixed(2),
      c.repReferredBy || 'Organic / Direct',
      c.lastOrderDate,
      c.status,
    ]);
    downloadCsv(`ILS_Customer_Acquisition_Report_${Date.now()}.csv`, rows, headers);
    onShowToast(`Downloaded Customers Report CSV (${customers.length} records)`, { type: 'success' });
  };

  const exportCommissionsCsv = () => {
    const headers = ['Ledger ID', 'Representative', 'Username', 'Order ID', 'Order Total ($)', 'Level', 'Rate (%)', 'Commission ($)', 'Status', 'Date'];
    const rows = commissions.map((c) => [
      c.id,
      c.repName,
      `@${c.repUsername}`,
      c.orderId,
      c.orderAmount.toFixed(2),
      c.tierLabel,
      `${c.ratePercent}%`,
      c.commissionAmount.toFixed(2),
      c.status,
      c.date,
    ]);
    downloadCsv(`ILS_Commission_Ledger_Report_${Date.now()}.csv`, rows, headers);
    onShowToast(`Downloaded Commission Ledger Report CSV (${commissions.length} records)`, { type: 'success' });
  };

  const exportTopAffiliatesCsv = () => {
    const headers = ['Rank', 'Representative Name', 'Username', 'Current Rank', 'Lifetime Sales ($)', 'Monthly Personal Sales ($)', 'Monthly Team Sales ($)', 'Team Size', 'Total Commissions Earned ($)', 'Status'];
    const sortedReps = [...representatives].sort((a, b) => b.lifetimeSales - a.lifetimeSales);
    const rows = sortedReps.map((r, i) => [
      i + 1,
      r.name,
      `@${r.repUsername}`,
      r.currentRank,
      r.lifetimeSales.toFixed(2),
      r.personalSalesMonth.toFixed(2),
      r.teamSalesMonth.toFixed(2),
      r.teamSize,
      r.totalCommissionsEarned.toFixed(2),
      r.status,
    ]);
    downloadCsv(`ILS_Top_Affiliates_Report_${Date.now()}.csv`, rows, headers);
    onShowToast(`Downloaded Top Affiliates Report CSV (${sortedReps.length} records)`, { type: 'success' });
  };

  // Top Affiliates Sorted List
  const topAffiliatesList = useMemo(() => {
    return [...representatives].sort((a, b) => b.lifetimeSales - a.lifetimeSales);
  }, [representatives]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers;
    const q = searchQuery.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.repReferredBy && c.repReferredBy.toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  // Filtered Commissions
  const filteredCommissions = useMemo(() => {
    if (!searchQuery.trim()) return commissions;
    const q = searchQuery.toLowerCase();
    return commissions.filter(
      (c) =>
        c.repName.toLowerCase().includes(q) ||
        c.repUsername.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q) ||
        c.tierLabel.toLowerCase().includes(q)
    );
  }, [commissions, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Analytics, Financials & Reports
              </h2>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Omnichannel sales revenue, shopper conversion funnels, customer retention, affiliate performance, and commission liabilities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Timeframe Selector */}
            <div className="flex items-center bg-[#faf7f9] border border-[#eedbe6] p-1 rounded-xl">
              {(['7d', '30d', '90d', 'ytd'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleTimeframeClick(tf)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    selectedTimeframe === tf
                      ? 'bg-[#D30915] text-white shadow-2xs'
                      : 'text-[#716d77] hover:text-[#141219]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>

            {/* Quick Master Export */}
            <button
              type="button"
              onClick={() => {
                if (activeReportTab === 'overview') exportOverviewCsv();
                else if (activeReportTab === 'sales_orders') exportSalesOrdersCsv();
                else if (activeReportTab === 'customers') exportCustomersCsv();
                else if (activeReportTab === 'commissions') exportCommissionsCsv();
                else if (activeReportTab === 'top_affiliates') exportTopAffiliatesCsv();
              }}
              className="px-3.5 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Report Sub-Tabs Navigation */}
        <div className="flex items-center gap-1.5 border-b border-[#f0e2ec] pb-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Executive Overview', icon: TrendingUp },
            { id: 'sales_orders', label: 'Sales & Orders', count: orders.length, icon: ShoppingCart },
            { id: 'customers', label: 'Customer Cohorts', count: customers.length, icon: Users },
            { id: 'commissions', label: 'Commission Ledger', count: commissions.length, icon: DollarSign },
            { id: 'top_affiliates', label: 'Top Affiliates', count: representatives.length, icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveReportTab(tab.id as ReportTab);
                  setSearchQuery('');
                }}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  activeReportTab === tab.id
                    ? 'bg-[#D30915] text-white shadow-xs'
                    : 'text-[#55505a] hover:bg-[#fff1f2] hover:text-[#D30915]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                      activeReportTab === tab.id ? 'bg-white text-[#D30915]' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: EXECUTIVE OVERVIEW */}
      {activeReportTab === 'overview' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top Highlights 4-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#716d77]">Gross Sales ({selectedTimeframe.toUpperCase()})</span>
              <div className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
                ${reportData.grossSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Net Sales: ${reportData.netSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#716d77]">Traffic & Conversion</span>
              <div className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font">
                {reportData.conversionRate}%
              </div>
              <div className="text-[11px] text-[#716d77] font-medium">
                From {reportData.visitors.toLocaleString()} unique web sessions
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#716d77]">Membership MRR</span>
              <div className="text-2xl sm:text-3xl font-black text-[#54217f] hero-title-font">
                ${reportData.membershipMRR.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#716d77] font-medium">
                Across {reportData.activeRepresentatives} active subscribers
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-5 shadow-xs space-y-1">
              <span className="text-xs font-bold text-[#716d77]">Commission Liability</span>
              <div className="text-2xl sm:text-3xl font-black text-[#D30915] hero-title-font">
                ${reportData.commissionLiability.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-emerald-600 font-bold">
                ${reportData.totalPayoutsDisbursed.toLocaleString('en-US')} already disbursed
              </div>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Sales by Day Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                    Revenue Trajectory
                  </h3>
                  <p className="text-xs text-[#716d77] m-0">Day-by-day gross merchandise volume</p>
                </div>
                <span className="text-xs font-bold text-[#D30915]">AOV: ${reportData.averageOrderValue}</span>
              </div>

              <div className="pt-4 h-52 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100">
                {reportData.salesByDay.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#8a858f]">
                    <span>No sales recorded yet.</span>
                  </div>
                ) : (
                  reportData.salesByDay.map((pt) => (
                    <div key={pt.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#716d77] opacity-0 group-hover:opacity-100 transition-opacity">
                        ${(pt.sales / 1000).toFixed(1)}k
                      </span>
                      <div
                        style={{ height: `${(pt.sales / 10000) * 100}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-[#D30915] to-[#ff7fa9] rounded-t-lg group-hover:brightness-110 transition-all"
                      />
                      <span className="text-xs font-bold text-[#55505a]">{pt.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Traffic by Day Chart */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                    Shopper Sessions vs Checkouts
                  </h3>
                  <p className="text-xs text-[#716d77] m-0">Traffic volume driving catalog reveals</p>
                </div>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  {reportData.conversionRate}% Avg Conversion
                </span>
              </div>

              <div className="pt-4 h-52 flex items-end justify-between gap-2 px-2 pb-2 border-b border-gray-100">
                {reportData.trafficByDay.length === 0 ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#8a858f]">
                    <span>No traffic recorded yet.</span>
                  </div>
                ) : (
                  reportData.trafficByDay.map((pt) => (
                    <div key={pt.date} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <span className="text-[10px] font-bold text-[#716d77] opacity-0 group-hover:opacity-100 transition-opacity">
                        {pt.visitors}
                      </span>
                      <div
                        style={{ height: `${(pt.visitors / 12000) * 100}%` }}
                        className="w-full max-w-[36px] bg-gradient-to-t from-[#54217f] to-[#8d42d3] rounded-t-lg group-hover:brightness-110 transition-all"
                      />
                      <span className="text-xs font-bold text-[#55505a]">{pt.date}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Tier Distribution & Membership Plan Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                  Commission Distribution by Tier
                </h3>
                <span className="text-xs font-bold text-emerald-700">35% Program Total</span>
              </div>
              <div className="space-y-2 text-xs">
                {reportData.tierDistribution.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a858f]">
                    No commission tiers recorded yet.
                  </div>
                ) : (
                  reportData.tierDistribution.map((td) => (
                    <div
                      key={td.tier}
                      className="p-2.5 rounded-xl bg-[#faf7f9] border border-[#f0e2ec] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#141219]">{td.tier} ({td.rate})</div>
                        <div className="text-[11px] text-[#716d77]">{td.percentage}% of all commissions paid</div>
                      </div>
                      <div className="font-black text-sm text-[#141219]">
                        ${td.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                  Subscription Plan Breakdown
                </h3>
                <span className="text-xs font-bold text-[#D30915]">Recurring Revenue</span>
              </div>
              <div className="space-y-2 text-xs">
                {reportData.membershipBreakdown.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8a858f]">
                    No active membership subscriptions yet.
                  </div>
                ) : (
                  reportData.membershipBreakdown.map((mb) => (
                    <div
                      key={mb.plan}
                      className="p-3 rounded-xl bg-[#faf7f9] border border-[#f0e2ec] flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-[#141219]">{mb.plan}</div>
                        <div className="text-[11px] text-[#716d77]">{mb.count} active subscribers enrolled</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-sm text-[#D30915]">
                          ${mb.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-[#716d77]">Plan volume</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SALES & ORDERS REPORT */}
      {activeReportTab === 'sales_orders' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0">Sales & Order Fulfillment Ledger</h3>
              <p className="text-xs text-[#716d77] m-0 mt-0.5">
                Total Orders: {orders.length} | Gross Revenue: ${orders.reduce((acc, o) => acc + o.total, 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter order ID, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-[#eedbe6] text-xs outline-none focus:border-[#D30915]"
                />
              </div>
              <button
                type="button"
                onClick={exportSalesOrdersCsv}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#141219] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#D30915]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-3">Customer</th>
                    <th className="py-3.5 px-3">Date</th>
                    <th className="py-3.5 px-3">Items</th>
                    <th className="py-3.5 px-3">Total ($)</th>
                    <th className="py-3.5 px-3">Payment</th>
                    <th className="py-3.5 px-3">Fulfillment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-400">
                        {orders.length === 0 ? 'No orders yet' : 'No orders match your search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-[#fffbfd] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#D30915]">{ord.orderNumber}</td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-[#141219]">{ord.customerName}</div>
                          <div className="text-[11px] text-[#716d77]">{ord.customerEmail}</div>
                        </td>
                        <td className="py-3 px-3 text-stone-600 font-mono text-[11px]">{ord.createdAt.slice(0, 10)}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-[#141219]">{ord.itemCount} items</span>
                          {ord.itemsSummary && (
                            <div className="text-[11px] text-stone-500 truncate max-w-xs">{ord.itemsSummary}</div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-black text-[#141219]">${ord.total.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              ord.paymentStatus === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              ord.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : ord.status === 'shipped'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CUSTOMER COHORTS REPORT */}
      {activeReportTab === 'customers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0">Customer Registry & Lifetime Value</h3>
              <p className="text-xs text-[#716d77] m-0 mt-0.5">
                Total Customers: {customers.length} | Total Cumulative Spend: ${customers.reduce((acc, c) => acc + c.totalSpent, 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search customer, email, sponsor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-[#eedbe6] text-xs outline-none focus:border-[#D30915]"
                />
              </div>
              <button
                type="button"
                onClick={exportCustomersCsv}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#141219] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#D30915]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-3">Contact</th>
                    <th className="py-3.5 px-3">Referred By</th>
                    <th className="py-3.5 px-3">Orders</th>
                    <th className="py-3.5 px-3">Lifetime Value</th>
                    <th className="py-3.5 px-3">Last Order</th>
                    <th className="py-3.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-400">
                        {customers.length === 0 ? 'No customers found' : 'No customers match your query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-[#fffbfd] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#141219]">{c.name}</td>
                        <td className="py-3 px-3">
                          <div className="text-stone-700">{c.email}</div>
                          <div className="text-[11px] text-stone-400">{c.phone}</div>
                        </td>
                        <td className="py-3 px-3">
                          {c.repReferredBy ? (
                            <span className="font-bold text-[#D30915]">@{c.repReferredBy}</span>
                          ) : (
                            <span className="text-stone-400">Direct / Organic</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-800">{c.ordersCount} orders</td>
                        <td className="py-3 px-3 font-black text-[#141219]">${c.totalSpent.toFixed(2)}</td>
                        <td className="py-3 px-3 text-stone-600 font-mono text-[11px]">{c.lastOrderDate}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              c.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: COMMISSION LEDGER REPORT */}
      {activeReportTab === 'commissions' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0">Multi-Tier Commission Ledger (35% Pool)</h3>
              <p className="text-xs text-[#716d77] m-0 mt-0.5">
                Direct (20%) + Tier 1-5 (3% / 4% / 4% / 2% / 2%) | Total Earned: ${commissions.reduce((acc, c) => acc + c.commissionAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter rep, order, level..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-50 border border-[#eedbe6] text-xs outline-none focus:border-[#D30915]"
                />
              </div>
              <button
                type="button"
                onClick={exportCommissionsCsv}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-[#141219] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-[#D30915]" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Representative</th>
                    <th className="py-3.5 px-3">Order ID</th>
                    <th className="py-3.5 px-3">Order Amount</th>
                    <th className="py-3.5 px-3">Level / Tier</th>
                    <th className="py-3.5 px-3">Rate</th>
                    <th className="py-3.5 px-3">Commission ($)</th>
                    <th className="py-3.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredCommissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-stone-400">
                        {commissions.length === 0 ? 'No commissions yet' : 'No commissions match your filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCommissions.map((comm) => (
                      <tr key={comm.id} className="hover:bg-[#fffbfd] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#141219]">{comm.repName}</div>
                          <div className="text-[11px] text-[#D30915]">@{comm.repUsername}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-stone-700">{comm.orderId}</td>
                        <td className="py-3 px-3 font-bold text-stone-900">${comm.orderAmount.toFixed(2)}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold text-[11px] border border-purple-200">
                            {comm.tierLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-stone-600">{comm.ratePercent}%</td>
                        <td className="py-3 px-3 font-black text-emerald-700 text-sm">
                          +${comm.commissionAmount.toFixed(2)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              comm.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : comm.status === 'paid'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {comm.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: TOP AFFILIATES REPORT */}
      {activeReportTab === 'top_affiliates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0">Top Performing Affiliates & Conversion</h3>
              <p className="text-xs text-[#716d77] m-0 mt-0.5">
                Ranked by cumulative retail volume and downline network production.
              </p>
            </div>
            <button
              type="button"
              onClick={exportTopAffiliatesCsv}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-[#141219] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Export Leaderboard CSV</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#eedbe6] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#141219]">
                <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 text-center">Rank</th>
                    <th className="py-3.5 px-3">Representative</th>
                    <th className="py-3.5 px-3">Title / Tier</th>
                    <th className="py-3.5 px-3">Personal Month</th>
                    <th className="py-3.5 px-3">Team Month</th>
                    <th className="py-3.5 px-3">Downline Size</th>
                    <th className="py-3.5 px-3">Lifetime Sales</th>
                    <th className="py-3.5 px-3">Total Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {topAffiliatesList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-stone-400">
                        {representatives.length === 0 ? 'No representatives found' : 'No affiliates match your query.'}
                      </td>
                    </tr>
                  ) : (
                    topAffiliatesList.map((rep, idx) => (
                    <tr key={rep.id} className="hover:bg-[#fffbfd] transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-black text-xs ${
                            idx === 0
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : idx === 1
                              ? 'bg-stone-200 text-stone-700'
                              : idx === 2
                              ? 'bg-amber-50 text-amber-700'
                              : 'text-stone-500'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rep.avatar}
                            alt={rep.name}
                            className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[#141219] truncate">{rep.name}</div>
                            <div className="text-[11px] text-[#D30915]">@{rep.repUsername}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {rep.currentRank}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-stone-700">${rep.personalSalesMonth.toFixed(2)}</td>
                      <td className="py-3 px-3 font-bold text-purple-700">${rep.teamSalesMonth.toFixed(2)}</td>
                      <td className="py-3 px-3 font-bold text-stone-800">{rep.teamSize} reps</td>
                      <td className="py-3 px-3 font-black text-[#141219]">${rep.lifetimeSales.toFixed(2)}</td>
                      <td className="py-3 px-3 font-black text-emerald-700 text-sm">
                        ${rep.totalCommissionsEarned.toFixed(2)}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
