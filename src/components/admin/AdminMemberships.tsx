import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Search,
  AlertTriangle,
  XCircle,
  X,
  Check,
  Sliders,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import type { MembershipAdminRecord, MembershipPlanType } from '../../types/admin';

interface AdminMembershipsProps {
  memberships: MembershipAdminRecord[];
  onUpdateStatus: (id: string, status: 'active' | 'past_due' | 'suspended' | 'cancelled') => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export interface MembershipPricingConfig {
  monthlyPrice: number;
  sixMonthDiscount: number;
  twelveMonthDiscount: number;
}

const DEFAULT_MEMBERSHIP_PRICING: MembershipPricingConfig = {
  monthlyPrice: 19.99,
  sixMonthDiscount: 10,
  twelveMonthDiscount: 15,
};

const MEMBERSHIP_PRICING_KEY = 'ils_admin_membership_pricing_v1';

export const AdminMemberships: React.FC<AdminMembershipsProps> = ({
  memberships,
  onUpdateStatus,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | MembershipPlanType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past_due' | 'suspended' | 'cancelled'>('all');
  const [selectedMembership, setSelectedMembership] = useState<MembershipAdminRecord | null>(null);

  // Membership Pricing Configuration
  const [pricing, setPricing] = useState<MembershipPricingConfig>(() => {
    try {
      const saved = localStorage.getItem(MEMBERSHIP_PRICING_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_MEMBERSHIP_PRICING;
  });

  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [tempPricing, setTempPricing] = useState<MembershipPricingConfig>(pricing);
  const [pricingError, setPricingError] = useState<string | null>(null);

  // Dynamic calculated prices
  const calculatedSixMonthPrice = Number((pricing.monthlyPrice * 6 * (1 - pricing.sixMonthDiscount / 100)).toFixed(2));
  const calculatedTwelveMonthPrice = Number((pricing.monthlyPrice * 12 * (1 - pricing.twelveMonthDiscount / 100)).toFixed(2));
  const sixMonthSavings = Number((pricing.monthlyPrice * 6 - calculatedSixMonthPrice).toFixed(2));
  const twelveMonthSavings = Number((pricing.monthlyPrice * 12 - calculatedTwelveMonthPrice).toFixed(2));

  // Temp previews in modal
  const tempSixMonthPrice = Number(((Number(tempPricing.monthlyPrice) || 0) * 6 * (1 - (Number(tempPricing.sixMonthDiscount) || 0) / 100)).toFixed(2));
  const tempTwelveMonthPrice = Number(((Number(tempPricing.monthlyPrice) || 0) * 12 * (1 - (Number(tempPricing.twelveMonthDiscount) || 0) / 100)).toFixed(2));

  const handleOpenEditPricing = () => {
    setTempPricing(pricing);
    setPricingError(null);
    setIsEditingPricing(true);
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempPricing.monthlyPrice <= 0) {
      setPricingError('Monthly base price must be greater than $0.00.');
      return;
    }
    if (tempPricing.sixMonthDiscount < 0 || tempPricing.sixMonthDiscount > 80) {
      setPricingError('6-Month discount must be between 0% and 80%.');
      return;
    }
    if (tempPricing.twelveMonthDiscount < 0 || tempPricing.twelveMonthDiscount > 80) {
      setPricingError('12-Month discount must be between 0% and 80%.');
      return;
    }

    const updated: MembershipPricingConfig = {
      monthlyPrice: Number(tempPricing.monthlyPrice),
      sixMonthDiscount: Number(tempPricing.sixMonthDiscount),
      twelveMonthDiscount: Number(tempPricing.twelveMonthDiscount),
    };

    setPricing(updated);
    localStorage.setItem(MEMBERSHIP_PRICING_KEY, JSON.stringify(updated));
    setIsEditingPricing(false);
    onShowToast(`Membership pricing updated: $${updated.monthlyPrice.toFixed(2)}/mo (${updated.sixMonthDiscount}% & ${updated.twelveMonthDiscount}% prepaid discounts).`, {
      title: 'Pricing Updated',
      type: 'success',
    });
  };

  // Filter list
  const filtered = useMemo(() => {
    return memberships.filter((m) => {
      const matchSearch =
        m.repName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.repUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.planName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPlan = planFilter === 'all' || m.plan === planFilter;
      const matchStatus = statusFilter === 'all' || m.status === statusFilter;

      return matchSearch && matchPlan && matchStatus;
    });
  }, [memberships, searchQuery, planFilter, statusFilter]);

  const handleSendReminder = (username: string) => {
    onShowToast(`Billing renewal notification sent to @${username}`, {
      title: 'Reminder Dispatched',
      type: 'success',
    });
  };

  const getStatusBadge = (status: 'active' | 'past_due' | 'suspended' | 'cancelled') => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Active</span>
          </span>
        );
      case 'past_due':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
            <AlertTriangle className="w-3 h-3" />
            <span>Past Due</span>
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-bold">
            <XCircle className="w-3 h-3" />
            <span>Suspended</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200 text-[11px] font-bold">
            <span>Cancelled</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Approved Plan Reference Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Representative Memberships
              </h2>
              <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
                {memberships.length} Subscriptions
              </span>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Approved subscription billing tiers, renewal cycles, payment health, and grace period controls.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleOpenEditPricing}
              className="px-3.5 py-2 rounded-xl bg-[#D30915] hover:bg-[#b00711] text-white text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Configure Pricing</span>
            </button>
          </div>
        </div>

        {/* Approved Business Pricing Callout Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#fff8fb] to-white border border-[#eedbe6] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#141219]">Monthly Active Plan</span>
              <span className="text-[10px] font-bold text-gray-500 uppercase">Standard</span>
            </div>
            <div className="text-xl font-black text-[#D30915] hero-title-font">
              ${pricing.monthlyPrice.toFixed(2)} <span className="text-xs font-medium text-[#716d77]">/month</span>
            </div>
            <p className="text-[11px] text-[#716d77] m-0">Standard monthly rep access & back-office privileges.</p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-[#fff4f8] to-white border border-[#f0d0e2] space-y-1 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#141219]">6-Month Prepaid</span>
              <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded">
                {pricing.sixMonthDiscount}% OFF
              </span>
            </div>
            <div className="text-xl font-black text-[#54217f] hero-title-font">
              ${calculatedSixMonthPrice.toFixed(2)} <span className="text-xs font-medium text-[#716d77]">/6 mos</span>
            </div>
            <p className="text-[11px] text-[#716d77] m-0">Save ${sixMonthSavings.toFixed(2)} upfront compared to monthly billing.</p>
          </div>

          <div className="p-3 rounded-xl bg-gradient-to-br from-[#fff1f2] to-white border border-[#D30915]/30 space-y-1 relative overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#141219]">12-Month Annual VIP</span>
              <span className="text-[10px] font-black text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded border border-[#D30915]/20">
                {pricing.twelveMonthDiscount}% OFF
              </span>
            </div>
            <div className="text-xl font-black text-[#D30915] hero-title-font">
              ${calculatedTwelveMonthPrice.toFixed(2)} <span className="text-xs font-medium text-[#716d77]">/year</span>
            </div>
            <p className="text-[11px] text-[#716d77] m-0">Best value. Save ${twelveMonthSavings.toFixed(2)} upfront with year-round perks.</p>
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search representative name or @username..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value as 'all' | MembershipPlanType)}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Plans (Monthly / 6-Mo / 12-Mo)</option>
            <option value="monthly">Monthly Active (${pricing.monthlyPrice.toFixed(2)}/mo)</option>
            <option value="six_month">6-Month Prepaid (${calculatedSixMonthPrice.toFixed(2)})</option>
            <option value="twelve_month">12-Month Prepaid (${calculatedTwelveMonthPrice.toFixed(2)})</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'past_due' | 'suspended' | 'cancelled')}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Billing Statuses</option>
            <option value="active">Active Only</option>
            <option value="past_due">Past Due (Payment Failed)</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* 3. Memberships Desktop Table */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Representative</th>
                <th className="py-3.5 px-3">Plan & Price</th>
                <th className="py-3.5 px-3">Payment Method</th>
                <th className="py-3.5 px-3">Next Billing Date</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#716d77]">
                    <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#141219] m-0">No memberships found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((mem) => (
                  <tr key={mem.id} className="hover:bg-[#fffbfd] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={mem.repAvatar}
                          alt={mem.repName}
                          className="w-9 h-9 rounded-full object-cover border border-[#eedbe6] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#141219] truncate">{mem.repName}</div>
                          <div className="text-[11px] text-[#D30915] font-bold">@{mem.repUsername}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#141219]">{mem.planName}</div>
                      <div className="text-xs font-black text-[#D30915]">
                        ${mem.price.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#716d77]">
                          ({mem.billingFrequency.replace('_', ' ')})
                        </span>
                      </div>
                      {mem.discountNotice && (
                        <div className="text-[10px] text-emerald-600 font-bold">{mem.discountNotice}</div>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#141219]">{mem.paymentMethodSnippet}</div>
                      <div className={`text-[10px] font-bold ${
                        mem.paymentStatus === 'paid'
                          ? 'text-emerald-600'
                          : mem.paymentStatus === 'failed'
                          ? 'text-rose-600'
                          : 'text-amber-600'
                      }`}>
                        {mem.paymentStatus === 'paid' ? 'Paid ✓' : 'Payment Failed ✗'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#141219]">{mem.nextBillingDate}</div>
                      <div className="text-[10px] text-[#716d77] capitalize">
                        Renewal: {mem.renewalStatus.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3 px-3">{getStatusBadge(mem.status)}</td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSendReminder(mem.repUsername)}
                          className="px-2 py-1 rounded-lg border border-[#eedbe6] hover:bg-[#fff1f2] text-[#141219] hover:text-[#D30915] text-[11px] font-bold transition-all cursor-pointer"
                          title="Send Billing Reminder"
                        >
                          Remind
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMembership(mem)}
                          className="px-2 py-1 rounded-lg bg-[#D30915] hover:bg-[#B60711] text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Mobile Responsive Cards View (< 768px) */}
      <div className="md:hidden space-y-3">
        {filtered.map((mem) => (
          <div key={mem.id} className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <img
                  src={mem.repAvatar}
                  alt={mem.repName}
                  className="w-10 h-10 rounded-full object-cover border border-[#eedbe6]"
                />
                <div>
                  <h4 className="font-black text-sm text-[#141219] m-0">{mem.repName}</h4>
                  <span className="text-xs font-bold text-[#D30915]">@{mem.repUsername}</span>
                </div>
              </div>
              <div>{getStatusBadge(mem.status)}</div>
            </div>

            <div className="bg-[#fdf8fa] rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[#716d77]">Plan:</span>
                <span className="font-bold text-[#141219]">{mem.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Price:</span>
                <span className="font-black text-[#D30915]">${mem.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Payment Status:</span>
                <span className={`font-bold capitalize ${
                  mem.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {mem.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Next Billing:</span>
                <span className="font-bold text-[#141219]">{mem.nextBillingDate}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleSendReminder(mem.repUsername)}
                className="flex-1 py-2 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#141219] hover:bg-gray-50 transition-all cursor-pointer"
              >
                Send Reminder
              </button>
              <button
                type="button"
                onClick={() => setSelectedMembership(mem)}
                className="flex-1 py-2 rounded-xl bg-[#D30915] text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Manage Status
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Membership Management Modal */}
      {selectedMembership && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#eedbe6] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#D30915]" />
                <h3 className="font-black text-base text-[#141219] hero-title-font m-0">
                  Update Subscription Status
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMembership(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#716d77] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-[#fdf9fb] rounded-xl border border-[#eedbe6] text-xs space-y-1">
              <div className="font-bold text-[#141219]">Representative: {selectedMembership.repName} (@{selectedMembership.repUsername})</div>
              <div className="text-[#716d77]">Current Plan: {selectedMembership.planName} (${selectedMembership.price.toFixed(2)})</div>
              <div className="text-[#716d77]">Payment Method: {selectedMembership.paymentMethodSnippet}</div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-bold text-[#141219]">Change Subscription Status:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(selectedMembership.id, 'active');
                    onShowToast(`Membership marked as Active.`, { type: 'success' });
                    setSelectedMembership(null);
                  }}
                  className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Set Active</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(selectedMembership.id, 'past_due');
                    onShowToast(`Membership marked as Past Due.`, { type: 'info' });
                    setSelectedMembership(null);
                  }}
                  className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Set Past Due</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(selectedMembership.id, 'suspended');
                    onShowToast(`Membership suspended.`, { type: 'info' });
                    setSelectedMembership(null);
                  }}
                  className="p-2.5 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(selectedMembership.id, 'cancelled');
                    onShowToast(`Membership cancelled.`, { type: 'info' });
                    setSelectedMembership(null);
                  }}
                  className="p-2.5 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-800 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <span>Cancel</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMembership(null)}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#716d77] hover:bg-gray-50 transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. Edit Membership Pricing Configuration Modal */}
      {isEditingPricing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#eedbe6] shadow-2xl max-w-md w-full p-5 sm:p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#f5eaf1]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#D30915]" />
                <h3 className="text-lg font-black text-[#141219] m-0">
                  Configure Membership Pricing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingPricing(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4">
              <p className="text-xs text-[#716d77] m-0">
                Update representative recurring membership fees and prepaid volume discount percentages.
              </p>

              {/* Monthly Base Price */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#141219]">
                  Base Monthly Subscription ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="999"
                    value={tempPricing.monthlyPrice}
                    onChange={(e) => setTempPricing({ ...tempPricing, monthlyPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-7 pr-3 py-2 rounded-xl border border-[#eedbe6] text-sm font-bold text-[#141219] focus:outline-hidden focus:border-[#D30915]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">/mo</span>
                </div>
                <span className="text-[10px] text-gray-500">Default: $19.99 / month</span>
              </div>

              {/* 6-Month Prepaid Discount */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#141219]">
                  6-Month Prepaid Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="80"
                    value={tempPricing.sixMonthDiscount}
                    onChange={(e) => setTempPricing({ ...tempPricing, sixMonthDiscount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#eedbe6] text-sm font-bold text-[#141219] focus:outline-hidden focus:border-[#D30915]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">%</span>
                </div>
                <span className="text-[10px] text-gray-500">Default: 10% discount</span>
              </div>

              {/* 12-Month Annual Discount */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#141219]">
                  12-Month Annual Prepaid Discount (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="80"
                    value={tempPricing.twelveMonthDiscount}
                    onChange={(e) => setTempPricing({ ...tempPricing, twelveMonthDiscount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-[#eedbe6] text-sm font-bold text-[#141219] focus:outline-hidden focus:border-[#D30915]"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-gray-400">%</span>
                </div>
                <span className="text-[10px] text-gray-500">Default: 15% discount</span>
              </div>

              {/* Live Preview Card */}
              <div className="p-3.5 rounded-2xl bg-[#faf7f9] border border-[#eedbe6] space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Calculated Billing Previews</span>
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-white border border-[#f0d0e2]">
                    <span className="block text-[10px] font-extrabold text-[#716d77] uppercase">6-Month Price</span>
                    <span className="font-black text-sm text-[#54217f]">${tempSixMonthPrice.toFixed(2)}</span>
                    <span className="block text-[10px] text-emerald-700 font-bold">
                      Save ${((Number(tempPricing.monthlyPrice) || 0) * 6 - tempSixMonthPrice).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-[#D30915]/30">
                    <span className="block text-[10px] font-extrabold text-[#716d77] uppercase">12-Month Annual</span>
                    <span className="font-black text-sm text-[#D30915]">${tempTwelveMonthPrice.toFixed(2)}</span>
                    <span className="block text-[10px] text-emerald-700 font-bold">
                      Save ${((Number(tempPricing.monthlyPrice) || 0) * 12 - tempTwelveMonthPrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {pricingError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{pricingError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f5eaf1]">
                <button
                  type="button"
                  onClick={() => setIsEditingPricing(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 text-[#716d77] hover:text-[#141219] hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D30915] hover:bg-[#b00711] text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                >
                  Save Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
