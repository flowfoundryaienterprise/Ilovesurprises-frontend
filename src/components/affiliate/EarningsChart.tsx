import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  TrendingUp,
  Layers,
  BarChart2,
  Flame,
  Info,
} from 'lucide-react';
import { affiliateService } from '../../services/affiliateService';

interface ChartPoint {
  label: string;
  shortLabel: string;
  personal: number; // 20% personal sales earnings
  team: number; // 5-level tier overrides
  orders: number;
}

export const EarningsChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [viewStyle, setViewStyle] = useState<'stacked' | 'grouped'>('stacked');
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const chartContainerRef = React.useRef<HTMLDivElement>(null);
  const isTouchRef = React.useRef(false);

  const commissions = useMemo(() => affiliateService.getCommissions(), []);
  const hasCommissions = commissions.length > 0;

  const data: ChartPoint[] = useMemo(() => {
    if (!hasCommissions) {
      if (timeframe === 'daily') {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return days.map((d) => ({ label: d, shortLabel: d, personal: 0, team: 0, orders: 0 }));
      } else if (timeframe === 'weekly') {
        return [
          { label: 'Week 1', shortLabel: 'W1', personal: 0, team: 0, orders: 0 },
          { label: 'Week 2', shortLabel: 'W2', personal: 0, team: 0, orders: 0 },
          { label: 'Week 3', shortLabel: 'W3', personal: 0, team: 0, orders: 0 },
          { label: 'Week 4', shortLabel: 'W4', personal: 0, team: 0, orders: 0 },
        ];
      } else {
        const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
        return months.map((m) => ({ label: m, shortLabel: m, personal: 0, team: 0, orders: 0 }));
      }
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((d) => {
      let personal = 0;
      let team = 0;
      let orders = 0;
      commissions.forEach((c) => {
        if (c.level === 'personal') {
          personal += c.commissionAmount;
        } else {
          team += c.commissionAmount;
        }
        orders += 1;
      });
      return { label: d, shortLabel: d, personal, team, orders };
    });
  }, [commissions, timeframe, hasCommissions]);

  // Click outside to dismiss active tooltip on touch/click
  React.useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent | TouchEvent) => {
      if (chartContainerRef.current && !chartContainerRef.current.contains(e.target as Node)) {
        setActiveHoverIndex(null);
      }
    };
    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('touchstart', handlePointerDownOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('touchstart', handlePointerDownOutside);
    };
  }, []);

  // Compute max values for responsive scaling
  const maxCombinedVal = Math.max(...data.map((d) => d.personal + d.team), 100);
  const maxSingleVal = Math.max(...data.map((d) => Math.max(d.personal, d.team)), 100);
  const maxVal = viewStyle === 'stacked' ? maxCombinedVal : maxSingleVal;

  const totalPeriodEarnings = data.reduce((sum, d) => sum + d.personal + d.team, 0);
  const totalPersonalEarnings = data.reduce((sum, d) => sum + d.personal, 0);
  const totalTeamEarnings = data.reduce((sum, d) => sum + d.team, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  // Peak earning period
  const peakPeriod = [...data].sort((a, b) => b.personal + b.team - (a.personal + a.team))[0];
  const activeItem = activeHoverIndex !== null ? data[activeHoverIndex] : null;

  return (
    <div
      ref={chartContainerRef}
      className="bg-gradient-to-b from-white via-[#fffdfd] to-[#fff8fb] rounded-[20px] sm:rounded-[28px] p-4 sm:p-7 lg:p-9 border-2 border-[#fecdd3] shadow-[0_12px_36px_rgba(211,9,21,0.06)] space-y-4 sm:space-y-6 relative"
    >
      {/* Soft Ambient Backlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-[#D30915]/8 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl pointer-events-none" />

      {/* 1. Header Toolbar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-[#f5eaf1]">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-2.5 sm:px-3 py-1 rounded-full border border-[#fecdd3] inline-flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Revenue & Commission Analytics</span>
            </span>

            <span className="text-[9px] sm:text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ● Live Real-Time Ledger
            </span>
          </div>

          <h3 className="text-lg sm:text-2xl font-black text-[#141219] m-0 font-display">
            Personal & 5-Tier Downline Revenue Growth
          </h3>
          <p className="text-xs sm:text-sm text-[#716d77] m-0 mt-1">
            {hasCommissions ? (
              <>
                Total Revenue in Selected Period: <strong className="text-emerald-700 font-black">${totalPeriodEarnings.toFixed(2)}</strong> across <strong className="text-[#141219] font-bold">{totalOrders} customer orders</strong>
              </>
            ) : (
              'No commissions recorded yet'
            )}
          </p>
        </div>

        {/* Controls: Timeframe + Bar View Switcher */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap self-start lg:self-auto w-full sm:w-auto">
          {/* View Mode (Stacked vs Grouped) */}
          <div className="flex items-center gap-1 bg-[#fffafc] p-1 rounded-[12px] sm:rounded-[13px] border border-[#eedbe6] shadow-2xs flex-1 sm:flex-initial justify-center">
            <button
              type="button"
              onClick={() => setViewStyle('stacked')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial ${
                viewStyle === 'stacked'
                  ? 'bg-[#D30915] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
              title="Stacked Pillar View"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Stacked</span>
            </button>

            <button
              type="button"
              onClick={() => setViewStyle('grouped')}
              className={`px-2.5 sm:px-3 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer flex-1 sm:flex-initial ${
                viewStyle === 'grouped'
                  ? 'bg-[#D30915] text-white font-black shadow-xs'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
              title="Side-by-Side Comparison"
            >
              <BarChart2 className="w-3.5 h-3.5 shrink-0" />
              <span>Side-by-Side</span>
            </button>
          </div>

          {/* Timeframe Filter Tabs */}
          <div className="flex items-center gap-1 bg-[#fffafc] p-1 rounded-[12px] sm:rounded-[13px] border border-[#eedbe6] shadow-2xs flex-1 sm:flex-initial justify-center">
            {(['monthly', 'weekly', 'daily'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setTimeframe(t);
                  setActiveHoverIndex(null);
                }}
                className={`px-2.5 sm:px-3.5 py-1.5 rounded-[9px] sm:rounded-[10px] text-[11px] sm:text-xs font-bold capitalize transition-all cursor-pointer flex-1 sm:flex-initial text-center ${
                  timeframe === t
                    ? 'bg-[#141219] text-white font-black shadow-xs'
                    : 'text-[#716d77] hover:text-[#141219]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5">
        {/* Personal Sales Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#fff1f2] border-2 border-[#fecdd3] shadow-xs flex items-center justify-between group hover:border-[#D30915] transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-[#D30915] to-[#ff4785] text-white flex items-center justify-center shadow-xs shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-[#D30915] block">
                Personal 20% Direct Sales
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${totalPersonalEarnings.toFixed(2)}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-[#D30915] bg-white px-2 sm:px-2.5 py-1 rounded-full border border-[#fecdd3] shadow-2xs shrink-0">
            {totalPeriodEarnings > 0 ? ((totalPersonalEarnings / totalPeriodEarnings) * 100).toFixed(0) : '0'}%
          </span>
        </div>

        {/* 5-Tier Overrides Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#fbf5ff] border-2 border-purple-200 shadow-xs flex items-center justify-between group hover:border-purple-400 transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-purple-800 block">
                5-Tier Overrides (1-5%)
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${totalTeamEarnings.toFixed(2)}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-xs font-black text-purple-800 bg-white px-2 sm:px-2.5 py-1 rounded-full border border-purple-200 shadow-2xs shrink-0">
            {totalPeriodEarnings > 0 ? ((totalTeamEarnings / totalPeriodEarnings) * 100).toFixed(0) : '0'}%
          </span>
        </div>

        {/* Momentum & Peak Card */}
        <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-white to-[#f0fdf4] border-2 border-emerald-200 shadow-xs flex items-center justify-between group hover:border-emerald-400 transition-all">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] sm:rounded-[12px] bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="text-[9px] sm:text-[10px] uppercase font-black text-emerald-800 block">
                Peak Velocity
              </span>
              <strong className="text-base sm:text-xl font-black text-[#141219]">
                ${peakPeriod ? (peakPeriod.personal + peakPeriod.team).toFixed(2) : '0.00'}
              </strong>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] font-black text-emerald-800 bg-emerald-100 px-2 sm:px-2.5 py-1 rounded-full shrink-0">
            ★ {peakPeriod && peakPeriod.personal + peakPeriod.team > 0 ? peakPeriod.shortLabel : 'None'}
          </span>
        </div>
      </div>

      {/* 3. The World-Class Interactive Bar Chart Canvas */}
      <div className="bg-white rounded-[18px] sm:rounded-[24px] p-3.5 sm:p-6 lg:p-7 border border-[#eedbe6] shadow-inner space-y-4">
        {/* Chart Legend */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 flex-wrap text-xs pb-3 border-b border-[#f5eaf1]">
          <div className="flex items-center gap-3 sm:gap-4 font-bold text-[#55505a] flex-wrap text-[11px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] sm:rounded-[6px] bg-gradient-to-t from-[#D30915] to-[#ff4785] shadow-xs shrink-0" />
              <span className="text-[#141219]">Personal Direct (20%)</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[5px] sm:rounded-[6px] bg-gradient-to-t from-purple-700 to-indigo-500 shadow-xs shrink-0" />
              <span className="text-[#141219]">5-Tier Overrides (1-5%)</span>
            </div>
          </div>

          <span className="text-[10px] sm:text-[11px] text-[#8a858f] font-medium inline-flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#D30915]" />
            <span>Tap any bar for full tier breakdown</span>
          </span>
        </div>

        {/* Stage Wrapper with Safe Headroom for Tooltips */}
        <div className="relative pt-24 sm:pt-28 pb-2">
          {/* Chart Core Stage (Grid + Bars sharing identical coordinate space) */}
          <div className="relative h-56 sm:h-72">
            {/* Y-Axis Horizontal Grid Reference Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-60">
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${maxVal.toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.75).toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.5).toFixed(0)}
              </div>
              <div className="border-b border-dashed border-[#ecdbe6] w-full flex items-center justify-end pr-2 text-[9px] font-mono text-[#8a858f]">
                ${(maxVal * 0.25).toFixed(0)}
              </div>
              <div className="border-b border-stone-200 w-full" />
            </div>

            {/* Bars Stage */}
            <div className="h-full flex items-end justify-between gap-1.5 sm:gap-6 px-1 sm:px-6 relative z-10">
              {!hasCommissions ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-center py-12">
                  <BarChart2 className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                  <p className="font-bold text-sm text-[#141219] m-0">No commissions recorded yet</p>
                  <p className="text-xs text-[#716d77] m-0 mt-1 max-w-sm">
                    Personal retail customer orders and 5-tier overrides will automatically chart here in real-time.
                  </p>
                </div>
              ) : (
                data.map((item, idx) => {
                const total = item.personal + item.team;
                const totalHeightPercent = (total / maxVal) * 100;
                const personalHeightPercent = (item.personal / maxVal) * 100;
                const teamHeightPercent = (item.team / maxVal) * 100;

                const personalRatio = (item.personal / total) * 100;
                const teamRatio = (item.team / total) * 100;

                const isHovered = activeHoverIndex === idx;

                // Responsive positioning to prevent overflow clipping on left/right edges
                const isFirst = idx === 0;
                const isLast = idx === data.length - 1;
                const isNearLeft = idx === 1 && data.length > 4;
                const isNearRight = idx === data.length - 2 && data.length > 4;

                let tooltipPosClass = 'left-1/2 -translate-x-1/2';
                let arrowPosClass = 'left-1/2 -translate-x-1/2';

                if (isFirst) {
                  tooltipPosClass = 'left-0 sm:left-1/2 sm:-translate-x-1/2';
                  arrowPosClass = 'left-5 sm:left-1/2 sm:-translate-x-1/2';
                } else if (isLast) {
                  tooltipPosClass = 'right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2';
                  arrowPosClass = 'right-5 sm:right-auto sm:left-1/2 sm:-translate-x-1/2';
                } else if (isNearLeft) {
                  tooltipPosClass = '-left-4 sm:left-1/2 sm:-translate-x-1/2';
                  arrowPosClass = 'left-9 sm:left-1/2 sm:-translate-x-1/2';
                } else if (isNearRight) {
                  tooltipPosClass = '-right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2';
                  arrowPosClass = 'right-9 sm:right-auto sm:left-1/2 sm:-translate-x-1/2';
                }

                return (
                  <div
                    key={item.label}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveHoverIndex((prev) => (prev === idx ? null : idx));
                    }}
                    onTouchStart={() => {
                      isTouchRef.current = true;
                    }}
                    onMouseEnter={() => {
                      if (isTouchRef.current) return;
                      setActiveHoverIndex(idx);
                    }}
                    onMouseLeave={() => {
                      if (isTouchRef.current) return;
                      setActiveHoverIndex(null);
                    }}
                    className="flex-1 flex flex-col items-center justify-end h-full relative group cursor-pointer select-none"
                  >
                    {/* Floating Luxury Tooltip Card */}
                    {isHovered && (
                      <div
                        className={`absolute bottom-full mb-3 ${tooltipPosClass} z-30 pointer-events-none animate-in zoom-in-95 duration-150`}
                      >
                        <div className="bg-[#141219] text-white p-2.5 sm:p-3 rounded-[14px] shadow-2xl border border-white/20 min-w-[150px] sm:min-w-[170px] text-xs space-y-1.5 backdrop-blur-md">
                          <div className="flex items-center justify-between border-b border-white/10 pb-1">
                            <span className="font-bold text-[10px] sm:text-xs text-[#eedbe6]">
                              {item.label}
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded">
                              {item.orders} orders
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-red-300">
                              <span className="w-2 h-2 rounded-full bg-[#D30915] shadow-xs" />
                              <span>Direct (20%):</span>
                            </span>
                            <strong className="text-white font-mono">${item.personal.toFixed(2)}</strong>
                          </div>

                          <div className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5 text-purple-300">
                              <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs" />
                              <span>Overrides (1-5%):</span>
                            </span>
                            <strong className="text-white font-mono">${item.team.toFixed(2)}</strong>
                          </div>

                          <div className="pt-1.5 mt-1 border-t border-white/15 flex items-center justify-between gap-3">
                            <span className="font-black text-emerald-400">Total:</span>
                            <strong className="text-emerald-400 font-mono font-black text-xs sm:text-sm">
                              ${total.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* Tooltip Arrow */}
                        <div
                          className={`w-2.5 h-2.5 bg-[#141219] rotate-45 absolute -bottom-1 ${arrowPosClass} border-r border-b border-white/20`}
                        />
                      </div>
                    )}

                    {/* Floating Total Value Pill directly over top of bar */}
                    <div
                      className={`mb-1.5 sm:mb-2 transition-all duration-200 text-[9px] sm:text-[11px] font-black font-mono px-1.5 sm:px-2 py-0.5 rounded-full shadow-2xs ${
                        isHovered
                          ? 'bg-[#D30915] text-white scale-110 shadow-md ring-2 ring-[#D30915]/30'
                          : 'bg-white/90 text-[#141219] border border-[#eedbe6]'
                      }`}
                    >
                      ${total.toFixed(0)}
                    </div>

                    {/* Light Pillar Track Column */}
                    <div
                      className={`w-full max-w-[44px] sm:max-w-[56px] h-full flex items-end justify-center rounded-t-[14px] sm:rounded-t-[18px] p-1 sm:p-1.5 transition-all ${
                        isHovered ? 'bg-[#fff1f2] ring-2 ring-[#D30915]/20' : 'bg-[#fff8fb]/70 group-hover:bg-[#fff1f2]'
                      }`}
                    >
                      {viewStyle === 'stacked' ? (
                        /* Mode 1: 3D Stacked Pillar */
                        <div
                          className={`w-full rounded-t-[10px] sm:rounded-t-[14px] overflow-hidden transition-all duration-300 flex flex-col-reverse shadow-md relative ${
                            isHovered
                              ? 'scale-103 shadow-[0_10px_24px_rgba(211,9,21,0.35)] brightness-105'
                              : ''
                          }`}
                          style={{ height: `${Math.max(14, totalHeightPercent)}%` }}
                        >
                          {/* Top Gloss Highlight Cap */}
                          <div className="absolute top-0 inset-x-0 h-1 bg-white/40 z-10" />

                          {/* Personal Tier (Bottom Stack) */}
                          <div
                            className="bg-gradient-to-t from-[#D30915] via-[#ff3b7d] to-[#ff5388] transition-all relative"
                            style={{ height: `${personalRatio}%` }}
                          />

                          {/* Team Overrides Tier (Top Stack) */}
                          <div
                            className="bg-gradient-to-t from-purple-700 via-purple-600 to-indigo-500 transition-all border-b border-white/20"
                            style={{ height: `${teamRatio}%` }}
                          />
                        </div>
                      ) : (
                        /* Mode 2: Side-by-Side Dual Pillars */
                        <div className="w-full h-full flex items-end justify-center gap-1 sm:gap-1.5">
                          {/* Personal Bar */}
                          <div
                            className="flex-1 rounded-t-[8px] sm:rounded-t-[10px] bg-gradient-to-t from-[#D30915] to-[#ff4785] transition-all duration-300 relative shadow-xs"
                            style={{ height: `${Math.max(12, personalHeightPercent)}%` }}
                          >
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/50" />
                          </div>

                          {/* Team Overrides Bar */}
                          <div
                            className="flex-1 rounded-t-[8px] sm:rounded-t-[10px] bg-gradient-to-t from-purple-700 to-indigo-500 transition-all duration-300 relative shadow-xs"
                            style={{ height: `${Math.max(12, teamHeightPercent)}%` }}
                          >
                            <div className="absolute top-0 inset-x-0 h-0.5 bg-white/50" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Label Tag */}
                    <div className="mt-2 text-center w-full">
                      <span
                        className={`block text-[9px] sm:text-xs font-bold truncate transition-colors ${
                          isHovered ? 'text-[#D30915] font-black' : 'text-[#55505a] group-hover:text-[#D30915]'
                        }`}
                      >
                        {item.shortLabel}
                      </span>
                    </div>
                  </div>
                );
              })
              )}
            </div>
          </div>
        </div>

        {/* 4. Active Period Breakdown Details Banner when a bar is selected */}
        {activeItem && (
          <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[20px] bg-gradient-to-br from-[#141219] via-[#1c1824] to-[#251520] text-white border border-[#fecdd3]/40 shadow-lg space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] font-black uppercase tracking-wider text-[#ff4785] bg-white/10 px-2 py-0.5 rounded-full border border-white/10 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#ff4785]" />
                  <span>Selected Period</span>
                </span>
                <strong className="text-xs sm:text-sm font-black text-white font-display">
                  {activeItem.label}
                </strong>
                <span className="text-[10px] text-white/70 font-mono">
                  ({activeItem.orders} Orders)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  ${(activeItem.personal + activeItem.team).toFixed(2)} Total
                </span>
                <button
                  type="button"
                  onClick={() => setActiveHoverIndex(null)}
                  className="text-white/60 hover:text-white bg-white/10 hover:bg-white/20 text-[10px] px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
                >
                  Dismiss ✕
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-white/5 rounded-[12px] p-2 sm:p-2.5 border border-white/10">
                <span className="text-[9px] uppercase font-bold text-red-300 block">
                  Personal (20%)
                </span>
                <strong className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                  ${activeItem.personal.toFixed(2)}
                </strong>
                <span className="text-[9px] text-[#f4d1e2] block">
                  Direct Customer Sales
                </span>
              </div>

              <div className="bg-white/5 rounded-[12px] p-2.5 border border-white/10">
                <span className="text-[9px] uppercase font-bold text-purple-300 block">
                  Team Overrides (1-5%)
                </span>
                <strong className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                  ${activeItem.team.toFixed(2)}
                </strong>
                <span className="text-[9px] text-purple-200 block">
                  5-Tier Sponsor Network
                </span>
              </div>

              <div className="bg-white/5 rounded-[12px] p-2.5 border border-white/10">
                <span className="text-[9px] uppercase font-bold text-amber-300 block">
                  Total Orders
                </span>
                <strong className="text-sm sm:text-base font-black text-white font-mono block mt-0.5">
                  {activeItem.orders} Orders
                </strong>
                <span className="text-[9px] text-amber-200 block">
                  Avg ${( (activeItem.personal / 0.20) / (activeItem.orders || 1) ).toFixed(0)} / order
                </span>
              </div>

              <div className="bg-emerald-500/10 rounded-[12px] p-2.5 border border-emerald-400/30">
                <span className="text-[9px] uppercase font-black text-emerald-400 block">
                  Total Commission
                </span>
                <strong className="text-sm sm:text-base font-black text-emerald-400 font-mono block mt-0.5">
                  ${(activeItem.personal + activeItem.team).toFixed(2)}
                </strong>
                <span className="text-[9px] text-emerald-300 font-bold block">
                  ✓ Direct Payout 15th
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Performance Footer Note */}
        <div className="pt-3 border-t border-[#f5eaf1] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[10px] sm:text-[11px] text-[#716d77]">
          <span>
            Highest Earning Month: <strong className="text-[#141219]">{peakPeriod.label} (${(peakPeriod.personal + peakPeriod.team).toFixed(2)})</strong>
          </span>
          <span className="text-emerald-700 font-bold">
            ✓ Automated Monthly Direct Payouts Active (15th of each month)
          </span>
        </div>
      </div>
    </div>
  );
};
