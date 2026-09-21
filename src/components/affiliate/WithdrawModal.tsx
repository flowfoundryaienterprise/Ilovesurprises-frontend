import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  CreditCard,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { AffiliateStats, PayoutMethod, PayoutRecord } from '../../types';
import { affiliateService } from '../../services/affiliateService';

interface WithdrawModalProps {
  isOpen: boolean;
  stats: AffiliateStats;
  payouts: PayoutRecord[];
  onClose: () => void;
  onUpdateStats: (stats: AffiliateStats) => void;
  onUpdatePayouts: (payouts: PayoutRecord[]) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  stats,
  payouts,
  onClose,
  onUpdateStats,
  onUpdatePayouts,
  onShowToast,
}) => {
  const [amount, setAmount] = useState<string>(stats.availableBalance >= 25 ? '100.00' : stats.availableBalance.toFixed(2));
  const [method, setMethod] = useState<PayoutMethod>('paypal');
  const [destination, setDestination] = useState('sarah.vip@gmail.com');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successPayout, setSuccessPayout] = useState<PayoutRecord | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const numAmount = parseFloat(amount) || 0;
  const isEligible = stats.availableBalance >= 25;

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numAmount < 25) {
      setErrorMsg('Minimum payout threshold is $25.00');
      return;
    }

    if (numAmount > stats.availableBalance) {
      setErrorMsg(`Withdrawal amount cannot exceed available balance ($${stats.availableBalance.toFixed(2)})`);
      return;
    }

    if (!destination.trim()) {
      setErrorMsg('Please specify account details for your selected payout method');
      return;
    }

    setIsSubmitting(true);
    const result = await affiliateService.requestPayout({
      amount: numAmount,
      method,
      destinationAccount: destination.trim(),
    });

    setIsSubmitting(false);

    if (result.success && result.payout) {
      const updatedStats = affiliateService.getStats();
      const updatedPayouts = affiliateService.getPayouts();
      onUpdateStats(updatedStats);
      onUpdatePayouts(updatedPayouts);
      setSuccessPayout(result.payout);
      onShowToast(`Payout request for $${numAmount.toFixed(2)} scheduled for monthly distribution on the 15th!`, {
        title: 'Withdrawal Scheduled',
        type: 'success',
      });
    } else {
      setErrorMsg(result.error || 'Failed to submit withdrawal request');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[92vh] bg-white rounded-[22px] sm:rounded-[26px] p-4 sm:p-7 border border-[#eedbe6] shadow-2xl flex flex-col overflow-hidden animate-modal-pop my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#f4edf2]">
          <div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] block">
              Representative Payout Hub • Monthly on the 15th
            </span>
            <h3 className="text-sm sm:text-lg font-black text-[#141219] m-0 font-display">
              Withdraw Available Earnings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 sm:space-y-4 text-xs scrollbar-thin">
          {successPayout ? (
            <div className="py-6 text-center space-y-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              </div>

              <h4 className="text-base sm:text-lg font-black text-[#141219] font-display">
                Withdrawal Request Received!
              </h4>

              <p className="text-xs text-[#716d77] max-w-sm mx-auto leading-relaxed">
                Your request to transfer <strong className="text-[#141219] font-black">${successPayout.amount.toFixed(2)}</strong> via <strong className="capitalize">{successPayout.method.replace('_', ' ')}</strong> ({successPayout.destinationAccount}) is scheduled for the next monthly payout on the 15th. Reference: <code className="text-[#D30915] font-bold">{successPayout.referenceId}</code>.
              </p>

              <div className="pt-2 sm:pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessPayout(null);
                    onClose();
                  }}
                  className="h-[40px] px-6 rounded-[12px] bg-[#D30915] text-white font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer w-full sm:w-auto"
                >
                  Done & Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleWithdraw} className="space-y-3.5 sm:space-y-4">
              {/* Balance Banner */}
              <div className="p-3.5 sm:p-4 rounded-[16px] sm:rounded-[18px] bg-gradient-to-r from-[#fff1f2] via-[#fff8fb] to-[#fbf5ff] border border-[#fecdd3] flex items-center justify-between">
                <div>
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold text-[#716d77] block">
                    Available for Payout
                  </span>
                  <strong className="text-lg sm:text-xl font-black text-[#141219]">
                    ${stats.availableBalance.toFixed(2)}
                  </strong>
                </div>

                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] text-[#716d77] block">Minimum</span>
                  <span className="text-[11px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    $25.00 Min
                  </span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Withdrawal Amount ($ USD) <span className="text-[#D30915]">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="25"
                    max={stats.availableBalance}
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full h-[42px] sm:h-[44px] pl-9 pr-20 rounded-[12px] sm:rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-sm text-[#141219] outline-none font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setAmount(stats.availableBalance.toFixed(2))}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2 sm:px-2.5 py-1 rounded-[8px] border border-[#fecdd3] hover:bg-[#D30915] hover:text-white transition-colors cursor-pointer"
                  >
                    Max All
                  </button>
                </div>
              </div>

              {/* Payout Method Selector */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1.5">
                  Payout Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('paypal');
                      setDestination('sarah.vip@gmail.com');
                    }}
                    className={`p-2.5 sm:p-3 rounded-[12px] sm:rounded-[14px] border text-center transition-all cursor-pointer ${
                      method === 'paypal'
                        ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915] shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a] hover:border-[#fecdd3]'
                    }`}
                  >
                    <span className="block font-black text-[11px] sm:text-xs">PayPal</span>
                    <span className="block text-[8px] sm:text-[9px] text-[#716d77] mt-0.5">Instant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('bank_transfer');
                      setDestination('Chase Bank (•••• 4819)');
                    }}
                    className={`p-2.5 sm:p-3 rounded-[12px] sm:rounded-[14px] border text-center transition-all cursor-pointer ${
                      method === 'bank_transfer'
                        ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915] shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a] hover:border-[#fecdd3]'
                    }`}
                  >
                    <span className="block font-black text-[11px] sm:text-xs">Bank Wire</span>
                    <span className="block text-[8px] sm:text-[9px] text-[#716d77] mt-0.5">1-2 Days</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('venmo');
                      setDestination('@sarah-sparkles');
                    }}
                    className={`p-2.5 sm:p-3 rounded-[12px] sm:rounded-[14px] border text-center transition-all cursor-pointer ${
                      method === 'venmo'
                        ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915] shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a] hover:border-[#fecdd3]'
                    }`}
                  >
                    <span className="block font-black text-[11px] sm:text-xs">Venmo</span>
                    <span className="block text-[8px] sm:text-[9px] text-[#716d77] mt-0.5">Same Day</span>
                  </button>
                </div>
              </div>

              {/* Destination Account Input */}
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  {method === 'paypal'
                    ? 'PayPal Email Address'
                    : method === 'bank_transfer'
                    ? 'Bank Account / Routing Reference'
                    : 'Venmo Handle / Phone'}
                </label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full h-[38px] sm:h-[40px] px-3 sm:px-3.5 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs text-[#141219] outline-none font-medium"
                />
              </div>

              <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-[#716d77] bg-stone-50 p-2 sm:p-2.5 rounded-[12px] border border-stone-200">
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                <span>Monthly payouts — processed on the 15th of each month. Zero transaction fees.</span>
              </div>

              <div className="pt-2 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-[38px] sm:h-[40px] px-4 rounded-[12px] border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] active:scale-95 text-xs font-bold text-[#716d77] cursor-pointer transition-all shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isEligible || isSubmitting}
                  className="h-[38px] sm:h-[40px] px-5 sm:px-6 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider shadow-[0_4px_14px_rgba(211,9,21,0.25)] hover:shadow-[0_6px_18px_rgba(211,9,21,0.35)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  {isSubmitting ? (
                    <span>Processing...</span>
                  ) : (
                    <>
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Confirm</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Recent Payout History Ledger */}
          <div className="pt-3 sm:pt-4 border-t border-[#f4edf2]">
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#716d77] mb-2 sm:mb-2.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Recent Payout History</span>
            </h4>

            {payouts.length === 0 ? (
              <p className="text-[11px] text-[#8a858f] italic">No payout transactions recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {payouts.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 sm:p-3 rounded-[12px] sm:rounded-[14px] bg-[#fffafc] border border-[#eedbe6] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <strong className="font-bold text-[#141219]">
                          ${p.amount.toFixed(2)}
                        </strong>
                        <span className="text-[9px] sm:text-[10px] text-[#716d77] uppercase font-bold">
                          via {p.method.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[9px] sm:text-[10px] text-[#8a858f] block mt-0.5 truncate max-w-[180px] sm:max-w-none">
                        {new Date(p.requestedAt).toLocaleDateString()} • {p.destinationAccount}
                      </span>
                    </div>

                    <span
                      className={`text-[8px] sm:text-[9px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                        p.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
