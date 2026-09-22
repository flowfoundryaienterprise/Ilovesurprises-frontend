import React from 'react';
import { Lock, ArrowLeft, ShieldAlert, ShieldCheck, Eye, Database, Server, Cookie, KeyRound, Mail } from 'lucide-react';

interface PrivacyPolicyProps {
  onNavigateToHome?: () => void;
  onNavigateToContact?: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({
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
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Privacy & Consumer Data</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Privacy Policy
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium">
            How I Love Surprises collects, protects, uses, and respects customer and consultant personal information.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* Section: Overview */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#ffd5d9]">
                <Eye className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Overview
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              This Privacy Policy explains how I Love Surprises may collect, use, disclose, and protect personal information when customers visit ILoveSurprises.com, create an account, make a purchase, join the affiliate program, contact support, or otherwise interact with our services.
            </p>
          </div>

          {/* Section: Information We Collect */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-emerald-600 flex items-center justify-center shrink-0 border border-[#bbf7d0]">
                <Database className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Information We Collect
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Information may include contact details, account information, shipping and billing details, transaction information, customer-support communications, referral/affiliate information, device/browser information, cookies, analytics data, and other information customers choose to provide.
            </p>
          </div>

          {/* Section: How We Use Information */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#eff6ff] text-blue-600 flex items-center justify-center shrink-0 border border-[#bfdbfe]">
                <Server className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                How We Use Information
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              We may use information to operate the website, process orders and payments, deliver products, provide customer support, administer accounts and affiliate/referral tracking, calculate commissions, prevent fraud, improve services, send permitted marketing communications, and comply with legal obligations.
            </p>
          </div>

          {/* Section: Service Providers */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#faf5ff] text-purple-600 flex items-center justify-center shrink-0 border border-[#e9d5ff]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Service Providers
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Information may be shared with vendors that help provide services such as hosting, payment processing, shipping, analytics, communications, fraud prevention, and other operational functions, subject to appropriate contractual and legal requirements.
            </p>
          </div>

          {/* Section: Cookies & Tracking */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fffbeb] text-amber-600 flex items-center justify-center shrink-0 border border-[#fde68a]">
                <Cookie className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Cookies & Tracking
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              ILoveSurprises.com may use cookies and similar technologies for essential website functions, preferences, analytics, marketing, and affiliate/referral attribution. Available consent or preference controls should be honored where required.
            </p>
          </div>

          {/* Section: Data Rights */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#ecfeff] text-cyan-600 flex items-center justify-center shrink-0 border border-[#a5f3fc]">
                <KeyRound className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Data Rights
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Depending on applicable law and location, users may have rights to request access, correction, deletion, portability, restriction, or other controls concerning personal information.
            </p>
          </div>

          {/* Section: Security & Retention */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] text-emerald-700 flex items-center justify-center shrink-0 border border-[#bbf7d0]">
                <Lock className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Security & Retention
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              We use reasonable administrative, technical, and organizational safeguards. Information is retained only as long as reasonably necessary for the purposes described, legal requirements, dispute resolution, and legitimate business needs.
            </p>
          </div>

          {/* Section: Contact */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#ffd5d9]">
                <Mail className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Contact
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Privacy questions or requests should be sent through the official I Love Surprises contact channel.
            </p>
            <div className="mt-4">
              <button
                type="button"
                onClick={onNavigateToContact}
                className="inline-flex items-center gap-2 text-xs font-bold text-[#D30915] hover:underline cursor-pointer bg-transparent border-none p-0"
              >
                <span>Go to Contact Channel &rarr;</span>
              </button>
            </div>
          </div>

        </div>

        {/* Important Notice Callout */}
        <div className="mt-8 bg-amber-50/80 rounded-2xl border border-amber-200 p-5 sm:p-6 text-left">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
              <strong className="font-bold block mb-1">IMPORTANT BEFORE PUBLISHING:</strong>
              This is website-ready baseline copy, not legal advice. Insert the confirmed business/legal entity, postal address, privacy email, payment/analytics providers, cookie practices, state privacy disclosures, and any required international provisions before launch.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
