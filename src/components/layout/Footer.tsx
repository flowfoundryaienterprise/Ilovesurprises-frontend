import React, { useState } from 'react';
import { ShieldCheck, Truck, Sparkles, Mail, Phone, Lock, CheckCheck, Send, DollarSign, HelpCircle, ChevronDown } from 'lucide-react';

interface FooterProps {
  onNavigate?: (
    route:
      | 'home'
      | 'shop'
      | 'categories'
      | 'affiliate'
      | 'about'
      | 'contact'
      | 'rewards'
      | 'admin'
      | 'appraisal'
      | 'refund-policy'
      | 'terms'
      | 'official-rules'
      | 'shipping-policy'
      | 'privacy'
      | 'faqs'
  ) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [mobileSections, setMobileSections] = useState<{ [key: string]: boolean }>({
    help: true,
    care: true,
    partner: true,
  });

  const toggleMobileSection = (key: string) => {
    setMobileSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3500);
    }
  };

  return (
    <footer className="mt-8 sm:mt-10 border-t border-[#eedbe6] bg-gradient-to-b from-[#fffafc] via-white to-[#fff5f8] text-[#141219] overflow-x-hidden">

      {/* 1. VIP Reveal Club & Newsletter Sign-Up Banner */}
      <div className="border-b border-[#f0e2ec] bg-gradient-to-r from-[#fff1f2] via-[#fff7fa] to-[#fbf5ff] py-5 sm:py-8 px-3 sm:px-6">
        <div className="max-w-[1460px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 lg:gap-8 items-center">

          <div className="lg:col-span-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#D30915]/10 text-[#D30915] text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5 sm:mb-2 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>VIP Reveal Club</span>
            </div>
            <h3 className="text-lg sm:text-2xl lg:text-[26px] font-black text-[#141219] tracking-tight leading-snug hero-title-font m-0 mb-1 sm:mb-1.5">
              Unlock 15% Off Your Next Surprise &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] to-[#B60711]">
                Weekly Cash Drop Alerts
              </span>
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed m-0 font-medium">
              Join over <strong className="text-[#141219] font-bold">85,000+ unboxing fans</strong>. Be first to know about new limited scents, rare diamond jewelry drops, and grand cash reveals.
            </p>
          </div>

          <div className="lg:col-span-6">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 max-w-lg lg:ml-auto">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full h-[44px] sm:h-[48px] pl-10 pr-4 rounded-[12px] sm:rounded-[14px] bg-white border border-[#e8dfe5] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none shadow-2xs transition-all"
                />
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
              </div>

              <button
                type="submit"
                disabled={subscribed}
                className="h-[44px] sm:h-[48px] px-6 rounded-[12px] sm:rounded-[14px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_6px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_10px_24px_rgba(211,9,21,0.38)] hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 shrink-0 w-full sm:w-auto"
              >
                {subscribed ? (
                  <>
                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                    <span>Subscribed! ✓</span>
                  </>
                ) : (
                  <>
                    <span>Claim 15% Off</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] text-[#716d77] mt-2 max-w-lg lg:ml-auto font-medium">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Zero spam. Unsubscribe anytime.</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span>Instant 15% code sent to inbox</span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Top 3 Quick-Trust Highlights */}
      <div className="border-b border-[#f2edf1] py-3 sm:py-4 bg-white/80">
        <div className="max-w-[1460px] mx-auto px-3 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 text-left">

          <div className="flex items-center justify-start text-left gap-2.5 sm:gap-3 px-3 py-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-white border border-[#f2d8e2] text-[#D30915] flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-[11px] sm:text-xs font-black text-[#141219] leading-snug">Guaranteed Surprise Inside</strong>
              <span className="block text-[10px] text-[#716d77] leading-tight mt-0.5">Real cash or luxury jewelry in 100% of orders</span>
            </div>
          </div>

          <div className="flex items-center justify-start text-left gap-2.5 sm:gap-3 px-3 py-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-white border border-[#f2d8e2] text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-[11px] sm:text-xs font-black text-[#141219] leading-snug">Express 2-3 Day Dispatch</strong>
              <span className="block text-[10px] text-[#716d77] leading-tight mt-0.5">Free tracked shipping nationwide on $50+</span>
            </div>
          </div>

          <div className="flex items-center justify-start text-left gap-2.5 sm:gap-3 px-3 py-2 sm:p-2.5 rounded-[12px] sm:rounded-[14px] bg-[#fff8fb] border border-[#f5e4ec] shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-white border border-[#f2d8e2] text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <strong className="block text-[11px] sm:text-xs font-black text-[#141219] leading-snug">100% Hand-Poured Soy Wax</strong>
              <span className="block text-[10px] text-[#716d77] leading-tight mt-0.5">Clean-burning, vegan & lead-free wicks</span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. Main Footer Links & Social Media Hub */}
      <div id="about" className="max-w-[1460px] mx-auto px-3 sm:px-6 py-6 sm:py-12">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10">

          {/* Column 1: Brand Info & Logo */}
          <div className="sm:col-span-1 lg:col-span-3 flex flex-col justify-start">
            <div>
              <a href="#hero" className="inline-block mb-3 group focus:outline-none">
                <img
                  src="/assets/ilovesurprises/logo/logo-16k.png"
                  alt="I Love Surprises Logo"
                  width={8192}
                  height={2728}
                  className="h-[42px] min-[360px]:h-[46px] min-[390px]:h-[50px] min-[420px]:h-[52px] sm:h-[58px] md:h-[62px] w-auto max-w-[170px] min-[360px]:max-w-[195px] min-[390px]:max-w-[215px] min-[420px]:max-w-[230px] sm:max-w-[265px] object-contain transition-transform duration-300 group-hover:scale-103"
                  loading="lazy"
                  decoding="async"
                  style={{
                    imageRendering: '-webkit-optimize-contrast',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden',
                    transform: 'translateZ(0)',
                  }}
                />
              </a>

              <p className="text-xs text-[#55505a] leading-relaxed max-w-sm m-0 mb-3.5 font-medium">
                The world's favorite unboxing & surprise experience. Hand-poured aromatic soy candles, bath treats & body treats with authentic cash (<strong className="text-[#141219] font-black">$2 to $2,500</strong>) or fine jewelry (<strong className="text-[#141219] font-black">up to $7,500</strong>) waiting inside.
              </p>
            </div>
          </div>

          {/* Column 2: Help Center (Spans 3 columns) */}
          <div className="sm:col-span-1 lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-2.5 sm:mb-3.5">
              <button
                type="button"
                onClick={() => toggleMobileSection('help')}
                className="w-full sm:pointer-events-none flex items-center justify-between font-inherit text-inherit uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer text-left"
                aria-expanded={mobileSections.help}
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-[#D30915]" />
                  <span>Help Center</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#8a858f] sm:hidden transition-transform duration-200 ${
                    mobileSections.help ? 'rotate-180 text-[#D30915]' : ''
                  }`}
                />
              </button>
            </h4>
            <ul
              className={`list-none p-0 m-0 space-y-1 sm:space-y-1.5 text-xs text-[#5e5963] font-medium ${
                mobileSections.help ? 'block' : 'hidden sm:block'
              }`}
            >
              <li>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Accessibility & Legal Notice (ADA)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Cash Guarantee Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('official-rules')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Official Rules / No Purchase Necessary
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('shipping-policy')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Shipping
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('refund-policy')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Refund
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('faqs')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('contact')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('appraisal')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Jewelry Appraisals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Redeem Your Crypto Candle Prize
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={(e) => e.preventDefault()}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Discover Our Jewelries
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('privacy')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  Privacy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('terms')}
                  className="hover:text-[#D30915] hover:translate-x-1 transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 w-full min-h-[36px] sm:min-h-0 flex items-center"
                >
                  T&Cs
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care & Guarantees (Spans 3 columns) */}
          <div id="contact" className="sm:col-span-1 lg:col-span-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-2.5 sm:mb-3.5">
              <button
                type="button"
                onClick={() => toggleMobileSection('care')}
                className="w-full sm:pointer-events-none flex items-center justify-between font-inherit text-inherit uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer text-left"
                aria-expanded={mobileSections.care}
              >
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Customer Care</span>
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-[#8a858f] sm:hidden transition-transform duration-200 ${
                    mobileSections.care ? 'rotate-180 text-[#D30915]' : ''
                  }`}
                />
              </button>
            </h4>
            <ul
              className={`list-none p-0 m-0 space-y-1.5 sm:space-y-2 text-xs text-[#5e5963] font-medium ${
                mobileSections.care ? 'block' : 'hidden sm:block'
              }`}
            >
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('rewards')}
                  className="text-[#D30915] font-black hover:underline hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  🎁 Surprise Club VIP Rewards
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('about')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  ✨ Our Brand Story & Mission
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('contact')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  📦 Track Your Delivery
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('contact')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  💬 Contact Customer Care (24/7)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('faqs')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  ❓ Frequently Asked Questions
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('about')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 min-h-[36px] sm:min-h-0 flex items-center"
                >
                  🕯️ 100% Soy Wax Craftsmanship
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate?.('appraisal')}
                  className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 text-left cursor-pointer bg-transparent border-none p-0 font-bold min-h-[36px] sm:min-h-0 flex items-center"
                >
                  💎 Appraise Your Jewelry
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Representative & Information / Social / Contact Section (Spans 3 columns) */}
          <div className="sm:col-span-1 lg:col-span-3 flex flex-col justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0 mb-2.5 sm:mb-3.5">
                <button
                  type="button"
                  onClick={() => toggleMobileSection('partner')}
                  className="w-full sm:pointer-events-none flex items-center justify-between font-inherit text-inherit uppercase tracking-wider bg-transparent border-none p-0 cursor-pointer text-left"
                  aria-expanded={mobileSections.partner}
                >
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#D30915]" />
                    <span>Partner & Earn</span>
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#8a858f] sm:hidden transition-transform duration-200 ${
                      mobileSections.partner ? 'rotate-180 text-[#D30915]' : ''
                    }`}
                  />
                </button>
              </h4>
              <div className={`${mobileSections.partner ? 'block' : 'hidden sm:block'}`}>
                <ul className="list-none p-0 m-0 space-y-1.5 sm:space-y-2 text-xs text-[#5e5963] font-medium">
                  <li>
                    <a href="#affiliate" className="text-[#D30915] font-black hover:underline hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      ✨ Join Representative Program (20%)
                    </a>
                  </li>
                  <li>
                    <a href="#affiliate" className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      📈 5-Tier Team Bonus Plan
                    </a>
                  </li>
                  <li>
                    <a href="#affiliate" className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      💼 Rep Portal Dashboard
                    </a>
                  </li>
                  <li>
                    <a href="#affiliate" className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      💳 Monthly Direct Payouts (15th of each month)
                    </a>
                  </li>
                  <li>
                    <a href="#affiliate" className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      🎁 Fundraiser & Bulk School Orders
                    </a>
                  </li>
                  <li>
                    <a href="#affiliate" className="hover:text-[#D30915] hover:translate-x-1 inline-block transition-all py-1 sm:py-0.5 min-h-[36px] sm:min-h-0 flex items-center">
                      🏪 Wholesale & Boutique Inquiries
                    </a>
                  </li>
                </ul>

                {/* Social Media Links with Elevated Hover States */}
                <div className="mt-4 pt-3 border-t border-[#eedbe6]/60">
                  <span className="block text-[10px] font-black uppercase tracking-wider text-[#8a858f] mb-2">
                    Follow Our Viral Unboxings
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Instagram */}
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Instagram"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-[10px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] hover:border-transparent hover:shadow-[0_6px_16px_rgba(220,39,67,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                    >
                      <svg className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>

                    {/* Facebook */}
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Facebook"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-[10px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#1877f2] hover:border-[#1877f2] hover:shadow-[0_6px_16px_rgba(24,119,242,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                    >
                      <svg className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>

                    {/* Twitter / X */}
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter / X"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-[10px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#141219] hover:border-[#141219] hover:shadow-[0_6px_16px_rgba(20,18,25,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                    >
                      <svg className="w-3.5 h-3.5 fill-current transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>

                    {/* Email */}
                    <a
                      href="mailto:support@ilovesurprises.com"
                      aria-label="Email Support"
                      className="w-8 h-8 sm:w-8 sm:h-8 rounded-[10px] bg-white border border-[#eedbe6] text-[#55505a] hover:text-white hover:bg-[#D30915] hover:border-[#D30915] hover:shadow-[0_6px_16px_rgba(211, 9, 21,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 flex items-center justify-center shadow-2xs group"
                    >
                      <Mail className="w-3.5 h-3.5 text-current transition-transform group-hover:scale-110" />
                    </a>
                  </div>
                </div>

                {/* Direct Support Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-3 text-[11px] font-bold text-[#55505a]">
                  <a
                    href="mailto:support@ilovesurprises.com"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#eedbe6] hover:border-[#D30915] hover:text-[#D30915] transition-colors shadow-2xs"
                  >
                    <Mail className="w-3 h-3 text-[#D30915]" />
                    <span>support@ilovesurprises.com</span>
                  </a>

                  <a
                    href="tel:18007877747"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#eedbe6] hover:border-[#D30915] hover:text-[#D30915] transition-colors shadow-2xs"
                  >
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>1-800-SURPRISE</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

      </div>

      {/* 4. Payment Badges & Safe Checkout Strip */}
      <div className="mt-8 sm:mt-10 pt-4 sm:pt-6 border-t border-[#f0e4ec] flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">

        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-[#141219]">
          <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span>256-Bit SSL Encrypted Bank-Grade Checkout</span>
        </div>

        {/* Payment Badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[10px] font-bold text-[#55505a]">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
            VISA
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
            Mastercard
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
            AMEX
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold text-[#003087]">
            PayPal
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
            Apple Pay
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold text-[#5a31f4]">
            Shop Pay
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-[6px] sm:rounded-[8px] bg-white border border-[#e8dfe5] shadow-2xs font-mono font-bold">
            Google Pay
          </span>
        </div>

      </div>

      {/* 5. Bottom Copyright Strip */}
      <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[#f4edf2] text-[10px] sm:text-[11px] text-[#85818a] flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <p className="m-0">
          © 2026 <strong className="text-[#141219]">ILoveSurprises.com</strong>. All rights reserved. Hand-poured with love in the USA.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => onNavigate?.('about')}
            className="hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            About Us
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate?.('contact')}
            className="hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Contact Us
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate?.('privacy')}
            className="hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate?.('terms')}
            className="hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
          >
            Terms of Service
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate?.('affiliate')}
            className="text-[#D30915] font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
          >
            Representative Hub (20%)
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={() => onNavigate?.('admin')}
            className="text-[#55505a] hover:text-[#D30915] font-bold cursor-pointer bg-transparent border-none p-0"
          >
            🛡️ Admin Portal
          </button>
        </div>
      </div>

    </div>
    </footer >
  );
};
