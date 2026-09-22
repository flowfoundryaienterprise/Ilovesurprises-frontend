import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Award,
  Search,
  Maximize2,
  Minimize2,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  List,
  GitFork,
} from 'lucide-react';
import type { ReferralMember } from '../../types';

interface GenealogyTreeProps {
  treeData: ReferralMember[];
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

const DEFAULT_PROFILE_AVATAR = '/assets/ilovesurprises/Profile/profile%20image.webp';

const LEVEL_COLORS: Record<
  number,
  { bg: string; text: string; border: string; label: string; rate: string; pill: string }
> = {
  1: {
    bg: 'bg-red-50',
    text: 'text-[#D30915]',
    border: 'border-[#fecdd3]',
    label: 'Level 1 (Direct)',
    rate: '5% Override',
    pill: 'bg-[#fff1f2] text-[#D30915] border-[#fecdd3]',
  },
  2: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200',
    label: 'Level 2',
    rate: '4% Override',
    pill: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  3: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    label: 'Level 3',
    rate: '3% Override',
    pill: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  4: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    label: 'Level 4',
    rate: '2% Override',
    pill: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  5: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    label: 'Level 5',
    rate: '1% Override',
    pill: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
};

export const GenealogyTree: React.FC<GenealogyTreeProps> = ({
  treeData,
  onShowToast,
}) => {
  // Collect all node IDs initially
  const allNodeIds = useMemo(() => {
    const ids: string[] = [];
    const traverse = (node: ReferralMember) => {
      ids.push(node.id);
      if (node.children) node.children.forEach(traverse);
    };
    treeData.forEach(traverse);
    return ids;
  }, [treeData]);

  // Set of expanded node IDs (Default: Expand Level 1 & Level 2)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    treeData.forEach((l1) => {
      initial.add(l1.id);
      if (l1.children) {
        l1.children.forEach((l2) => initial.add(l2.id));
      }
    });
    return initial;
  });

  const [search, setSearch] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [selectedMember, setSelectedMember] = useState<ReferralMember | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedIds(new Set(allNodeIds));
    onShowToast('Expanded all 5 genealogy tiers', { type: 'info' });
  };

  const handleCollapseAll = () => {
    setExpandedIds(new Set());
    onShowToast('Collapsed all downline tiers', { type: 'info' });
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(1.3, prev + 0.1));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(0.7, prev - 0.1));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
  };

  // Node Component Render (Recursive for Canvas View)
  const renderTreeNode = (node: ReferralMember, depth: number = 1) => {
    const isExpanded = expandedIds.has(node.id);
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const levelInfo = LEVEL_COLORS[node.level] || LEVEL_COLORS[1];
    const isMatched = search.trim() && (
      node.name.toLowerCase().includes(search.toLowerCase()) ||
      node.repUsername.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div key={node.id} className="relative flex flex-col items-center">
        {/* Node Member Card */}
        <div
          onClick={() => setSelectedMember(node)}
          className={`w-[240px] sm:w-[280px] bg-white rounded-[18px] sm:rounded-[22px] p-3 sm:p-4 border-2 transition-all duration-200 cursor-pointer text-left relative z-10 shadow-[0_6px_20px_rgba(50,31,63,0.06)] hover:shadow-[0_10px_30px_rgba(211, 9, 21,0.18)] select-none ${
            isMatched
              ? 'border-[#D30915] ring-4 ring-[#D30915]/25 scale-103'
              : selectedMember?.id === node.id
              ? 'border-[#D30915] ring-2 ring-[#D30915]/20'
              : 'border-[#eedbe6] hover:border-[#fecdd3]'
          }`}
        >
          {/* Top Level Pill Bar */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <span
              className={`text-[8px] sm:text-[9px] font-black uppercase px-2 sm:px-2.5 py-0.5 rounded-full border ${levelInfo.bg} ${levelInfo.text} ${levelInfo.border}`}
            >
              {levelInfo.label} • {levelInfo.rate}
            </span>

            <span
              className={`text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full ${
                node.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {node.status}
            </span>
          </div>

          {/* Member Info */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="relative shrink-0">
              <img
                src={node.avatar || DEFAULT_PROFILE_AVATAR}
                alt={node.name}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#fecdd3] shadow-xs"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0 truncate leading-tight">
                {node.name}
              </h4>
              <span className="text-[10px] text-[#8a858f] font-mono block truncate">
                @{node.repUsername}
              </span>
              <div className="flex items-center gap-1 text-[9px] font-bold text-[#D30915] mt-0.5">
                <Award className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{node.rank}</span>
              </div>
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="mt-2.5 pt-2 border-t border-[#f7eff4] grid grid-cols-3 gap-1 text-center">
            <div className="p-1 sm:p-1.5 rounded-[8px] sm:rounded-[10px] bg-[#fffafc]">
              <span className="text-[8px] text-[#716d77] font-bold uppercase block">Sales</span>
              <strong className="text-[10px] sm:text-[11px] font-black text-[#141219]">
                ${node.personalSales.toFixed(0)}
              </strong>
            </div>

            <div className="p-1 sm:p-1.5 rounded-[8px] sm:rounded-[10px] bg-[#fffafc]">
              <span className="text-[8px] text-[#716d77] font-bold uppercase block">Downlines</span>
              <strong className="text-[10px] sm:text-[11px] font-black text-purple-700">
                {node.totalTeamMembers} Reps
              </strong>
            </div>

            <div className="p-1 sm:p-1.5 rounded-[8px] sm:rounded-[10px] bg-emerald-50/80 border border-emerald-100">
              <span className="text-[8px] text-emerald-800 font-bold uppercase block">Contributed</span>
              <strong className="text-[10px] sm:text-[11px] font-black text-emerald-700">
                +${node.commissionGenerated.toFixed(0)}
              </strong>
            </div>
          </div>

          {/* Expand / Collapse Button if node has children */}
          {hasChildren && (
            <div className="mt-2 pt-2 border-t border-[#f4edf2]">
              <button
                type="button"
                onClick={(e) => toggleNode(node.id, e)}
                className={`w-full min-h-[32px] sm:min-h-[34px] rounded-[10px] text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                  isExpanded
                    ? 'bg-[#fff1f2] text-[#D30915] hover:bg-[#ffe6ef]'
                    : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
                }`}
              >
                {isExpanded ? (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                    <span>Hide {node.children?.length} Downlines</span>
                  </>
                ) : (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    <span>View {node.children?.length} Downlines</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Connecting Lines & Children Container */}
        {hasChildren && isExpanded && (
          <div className="relative pt-6 flex flex-col items-center">
            {/* Vertical stem line down from parent */}
            <div className="w-0.5 h-6 bg-[#eedbe6] absolute top-0 left-1/2 -translate-x-1/2" />

            {/* Horizontal branch bar spanning children */}
            <div className="flex items-start justify-center gap-4 sm:gap-8 pt-2 relative">
              {node.children!.length > 1 && (
                <div
                  className="h-0.5 bg-[#eedbe6] absolute top-2"
                  style={{
                    left: '120px',
                    right: '120px',
                  }}
                />
              )}

              {node.children!.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Vertical branch stem leading down to each child */}
                  <div className="w-0.5 h-4 bg-[#eedbe6] absolute -top-4 left-1/2 -translate-x-1/2" />
                  {renderTreeNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Flat List Hierarchy Mode
  const renderListHierarchy = () => {
    const rows: Array<{ member: ReferralMember; depth: number }> = [];
    const traverse = (node: ReferralMember, depth: number) => {
      rows.push({ member: node, depth });
      if (node.children && expandedIds.has(node.id)) {
        node.children.forEach((c) => traverse(c, depth + 1));
      }
    };
    treeData.forEach((root) => traverse(root, 0));

    return (
      <div className="overflow-x-auto w-full max-w-full min-w-0 rounded-[16px] sm:rounded-[20px] border border-[#eedbe6] bg-white scrollbar-thin">
        <table className="w-full text-left text-xs border-collapse min-w-[620px]">
          <thead>
            <tr className="bg-[#fff5f9] border-b border-[#eedbe6] text-[#716d77] font-black uppercase text-[9px] sm:text-[10px] tracking-wider">
              <th className="p-3 sm:p-3.5 pl-3 sm:pl-4">Downline Hierarchy & Member</th>
              <th className="p-3 sm:p-3.5">Tier Level</th>
              <th className="p-3 sm:p-3.5">Rank</th>
              <th className="p-3 sm:p-3.5 text-right">Personal Sales</th>
              <th className="p-3 sm:p-3.5 text-right">Downlines</th>
              <th className="p-3 sm:p-3.5 text-right">Overrides</th>
              <th className="p-3 sm:p-3.5 pr-3 sm:pr-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7eff4]">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#716d77] font-medium">
                  No downline representatives yet
                </td>
              </tr>
            ) : (
              rows.map(({ member, depth }) => {
              const levelInfo = LEVEL_COLORS[member.level] || LEVEL_COLORS[1];
              const hasChildren = Boolean(member.children && member.children.length > 0);
              const isExpanded = expandedIds.has(member.id);

              return (
                <tr
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="hover:bg-[#fffafc] transition-colors cursor-pointer group"
                >
                  <td className="p-3 sm:p-3.5 pl-3 sm:pl-4">
                    <div
                      className="flex items-center gap-1.5 sm:gap-2"
                      style={{ paddingLeft: `${depth * 14}px` }}
                    >
                      {hasChildren ? (
                        <button
                          type="button"
                          onClick={(e) => toggleNode(member.id, e)}
                          className="w-5 h-5 rounded-md bg-[#fff1f2] text-[#D30915] flex items-center justify-center cursor-pointer shrink-0"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      ) : (
                        <span className="w-5 shrink-0" />
                      )}

                      <img
                        src={member.avatar || DEFAULT_PROFILE_AVATAR}
                        alt={member.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-[#fecdd3] shrink-0"
                      />

                      <div className="min-w-0">
                        <strong className="font-bold text-[#141219] block leading-tight group-hover:text-[#D30915] truncate text-[11px] sm:text-xs">
                          {member.name}
                        </strong>
                        <span className="text-[9px] sm:text-[10px] text-[#8a858f] font-mono truncate block">
                          @{member.repUsername}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="p-3 sm:p-3.5">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border ${levelInfo.bg} ${levelInfo.text} ${levelInfo.border}`}
                    >
                      Level {member.level}
                    </span>
                  </td>

                  <td className="p-3 sm:p-3.5">
                    <span className="text-[10px] sm:text-xs font-bold text-[#55505a]">
                      {member.rank}
                    </span>
                  </td>

                  <td className="p-3 sm:p-3.5 text-right font-mono font-bold text-[#141219]">
                    ${member.personalSales.toFixed(2)}
                  </td>

                  <td className="p-3 sm:p-3.5 text-right font-mono font-bold text-purple-700">
                    {member.totalTeamMembers} Reps
                  </td>

                  <td className="p-3 sm:p-3.5 text-right font-mono font-black text-emerald-700">
                    +${member.commissionGenerated.toFixed(2)}
                  </td>

                  <td className="p-3 sm:p-3.5 pr-3 sm:pr-4 text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase ${
                        member.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                </tr>
              );
            }))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[20px] sm:rounded-[26px] p-4 sm:p-7 lg:p-8 border border-[#eedbe6] shadow-[0_8px_30px_rgba(50,31,63,0.04)] space-y-4 sm:space-y-6 animate-in fade-in duration-200 overflow-hidden">
      {/* 1. Header & Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-[#f5eaf1]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915]">
            <Layers className="w-3.5 h-3.5" />
            <span>Interactive 5-Tier Downline Network</span>
          </div>
          <h3 className="text-base sm:text-2xl font-black text-[#141219] m-0 font-display">
            5-Level Genealogy Sponsor Tree
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-0.5">
            Visualize your multi-tier downline structure, sales volume, and override commissions.
          </p>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#fbf7fc] p-1 rounded-[12px] border border-[#eedbe6]">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-[#D30915] text-white shadow-2xs font-black'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Tree Canvas</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#D30915] text-white shadow-2xs font-black'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List View</span>
            </button>
          </div>

          {/* Search Member */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#8a858f] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tree..."
              className="h-[34px] sm:h-[36px] pl-8 pr-7 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs text-[#141219] outline-none w-full sm:w-44 shadow-2xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="w-4 h-4 rounded-full bg-stone-200 text-stone-600 absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[9px] cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Expand All / Collapse All */}
          <button
            type="button"
            onClick={handleExpandAll}
            className="h-[34px] sm:h-[36px] px-3 sm:px-3.5 rounded-[11px] bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#55505a] hover:text-[#D30915] text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Expand All Nodes"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Expand</span>
          </button>

          <button
            type="button"
            onClick={handleCollapseAll}
            className="h-[34px] sm:h-[36px] px-3 sm:px-3.5 rounded-[11px] bg-white border border-[#eedbe6] hover:border-[#D30915] text-[#55505a] hover:text-[#D30915] text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Collapse All Nodes"
          >
            <Minimize2 className="w-3 h-3" />
            <span>Collapse</span>
          </button>

          {/* Zoom Controls (Canvas View Only) */}
          {viewMode === 'canvas' && (
            <div className="flex items-center gap-1 bg-[#fbf7fc] p-0.5 rounded-[11px] border border-[#eedbe6]">
              <button
                type="button"
                onClick={handleZoomOut}
                className="w-7 h-7 rounded-[8px] hover:bg-white text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold px-1 text-[#141219]">
                {(zoomScale * 100).toFixed(0)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="w-7 h-7 rounded-[8px] hover:bg-white text-[#716d77] hover:text-[#141219] flex items-center justify-center cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="w-7 h-7 rounded-[8px] hover:bg-white text-[#716d77] hover:text-[#D30915] flex items-center justify-center cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 2. 5-Tier Level Indicators Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-2.5 text-center text-xs">
        {Object.entries(LEVEL_COLORS).map(([lvl, info]) => (
          <div
            key={lvl}
            className={`p-2 sm:p-3 rounded-[14px] sm:rounded-[16px] border ${info.bg} ${info.border} flex flex-col items-center justify-center shadow-2xs`}
          >
            <span className={`text-[9px] sm:text-[10px] font-black uppercase ${info.text}`}>
              {info.label}
            </span>
            <strong className="text-[11px] sm:text-sm font-black text-[#141219] mt-0.5">
              {info.rate}
            </strong>
          </div>
        ))}
      </div>

      {/* 3. Main View Area (Canvas Tree or List Hierarchy) */}
      {viewMode === 'canvas' ? (
        <div className="w-full overflow-x-auto overflow-y-hidden border border-[#eedbe6] rounded-[20px] sm:rounded-[24px] bg-[#fffcfd] p-4 sm:p-10 shadow-inner scrollbar-thin">
          <div
            className="inline-flex flex-col items-center min-w-full origin-top transition-transform duration-200 py-2"
            style={{ transform: `scale(${zoomScale})` }}
          >
            {/* Root Leader Node (You) */}
            <div className="flex flex-col items-center mb-6">
              <div className="p-3.5 sm:p-5 rounded-[20px] sm:rounded-[24px] bg-gradient-to-r from-[#D30915] via-[#f43f5e] to-[#ff4785] text-white shadow-[0_12px_32px_rgba(211, 9, 21,0.38)] flex items-center gap-3 sm:gap-4 border-2 border-white ring-4 ring-[#D30915]/25">
                <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full bg-white text-[#D30915] font-black text-base sm:text-xl flex items-center justify-center shadow-xs shrink-0">
                  ★
                </div>
                <div>
                  <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-red-100 block">
                    Top Sponsor Leader (You)
                  </span>
                  <strong className="text-sm sm:text-lg font-black text-white block leading-tight">
                    Your Direct Team Network
                  </strong>
                  <span className="text-[10px] sm:text-[11px] text-red-100 font-medium mt-0.5 block">
                    20% Personal + Up to 15% 5-Tier Overrides (35% Max)
                  </span>
                </div>
              </div>

              {/* Vertical Root Line down to Level 1 */}
              <div className="w-0.5 h-8 bg-[#D30915] mt-2" />
            </div>

            {/* Level 1 Nodes Container */}
            {treeData.length === 0 ? (
              <div className="py-10 text-center text-[#716d77] max-w-sm mx-auto">
                <p className="font-bold text-sm text-[#141219] m-0">No downline representatives yet</p>
                <p className="text-xs m-0 mt-1">Representatives who sign up under your referral link will appear here.</p>
              </div>
            ) : (
              <div className="flex items-start justify-center gap-4 sm:gap-10 pt-2 relative">
                {treeData.length > 1 && (
                  <div
                    className="h-0.5 bg-[#eedbe6] absolute top-2"
                    style={{
                      left: '120px',
                      right: '120px',
                    }}
                  />
                )}

                {treeData.map((l1Member) => (
                  <div key={l1Member.id} className="relative flex flex-col items-center">
                    <div className="w-0.5 h-4 bg-[#eedbe6] absolute -top-4 left-1/2 -translate-x-1/2" />
                    {renderTreeNode(l1Member, 1)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        renderListHierarchy()
      )}

      {/* 4. Selected Member Inspect Modal / Drawer */}
      {selectedMember && (
        <div className="p-4 sm:p-5 rounded-[18px] sm:rounded-[22px] bg-gradient-to-r from-[#fff1f2] via-[#fff8fb] to-[#fbf5ff] border-2 border-[#fecdd3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in shadow-xs">
          <div className="flex items-center gap-3 sm:gap-3.5">
            <img
              src={selectedMember.avatar || DEFAULT_PROFILE_AVATAR}
              alt={selectedMember.name}
              className="w-11 h-11 sm:w-13 sm:h-13 rounded-full object-cover border-2 border-[#D30915] shadow-xs shrink-0"
            />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <strong className="text-sm sm:text-base font-black text-[#141219]">
                  {selectedMember.name}
                </strong>
                <span className="text-[9px] sm:text-[10px] font-black uppercase text-purple-900 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-200">
                  Level {selectedMember.level}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                  {selectedMember.rank}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#716d77] m-0 mt-0.5 truncate">
                @{selectedMember.repUsername} • Joined {selectedMember.joinDate}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 text-xs w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0dae7]">
            <div className="text-left sm:text-right">
              <span className="text-[9px] sm:text-[10px] text-[#716d77] uppercase font-bold block">
                Overrides
              </span>
              <strong className="text-sm sm:text-base font-black text-emerald-700">
                +${selectedMember.commissionGenerated.toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              onClick={() => setSelectedMember(null)}
              className="h-[34px] sm:h-[36px] px-3.5 sm:px-4 rounded-[11px] bg-white border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:text-[#141219] cursor-pointer shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
