import React, { useState, useMemo } from 'react';
import { ShoppingBag, Search, Download, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import type { CommissionRecord } from '../../types';

interface SalesRosterTableProps {
  commissions: CommissionRecord[];
}

export const SalesRosterTable: React.FC<SalesRosterTableProps> = ({ commissions }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'qualified' | 'pending' | 'reversed'>('all');

  const salesRecords = useMemo(() => {
    return commissions.map((c) => ({
      id: c.id,
      orderId: c.orderId,
      date: c.orderDate,
      // Customer-safe display (First Name + Last Initial)
      customerSafe: c.customerName
        .split(' ')
        .map((n, i) => (i === 0 ? n : `${n.charAt(0)}.`))
        .join(' '),
      itemsDescription: c.productName,
      orderAmount: c.orderAmount,
      commissionAmount: c.commissionAmount,
      status: c.status === 'reversed' ? 'reversed' : c.status === 'pending' ? 'pending' : 'qualified',
      levelLabel: c.levelLabel,
    }));
  }, [commissions]);

  const filtered = useMemo(() => {
    return salesRecords.filter((s) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.orderId.toLowerCase().includes(q) ||
        s.customerSafe.toLowerCase().includes(q) ||
        s.itemsDescription.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      return true;
    });
  }, [salesRecords, search, filterStatus]);

  const totalSalesVolume = useMemo(
    () => filtered.reduce((acc, curr) => acc + (curr.status !== 'reversed' ? curr.orderAmount : 0), 0),
    [filtered]
  );

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer (Safe)', 'Product', 'Order Total', 'Commission', 'Status'];
    const rows = filtered.map((r) => [
      r.orderId,
      r.date,
      `"${r.customerSafe}"`,
      `"${r.itemsDescription}"`,
      r.orderAmount.toFixed(2),
      r.commissionAmount.toFixed(2),
      r.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `ILS_Representative_Sales_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-[22px] bg-white border border-[#eee0e9] shadow-[0_10px_32px_rgba(50,31,63,0.05)] overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 sm:p-6 border-b border-[#f4ebf1] flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-white to-[#fffbfe]">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D30915]" />
            <h3 className="text-base sm:text-lg font-black text-[#141219] font-display m-0">
              Representative Sales Orders
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
              {filtered.length} Orders
            </span>
          </div>
          <p className="text-xs text-[#716d77] mt-0.5">
            Customer-safe order details and qualifying commission attribution
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#fffafb] border border-[#f5e6ee] text-right">
            <span className="text-[10px] text-[#8a858f] font-semibold block">Qualified Volume</span>
            <span className="text-sm font-black text-[#141219]">${totalSalesVolume.toFixed(2)}</span>
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-xl border border-[#ecdfe2] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3.5 sm:p-4 bg-[#fffafb] border-b border-[#f4ebf1] flex flex-wrap items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input
            type="text"
            placeholder="Search order ID, product or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white border border-[#ebdbe5] focus:border-[#D30915] text-xs outline-none"
          />
          <Search className="w-4 h-4 text-[#9c95a0] absolute left-2.5 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          {(['all', 'qualified', 'pending', 'reversed'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-[#D30915] text-white shadow-xs'
                  : 'bg-white text-[#645c68] border border-[#ebdbe5] hover:border-[#D30915]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-x-auto w-full max-w-full min-w-0 scrollbar-thin">
        <table className="w-full text-left text-xs text-[#141219]">
          <thead className="bg-[#faf5f8] border-b border-[#f0e4ec] text-[11px] uppercase font-black tracking-wider text-[#716d77]">
            <tr>
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Surprise Product</th>
              <th className="py-3 px-4 text-right">Order Value</th>
              <th className="py-3 px-4 text-right">Commission</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f7eff4]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-[#8a858f]">
                  {commissions.length === 0 ? 'No orders yet.' : 'No sales orders found matching this filter.'}
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="hover:bg-[#fff9fa] transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#D30915]">{order.orderId}</td>
                  <td className="py-3 px-4 text-[#716d77]">{order.date}</td>
                  <td className="py-3 px-4 font-semibold">{order.customerSafe}</td>
                  <td className="py-3 px-4 max-w-[220px] truncate text-[#55505a]">{order.itemsDescription}</td>
                  <td className="py-3 px-4 text-right font-black">${order.orderAmount.toFixed(2)}</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700">
                    +${order.commissionAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {order.status === 'qualified' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Qualified</span>
                      </span>
                    )}
                    {order.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Pending Hold</span>
                      </span>
                    )}
                    {order.status === 'reversed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <RotateCcw className="w-3 h-3 text-red-600" />
                        <span>Reversed</span>
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-[#fffafb] border-t border-[#f4ebf1] text-[11px] text-[#8a858f] flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 min-w-0">
        <span>*Customer privacy protected: Phone numbers and full billing details are withheld</span>
        <span>Orders automatically credited via 60-day persistent cookie</span>
      </div>
    </div>
  );
};
