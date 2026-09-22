import React from 'react';
import {
  User,
  Package,
  Heart,
  MapPin,
  Settings,
  Users,
  LogOut,
  Sparkles,
  Star,
  ChevronRight,
} from 'lucide-react';
import type { UserProfile } from '../../types';

export type AccountTab = 'profile' | 'orders' | 'wishlist' | 'addresses' | 'settings' | 'affiliate';

interface AccountSidebarProps {
  user: UserProfile;
  activeTab: AccountTab;
  ordersCount: number;
  wishlistCount: number;
  addressesCount: number;
  onSelectTab: (tab: AccountTab) => void;
  onLogout: () => void;
  onNavigateToAffiliate?: () => void;
}

export const AccountSidebar: React.FC<AccountSidebarProps> = ({
  user,
  activeTab,
  ordersCount,
  wishlistCount,
  addressesCount,
  onSelectTab,
  onLogout,
  onNavigateToAffiliate,
}) => {
  const isRep = user.role === 'representative';

  const navItems: {
    id: AccountTab;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    highlight?: boolean;
  }[] = [
    {
      id: 'profile',
      label: 'My Profile',
      description: 'Personal details & VIP status',
      icon: User,
    },
    {
      id: 'orders',
      label: 'Orders & Tracking',
      description: 'Live delivery & reveal receipts',
      icon: Package,
      badge: ordersCount,
    },
    {
      id: 'wishlist',
      label: 'My Wishlist',
      description: 'Saved candles & reveals',
      icon: Heart,
      badge: wishlistCount,
    },
    {
      id: 'addresses',
      label: 'Saved Addresses',
      description: 'Shipping & delivery destinations',
      icon: MapPin,
      badge: addressesCount,
    },
    {
      id: 'settings',
      label: 'Account Settings',
      description: 'Notifications & security',
      icon: Settings,
    },
    {
      id: 'affiliate',
      label: isRep ? 'Rep Portal Dashboard' : 'Earn 20% Reps',
      description: isRep ? 'Earnings, payouts & genealogy tree' : 'Join 5-tier affiliate program',
      icon: Users,
      badge: isRep ? '20%' : 'NEW',
      highlight: true,
    },
  ];

  return (
    <div className="w-full lg:w-[310px] shrink-0 space-y-4">
      {/* 1. VIP Profile Summary Card */}
      <div className="bg-white rounded-[24px] p-5 sm:p-6 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] relative overflow-hidden">
        {/* Soft Pink Ambient Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#D30915]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          <div className="relative shrink-0">
            <img
              src={user.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
              alt={user.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-[#D30915] shadow-xs"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] border-2 border-white shadow-2xs">
              ✓
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base font-black text-[#141219] m-0 truncate font-display">
                {user.name}
              </h2>
            </div>
            <p className="text-[11px] text-[#716d77] m-0 truncate mt-0.5 font-medium">
              {user.email}
            </p>
            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] text-[9px] font-black uppercase tracking-wider">
              {isRep ? (
                <>
                  <Star className="w-2.5 h-2.5 fill-[#D30915]" />
                  <span>20% Rep Partner</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>VIP Club Member</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Cashback Balance Badge */}
        <div className="mt-4 pt-3.5 border-t border-[#f7eff4] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#716d77] font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
            <span>Surprise VIP Rewards</span>
          </div>
          <strong className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            $24.50 Available
          </strong>
        </div>
      </div>

      {/* 2. Desktop Navigation Menu Card */}
      <nav
        className="hidden lg:block bg-white rounded-[24px] p-3 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-1"
        aria-label="Account navigation"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'affiliate' && onNavigateToAffiliate) {
                  onNavigateToAffiliate();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`w-full p-3 rounded-[16px] text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-[#D30915] to-[#B60711] text-white shadow-[0_6px_18px_rgba(211, 9, 21,0.28)]'
                  : item.highlight
                  ? 'bg-[#fff8fb] hover:bg-[#fff1f2] text-[#141219] border border-[#fecdd3]/70'
                  : 'hover:bg-[#fff1f2] text-[#3d3844] hover:text-[#D30915]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.highlight
                      ? 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3]'
                      : 'bg-[#fff8fb] text-[#716d77] group-hover:text-[#D30915] group-hover:bg-[#fff1f2]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <span
                    className={`block text-xs font-black truncate leading-tight ${
                      isActive ? 'text-white' : 'text-[#141219] group-hover:text-[#D30915]'
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`block text-[10px] truncate leading-tight mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-[#8a858f]'
                    }`}
                  >
                    {item.description}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white text-[#D30915]'
                        : item.highlight
                        ? 'bg-[#D30915] text-white'
                        : 'bg-[#fff1f2] text-[#D30915] border border-[#fecdd3]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white' : 'text-[#b5afb8] group-hover:text-[#D30915] group-hover:translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          );
        })}

        <div className="pt-2 mt-2 border-t border-[#f5eaf1]">
          <button
            type="button"
            onClick={onLogout}
            className="w-full p-2.5 px-3 rounded-[14px] text-left text-xs font-black text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-[10px] bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <LogOut className="w-3.5 h-3.5" />
            </div>
            <span>Sign Out of Account</span>
          </button>
        </div>
      </nav>

      {/* 3. Mobile / Tablet Horizontal Navigation Tabs Bar */}
      <div className="lg:hidden bg-white rounded-[20px] p-2 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'affiliate' && onNavigateToAffiliate) {
                  onNavigateToAffiliate();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`px-3.5 py-2.5 rounded-[14px] text-xs font-black transition-all whitespace-nowrap flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#D30915] text-white shadow-[0_4px_14px_rgba(211, 9, 21,0.28)]'
                  : 'bg-[#fffafc] hover:bg-[#fff1f2] text-[#55505a] border border-[#f5e4ec]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-white text-[#D30915]' : 'bg-[#fff1f2] text-[#D30915]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
