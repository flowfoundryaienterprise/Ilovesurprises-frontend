import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, UserCheck } from 'lucide-react';
import { ADMIN_ROLES_CONFIG } from '../../services/adminService';
import type { AdminRole, AdminTab } from '../../types/admin';

interface AdminPermissionDeniedProps {
  requiredTab: AdminTab;
  currentRole: AdminRole;
  onSwitchRole?: (role: AdminRole) => void;
  onNavigateToOverview?: () => void;
}

export const AdminPermissionDenied: React.FC<AdminPermissionDeniedProps> = ({
  requiredTab,
  currentRole,
  onSwitchRole,
  onNavigateToOverview,
}) => {
  const currentRoleConfig = ADMIN_ROLES_CONFIG[currentRole];

  return (
    <div className="w-full min-h-[500px] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-md w-full bg-white rounded-3xl border border-[#eedbe6] p-6 sm:p-8 shadow-xl text-center space-y-5 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#D30915]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <Lock className="w-3.5 h-3.5" />
            <span>Access Restricted</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-[#141219] hero-title-font">
            Permission Denied
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed">
            Your current role <strong className="text-[#141219]">"{currentRoleConfig.name}"</strong> does not have permission to view or manage the <strong className="text-[#D30915] capitalize">{requiredTab}</strong> module.
          </p>
        </div>

        <div className="bg-[#fff9fb] border border-[#f4e0ec] rounded-2xl p-3.5 text-left text-xs space-y-1.5">
          <div className="flex items-center justify-between text-[#141219] font-bold">
            <span>Your Assigned Role:</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#eedbe6] text-xs">
              {currentRoleConfig.badge}
            </span>
          </div>
          <p className="text-[11px] text-[#716d77] m-0">
            {currentRoleConfig.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5 pt-2">
          {onSwitchRole && (
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase text-[#8c8793] tracking-wider">
                Switch Role to Preview (Demo Mode):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onSwitchRole('super_admin')}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchRole('affiliate_manager')}
                  className="px-3 py-2 text-xs font-bold rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>Affiliate Mgr</span>
                </button>
              </div>
            </div>
          )}

          {onNavigateToOverview && (
            <button
              type="button"
              onClick={onNavigateToOverview}
              className="w-full py-2.5 px-4 rounded-xl border border-[#eedbe6] text-[#141219] hover:bg-gray-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
