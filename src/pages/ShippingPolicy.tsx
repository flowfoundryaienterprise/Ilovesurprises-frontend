import React from 'react';
import { Truck, ArrowLeft, Package, MapPin, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

interface ShippingPolicyProps {
  onNavigateToHome?: () => void;
  onNavigateToContact?: () => void;
}

export const ShippingPolicy: React.FC<ShippingPolicyProps> = ({
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
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Fast Tracked Fulfillment</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Shipping Policy
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium">
            Learn about how I Love Surprises safely packages, handles, and ships your surprise orders nationwide and abroad.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6">

          {/* Section 1: Order Delivery */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#ffd5d9]">
                <Package className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Order Delivery
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              I Love Surprises works to provide safe and timely delivery of customer orders. When tracking is available, each shipped package will be assigned tracking information so customers can follow its progress.
            </p>
          </div>

          {/* Section 2: Delivered Packages */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#effaf4] text-emerald-600 flex items-center justify-center shrink-0 border border-[#c3eed7]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Delivered Packages
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Once carrier tracking confirms that a package has been delivered, customers who cannot locate the package should first check the delivery area, household members, neighbors, and then contact the applicable carrier or local post office for assistance.
            </p>
          </div>

          {/* Section 3: Shipping Destinations */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#f0f9ff] text-sky-600 flex items-center justify-center shrink-0 border border-[#bae6fd]">
                <MapPin className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Shipping Destinations
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Shipping availability, rates, carriers, and delivery estimates are displayed during checkout where applicable. International availability may vary by destination and product.
            </p>
          </div>

          {/* Section 4: Incorrect Address */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fff7ed] text-amber-600 flex items-center justify-center shrink-0 border border-[#fed7aa]">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Incorrect Address
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Customers are responsible for providing a complete and accurate shipping address. Please contact customer support as soon as possible if an address error is discovered; changes cannot be guaranteed after processing or shipment.
            </p>
          </div>

          {/* Section 5: Delays */}
          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#fdf4ff] text-purple-600 flex items-center justify-center shrink-0 border border-[#f0abfc]">
                <Clock className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-[#141219] tracking-tight m-0">
                Delays
              </h2>
            </div>
            <p className="text-sm sm:text-[15px] text-[#4a4550] leading-relaxed m-0 font-medium">
              Carrier delays, weather, holidays, customs, and other events outside our control may affect estimated delivery times.
            </p>
          </div>

        </div>

        {/* Support Callout */}
        <div className="mt-10 bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] rounded-2xl border border-[#f8d7dc] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 mb-1 flex items-center gap-2">
              <span>Have a question regarding tracking or delivery?</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] m-0 font-medium">
              Our support team can help track down packages and verify dispatch details.
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
