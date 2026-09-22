import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  X,
  UserCheck,
  Gem,
  Package,
  Layers,
  Layout,
  LogOut,
} from 'lucide-react';
import type { AdminTab, AdminRole } from '../../types/admin';
import { ADMIN_ROLES_CONFIG } from '../../services/adminService';

interface AdminSidebarProps {
  currentTab: AdminTab;
  currentRole: AdminRole;
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onSelectTab: (tab: AdminTab) => void;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onSwitchRole: (role: AdminRole) => void;
  onReturnToStore: () => void;
  onLogout?: () => void;
  pendingCommissionsCount?: number;
  pendingRepsCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  currentRole,
  isCollapsed,
  isMobileOpen,
  onSelectTab,
  onToggleCollapse,
  onCloseMobile,
  onSwitchRole,
  onReturnToStore,
  onLogout,
  pendingCommissionsCount = 0,
  pendingRepsCount = 0,
}) => {
  const currentRoleDef = ADMIN_ROLES_CONFIG[currentRole];

  const NAV_ITEMS: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { id: 'overview', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'products', label: 'Products & Stock', icon: Package },
    { id: 'collections', label: 'Collections', icon: Layers },
    { id: 'orders', label: 'Orders & Shipping', icon: ShoppingBag },
    { id: 'customers', label: 'Customer Registry', icon: UserCheck },
    {
      id: 'representatives',
      label: 'Representatives',
      icon: Users,
      badge: pendingRepsCount > 0 ? `${pendingRepsCount}` : undefined,
      badgeColor: 'bg-red-100 text-[#D30915]',
    },
    { id: 'memberships', label: 'VIP Memberships', icon: CreditCard },
    { id: 'appraisals', label: 'Jewelry Appraisals', icon: Gem },
    {
      id: 'commissions',
      label: 'Commissions Ledger',
      icon: DollarSign,
      badge: pendingCommissionsCount > 0 ? `${pendingCommissionsCount}` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900',
    },
    { id: 'content', label: 'Homepage Content', icon: Layout },
    { id: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'permissions', label: 'Roles & Staff', icon: ShieldCheck },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#eedbe6] text-[#141219] select-none">
      {/* 1. Header & Brand */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-[#f4e2ed]">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="flex flex-col gap-1 min-w-0">
                <img
                  src="/assets/ilovesurprises/logo/logo-16k.png"
                  alt="ILoveSurprises"
                  width={8192}
                  height={2728}
                  className="h-[33px] sm:h-[37px] w-auto max-w-[175px] object-contain"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                />
              <span className="self-start text-[9px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-1.5 py-0.5 rounded border border-[#fecdd3]">
                Admin Suite
              </span>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#D30915] to-[#F0444E] text-white flex items-center justify-center shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
          )}
        </div>

        {/* Mobile close or desktop collapse */}
        {isMobileOpen ? (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-2 rounded-lg hover:bg-[#fff1f2] hover:text-[#D30915] text-[#716d77] active:scale-90 transition-all cursor-pointer"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-[#fff1f2] hover:text-[#D30915] text-[#716d77] active:scale-90 transition-all cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* 2. Current Role Pill */}
      {(!isCollapsed || isMobileOpen) && (
        <div className="px-4 py-2.5 bg-[#fdf8fa] border-b border-[#f3e3ee] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
            <span className="text-[11px] font-bold text-[#55505a] truncate">
              {currentRoleDef.name}
            </span>
          </div>
          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-white border border-[#eedbe6] text-[#D30915] shrink-0">
            {currentRoleDef.badge}
          </span>
        </div>
      )}

      {/* 3. Navigation Links */}
      <nav className="flex-1 p-2.5 sm:p-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const isAllowed = currentRoleDef.allowedTabs.includes(item.id);

          return (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              data-tab={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                if (isMobileOpen) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold active:scale-[0.98] transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-[#D30915] text-white shadow-[0_4px_16px_rgba(211, 9, 21,0.25)]'
                  : isAllowed
                  ? 'text-[#55505a] hover:bg-[#fff1f2] hover:text-[#D30915]'
                  : 'text-[#9c97a2] hover:bg-gray-50 opacity-75'
              }`}
              title={item.label}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : ''}`} />

              {(!isCollapsed || isMobileOpen) && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {!isAllowed && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight bg-gray-100 px-1 py-0.2 rounded">
                      Locked
                    </span>
                  )}
                  {item.badge && isAllowed && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#D30915]' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* 4. Role Simulator / Switcher & Return to Store */}
      <div className="p-3 border-t border-[#f4e2ed] bg-[#faf6f8] space-y-2">
        {(!isCollapsed || isMobileOpen) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider px-1">
              <span>Simulate Role:</span>
              <UserCheck className="w-3 h-3 text-[#D30915]" />
            </div>
            <select
              value={currentRole}
              onChange={(e) => onSwitchRole(e.target.value as AdminRole)}
              className="w-full text-xs font-semibold py-1.5 px-2 rounded-lg bg-white border border-[#eedbe6] text-[#141219] focus:outline-none focus:border-[#D30915] cursor-pointer"
            >
              <option value="super_admin">Super Admin (All Access)</option>
              <option value="store_manager">Store Manager (Commerce)</option>
              <option value="affiliate_manager">Affiliate Director (Reps)</option>
              <option value="support_rep">Support Rep (Read Only)</option>
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={onReturnToStore}
          className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#eedbe6] hover:border-[#D30915] bg-white text-xs font-bold text-[#141219] hover:text-[#D30915] shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer ${
            isCollapsed && !isMobileOpen ? 'px-1' : ''
          }`}
          title="Return to Public Storefront"
        >
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Exit to Storefront</span>}
        </button>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            id="admin-sidebar-logout-btn"
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-rose-200 hover:border-[#D30915] bg-white hover:bg-rose-50 text-xs font-bold text-[#D30915] shadow-2xs hover:shadow-xs active:scale-95 transition-all cursor-pointer ${
              isCollapsed && !isMobileOpen ? 'px-1' : ''
            }`}
            title="Sign Out of Admin Suite"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0 text-[#D30915]" />
            {(!isCollapsed || isMobileOpen) && <span>Sign Out</span>}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 shrink-0 transition-all duration-300 z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[280px] max-w-[85vw] h-full shadow-2xl z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
