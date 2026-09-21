import React from 'react';
import { Award, ArrowLeft, ShieldAlert } from 'lucide-react';

interface OfficialRulesProps {
  onNavigateToHome?: () => void;
  onNavigateToContact?: () => void;
}

export const OfficialRules: React.FC<OfficialRulesProps> = ({
  onNavigateToHome,
  onNavigateToContact,
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
            <Award className="w-3.5 h-3.5 shrink-0" />
            <span>Promotional Disclosures</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Official Rules / No Purchase Necessary
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium">
            Official rules and consumer terms governing promotional cash surprises and alternate entry methods for I Love Surprises.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* Section: No Purchase Necessary */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3 text-[#D30915]">
              No Purchase Necessary
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              No purchase is necessary to participate in the promotional cash program, and making a purchase does not increase a participant's chance of receiving a promotional cash award.
            </p>
          </div>

          {/* Section: Eligibility */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Eligibility
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              The promotion is intended for legal residents of the United States who are 18 years of age or older at the time of participation, except where prohibited by law.
            </p>
          </div>

          {/* Section: Promotion Overview */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Promotion Overview
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              I Love Surprises sells retail products that may include promotional cash surprises. Eligible cash products include the stated minimum cash amount, and selected products may include additional promotional cash.
            </p>
          </div>

          {/* Section: Alternate Method of Entry */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Alternate Method of Entry
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Participants who wish to enter without making a purchase may submit a handwritten request containing their full name, mailing address, and email address to the official AMOE mailing address designated by I Love Surprises. One valid entry per person per month is permitted unless the published promotion rules state otherwise.
            </p>
          </div>

          {/* Section: Entry Parity */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Entry Parity
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Eligible no-purchase entries are intended to receive an opportunity to participate in the promotional cash program without purchasing a retail product.
            </p>
          </div>

          {/* Section: General Conditions */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              General Conditions
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Incomplete, illegible, fraudulent, or ineligible entries may be rejected. I Love Surprises may modify, suspend, or terminate a promotion when reasonably necessary, subject to applicable law.
            </p>
          </div>

        </div>

        {/* Developer / Important Before Publishing Callout */}
        <div className="mt-8 bg-amber-50/80 rounded-2xl border border-amber-200 p-5 sm:p-6 text-left">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
              <strong className="font-bold block mb-1">IMPORTANT BEFORE PUBLISHING:</strong>
              Developer: insert the confirmed legal entity/sponsor name, current mailing address, support email, exact prize range, promotion dates (if applicable), and any state-specific restrictions before this page goes live.
            </div>
          </div>
        </div>

        {/* Support Callout */}
        {onNavigateToContact && (
          <div className="mt-8 bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] rounded-2xl border border-[#f8d7dc] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0 mb-1">
                Questions about AMOE or Official Rules?
              </h3>
              <p className="text-xs sm:text-sm text-[#55505a] m-0 font-medium">
                Reach out to our promotions inquiry desk for assistance regarding mailing instructions or eligibility.
              </p>
            </div>
            <button
              type="button"
              onClick={onNavigateToContact}
              className="px-6 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md shrink-0 cursor-pointer"
            >
              Contact Support
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
