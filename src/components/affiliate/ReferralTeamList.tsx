import React, { useState, useMemo } from 'react';
import { Users, Search, Award, Filter, CheckCircle2, Clock } from 'lucide-react';
import type { ReferralMember } from '../../types';
import { qualificationService } from '../../services/qualificationService';
import { AffiliateCustomSelect, type AffiliateSelectOption } from './AffiliateCustomSelect';

interface ReferralTeamListProps {
  members: ReferralMember[];
  repUsername?: string;
}

const LEVEL_OPTIONS: AffiliateSelectOption[] = [
  { value: 'all', label: 'All Levels (1 to 5)' },
  { value: '1', label: 'Level 1 (Direct)', badge: '5%', badgeColor: 'bg-red-50 text-red-700' },
  { value: '2', label: 'Level 2 Downlines', badge: '4%', badgeColor: 'bg-purple-50 text-purple-700' },
  { value: '3', label: 'Level 3 Downlines', badge: '3%', badgeColor: 'bg-blue-50 text-blue-700' },
  { value: '4', label: 'Level 4 Downlines', badge: '2%', badgeColor: 'bg-amber-50 text-amber-700' },
  { value: '5', label: 'Level 5 Downlines', badge: '1%', badgeColor: 'bg-emerald-50 text-emerald-700' },
];

const STATUS_OPTIONS: AffiliateSelectOption[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active Members', badge: 'Active', badgeColor: 'bg-emerald-50 text-emerald-800' },
  { value: 'inactive', label: 'Inactive Members', badge: 'Inactive', badgeColor: 'bg-stone-100 text-stone-600' },
];

const DEFAULT_PROFILE_AVATAR = '/assets/ilovesurprises/Profile/profile%20image.webp';

export const ReferralTeamList: React.FC<ReferralTeamListProps> = ({
  members,
  repUsername = '',
}) => {
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const qual = qualificationService.getCachedQualification(repUsername);
  const isQualified = qual.isQualified;

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.repUsername.toLowerCase().includes(q) ||
        m.rank.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (levelFilter !== 'all' && m.level !== parseInt(levelFilter)) {
        return false;
      }

      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [members, search, levelFilter, statusFilter]);

  const getRankBadge = (rank: ReferralMember['rank']) => {
    switch (rank) {
      case 'Diamond Ambassador':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Gold Leader':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Silver Representative':
        return 'bg-stone-100 text-stone-900 border-stone-300';
      default:
        return 'bg-red-100 text-red-900 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-4 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f5eaf1]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915]">
            <Users className="w-3.5 h-3.5" />
            <span>Downline Team Roster</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
            All 5-Tier Representative Members ({filteredMembers.length})
          </h3>
        </div>
      </div>

      {/* Downline Commission Qualification Banner */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
          isQualified
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <span className="font-bold flex items-center gap-1.5">
          {isQualified ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          )}
          <span>
            Team Commission Qualification:{' '}
            {isQualified ? (
              <span className="text-emerald-800">✓ Qualified for this month</span>
            ) : (
              <span className="text-amber-800">
                Not qualified — $125 qualifying retail customer sales required.
              </span>
            )}
          </span>
        </span>
        <span className="text-[11px] text-[#716d77] font-medium">
          Personal purchases excluded from qualification threshold
        </span>
      </div>

      {/* Filter Bar with Custom Luxury Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-2.5">
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search representative by name, handle, or rank..."
            className="w-full h-[40px] sm:h-[42px] pl-9 pr-8 rounded-[13px] bg-white border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs text-[#141219] outline-none shadow-2xs transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="w-5 h-5 rounded-full bg-stone-200 text-stone-600 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[10px] cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="sm:col-span-4">
          <AffiliateCustomSelect
            options={LEVEL_OPTIONS}
            value={levelFilter}
            onChange={setLevelFilter}
            icon={<Filter className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="sm:col-span-3">
          <AffiliateCustomSelect
            options={STATUS_OPTIONS}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {/* Roster Cards / Table */}
      {filteredMembers.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-[18px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
          <Users className="w-10 h-10 text-[#d9cbd5] mx-auto mb-2" />
          <h4 className="text-sm font-black text-[#141219] mb-1">
            {members.length === 0 ? 'No downline team members yet' : 'No Team Members Found'}
          </h4>
          <p className="text-xs text-[#716d77]">
            {members.length === 0 ? 'Representatives who sign up using your referral link will appear in your 5-tier network.' : 'Try clearing your search query or level filters.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card List View (< md) */}
          <div className="block md:hidden space-y-2.5">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="p-3.5 rounded-[16px] bg-[#fffcfd] border border-[#eedbe6] space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={member.avatar || DEFAULT_PROFILE_AVATAR}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover border border-[#fecdd3] shrink-0"
                    />
                    <div>
                      <strong className="font-bold text-xs text-[#141219] block leading-tight">
                        {member.name}
                      </strong>
                      <span className="text-[10px] text-[#8a858f] font-mono">
                        @{member.repUsername}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      member.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                  <span className="font-black uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Level {member.level}
                  </span>
                  <span
                    className={`font-black uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getRankBadge(
                      member.rank
                    )}`}
                  >
                    <Award className="w-2.5 h-2.5" />
                    <span>{member.rank}</span>
                  </span>
                </div>

                <div className="pt-2 border-t border-[#f5eaf1] grid grid-cols-3 gap-1 text-center text-xs">
                  <div className="p-1 rounded-[8px] bg-[#fffafc]">
                    <span className="text-[8px] text-[#716d77] uppercase font-bold block">Personal</span>
                    <strong className="text-[11px] font-bold text-[#141219]">${member.personalSales.toFixed(0)}</strong>
                  </div>
                  <div className="p-1 rounded-[8px] bg-[#fffafc]">
                    <span className="text-[8px] text-[#716d77] uppercase font-bold block">Team Vol</span>
                    <strong className="text-[11px] font-bold text-[#716d77]">${member.teamSales.toFixed(0)}</strong>
                  </div>
                  <div className="p-1 rounded-[8px] bg-emerald-50 border border-emerald-100">
                    <span className="text-[8px] text-emerald-800 uppercase font-bold block">Earned</span>
                    <strong className="text-[11px] font-black text-emerald-700">+${member.commissionGenerated.toFixed(0)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto rounded-[18px] border border-[#eedbe6]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fff5f9] border-b border-[#eedbe6] text-[#716d77] font-black uppercase text-[10px] tracking-wider">
                  <th className="p-3 pl-4">Member & Handle</th>
                  <th className="p-3">Sponsor Tier</th>
                  <th className="p-3">Rank Title</th>
                  <th className="p-3 text-right">Personal Sales</th>
                  <th className="p-3 text-right">Team Volume</th>
                  <th className="p-3 text-right">Commission Earned</th>
                  <th className="p-3 pr-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7eff4]">
                {filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-[#fffafc] transition-colors">
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={member.avatar || DEFAULT_PROFILE_AVATAR}
                          alt={member.name}
                          className="w-8 h-8 rounded-full object-cover border border-[#fecdd3]"
                        />
                        <div>
                          <strong className="font-bold text-[#141219] block leading-tight">
                            {member.name}
                          </strong>
                          <span className="text-[10px] text-[#8a858f] font-mono">
                            @{member.repUsername}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        Level {member.level}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border inline-flex items-center gap-1 ${getRankBadge(
                          member.rank
                        )}`}
                      >
                        <Award className="w-2.5 h-2.5" />
                        <span>{member.rank}</span>
                      </span>
                    </td>

                    <td className="p-3 text-right font-medium text-[#141219]">
                      ${member.personalSales.toFixed(2)}
                    </td>

                    <td className="p-3 text-right font-medium text-[#716d77]">
                      ${member.teamSales.toFixed(2)}
                    </td>

                    <td className="p-3 text-right">
                      <strong className="font-black text-emerald-700">
                        ${member.commissionGenerated.toFixed(2)}
                      </strong>
                    </td>

                    <td className="p-3 pr-4 text-right">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          member.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};
