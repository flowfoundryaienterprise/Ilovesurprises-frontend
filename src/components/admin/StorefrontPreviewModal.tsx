import React, { useState } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  ArrowLeft,
  Save,
  X,
  Zap,
  Tag,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import type { HomepageContentConfig } from '../../types/admin';
import { Hero } from '../home/Hero';
import { FeaturedCollectionsSection } from '../home/FeaturedCollectionsSection';
import { CategorySection } from '../home/CategorySection';

interface StorefrontPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  content: HomepageContentConfig;
  onPublish: () => void;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const StorefrontPreviewModal: React.FC<StorefrontPreviewModalProps> = ({
  isOpen,
  onClose,
  content,
  onPublish,
}) => {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const valueProp = content.valueProposition || {
    eyebrow: 'Why Choose I Love Surprises',
    title: 'The Original Real Cash & Luxury Jewelry Reveal Experience',
    description:
      'Every candle and bath bomb is hand-poured in the USA using 100% natural soy wax, concealing certified jewelry or real US paper cash from $2 up to $2,500.',
    points: [
      'Guaranteed Real Cash or Certified Jewelry in every item',
      '100% Natural Soy Wax with lead-free cotton wicks',
      'Artisan hand-poured small batches in the USA',
      'Fast insured delivery with hassle-free 30-day returns',
    ],
  };

  const about = content.aboutContent || {
    badge: 'Our Brand Story & Craftsmanship',
    headline: 'Where Luxury Fragrance Meets the Thrill of Real Surprises',
    storyText:
      'Hand-poured 100% natural soy wax candles crafted with artisan care in the USA. Every single candle, bath treat, and wax melt is guaranteed to conceal authentic cash or luxury fine jewelry.',
    naturalSoyStat: '100% Natural Soy Wax',
    unboxingsStat: '125,000+ Unboxings',
    realCashStat: 'Up to $2,500 Cash Inside',
  };

  const faqs = (content.faqItems && content.faqItems.length > 0) ? content.faqItems : [
    {
      id: 'faq-1',
      question: 'What is I Love Surprises?',
      answer: 'I Love Surprises offers candles, bath treats, and wax melts with guaranteed authentic cash ($2 to $2,500) or genuine appraised jewelry hidden inside every product.',
      category: 'About Surprises',
    },
    {
      id: 'faq-2',
      question: 'Are the candles made with pure soy wax?',
      answer: 'Yes! All of our reveal candles are artisan hand-poured in the USA using 100% natural soy wax with premium lead-free cotton wicks for a clean, non-toxic burn.',
      category: 'Products',
    },
    {
      id: 'faq-3',
      question: 'How do you safeguard the cash & jewelry during burning?',
      answer: 'Each reward is carefully wrapped in heavy-gauge commercial heat-resistant protective foil and double-sealed inside a protective capsule beneath the wax surface.',
      category: 'Safety & Quality',
    },
  ];

  const footer = content.footerContent || {
    newsletterTitle: 'Unlock 15% Off Your Next Surprise & Weekly Cash Drop Alerts',
    newsletterSubtitle:
      'Join over 85,000+ unboxing fans. Be first to know about new limited scents, rare diamond jewelry drops, and grand cash reveals.',
    copyrightText: '© 2026 ILoveSurprises.com. All rights reserved. Hand-poured with love in the USA.',
    supportEmail: 'support@ilovesurprises.com',
    supportPhone: '1-800-SURPRISE',
    guaranteeText: '256-Bit SSL Encrypted Bank-Grade Checkout',
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#141219]/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      {/* 1. PREVIEW CONTROL BAR (Always Sticky at Top) */}
      <header className="h-16 px-3 sm:px-6 bg-[#1a1420] border-b border-[#362737] flex items-center justify-between text-white shrink-0 shadow-lg z-50">
        {/* Left: Exit to Admin */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Return to Admin</span>
            <span className="sm:hidden">Exit</span>
          </button>

          <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-white/15">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
              <span>Draft Preview Mode</span>
            </span>
            <span className="text-[11px] text-gray-400">
              Interactive preview using unsaved admin draft state
            </span>
          </div>
        </div>

        {/* Center: Device Switcher */}
        <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              device === 'desktop'
                ? 'bg-[#D30915] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Desktop 100% View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              device === 'tablet'
                ? 'bg-[#D30915] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Tablet (768px View)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Tablet (768px)</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              device === 'mobile'
                ? 'bg-[#D30915] text-white shadow-xs'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Mobile (375px View)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mobile (375px)</span>
          </button>
        </div>

        {/* Right: Publish or Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onPublish();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Publish Changes</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Close Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 2. PREVIEW SCROLLABLE STAGE */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-6 flex justify-center bg-[#251d29]/60">
        <div
          className={`transition-all duration-300 bg-white text-[#141219] rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col min-h-screen ${
            device === 'desktop'
              ? 'w-full max-w-[1460px]'
              : device === 'tablet'
              ? 'w-[768px] max-w-full border-8 border-[#3b2b3f]'
              : 'w-[375px] max-w-full border-8 border-[#3b2b3f]'
          }`}
        >
          {/* Top Sticky Announcement Banner */}
          {content.announcementActive && (
            <div className="bg-[#D30915] text-white py-1.5 px-3 text-center text-xs font-bold flex items-center justify-center gap-2">
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>{content.announcementText || 'Free Shipping on orders $75+ • Real Cash or Jewelry inside every item!'}</span>
            </div>
          )}

          {/* Promotional Discount Alert */}
          {content.promoBannerActive && (
            <div className="bg-purple-900 text-purple-100 py-1 px-3 text-center text-[11px] font-semibold flex items-center justify-center gap-2">
              <Tag className="w-3 h-3 text-amber-300" />
              <span>{content.promoBannerText || 'Special Offer Available'}</span>
              {content.promoBannerCode && (
                <span className="px-1.5 py-0.2 bg-white/20 rounded font-mono font-bold text-white">
                  {content.promoBannerCode}
                </span>
              )}
            </div>
          )}

          {/* Simulated Brand Header */}
          <div className="border-b border-[#eedbe6] bg-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-[#D30915] font-display">
                I Love Surprises <span className="text-[#141219]">❤️</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                Storefront
              </span>
            </div>
            <div className="text-xs text-[#716d77] font-semibold hidden sm:flex items-center gap-4">
              <span>Shop All</span>
              <span>Cash Candles</span>
              <span>Jewelry</span>
              <span>About</span>
              <span>FAQ</span>
            </div>
          </div>

          {/* DYNAMIC HERO SECTION PREVIEW */}
          <div className="w-full">
            <Hero config={content.hero} />
          </div>

          {/* Category Explore Section */}
          <div className="w-full">
            <CategorySection />
          </div>

          {/* FEATURED COLLECTIONS SECTION (Halloween, Christmas, Cash, Zodiac) */}
          <div className="w-full">
            <FeaturedCollectionsSection />
          </div>

          {/* VALUE PROPOSITION SECTION */}
          <section className="max-w-[1460px] mx-auto px-4 sm:px-8 py-8 sm:py-12 bg-gradient-to-br from-[#fff7f9] via-white to-[#fdf2f4] rounded-2xl sm:rounded-3xl border border-[#eedbe6] my-6">
            <div className="text-center max-w-3xl mx-auto space-y-2 mb-6">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
                {valueProp.eyebrow}
              </span>
              <h2 className="text-xl sm:text-3xl font-black text-[#141219] font-display tracking-tight m-0">
                {valueProp.title}
              </h2>
              <p className="text-xs sm:text-sm text-[#716d77] leading-relaxed m-0 font-medium">
                {valueProp.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {valueProp.points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-white border border-[#eedbe6] shadow-2xs flex items-start gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-[#141219] leading-snug">{pt}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ABOUT BRAND TEASER */}
          <section className="max-w-[1460px] mx-auto px-4 sm:px-8 py-8 bg-white border-t border-[#eedbe6]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="text-[10px] font-black uppercase text-[#D30915] tracking-wider">
                  {about.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-[#141219] font-display m-0">
                  {about.headline}
                </h3>
                <p className="text-xs sm:text-sm text-[#716d77] m-0 leading-relaxed font-medium">
                  {about.storyText}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 shrink-0">
                <div className="p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-center">
                  <strong className="block text-xs sm:text-sm font-black text-[#D30915]">
                    {about.naturalSoyStat}
                  </strong>
                  <span className="text-[10px] text-[#716d77]">Poured in USA</span>
                </div>
                <div className="p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-center">
                  <strong className="block text-xs sm:text-sm font-black text-[#141219]">
                    {about.unboxingsStat}
                  </strong>
                  <span className="text-[10px] text-[#716d77]">Happy Customers</span>
                </div>
                <div className="p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-center">
                  <strong className="block text-xs sm:text-sm font-black text-emerald-600">
                    {about.realCashStat}
                  </strong>
                  <span className="text-[10px] text-[#716d77]">Guaranteed Win</span>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ SECTION PREVIEW */}
          <section className="max-w-[1460px] mx-auto px-4 sm:px-8 py-8 bg-[#faf7f9] border-t border-[#eedbe6]">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="text-center mb-4">
                <span className="text-[10px] font-black uppercase text-[#D30915] tracking-wider">
                  Customer Questions
                </span>
                <h3 className="text-xl font-black text-[#141219] m-0">Frequently Asked Questions</h3>
              </div>

              {faqs.map((faq, idx) => (
                <div
                  key={faq.id || idx}
                  className="rounded-xl border border-[#eedbe6] bg-white overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaqIndex(expandedFaqIndex === idx ? null : idx)}
                    className="w-full p-3.5 text-left flex items-center justify-between gap-2 font-bold text-xs text-[#141219] hover:bg-[#fff9fa] transition-colors cursor-pointer"
                  >
                    <span>{faq.question}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        expandedFaqIndex === idx ? 'rotate-180 text-[#D30915]' : ''
                      }`}
                    />
                  </button>
                  {expandedFaqIndex === idx && (
                    <div className="px-3.5 pb-3.5 text-xs text-[#716d77] leading-relaxed border-t border-[#faf0f5] pt-2">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* FOOTER PREVIEW */}
          <footer className="mt-auto border-t border-[#eedbe6] bg-gradient-to-b from-white to-[#faf7f9] p-6 text-center space-y-3">
            <h4 className="text-sm sm:text-base font-black text-[#141219] m-0">
              {footer.newsletterTitle}
            </h4>
            <p className="text-xs text-[#716d77] max-w-lg mx-auto m-0">
              {footer.newsletterSubtitle}
            </p>
            <div className="text-[11px] text-[#716d77] pt-2 border-t border-[#eedbe6] flex flex-wrap items-center justify-center gap-3">
              <span>{footer.copyrightText}</span>
              <span>•</span>
              <span>Email: {footer.supportEmail}</span>
              <span>•</span>
              <span>Phone: {footer.supportPhone}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
