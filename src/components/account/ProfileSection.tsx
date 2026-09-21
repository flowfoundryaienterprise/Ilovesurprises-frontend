import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit2,
  Check,
  Star,
  Lock,
  Camera,
  RefreshCw,
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { accountService } from '../../services/accountService';
import { isValidEmail, isValidMobile } from '../../services/auth';

interface ProfileSectionProps {
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

const DEFAULT_PROFILE_AVATAR = '/assets/ilovesurprises/Profile/profile%20image.webp';
const AVATAR_PRESETS = [
  DEFAULT_PROFILE_AVATAR,
];

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  user,
  onUpdateUser,
  onShowToast,
}) => {
  const getCleanAvatar = (avatarUrl?: string) => {
    const isGoogleOrRemote =
      avatarUrl &&
      (avatarUrl.includes('googleusercontent.com') ||
        (avatarUrl.startsWith('https://') && !avatarUrl.includes('unsplash.com')));
    if (!avatarUrl || avatarUrl.includes('unsplash.com') || (!isGoogleOrRemote && avatarUrl.startsWith('http'))) {
      return DEFAULT_PROFILE_AVATAR;
    }
    return avatarUrl;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile || '');
  const [selectedAvatar, setSelectedAvatar] = useState(getCleanAvatar(user.avatar));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isResetSent, setIsResetSent] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Full name must be at least 2 characters';
    }
    if (!email.trim() || !isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (mobile.trim() && !isValidMobile(mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const updated: UserProfile = {
      ...user,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim() || undefined,
      avatar: selectedAvatar,
    };

    accountService.updateStoredUser(updated);
    onUpdateUser(updated);
    setIsEditing(false);
    setShowAvatarPicker(false);
    setErrors({});
    onShowToast('Profile information successfully saved!', {
      title: 'Profile Updated',
      type: 'success',
    });
  };

  const handleResetPassword = () => {
    setIsResetSent(true);
    onShowToast(`Password reset link sent to ${user.email}`, {
      title: 'Security Link Sent',
      type: 'info',
    });
    setTimeout(() => setIsResetSent(false), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Main Profile Information Card */}
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f5eaf1] mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
                Personal Profile & Account
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-2.5 py-0.5 rounded-full border border-[#fecdd3]">
                {user.role === 'representative' ? '★ 20% Rep' : '💎 VIP Member'}
              </span>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Manage your personal credentials, contact info, and security preferences
            </p>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="h-[38px] px-4 rounded-[12px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-5">
            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-2">
                Profile Avatar
              </label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="relative">
                  <img
                    src={selectedAvatar}
                    alt={name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#D30915] shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#D30915] text-white flex items-center justify-center text-xs shadow-xs hover:scale-110 transition-transform cursor-pointer border border-white"
                    title="Change Avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                {showAvatarPicker && (
                  <div className="flex items-center gap-2 p-2 rounded-[14px] bg-[#fff8fb] border border-[#fecdd3]">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(preset)}
                        className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-transform hover:scale-105 cursor-pointer ${
                          selectedAvatar === preset ? 'border-[#D30915] ring-2 ring-[#D30915]/20' : 'border-white opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Full Name <span className="text-[#D30915]">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#8a858f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="Your name"
                  className="w-full h-[44px] pl-10 pr-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs sm:text-sm text-[#141219] outline-none font-medium"
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-600 mt-1">{errors.name}</p>}
            </div>

            {/* Email & Mobile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Email Address <span className="text-[#D30915]">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8a858f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                    placeholder="example@gmail.com"
                    className="w-full h-[44px] pl-10 pr-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs sm:text-sm text-[#141219] outline-none font-medium"
                  />
                </div>
                {errors.email && <p className="text-[11px] text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#8a858f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value);
                      if (errors.mobile) setErrors((prev) => ({ ...prev, mobile: '' }));
                    }}
                    placeholder="(555) 000-0000"
                    className="w-full h-[44px] pl-10 pr-3.5 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs sm:text-sm text-[#141219] outline-none font-medium"
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-red-600 mt-1">{errors.mobile}</p>}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#f5eaf1]">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setName(user.name);
                  setEmail(user.email);
                  setMobile(user.mobile || '');
                  setSelectedAvatar(getCleanAvatar(user.avatar));
                  setErrors({});
                }}
                className="h-[40px] px-5 rounded-[12px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] hover:text-[#141219] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-[40px] px-6 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-[18px] bg-[#fffafc] border border-[#eedbe6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#fecdd3]">
                  <User className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block">
                    Full Legal Name
                  </span>
                  <strong className="text-sm font-black text-[#141219] truncate block">
                    {user.name}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#fffafc] border border-[#eedbe6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-200">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block">
                    Account Status & Role
                  </span>
                  <strong className="text-sm font-black text-[#D30915] capitalize">
                    {user.role === 'representative' ? 'Official 20% Rep Partner' : 'VIP Loyalty Member'}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#fffafc] border border-[#eedbe6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block">
                    Registered Email
                  </span>
                  <strong className="text-sm font-black text-[#141219] truncate block">
                    {user.email}
                  </strong>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-[#fffafc] border border-[#eedbe6] flex items-center gap-3">
                <div className="w-10 h-10 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
                  <Phone className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-black uppercase text-[#716d77] block">
                    Mobile Phone
                  </span>
                  <strong className="text-sm font-black text-[#141219]">
                    {user.mobile || 'Not provided'}
                  </strong>
                </div>
              </div>
            </div>

            {/* VIP Member Perks Ribbon */}
            <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#fff1f2] via-[#fff8fb] to-[#fbf5ff] border border-[#fecdd3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <strong className="text-xs font-black text-[#141219] block">
                    100% Win Guarantee Verified Member
                  </strong>
                  <span className="text-[11px] text-[#716d77]">
                    Earn 5% cashback on all surprise unboxings & free shipping on $50+
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-black text-emerald-700 bg-white px-3 py-1 rounded-full border border-[#fecdd3]">
                  Level 1 VIP
                </span>
              </div>
            </div>

            {/* Password & Security Card */}
            <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[10px] bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-xs font-black text-[#141219] block">
                    Password & Security
                  </strong>
                  <span className="text-[11px] text-[#716d77]">
                    Encrypted with bank-grade 256-bit security
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetSent}
                className="h-[34px] px-4 rounded-[10px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isResetSent ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Reset Link Sent!</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
