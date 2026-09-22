import React, { useState } from 'react';
import {
  Bell,
  Shield,
  Globe,
  Trash2,
  Sparkles,
  Smartphone,
  Mail,
  AlertTriangle,
} from 'lucide-react';
import type { UserProfile, UserSettings } from '../../types';
import { accountService } from '../../services/accountService';
import { LuxuryRegionalSelect } from './LuxuryRegionalSelect';
import {
  DEFAULT_CURRENCY_OPTIONS,
  DEFAULT_LANGUAGE_OPTIONS,
} from '../../constants/regional';

interface SettingsSectionProps {
  user: UserProfile;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
  onLogout: () => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  user: _user,
  onShowToast,
  onLogout,
}) => {
  const [settings, setSettings] = useState<UserSettings>(() => accountService.getUserSettings());
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  const handleToggle = (key: keyof UserSettings) => {
    const updatedValue = !settings[key];
    const updated = accountService.updateUserSettings({ [key]: updatedValue });
    setSettings(updated);
    onShowToast('Settings updated successfully', {
      title: 'Preferences Saved',
      type: 'success',
    });
  };

  const handleSelectChange = (key: 'currency' | 'language', value: string) => {
    const updated = accountService.updateUserSettings({ [key]: value });
    setSettings(updated);
    const title = key === 'currency' ? 'Currency Updated' : 'Language Updated';
    onShowToast(`Preference set to ${value}`, {
      title,
      type: 'success',
    });
  };

  const handleResetRegionalDefaults = () => {
    const updated = accountService.updateUserSettings({
      currency: 'USD ($)',
      language: 'English (US)',
    });
    setSettings(updated);
    onShowToast('Reset to default US English and USD ($)', {
      title: 'Defaults Restored',
      type: 'info',
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmationText.trim().toLowerCase() === 'delete') {
      accountService.updateStoredUser(null);
      onShowToast('Your account data has been cleared from this device', {
        title: 'Account Deleted',
        type: 'info',
      });
      setIsDeletingModalOpen(false);
      onLogout();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Notifications Preferences */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#f5eaf1] mb-5">
          <div className="w-8 h-8 rounded-[10px] bg-[#fff1f2] text-[#D30915] flex items-center justify-center border border-[#fecdd3]">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              Notification Preferences
            </h2>
            <p className="text-xs text-[#716d77] m-0">
              Control when and how you receive courier tracking and reveal prize alerts
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Order Status Updates */}
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#fffafc] border border-[#f5e4ec]">
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#D30915] mt-0.5 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-[#141219] block">
                  Order & Live Courier Email Updates
                </strong>
                <span className="text-[11px] text-[#716d77]">
                  Receive emails when your candle package is hand-poured, shipped, and delivered.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={settings.orderStatusUpdates}
                onChange={() => handleToggle('orderStatusUpdates')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D30915]" />
            </label>
          </div>

          {/* SMS Shipping Alerts */}
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#fffafc] border border-[#f5e4ec]">
            <div className="flex items-start gap-3">
              <Smartphone className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-[#141219] block">
                  SMS Instant Delivery Notifications
                </strong>
                <span className="text-[11px] text-[#716d77]">
                  Get real-time text alerts the moment your surprise package arrives on your doorstep.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={() => handleToggle('smsNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D30915]" />
            </label>
          </div>

          {/* Surprise Drop Alerts */}
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#fffafc] border border-[#f5e4ec]">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-xs font-bold text-[#141219] block">
                  Limited Edition $2,500 Cash Drop Alerts
                </strong>
                <span className="text-[11px] text-[#716d77]">
                  Be first in line when rare scent batches with $2,500 cash bills or genuine diamonds drop.
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={settings.surpriseDropAlerts}
                onChange={() => handleToggle('surpriseDropAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D30915]" />
            </label>
          </div>
        </div>
      </div>

      {/* 2. Security & Two-Factor Authentication */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#f5eaf1] mb-5">
          <div className="w-8 h-8 rounded-[10px] bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              Security & Access Control
            </h2>
            <p className="text-xs text-[#716d77] m-0">
              Keep your VIP rewards and account credentials safe
            </p>
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center justify-between p-3.5 rounded-[16px] bg-[#fffafc] border border-[#f5e4ec]">
            <div>
              <strong className="text-xs font-bold text-[#141219] block">
                Two-Factor Verification (2FA)
              </strong>
              <span className="text-[11px] text-[#716d77]">
                Require a one-time OTP code sent to your email or mobile when signing in from new devices.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={settings.twoFactorEnabled}
                onChange={() => handleToggle('twoFactorEnabled')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600" />
            </label>
          </div>

          <div className="p-3.5 rounded-[16px] bg-white border border-[#eedbe6] flex items-center justify-between text-xs">
            <div>
              <strong className="font-bold text-[#141219] block">Active Session</strong>
              <span className="text-[11px] text-[#716d77]">
                Signed in on this browser (Chrome / Windows) • Active now
              </span>
            </div>
            <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Current Device</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Regional & Currency Settings */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#f5eaf1] mb-5">
          <div className="w-8 h-8 rounded-[10px] bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              Regional & Language
            </h2>
            <p className="text-xs text-[#716d77] m-0">
              Customize currency display and locale preferences
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          <LuxuryRegionalSelect
            label="Preferred Currency"
            description="Catalog & checkout display"
            type="currency"
            options={DEFAULT_CURRENCY_OPTIONS}
            value={settings.currency}
            onChange={(val) => handleSelectChange('currency', val)}
            searchPlaceholder="Search currency by code, name, or country..."
          />

          <LuxuryRegionalSelect
            label="Display Language"
            description="Storefront & email translation"
            type="language"
            options={DEFAULT_LANGUAGE_OPTIONS}
            value={settings.language}
            onChange={(val) => handleSelectChange('language', val)}
            searchPlaceholder="Search language by name or region..."
          />
        </div>

        {/* Live Locale & Price Formatting Preview */}
        <div className="mt-5 p-4 rounded-[18px] bg-gradient-to-br from-[#fff8fb] to-[#fcf5f9] border border-[#fecdd3] shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-black text-[#141219] font-display">
                  Live Formatting Preview
                </span>
                <span className="text-[10px] font-bold text-[#D30915] bg-white px-2 py-0.5 rounded-full border border-[#fecdd3]">
                  Instant Sync
                </span>
              </div>
              <p className="text-[11px] text-[#716d77]">
                Sample candle:{' '}
                <strong className="text-[#141219] font-bold">
                  {DEFAULT_CURRENCY_OPTIONS.find((c) => c.value === settings.currency)?.samplePrice || '$49.95 USD'}
                </strong>{' '}
                • Courier estimate in {settings.language}:{' '}
                <strong className="text-[#141219] font-bold">
                  {DEFAULT_LANGUAGE_OPTIONS.find((l) => l.value === settings.language)?.sampleDate || 'Friday, September 4, 2026'}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={handleResetRegionalDefaults}
              className="text-[11px] font-bold text-[#D30915] hover:text-[#9B060E] bg-white hover:bg-[#fff1f2] px-3 py-1.5 rounded-full border border-[#fecdd3] transition-all cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs"
            >
              Reset to Defaults (US / USD)
            </button>
          </div>
        </div>
      </div>

      {/* 4. Danger Zone: Data Reset / Delete */}
      <div className="bg-red-50/40 rounded-[24px] p-6 sm:p-8 border border-red-200 shadow-2xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-red-200/70 mb-4">
          <div className="w-8 h-8 rounded-[10px] bg-red-100 text-red-700 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-red-900 m-0 font-display">
              Account Management Zone
            </h2>
            <p className="text-xs text-red-700 m-0">
              Clear local session data and saved account preferences
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <strong className="text-xs font-bold text-[#141219] block">
              Delete Saved Account Data
            </strong>
            <span className="text-[11px] text-[#716d77]">
              Permanently clear your local profile, addresses, and session authentication from this device.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDeletingModalOpen(true)}
            className="h-[38px] px-4 rounded-[12px] bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeletingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-[24px] p-6 border border-[#eedbe6] shadow-2xl animate-modal-pop">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-center text-[#141219] mb-1 font-display">
              Confirm Account Data Deletion
            </h3>
            <p className="text-xs text-[#716d77] text-center mb-4 leading-relaxed">
              This will remove all stored credentials and saved addresses. Type <strong className="text-red-600 font-black">DELETE</strong> below to confirm.
            </p>

            <input
              type="text"
              placeholder='Type "DELETE"'
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              className="w-full h-[42px] px-3.5 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] text-xs font-bold text-center text-[#141219] outline-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeletingModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="h-[38px] px-4 rounded-[11px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] hover:text-[#141219] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationText.trim().toLowerCase() !== 'delete'}
                onClick={handleConfirmDelete}
                className="h-[38px] px-5 rounded-[11px] bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs uppercase cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
