import React from 'react';

export const AdminKpiSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 sm:p-5 rounded-2xl bg-white border border-[#eedbe6]/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-24 h-4 bg-gray-200 rounded-md" />
            <div className="w-8 h-8 bg-gray-200 rounded-xl" />
          </div>
          <div className="w-32 h-8 bg-gray-300 rounded-lg" />
          <div className="w-20 h-3 bg-gray-100 rounded-md" />
        </div>
      ))}
    </div>
  );
};

export const AdminTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full bg-white rounded-2xl border border-[#eedbe6] p-4 sm:p-6 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="w-48 h-6 bg-gray-200 rounded-md" />
        <div className="w-32 h-8 bg-gray-200 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-1.5">
                <div className="w-28 h-4 bg-gray-200 rounded-md" />
                <div className="w-20 h-3 bg-gray-100 rounded-md" />
              </div>
            </div>
            <div className="hidden sm:block w-24 h-4 bg-gray-200 rounded-md" />
            <div className="w-16 h-6 bg-gray-200 rounded-full" />
            <div className="w-12 h-6 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const AdminChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#eedbe6] p-5 shadow-xs animate-pulse space-y-4">
      <div className="flex items-center justify-between">
        <div className="w-40 h-5 bg-gray-200 rounded-md" />
        <div className="w-24 h-6 bg-gray-200 rounded-md" />
      </div>
      <div className="w-full h-48 bg-gray-100 rounded-xl flex items-end justify-between p-4 gap-2">
        {[40, 65, 30, 85, 55, 95, 75].map((h, i) => (
          <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-gray-200 rounded-t-md" />
        ))}
      </div>
    </div>
  );
};
