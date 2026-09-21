import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Ban,
  Package,
  Mail,
  CreditCard,
  Globe,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import type { AdminSettingsData } from '../../types/admin';

interface AdminSettingsProps {
  settings: AdminSettingsData;
  onSaveSettings: (settings: AdminSettingsData) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onSaveSettings,
  onShowToast,
}) => {
  const [formData, setFormData] = useState<AdminSettingsData>(settings);
  const [newRestrictedName, setNewRestrictedName] = useState('');

  const handleAttributionChange = (days: 30 | 60 | 90 | 180) => {
    setFormData((prev) => ({ ...prev, referralAttributionDays: days }));
  };

  const handleAddRestricted = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRestrictedName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!clean) return;
    if (formData.restrictedUsernames.includes(clean)) {
      onShowToast(`"${clean}" is already in restricted list`, { type: 'info' });
      return;
    }
    setFormData((prev) => ({
      ...prev,
      restrictedUsernames: [...prev.restrictedUsernames, clean],
    }));
    setNewRestrictedName('');
  };

  const handleRemoveRestricted = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      restrictedUsernames: prev.restrictedUsernames.filter((n) => n !== name),
    }));
  };

  const handleToggleGateway = (gw: 'stripe' | 'paypal' | 'applePay') => {
    setFormData((prev) => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [gw]: {
          ...prev.gateways[gw],
          enabled: !prev.gateways[gw].enabled,
        },
      },
    }));
  };

  const handleSaveAll = () => {
    onSaveSettings(formData);
    onShowToast('Admin platform settings updated successfully!', {
      title: 'Settings Saved',
      type: 'success',
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Save Button */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              System Configuration & Rules
            </h2>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Attribution cookie windows, reserved handles, starter bundles, email providers, and gateway configurations.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* 2. Referral Attribution Window & Restricted Usernames (2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Attribution Window */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#D30915]" />
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Referral Attribution Window
            </h3>
          </div>
          <p className="text-xs text-[#716d77] m-0">
            Select the cookie attribution duration for representative store links. If a shopper clicks a rep link, purchases within this timeframe credit the representative.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {([30, 60, 90, 180] as const).map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => handleAttributionChange(days)}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  formData.referralAttributionDays === days
                    ? 'border-[#D30915] bg-[#fff1f2] text-[#D30915] font-black shadow-xs'
                    : 'border-[#eedbe6] bg-gray-50 text-[#55505a] hover:bg-gray-100 font-bold'
                }`}
              >
                <div className="text-lg">{days} Days</div>
                <div className="text-[10px] text-[#716d77]">
                  {days === 60 ? 'Recommended' : 'Cookie Period'}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Restricted Usernames */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-600" />
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Restricted Rep Usernames
              </h3>
            </div>
            <span className="text-xs text-[#716d77]">{formData.restrictedUsernames.length} Reserved</span>
          </div>

          <form onSubmit={handleAddRestricted} className="flex gap-2">
            <input
              type="text"
              value={newRestrictedName}
              onChange={(e) => setNewRestrictedName(e.target.value)}
              placeholder="e.g. VIP, Official, Billing..."
              className="flex-1 h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
            />
            <button
              type="submit"
              className="px-3 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>

          {/* Chips */}
          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {formData.restrictedUsernames.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-[#141219] text-xs font-bold"
              >
                <span>@{name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveRestricted(name)}
                  className="hover:text-rose-600 cursor-pointer p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Starter Kits Configuration */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#D30915]" />
          <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
            Onboarding Starter Kits
          </h3>
        </div>
        <p className="text-xs text-[#716d77] m-0">
          Configure hardware and inventory bundles made available during representative signup.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {formData.starterKits.map((kit) => (
            <div
              key={kit.id}
              className="p-4 rounded-2xl bg-[#faf7f9] border border-[#eedbe6] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-black text-sm text-[#141219] m-0">{kit.name}</h4>
                <span className="font-black text-sm text-[#D30915]">${kit.price.toFixed(2)}</span>
              </div>
              <p className="text-xs text-[#716d77] m-0 leading-relaxed">{kit.description}</p>
              <div className="bg-white p-2.5 rounded-xl border border-gray-100 text-xs space-y-1">
                <span className="text-[10px] font-bold text-[#716d77] uppercase block">Includes:</span>
                <div className="flex flex-wrap gap-1">
                  {kit.sampleItems.map((item, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-[11px] text-[#141219]">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Payment Gateways & Email Integration (2-Col Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Payment Gateways */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#D30915]" />
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Payment Gateways & Webhooks
            </h3>
          </div>

          <div className="space-y-3">
            {/* Stripe */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#141219]">Stripe Credit / Debit Engine</div>
                <div className="text-[11px] text-emerald-600 font-medium">Webhook Status: Healthy (200 OK)</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleGateway('stripe')}
                className="cursor-pointer"
              >
                {formData.gateways.stripe.enabled ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">Enabled</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">Disabled</span>
                )}
              </button>
            </div>

            {/* PayPal */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#141219]">PayPal Express & Rep Payouts</div>
                <div className="text-[11px] text-emerald-600 font-medium">Monthly Disbursement Active (15th)</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleGateway('paypal')}
                className="cursor-pointer"
              >
                {formData.gateways.paypal.enabled ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">Enabled</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">Disabled</span>
                )}
              </button>
            </div>

            {/* Apple Pay */}
            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-xs text-[#141219]">Apple Pay & Google Pay Mobile Wallets</div>
                <div className="text-[11px] text-[#716d77] font-medium">1-Click biometric checkout</div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleGateway('applePay')}
                className="cursor-pointer"
              >
                {formData.gateways.applePay.enabled ? (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">Enabled</span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold">Disabled</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Email Integration */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#D30915]" />
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Transactional Email Relay
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-[#141219] mb-1">Active Provider</label>
              <select
                value={formData.emailProvider}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    emailProvider: e.target.value as 'sendgrid' | 'ses' | 'postmark',
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] font-medium cursor-pointer"
              >
                <option value="sendgrid">Twilio SendGrid (Standard)</option>
                <option value="ses">Amazon Simple Email Service (SES)</option>
                <option value="postmark">Postmark Transactional</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-[#141219] mb-1">Sender Name</label>
                <input
                  type="text"
                  value={formData.emailSenderName}
                  onChange={(e) => setFormData((p) => ({ ...p, emailSenderName: e.target.value }))}
                  placeholder="Your name"
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#141219] mb-1">Sender Email</label>
                <input
                  type="email"
                  value={formData.emailSenderAddress}
                  onChange={(e) => setFormData((p) => ({ ...p, emailSenderAddress: e.target.value }))}
                  placeholder="example@gmail.com"
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6]"
                />
              </div>
            </div>

            <div>
              <span className="block font-bold text-[#141219] mb-1.5">Registered Email Templates:</span>
              <div className="space-y-1">
                {formData.emailTemplates.map((tpl) => (
                  <div key={tpl.id} className="p-2 rounded-lg bg-gray-50 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#141219]">{tpl.name}</span>
                    <span className="text-emerald-600 font-medium">Ready ✓</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Site Content & Announcement Banner Manager */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#D30915]" />
          <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
            Top Banner & Site Announcement Copy
          </h3>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#141219] mb-1">Store Announcement Bar Text</label>
            <input
              type="text"
              value={formData.siteContent.announcementText}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  siteContent: { ...p.siteContent, announcementText: e.target.value },
                }))
              }
              className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[#141219] mb-1">VIP Reveal Club Promo Copy</label>
            <input
              type="text"
              value={formData.siteContent.promoBannerText}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  siteContent: { ...p.siteContent, promoBannerText: e.target.value },
                }))
              }
              className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
