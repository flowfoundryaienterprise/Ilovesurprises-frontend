import React, { useState, useMemo } from 'react';
import {
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  X,
  Sparkles,
  Check,
  Ban,
  Copy,
} from 'lucide-react';
import type { RepresentativeAdminRecord, RepStatus } from '../../types/admin';
import { qualificationService } from '../../services/qualificationService';
import { attributionService } from '../../services/attributionService';

interface AdminRepresentativesProps {
  representatives: RepresentativeAdminRecord[];
  onUpdateStatus: (id: string, status: RepStatus) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminRepresentatives: React.FC<AdminRepresentativesProps> = ({
  representatives,
  onUpdateStatus,
  onApprove,
  onReject,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | RepStatus>('all');
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');
  const [selectedRep, setSelectedRep] = useState<RepresentativeAdminRecord | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    repId: string;
    action: 'approve' | 'reject' | 'suspend' | 'activate';
    repName: string;
  } | null>(null);

  // Filter reps
  const filteredReps = useMemo(() => {
    return representatives.filter((rep) => {
      const matchSearch =
        rep.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.repUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.sponsorUsername.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'all' || rep.status === statusFilter;
      const matchApproval = approvalFilter === 'all' || rep.approvalStatus === approvalFilter;

      return matchSearch && matchStatus && matchApproval;
    });
  }, [representatives, searchQuery, statusFilter, approvalFilter]);

  const handleOpenConfirm = (
    repId: string,
    action: 'approve' | 'reject' | 'suspend' | 'activate',
    repName: string
  ) => {
    setConfirmAction({ repId, action, repName });
    setIsConfirmModalOpen(true);
  };

  const handleExecuteConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.action === 'approve') {
      onApprove(confirmAction.repId);
      onShowToast(`Representative @${confirmAction.repName} approved!`, {
        title: 'Representative Approved',
        type: 'success',
      });
    } else if (confirmAction.action === 'reject') {
      onReject(confirmAction.repId);
      onShowToast(`Representative application for @${confirmAction.repName} rejected.`, {
        title: 'Application Rejected',
        type: 'info',
      });
    } else if (confirmAction.action === 'suspend') {
      onUpdateStatus(confirmAction.repId, 'suspended');
      onShowToast(`Representative @${confirmAction.repName} has been suspended.`, {
        title: 'Account Suspended',
        type: 'info',
      });
    } else if (confirmAction.action === 'activate') {
      onUpdateStatus(confirmAction.repId, 'active');
      onShowToast(`Representative @${confirmAction.repName} set to Active.`, {
        title: 'Account Activated',
        type: 'success',
      });
    }

    setIsConfirmModalOpen(false);
    setConfirmAction(null);
  };

  const getStatusBadge = (status: RepStatus) => {
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
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Representatives Directory
            </h2>
            <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              {representatives.length} Registered
            </span>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Audit downline representatives, verify sponsor lineages, approve onboardings, and track membership statuses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-medium text-[#716d77]">
            Showing <strong className="text-[#141219]">{filteredReps.length}</strong> of {representatives.length}
          </div>
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eedbe6] shadow-xs">
        {/* Search */}
        <div className="relative lg:col-span-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, @username, email, or sponsor..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | RepStatus)}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Statuses (Active / Past Due / Suspended)</option>
            <option value="active">Active Only</option>
            <option value="past_due">Past Due Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        {/* Approval Filter */}
        <div>
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value as 'all' | 'approved' | 'pending' | 'rejected')}
            className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-medium focus:outline-none focus:border-[#D30915] cursor-pointer"
          >
            <option value="all">All Approval States</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending Application</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* 3. Representatives Desktop Table (Hidden < 768px) */}
      <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[11px] font-extrabold uppercase text-[#716d77] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Representative</th>
                <th className="py-3.5 px-3">Sponsor Info</th>
                <th className="py-3.5 px-3">Rank & Team</th>
                <th className="py-3.5 px-3">Monthly Qualification ($125)</th>
                <th className="py-3.5 px-3">Membership Plan</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredReps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#716d77]">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-bold text-sm text-[#141219] m-0">No representatives found</p>
                    <p className="text-xs m-0">Try adjusting your search query or status filter.</p>
                  </td>
                </tr>
              ) : (
                filteredReps.map((rep) => (
                  <tr key={rep.id} className="hover:bg-[#fffbfd] transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={rep.avatar}
                          alt={rep.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#eedbe6] shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-[#141219] truncate">{rep.name}</div>
                          <div className="text-[11px] text-[#D30915] font-bold">@{rep.repUsername}</div>
                          <div className="text-[10px] text-[#8a858f]">{rep.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-xs font-bold text-[#141219]">{rep.sponsorName}</div>
                      <div className="text-[11px] text-[#716d77]">@{rep.sponsorUsername}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#54217f]">{rep.currentRank}</div>
                      <div className="text-[11px] text-[#716d77]">{rep.teamSize} Direct Downlines</div>
                    </td>

                    <td className="py-3 px-3">
                      {(() => {
                        const q = qualificationService.getCachedQualification(rep.repUsername);
                        return (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  q.isQualified
                                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                              >
                                {q.isQualified ? '✓ Qualified' : 'Not Qualified'}
                              </span>
                            </div>
                            <div className="text-[11px] font-bold text-[#141219]">
                              Retail: ${q.qualifyingRetailSales.toFixed(2)} / ${q.qualificationThreshold.toFixed(2)}
                            </div>
                            <div className="text-[9px] text-[#716d77]">
                              Personal: ${q.personalPurchasesExcluded.toFixed(2)} (20% off) • $20 fees: $0 comm
                            </div>
                            <div className="text-[9px] text-[#716d77]">
                              Month: {q.calendarMonth} • {q.isQualified ? 'Downlines Active' : 'Downlines Ineligible'}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#141219] truncate max-w-[170px]">
                        {rep.membershipPlan}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-bold capitalize">
                        Status: {rep.membershipStatus}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div>{getStatusBadge(rep.status)}</div>
                        {rep.approvalStatus === 'pending' && (
                          <span className="block text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRep(rep)}
                          className="p-1.5 rounded-lg bg-gray-50 hover:bg-[#fff1f2] text-[#55505a] hover:text-[#D30915] transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {rep.approvalStatus === 'pending' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirm(rep.id, 'approve', rep.repUsername)}
                              className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Approve"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenConfirm(rep.id, 'reject', rep.repUsername)}
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                              title="Reject"
                            >
                              Reject
                            </button>
                          </>
                        ) : rep.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(rep.id, 'suspend', rep.repUsername)}
                            className="px-2 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-700 text-[11px] font-bold transition-all cursor-pointer"
                            title="Suspend"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenConfirm(rep.id, 'activate', rep.repUsername)}
                            className="px-2 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-[11px] font-bold transition-all cursor-pointer"
                            title="Set Active"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Mobile Responsive Cards View (Shown < 768px) */}
      <div className="md:hidden space-y-3">
        {filteredReps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-8 text-center text-[#716d77]">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#141219] m-0">No representatives found</p>
            <p className="text-xs m-0">Try changing your search terms.</p>
          </div>
        ) : (
          filteredReps.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl border border-[#eedbe6] p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <img
                    src={rep.avatar}
                    alt={rep.name}
                    className="w-11 h-11 rounded-full object-cover border border-[#eedbe6]"
                  />
                  <div>
                    <h4 className="font-black text-sm text-[#141219] m-0">{rep.name}</h4>
                    <span className="text-xs font-bold text-[#D30915]">@{rep.repUsername}</span>
                    <div className="text-[11px] text-[#716d77]">{rep.email}</div>
                  </div>
                </div>
                <div>{getStatusBadge(rep.status)}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-[#fdf8fa] rounded-xl p-2.5 text-xs">
                <div>
                  <span className="text-[10px] text-[#716d77] block font-medium">Sponsor:</span>
                  <span className="font-bold text-[#141219]">{rep.sponsorName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[#716d77] block font-medium">Rank & Team:</span>
                  <span className="font-bold text-[#54217f]">{rep.currentRank} ({rep.teamSize})</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-gray-100">
                  <span className="text-[10px] text-[#716d77] block font-medium">Membership:</span>
                  <span className="font-bold text-[#141219]">{rep.membershipPlan}</span>
                </div>
              </div>

              {/* Mobile Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedRep(rep)}
                  className="flex-1 py-2 px-3 rounded-xl border border-[#eedbe6] bg-white text-xs font-bold text-[#141219] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#D30915]" />
                  <span>Full Profile</span>
                </button>

                {rep.approvalStatus === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenConfirm(rep.id, 'approve', rep.repUsername)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>
                ) : rep.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleOpenConfirm(rep.id, 'suspend', rep.repUsername)}
                    className="py-2 px-3 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Suspend</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenConfirm(rep.id, 'activate', rep.repUsername)}
                    className="py-2 px-3 rounded-xl border border-emerald-200 text-emerald-700 bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Activate</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. Representative Details Modal / Drawer */}
      {selectedRep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#eedbe6] max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D30915]" />
                <h3 className="font-black text-base text-[#141219] hero-title-font m-0">
                  Representative Dossier
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRep(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-[#716d77] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Header */}
            <div className="flex items-center gap-4 bg-[#fdf9fb] p-4 rounded-2xl border border-[#f3e3ee]">
              <img
                src={selectedRep.avatar}
                alt={selectedRep.name}
                className="w-16 h-16 rounded-2xl object-cover border border-[#eedbe6] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-black text-lg text-[#141219] m-0 truncate">{selectedRep.name}</h4>
                <div className="text-xs font-bold text-[#D30915]">@{selectedRep.repUsername}</div>
                <div className="mt-1 flex items-center gap-2">
                  {getStatusBadge(selectedRep.status)}
                  <span className="text-[10px] font-bold text-[#54217f] bg-purple-50 px-2 py-0.5 rounded-full">
                    {selectedRep.currentRank}
                  </span>
                </div>
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-gray-50 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] text-[#716d77] font-medium block">Personal Sales (Month):</span>
                <span className="font-black text-[#141219] text-base">
                  ${selectedRep.personalSalesMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] text-[#716d77] font-medium block">Team Volume (Month):</span>
                <span className="font-black text-[#54217f] text-base">
                  ${selectedRep.teamSalesMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] text-[#716d77] font-medium block">Lifetime Sales:</span>
                <span className="font-black text-[#141219] text-base">
                  ${selectedRep.lifetimeSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl space-y-0.5">
                <span className="text-[10px] text-[#716d77] font-medium block">Total Commissions Earned:</span>
                <span className="font-black text-emerald-600 text-base">
                  ${selectedRep.totalCommissionsEarned.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Downline & Sponsor Details */}
            <div className="bg-[#fff9fb] p-3.5 rounded-xl border border-[#f2dfec] space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[#716d77]">Direct Enroller / Sponsor:</span>
                <span className="font-bold text-[#141219]">{selectedRep.sponsorName} (@{selectedRep.sponsorUsername})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Registered Email:</span>
                <span className="font-bold text-[#141219]">{selectedRep.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Mobile Phone:</span>
                <span className="font-bold text-[#141219]">{selectedRep.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Membership Plan:</span>
                <span className="font-bold text-[#D30915]">{selectedRep.membershipPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#716d77]">Enrolled Date:</span>
                <span className="font-bold text-[#141219]">{selectedRep.joinDate}</span>
              </div>
            </div>

            {/* Referral Link & Customer Attribution Card */}
            {(() => {
              const referralLink = typeof window !== 'undefined'
                ? `${window.location.origin}/?rep=${selectedRep.repUsername}`
                : `https://ilovesurprises.com/?rep=${selectedRep.repUsername}`;
              const attributions = attributionService.getStoredAttributions();
              const attributedCustomers = Object.values(attributions).filter(
                (a) => a.repUsername.toLowerCase() === selectedRep.repUsername.toLowerCase()
              );

              return (
                <div className="bg-[#fff9fb] p-3.5 rounded-xl border border-[#f2dfec] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-[10px] text-[#716d77]">
                      Affiliate Referral Link &amp; Attribution
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      {attributedCustomers.length} Lifetime Customer{attributedCustomers.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      readOnly
                      value={referralLink}
                      className="flex-1 h-8 px-2.5 rounded-lg bg-white border border-[#eedbe6] text-[11px] font-mono text-[#D30915] select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(referralLink);
                        onShowToast(`Referral link for @${selectedRep.repUsername} copied!`, {
                          title: 'Link Copied',
                          type: 'success',
                        });
                      }}
                      className="h-8 px-2.5 rounded-lg bg-[#faf7f9] border border-[#eedbe6] hover:bg-[#fff0f3] text-xs font-bold text-[#141219] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#D30915]" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Monthly Qualification Details Card */}
            {(() => {
              const q = qualificationService.getCachedQualification(selectedRep.repUsername);
              return (
                <div className="bg-[#faf6f9] p-3.5 rounded-xl border border-[#eedbe6] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase tracking-wider text-[10px] text-[#716d77]">
                      Monthly Qualification (Team Overrides)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        q.isQualified
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}
                    >
                      {q.isQualified ? '✓ Qualified' : 'Not Qualified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Calendar Month:</span>
                    <span className="font-bold text-[#141219]">{q.calendarMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Qualifying Retail Sales:</span>
                    <span className={`font-black ${q.isQualified ? 'text-emerald-700' : 'text-[#D30915]'}`}>
                      ${q.qualifyingRetailSales.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Rep Personal Purchases:</span>
                    <span className="font-bold text-[#55505a]">
                      ${q.personalPurchasesExcluded.toFixed(2)} (20% Rep discount, excluded)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">$20 Rep Signup / Monthly Fee:</span>
                    <span className="font-bold text-[#55505a]">
                      $0 Commission / Excluded from volume
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Policy Threshold:</span>
                    <span className="font-bold text-[#141219]">${q.qualificationThreshold.toFixed(2)} (Fixed Policy)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Downline Commissions:</span>
                    <span className={`font-bold ${q.isQualified ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {q.isQualified ? 'Eligible for Level 1–5 Overrides' : 'Ineligible (<$125 retail sales)'}
                    </span>
                  </div>
                  <div className="pt-1 text-[10px] text-[#8a858f] italic border-t border-[#eedbe6]/60 space-y-0.5">
                    <div>* Personal purchases receive 20% Rep discount but do not count toward $125 qualification.</div>
                    <div>* Rep signup/monthly fees do not generate commission income.</div>
                  </div>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => setSelectedRep(null)}
              className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-[#141219] transition-all cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}

      {/* 6. Approval / Suspension Confirmation Modal */}
      {isConfirmModalOpen && confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-[#eedbe6] max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${
              confirmAction.action === 'approve' || confirmAction.action === 'activate'
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-rose-50 text-rose-600'
            }`}>
              {confirmAction.action === 'approve' || confirmAction.action === 'activate' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#141219] hero-title-font m-0 capitalize">
                Confirm {confirmAction.action}
              </h3>
              <p className="text-xs text-[#716d77] m-0">
                Are you sure you want to {confirmAction.action} representative <strong className="text-[#141219]">@{confirmAction.repName}</strong>?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteConfirm}
                className={`py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-xs cursor-pointer ${
                  confirmAction.action === 'approve' || confirmAction.action === 'activate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
