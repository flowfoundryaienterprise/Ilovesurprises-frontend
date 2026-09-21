import React from 'react';
import { RotateCcw, Clock, ShieldCheck, HelpCircle, AlertCircle, ArrowLeft, PackageCheck, Ban } from 'lucide-react';

interface RefundPolicyProps {
  onNavigateToContact?: () => void;
  onNavigateToHome?: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({
  onNavigateToContact,
  onNavigateToHome,
}) => {
  return (
    <div className="w-full bg-[#fcf9fb] min-h-screen py-8 sm:py-14 text-[#141219]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">

        {/* Back navigation */}
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={onNavigateToHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Header Banner */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-6 sm:p-10 shadow-sm mb-8 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D30915]/10 text-[#D30915] text-xs font-black uppercase tracking-wider mb-3">
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Customer Protection Guarantee</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Refund & Return Policy
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium">
            At I Love Surprises, we stand behind the craftsmanship of our hand-poured surprise candles, bath treats, and luxury gifts. Please review our official return and refund guidelines below.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* Section 1: Returns */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#ffd5d9]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Returns
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Eligible items may be returned within 60 days after the order is received. Returned items must be in the same condition in which they were received, unused where applicable, and include original packaging and any included tags or materials.
            </p>
          </div>

          {/* Section 2: Return Approval */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#effaf4] text-emerald-600 flex items-center justify-center shrink-0 border border-[#c3eed7]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Return Approval
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Please contact I Love Surprises customer support before sending a return so the team can provide the appropriate return instructions.
            </p>
          </div>

          {/* Section 3: Refund Processing */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fdf5f0] text-amber-600 flex items-center justify-center shrink-0 border border-[#fae2ce]">
                <PackageCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Refund Processing
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              After an approved return is received and inspected, the refund will normally be processed within 7 days. Your bank or payment provider may require additional time for the credit to appear.
            </p>
          </div>

          {/* Section 4: Damaged or Incorrect Items */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-orange-600 flex items-center justify-center shrink-0 border border-[#fed7aa]">
                <AlertCircle className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Damaged or Incorrect Items
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              If an order arrives damaged or an incorrect item is received, contact customer support promptly with the order number and supporting photos so the issue can be reviewed.
            </p>
          </div>

          {/* Section 5: Non-Returnable Items */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fdf2f8] text-[#D30915] flex items-center justify-center shrink-0 border border-[#fbcfe8]">
                <Ban className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Non-Returnable Items
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Certain opened, used, personalized, final-sale, promotional, prize-related, or otherwise non-returnable products may be excluded where stated on the product page or required by hygiene/safety considerations.
            </p>
          </div>

        </div>

        {/* Need Help Assistance Box */}
        <div className="mt-10 bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] rounded-2xl border border-[#f8d7dc] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#D30915]" />
              <span>Need to initiate a return or exchange?</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] m-0 font-medium">
              Our 24/7 concierge support team will assist you with approval and shipping instructions.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToContact}
            className="px-6 py-3 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg shrink-0 cursor-pointer"
          >
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
};
