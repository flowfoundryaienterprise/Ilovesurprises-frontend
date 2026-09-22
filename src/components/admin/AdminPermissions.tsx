import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  Lock,
  UserCheck,
  Shield,
} from 'lucide-react';
import type { AdminRole, AdminTab, AdminStaffUser } from '../../types/admin';
import { adminService, ADMIN_ROLES_CONFIG } from '../../services/adminService';

interface AdminPermissionsProps {
  currentRole: AdminRole;
  onSwitchRole: (role: AdminRole) => void;
  onNavigateTab: (tab: AdminTab) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminPermissions: React.FC<AdminPermissionsProps> = ({
  currentRole,
  onSwitchRole,
  onNavigateTab,
  onShowToast,
}) => {
  const ALL_ROLES: AdminRole[] = ['super_admin', 'store_manager', 'affiliate_manager', 'support_rep'];
  const [roleConfigs, setRoleConfigs] = useState(() => adminService.getRoleDefinitions());
  const [staffList, setStaffList] = useState<AdminStaffUser[]>([]);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

  useEffect(() => {
    adminService.getStaffAdmins().then((users) => {
      setStaffList(users);
      setIsLoadingStaff(false);
    });
  }, []);

  const handleUpdateStaffRole = async (staffId: string, newRole: AdminRole, staffName: string) => {
    if (currentRole !== 'super_admin') {
      onShowToast('Only Super Admin can assign administrative roles', { type: 'info' });
      return;
    }
    await adminService.updateStaffRole(staffId, newRole);
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, role: newRole } : s))
    );
    onShowToast(`Assigned ${ADMIN_ROLES_CONFIG[newRole].name} to ${staffName}`, {
      type: 'success',
    });
  };

  const PERMISSION_GROUPS: {
    tab: AdminTab;
    label: string;
    description: string;
  }[] = [
    { tab: 'overview', label: 'Executive Overview', description: 'Platform sales velocity, MRR, 7 KPI cards, live activity feeds' },
    { tab: 'products', label: 'Product Catalog', description: 'Catalog items, inventory thresholds, multi-variants, photo gallery' },
    { tab: 'collections', label: 'Collections Management', description: 'Storefront showcases, content writeups, product mapping' },
    { tab: 'orders', label: 'Orders & Fulfillment', description: 'Customer checkouts, carrier tracking, order manifests, refunds' },
    { tab: 'customers', label: 'Customer Registry', description: 'Customer profiles, order history, lifetime spend, referrer links' },
    { tab: 'representatives', label: 'Representatives Directory', description: 'Downline audit, approval/rejection, account suspension' },
    { tab: 'memberships', label: 'Memberships & Billing', description: '$19.99/mo, 6-mo & 12-mo plans, grace periods' },
    { tab: 'appraisals', label: 'Jewelry Appraisals', description: 'Appraisal requests, certificate lookup, valuation audits' },
    { tab: 'commissions', label: 'Commissions Ledger', description: '35% multi-tier distribution ledger, payouts, clawbacks' },
    { tab: 'content', label: 'Homepage Content', description: 'Cash Candles, Trending, Zodiac showcase cards, announcements' },
    { tab: 'reports', label: 'Analytics & Reports', description: 'Detailed sales reports, traffic conversion, MRR, CSV exports' },
    { tab: 'settings', label: 'System Configuration', description: 'Attribution windows, restricted usernames, starter kits, gateways' },
    { tab: 'permissions', label: 'Roles & Access Control', description: 'Role assignment, security privileges, role simulation' },
  ];

  const handleRoleSelect = (role: AdminRole) => {
    onSwitchRole(role);
    onShowToast(`Simulating session as: ${ADMIN_ROLES_CONFIG[role].name}`, {
      title: 'Role Switched',
      type: 'success',
    });
  };

  const handleTogglePermission = (role: AdminRole, tab: AdminTab, label: string) => {
    if (currentRole !== 'super_admin') {
      onShowToast('Only Super Admin can modify role permissions', { type: 'info' });
      return;
    }
    if (role === 'super_admin') {
      onShowToast('Super Admin permissions are immutable and mandatory', { type: 'info' });
      return;
    }
    // Hard security check: Staff cannot be granted settings or permissions
    if (tab === 'settings' || tab === 'permissions') {
      onShowToast(`Security Policy: "${label}" is strictly restricted to Super Admin only.`, {
        type: 'info',
        title: 'Restricted Action',
      });
      return;
    }

    const currentAllowed = roleConfigs[role].allowedTabs;
    const isCurrentlyAllowed = currentAllowed.includes(tab);
    const updatedTabs = isCurrentlyAllowed
      ? currentAllowed.filter((t) => t !== tab)
      : [...currentAllowed, tab];

    const updated = adminService.updateRolePermissions(role, updatedTabs);
    setRoleConfigs(updated);
    onShowToast(
      `${isCurrentlyAllowed ? 'Revoked' : 'Granted'} "${label}" for ${roleConfigs[role].name}`,
      { type: 'success', title: 'Permission Updated' }
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Current Role Banner */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#D30915]" />
              <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
                Administrative Roles & RBAC Matrix
              </h2>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Granular role-based access control, privilege assignments, and interactive session simulation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#716d77] font-medium">Active Session Role:</span>
            <span className="px-3 py-1 rounded-xl bg-[#fff1f2] border border-[#f0d0e2] text-xs font-black text-[#D30915]">
              {ADMIN_ROLES_CONFIG[currentRole].name}
            </span>
          </div>
        </div>

        {/* Live Role Simulation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {ALL_ROLES.map((roleKey) => {
            const r = ADMIN_ROLES_CONFIG[roleKey];
            const isSelected = currentRole === roleKey;

            return (
              <div
                key={roleKey}
                onClick={() => handleRoleSelect(roleKey)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 relative overflow-hidden ${
                  isSelected
                    ? 'border-[#D30915] bg-[#fffbfd] shadow-sm ring-2 ring-[#D30915]/10'
                    : 'border-[#eedbe6] bg-white hover:border-[#D30915]/50 hover:bg-[#faf7f9]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm text-[#141219]">{r.name}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#D30915] animate-pulse" />
                  )}
                </div>
                <p className="text-[11px] text-[#716d77] m-0 leading-relaxed">{r.description}</p>
                <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-xs">
                  <span className="text-[10px] font-bold text-[#D30915] uppercase">{r.badge}</span>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isSelected ? 'bg-[#D30915] text-white' : 'bg-gray-100 text-[#141219]'
                    }`}
                  >
                    {isSelected ? 'Active Role ✓' : 'Switch Here'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Administrative Staff Accounts (Requirement 9) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#D30915]" />
              <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
                Administrative Staff & Role Assignments
              </h3>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Verified administrative personnel connected to store authentication. Super Admin can assign operational roles.
            </p>
          </div>
          <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2.5 py-1 rounded-full">
            {staffList.length} Operators
          </span>
        </div>

        {/* Security Architecture Callout (Requirement 9) */}
        <div className="p-3.5 bg-amber-50/70 border-b border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-900">
          <Shield className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-bold">Enterprise Security Policy:</strong> Admin navigation and UI visibility provide an intuitive, role-tailored workflow. All sensitive operations (financial commission approval, catalog teardown, customer profile edits) are independently protected by role-based operational permissions.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-3">Email Address</th>
                <th className="py-3 px-3">Assigned Role</th>
                <th className="py-3 px-3">Role Capabilities</th>
                <th className="py-3 px-4 text-right">Modify Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f5eaf1] font-medium">
              {isLoadingStaff ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#716d77]">
                    Loading staff members from administrative directory...
                  </td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-xs text-[#716d77]">
                    No staff records found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => {
                  const config = ADMIN_ROLES_CONFIG[staff.role];
                  const isFounder =
                    staff.email === 'ilovesurprises.admin@gmail.com';

                return (
                  <tr key={staff.id} className="hover:bg-[#fffbfd] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#fff1f2] border border-[#eedbe6] text-[#D30915] flex items-center justify-center font-bold text-xs shrink-0">
                          {staff.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#141219]">{staff.name}</div>
                          {isFounder && (
                            <span className="inline-block text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded">
                              Founder & Primary
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-xs text-[#716d77]">{staff.email}</td>

                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#faf7f9] border border-[#eedbe6] text-[#141219]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D30915]" />
                        <span>{config.name}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#716d77] text-[11px] max-w-xs">
                      {config.description}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {isFounder ? (
                        <span className="text-[11px] font-bold text-[#716d77] italic">Immutable Super Admin</span>
                      ) : (
                        <select
                          disabled={currentRole !== 'super_admin'}
                          value={staff.role}
                          onChange={(e) => handleUpdateStaffRole(staff.id, e.target.value as AdminRole, staff.name)}
                          className="h-8 px-2.5 rounded-lg bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#141219] disabled:opacity-40"
                        >
                          <option value="super_admin">Super Administrator</option>
                          <option value="store_manager">Store Manager</option>
                          <option value="affiliate_manager">Affiliate Director</option>
                          <option value="support_rep">Customer Support</option>
                        </select>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. RBAC Permissions Matrix Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-[#141219] hero-title-font m-0">
              Module Access Matrix
            </h3>
            <p className="text-xs text-[#716d77] m-0">
              {currentRole === 'super_admin'
                ? 'Super Admin Mode: Click any staff permission below to toggle live privileges. System settings and permissions matrix are strictly locked to Super Admin.'
                : 'Visual map of allowed sections per administrative profile.'}
            </p>
          </div>
          <span className="text-xs text-[#716d77] font-medium hidden sm:inline">
            Click any module to navigate directly
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Admin Module</th>
                <th className="py-3.5 px-3 text-center">Super Admin</th>
                <th className="py-3.5 px-3 text-center">Store Manager</th>
                <th className="py-3.5 px-3 text-center">Affiliate Director</th>
                <th className="py-3.5 px-3 text-center">Support Rep</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {PERMISSION_GROUPS.map((group) => (
                <tr key={group.tab} className="hover:bg-[#fffbfd] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-sm text-[#141219] flex items-center gap-2">
                      <span>{group.label}</span>
                      <button
                        type="button"
                        onClick={() => onNavigateTab(group.tab)}
                        className="text-[10px] text-[#D30915] font-bold hover:underline cursor-pointer"
                      >
                        (Preview Tab)
                      </button>
                    </div>
                    <div className="text-[11px] text-[#716d77]">{group.description}</div>
                  </td>

                  {/* Super Admin */}
                  <td className="py-3.5 px-3 text-center">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-50 text-emerald-600">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </span>
                  </td>

                  {/* Other Roles: store_manager, affiliate_manager, support_rep */}
                  {(['store_manager', 'affiliate_manager', 'support_rep'] as AdminRole[]).map((rKey) => {
                    const isRestricted = group.tab === 'settings' || group.tab === 'permissions';
                    const isAllowed = roleConfigs[rKey].allowedTabs.includes(group.tab);

                    if (isRestricted) {
                      return (
                        <td key={rKey} className="py-3.5 px-3 text-center">
                          <span
                            title="Restricted: Critical system operations reserved for Super Admin"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-stone-100 text-stone-400"
                          >
                            <Lock className="w-3.5 h-3.5 text-stone-400" />
                          </span>
                        </td>
                      );
                    }

                    return (
                      <td key={rKey} className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={currentRole !== 'super_admin'}
                          onClick={() => handleTogglePermission(rKey, group.tab, group.label)}
                          title={
                            currentRole === 'super_admin'
                              ? `Click to ${isAllowed ? 'Revoke' : 'Grant'} access for ${roleConfigs[rKey].name}`
                              : undefined
                          }
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-transform ${
                            currentRole === 'super_admin' ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
                          } ${
                            isAllowed
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          {isAllowed ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-4 h-4" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
