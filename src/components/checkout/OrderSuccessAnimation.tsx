import React, { useState } from 'react';
import {
  Copy,
  Check,
  Truck,
  ShoppingBag,
  ArrowRight,
  Printer,
  ShieldCheck,
  ExternalLink,
  RotateCw,
} from 'lucide-react';
import type { Order } from '../../types';

interface OrderSuccessAnimationProps {
  order: Order;
  onNavigateToShop: () => void;
  onNavigateToAccountOrders: (orderId?: string) => void;
}

// Celebration particles around the success badge (12 luxury metallic dots, diamonds & rings)
const PARTICLES = [
  { id: 1, tx: '-54px', ty: '-52px', s: '1.2', r: '240deg', color: '#f59e0b', icon: '●' },
  { id: 2, tx: '56px', ty: '-50px', s: '1.3', r: '180deg', color: '#D30915', icon: '◆' },
  { id: 3, tx: '-64px', ty: '0px', s: '1.0', r: '120deg', color: '#10b981', icon: '●' },
  { id: 4, tx: '66px', ty: '12px', s: '1.1', r: '300deg', color: '#f59e0b', icon: '◆' },
  { id: 5, tx: '-44px', ty: '56px', s: '1.2', r: '210deg', color: '#D30915', icon: '◆' },
  { id: 6, tx: '48px', ty: '54px', s: '1.3', r: '150deg', color: '#10b981', icon: '●' },
  { id: 7, tx: '0px', ty: '-68px', s: '1.1', r: '360deg', color: '#D30915', icon: '●' },
  { id: 8, tx: '0px', ty: '68px', s: '1.2', r: '180deg', color: '#f59e0b', icon: '◆' },
  { id: 9, tx: '-32px', ty: '-62px', s: '0.9', r: '90deg', color: '#10b981', icon: '●' },
  { id: 10, tx: '36px', ty: '-60px', s: '0.9', r: '270deg', color: '#f59e0b', icon: '◆' },
  { id: 11, tx: '-60px', ty: '34px', s: '1.0', r: '45deg', color: '#D30915', icon: '●' },
  { id: 12, tx: '62px', ty: '36px', s: '1.0', r: '315deg', color: '#10b981', icon: '◆' },
];

export const OrderSuccessAnimation: React.FC<OrderSuccessAnimationProps> = ({
  order,
  onNavigateToShop,
  onNavigateToAccountOrders,
}) => {
  const [copied, setCopied] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const handleCopyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleReplay = () => {
    setAnimKey((prev) => prev + 1);
  };

  const isCod = order.paymentSummary.method === 'cod';

  return (
    <div
      key={animKey}
      role="status"
      aria-live="polite"
      className="relative w-full max-w-[840px] mx-auto text-center"
    >
      {/* Screen Reader Live Announcement */}
      <span
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
          display: 'none',
        }}
      >
        Order Placed Successfully! Your order reference is {order.id}. Total {isCod ? 'due on delivery' : 'paid'}: ${order.total.toFixed(2)}.
      </span>

      {/* Main Luxury Success Hero Card */}
      <div className="relative bg-white rounded-[32px] p-6 sm:p-12 border border-[#eedbe6] shadow-[0_16px_50px_rgba(50,31,63,0.06)] overflow-hidden">
        
        {/* Ambient background glow & confetti flares */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-[#D30915]/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-emerald-400/5 blur-3xl pointer-events-none anim-aura-pulse" />

        {/* 1. DIGITAL PAYMENT SUCCESS ANIMATION ICON */}
        <div className="relative inline-flex items-center justify-center my-3 sm:my-5">
          
          {/* Concentric Triple Ripple Waves */}
          <div className="absolute w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-emerald-500/25 anim-success-ripple-1 pointer-events-none" />
          <div className="absolute w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-emerald-400/20 anim-success-ripple-2 pointer-events-none" />
          <div className="absolute w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-emerald-300/15 anim-success-ripple-3 pointer-events-none" />

          {/* Luxury Floating Particles / Confetti */}
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              style={
                {
                  '--tx': p.tx,
                  '--ty': p.ty,
                  '--s': p.s,
                  '--r': p.r,
                  color: p.color,
                } as React.CSSProperties
              }
              className="anim-particle absolute select-none pointer-events-none font-bold text-xs"
            >
              {p.icon}
            </div>
          ))}

          {/* SVG Animated Circle & Checkmark with Gradient Fill */}
          <div className="anim-success-bounce relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-b from-white to-[#f0fdf4] flex items-center justify-center shadow-[0_12px_36px_rgba(16,185,129,0.28)] border-2 border-emerald-100 z-10">
            <svg
              className="w-full h-full p-2.5"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="successStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="checkStrokeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              {/* Background circular guide track */}
              <circle
                cx="50"
                cy="50"
                r="43"
                stroke="#d1fae5"
                strokeWidth="5"
                strokeLinecap="round"
              />
              {/* Animated Drawing Circle */}
              <circle
                className="anim-success-circle"
                cx="50"
                cy="50"
                r="43"
                stroke="url(#successStrokeGrad)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {/* Animated Drawing Checkmark */}
              <path
                className="anim-success-check"
                d="M29 51.5 L42.5 65 L72.5 35"
                stroke="url(#checkStrokeGrad)"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* 2. SUCCESS MESSAGES (STAGGER 1) */}
        <div className="anim-stagger-1 space-y-2 mt-4">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isCod ? 'Order Placed • Doorstep Verification' : 'Payment Confirmed & Verified'}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] font-display tracking-tight m-0">
            Order Placed Successfully!
          </h1>

          <p className="text-sm sm:text-base text-[#D30915] font-bold m-0 flex items-center justify-center gap-1.5">
            <span>Your surprise is on its way!</span>
            <span className="text-lg">🎁</span>
          </p>

          <p className="text-xs sm:text-sm text-[#716d77] max-w-lg mx-auto leading-relaxed pt-1 m-0">
            We&apos;re preparing your parcel with love & surprise reveals. A confirmation email has been sent to{' '}
            <strong className="text-[#141219]">{order.shippingAddress.email}</strong>.
          </p>
        </div>

        {/* 3. ORDER SUMMARY HIGHLIGHT PILL & DETAILS CARD (STAGGER 2) */}
        <div className="anim-stagger-2 mt-7 space-y-4">
          
          {/* Order Reference Pill with 1-Click Copy */}
          <div className="inline-flex items-center gap-2 p-1.5 pl-4 pr-2 rounded-[16px] bg-[#fffafc] border border-[#fecdd3] shadow-2xs">
            <span className="text-xs font-bold text-[#716d77]">Order Reference:</span>
            <span className="text-xs sm:text-sm font-mono font-black text-[#D30915] tracking-wide">
              {order.id}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="p-1.5 rounded-[10px] bg-white border border-[#ecdbe6] hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer active:scale-95"
              title="Copy Order ID"
              aria-label="Copy Order Reference ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* 4-Item Quick Snapshot Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-4 sm:p-5 rounded-[22px] bg-[#fffbfd] border border-[#eedbe6] text-left">
            
            {/* Total Paid */}
            <div className="p-3 rounded-[16px] bg-white border border-[#f4e6ee] shadow-2xs transition-all hover:border-[#D30915]/40">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                {isCod ? 'Amount Due' : 'Total Paid'}
              </span>
              <span className="text-base sm:text-lg font-black text-[#141219] tracking-tight">
                ${order.total.toFixed(2)}
              </span>
              <span className={`block text-[10px] font-bold mt-0.5 ${isCod ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isCod ? '● Cash on Delivery' : '✓ Card / Digital'}
              </span>
            </div>

            {/* Surprise Items */}
            <div className="p-3 rounded-[16px] bg-white border border-[#f4e6ee] shadow-2xs transition-all hover:border-[#D30915]/40">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                Surprise Box
              </span>
              <span className="text-base sm:text-lg font-black text-[#D30915] tracking-tight">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} Item{order.items.length > 1 ? 's' : ''}
              </span>
              <span className="block text-[10px] font-bold text-stone-600 truncate mt-0.5">
                {order.items[0]?.product.name || 'Surprise Candle'}
              </span>
            </div>

            {/* Delivery Method */}
            <div className="p-3 rounded-[16px] bg-white border border-[#f4e6ee] shadow-2xs transition-all hover:border-[#D30915]/40">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                Delivery Speed
              </span>
              <span className="text-xs sm:text-sm font-black text-[#141219] block truncate">
                {order.deliveryMethod.name.split(' ')[0]} {order.deliveryMethod.name.split(' ')[1] || ''}
              </span>
              <span className="block text-[10px] font-bold text-[#716d77] truncate mt-0.5">
                {order.deliveryMethod.carrierInfo.split(' ')[0]} Tracked
              </span>
            </div>

            {/* Estimated Arrival */}
            <div className="p-3 rounded-[16px] bg-white border border-[#f4e6ee] shadow-2xs transition-all hover:border-[#D30915]/40">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-0.5">
                Est. Arrival
              </span>
              <span className="text-xs sm:text-sm font-black text-[#141219] block truncate">
                {order.estimatedDeliveryDate}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 mt-0.5">
                <Truck className="w-3 h-3 text-emerald-600" />
                <span>On Schedule</span>
              </span>
            </div>

          </div>
        </div>

        {/* 4. PRIMARY ACTION TOOLBAR (STAGGER 3) - Ultra-Premium, Compact & High Visibility */}
        <div className="anim-stagger-3 mt-7 flex justify-center">
          <div className="p-1.5 sm:p-2 rounded-[18px] sm:rounded-full bg-[#fffafc] border border-[#f0dce8] shadow-[0_4px_24px_rgba(50,31,63,0.06)] inline-flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            
            {/* View Order Button (Smoothly scrolls and centers Order Details Card) */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('order-details-section');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } else {
                  onNavigateToAccountOrders(order.id);
                }
              }}
              className="group h-[38px] sm:h-[40px] px-3.5 sm:px-4 rounded-[13px] sm:rounded-full bg-[#141219] hover:bg-[#272332] active:scale-95 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-[0_3px_10px_rgba(20,18,25,0.22)] hover:shadow-[0_5px_16px_rgba(20,18,25,0.32)] transition-all cursor-pointer"
              title="Scroll down to view detailed receipt & tracking breakdown"
            >
              <ExternalLink className="w-3.5 h-3.5 text-white/90 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-200" />
              <span>View Order Details</span>
            </button>

            {/* Continue Shopping Button */}
            <button
              type="button"
              onClick={onNavigateToShop}
              className="group h-[38px] sm:h-[40px] px-4 sm:px-5 rounded-[13px] sm:rounded-full bg-gradient-to-r from-[#D30915] via-[#e5286e] to-[#d81f62] hover:brightness-105 active:scale-95 text-white font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(211, 9, 21,0.35)] hover:shadow-[0_6px_22px_rgba(211, 9, 21,0.48)] transition-all cursor-pointer"
              title="Browse more surprise collections"
            >
              <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>

            {/* Print Receipt Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="group h-[38px] sm:h-[40px] px-3.5 sm:px-4 rounded-[13px] sm:rounded-full bg-white border border-[#e2d5df] hover:border-[#D30915]/50 hover:bg-[#fff1f2] text-[#1e1926] hover:text-[#D30915] active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              title="Print official order receipt PDF"
            >
              <Printer className="w-3.5 h-3.5 text-[#5e5866] group-hover:text-[#D30915] group-hover:scale-110 transition-all duration-200" />
              <span>Print Receipt</span>
            </button>

            {/* Replay Animation Trigger */}
            <button
              type="button"
              onClick={handleReplay}
              className="group h-[38px] sm:h-[40px] px-3.5 sm:px-4 rounded-[13px] sm:rounded-full bg-[#fff1f2] border border-[#fecdd3] hover:border-[#D30915] hover:bg-[#fde2ec] text-[#b8235b] hover:text-[#9e1648] active:scale-95 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              title="Replay Celebration Animation"
            >
              <RotateCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500 ease-out" />
              <span>Replay</span>
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
