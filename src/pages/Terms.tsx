import React from 'react';
import { ArrowLeft, ShieldAlert, Scale } from 'lucide-react';

interface TermsProps {
  onNavigateToHome?: () => void;
  onNavigateToContact?: () => void;
}

export const Terms: React.FC<TermsProps> = ({
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
            <Scale className="w-3.5 h-3.5 shrink-0" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Terms & Conditions
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium">
            Please read these Terms & Conditions carefully before using our website, purchasing products, or participating in the I Love Surprises programs.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* Section: Acceptance of Terms */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Acceptance of Terms
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              By accessing or using ILoveSurprises.com, creating an account, placing an order, or using our services, you agree to these Terms & Conditions and any additional policies referenced on the website.
            </p>
          </div>

          {/* Section: Online Store Terms */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Online Store Terms
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              You must use the website only for lawful purposes. You may not misuse the service, interfere with website security, attempt unauthorized access, or use the site in a way that violates applicable law or the rights of others.
            </p>
          </div>

          {/* Section: Products & Pricing */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Products & Pricing
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Product descriptions, availability, images, pricing, promotions, and other information may change without notice. We may correct errors, limit quantities, refuse or cancel orders, or update information when reasonably necessary.
            </p>
          </div>

          {/* Section: Orders & Payments */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Orders & Payments
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Orders are subject to acceptance, payment authorization, product availability, fraud screening, and other applicable checks. Customers are responsible for providing accurate billing, shipping, and contact information.
            </p>
          </div>

          {/* Section: Surprise Products & Promotions */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Surprise Products & Promotions
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Surprise contents may vary by product. Promotional cash, jewelry, crypto, or other prize-related features are governed by the product description and any applicable official rules. No purchase is necessary for promotions where an alternate method of entry is offered.
            </p>
          </div>

          {/* Section: Affiliate / Referral Program */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Affiliate / Referral Program
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Participation in the I Love Surprises affiliate or representative program may be governed by separate affiliate terms, commission rules, eligibility requirements, tracking policies, and payout conditions. Fraudulent self-referrals, manipulation, duplicate attribution, or abuse may result in withheld commissions or account suspension.
            </p>
          </div>

          {/* Section: Returns & Shipping */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Returns & Shipping
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Purchases are also subject to the Shipping Policy and Refund & Return Policy published on ILoveSurprises.com.
            </p>
          </div>

          {/* Section: Intellectual Property */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Intellectual Property
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              The website, branding, text, graphics, software, photographs, and other content are owned by or licensed to I Love Surprises and are protected by applicable intellectual-property laws.
            </p>
          </div>

          {/* Section: Third-Party Services */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Third-Party Services
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              The website may use or link to third-party services. We are not responsible for third-party websites, services, terms, privacy practices, or availability except as required by law.
            </p>
          </div>

          {/* Section: Disclaimer & Limitation */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Disclaimer & Limitation
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              To the extent permitted by law, the website and services are provided without warranties beyond those expressly stated, and liability may be limited as permitted by applicable law.
            </p>
          </div>

          {/* Section: Changes to Terms */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0 mb-3">
              Changes to Terms
            </h2>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              We may update these Terms & Conditions from time to time. The current version posted on ILoveSurprises.com will apply from its stated effective date.
            </p>
          </div>

        </div>

        {/* Important Notice Callout */}
        <div className="mt-8 bg-amber-50/80 rounded-2xl border border-amber-200 p-5 sm:p-6 text-left">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
              <strong className="font-bold block mb-1">IMPORTANT BEFORE PUBLISHING:</strong>
              This is baseline website copy, not legal advice. Add the confirmed legal entity, business address, governing law/jurisdiction, support contact, payment terms, affiliate terms, and any required consumer-law provisions before launch.
            </div>
          </div>
        </div>

        {/* Support Callout */}
        {onNavigateToContact && (
          <div className="mt-8 bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] rounded-2xl border border-[#f8d7dc] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
            <div>
              <h3 className="text-base font-black text-[#141219] m-0 mb-1">
                Have questions regarding our Terms & Conditions?
              </h3>
              <p className="text-xs sm:text-sm text-[#55505a] m-0 font-medium">
                Our support team is available to help clarify store terms, policies, or order inquiries.
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
