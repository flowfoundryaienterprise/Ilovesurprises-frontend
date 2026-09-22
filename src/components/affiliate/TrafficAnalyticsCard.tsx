import React from 'react';
import {
  MousePointerClick,
  Users,
  TrendingUp,
  Percent,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import type { AffiliateStats } from '../../types';

interface TrafficAnalyticsCardProps {
  stats: AffiliateStats;
}

export const TrafficAnalyticsCard: React.FC<TrafficAnalyticsCardProps> = ({ stats }) => {
  const totalClicks = 0;
  const uniqueVisitors = 0;
  const conversions = Math.round(totalClicks * (stats.conversionRate / 100));
  const avgOrderValue = 0;

  const trafficSources: Array<{ name: string; visits: number; percent: number; color: string }> = [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 4 Main Key Performance Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Clicks & Visits */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#716d77]">Total Clicks & Visits</span>
            <div className="w-8 h-8 rounded-xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center">
              <MousePointerClick className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#141219]">{totalClicks.toLocaleString()}</div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            Storefront link visits
          </span>
        </div>

        {/* Metric 2: Unique Visitors */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#716d77]">Unique Visitors</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#141219]">{uniqueVisitors.toLocaleString()}</div>
          <span className="text-[11px] text-[#716d77] font-medium block mt-1">Unique first-time visitors</span>
        </div>

        {/* Metric 3: Total Conversions */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#716d77]">Attributed Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#141219]">{conversions} Orders</div>
          <span className="text-[11px] text-[#716d77] font-medium block mt-1">
            Avg Order: ${avgOrderValue.toFixed(2)}
          </span>
        </div>

        {/* Metric 4: Conversion Rate */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#716d77]">Conversion Rate</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#141219]">{stats.conversionRate}%</div>
          <span className="text-[11px] text-stone-500 font-medium block mt-1">
            Storefront conversion
          </span>
        </div>
      </div>

      {/* Traffic Sources & Attribution Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left: Traffic Acquisition Breakdown */}
        <div className="lg:col-span-7 rounded-[22px] bg-white border border-[#eee0e9] p-5 sm:p-6 shadow-2xs">
          <h4 className="text-sm sm:text-base font-black text-[#141219] font-display m-0 mb-1">
            Traffic Channels & Inbound Sources
          </h4>
          <p className="text-xs text-[#716d77] m-0 mb-5">
            Where your customers find and visit your personal storefront link
          </p>

          <div className="space-y-3.5">
            {trafficSources.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#716d77]">
                No traffic sources recorded yet. Share your personal storefront link to start receiving customer visits.
              </div>
            ) : (
              trafficSources.map((source) => (
                <div key={source.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#141219]">{source.name}</span>
                    <span className="text-[#716d77]">
                      {source.visits} visits ({source.percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-[#f4edf2] rounded-full overflow-hidden">
                    <div
                      className={`h-full ${source.color} rounded-full transition-all duration-500`}
                      style={{ width: `${source.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


        {/* Right: Attribution Window Rules Card */}
        <div className="lg:col-span-5 rounded-[22px] bg-gradient-to-br from-[#fffafb] via-white to-[#fff6f8] border border-[#f1dbe8] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-[#D30915]" />
              <h4 className="text-sm sm:text-base font-black text-[#141219] font-display m-0">
                60-Day Attribution Guarantee
              </h4>
            </div>
            <p className="text-xs text-[#55505a] leading-relaxed mb-4">
              When a customer visits via your link (<strong>ilovesurprises.com/{stats.repUsername}</strong>), an
              attribution cookie is securely maintained across products, collections, cart, and checkout.
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-[#2c2830]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>60-day customer attribution window</span>
              </div>
              <div className="flex items-start gap-2 text-[#2c2830]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Credited even if customer closes browser & returns later</span>
              </div>
              <div className="flex items-start gap-2 text-[#2c2830]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Full protection against self-referral & duplicate attribution</span>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#f5e6ee] flex items-center justify-between text-[11px] text-[#716d77]">
            <span>Window Configured in Admin: 60 Days</span>
            <span className="font-bold text-[#D30915]">Cookie ID: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
