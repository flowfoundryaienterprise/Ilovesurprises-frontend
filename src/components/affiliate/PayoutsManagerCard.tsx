import React from 'react';
import {
  CreditCard,
  Download,
  Clock,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import type { PayoutRecord, AffiliateStats } from '../../types';

interface PayoutsManagerCardProps {
  stats: AffiliateStats;
  payouts: PayoutRecord[];
  onOpenWithdraw: () => void;
}

export const PayoutsManagerCard: React.FC<PayoutsManagerCardProps> = ({
  stats,
  payouts,
  onOpenWithdraw,
}) => {
  const minThreshold = 20.0;
  const isEligible = stats.availableBalance >= minThreshold;

  const handleDownloadStatements = () => {
    const headers = ['Reference ID', 'Amount', 'Fee', 'Net Amount', 'Method', 'Destination Account', 'Requested Date', 'Completed Date', 'Status'];
    const rows = payouts.map((p) => [
      p.referenceId,
      p.amount.toFixed(2),
      p.fee.toFixed(2),
      p.netAmount.toFixed(2),
      p.method,
      `"${p.destinationAccount}"`,
      p.requestedAt,
      p.completedAt || 'N/A',
      p.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encoded;
    link.download = `ILS_Payout_Statement_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Payout Eligibility & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Available Balance */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <span className="text-xs font-bold text-[#716d77]">Available for Withdrawal</span>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
            ${stats.availableBalance.toFixed(2)}
          </div>
          <span className="text-[11px] text-[#716d77] block mt-1">Minimum payout: ${minThreshold.toFixed(2)}</span>
        </div>

        {/* Payout Eligibility Status */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-white border border-[#eee0e9] shadow-[0_6px_24px_rgba(50,31,63,0.04)]">
          <span className="text-xs font-bold text-[#716d77]">Payout Eligibility</span>
          <div className="mt-1.5">
            {isEligible ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Eligible for Payout</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Needs ${(minThreshold - stats.availableBalance).toFixed(2)} more</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-[#716d77] block mt-2">Monthly payouts — paid on the 15th of each month</span>
        </div>

        {/* Action Button Card */}
        <div className="p-4 sm:p-5 rounded-[20px] bg-gradient-to-r from-[#fff5f6] to-[#fff0f2] border border-[#ffd8dc] shadow-[0_6px_24px_rgba(211, 9, 21,0.06)] flex flex-col justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#D30915]">Withdrawal Center</span>
            <p className="text-[11px] text-[#645c68] mt-0.5">Monthly disbursements processed on the 15th of each month</p>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <button
              type="button"
              disabled={!isEligible}
              onClick={onOpenWithdraw}
              className="flex-1 py-2 px-3 rounded-xl bg-[#D30915] hover:bg-[#b80712] disabled:opacity-50 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Request Payout</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadStatements}
              className="py-2 px-3 rounded-xl bg-white hover:bg-[#fff9fb] border border-[#ecdfe2] text-[#141219] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Download Statement"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Statements</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payout History Ledger */}
      <div className="rounded-[22px] bg-white border border-[#eee0e9] shadow-[0_10px_32px_rgba(50,31,63,0.05)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#f4ebf1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#D30915]" />
            <h4 className="text-base font-black text-[#141219] font-display m-0">
              Payout History & Statements
            </h4>
          </div>
          <button
            type="button"
            onClick={handleDownloadStatements}
            className="text-xs font-bold text-[#D30915] hover:underline flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download All CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#141219]">
            <thead className="bg-[#faf5f8] border-b border-[#f0e4ec] text-[11px] uppercase font-black tracking-wider text-[#716d77]">
              <tr>
                <th className="py-3 px-4">Reference ID</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Payout Method</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7eff4]">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#8a858f]">
                    No payout records found yet.
                  </td>
                </tr>
              ) : (
                payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fff9fa] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#D30915]">{p.referenceId}</td>
                    <td className="py-3 px-4 text-[#716d77]">{p.requestedAt}</td>
                    <td className="py-3 px-4 capitalize font-semibold">{p.method.replace('_', ' ')}</td>
                    <td className="py-3 px-4 font-mono text-[#55505a]">{p.destinationAccount}</td>
                    <td className="py-3 px-4 text-right font-black text-[#141219]">${p.amount.toFixed(2)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
