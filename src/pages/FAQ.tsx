import React, { useState } from 'react';
import { ChevronDown, ArrowLeft, MessageCircleQuestion, Mail, Search } from 'lucide-react';

interface FAQProps {
  onNavigateToHome?: () => void;
  onNavigateToContact?: () => void;
}

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    question: 'What is I Love Surprises?',
    answer: 'I Love Surprises offers fun products designed around the excitement of discovering a surprise. Depending on the product, the surprise may include jewelry, cash, or another featured reward.',
    category: 'About Surprises',
  },
  {
    question: 'What kinds of products do you offer?',
    answer: 'Our assortment may include candles, wax melts, bath products, soaps, candy, chocolates, slimes, greeting cards, jewelry, and other surprise products.',
    category: 'Products',
  },
  {
    question: 'Are the candles soy based?',
    answer: 'Where specified on the product page, our candle products are made with soy wax. Always review the individual product description for the most accurate materials and product details.',
    category: 'Products',
  },
  {
    question: 'Can I choose my jewelry?',
    answer: 'Some products may offer jewelry type or size choices. Available options are shown on the individual product page at the time of purchase.',
    category: 'Jewelry & Sizing',
  },
  {
    question: 'Can I cancel an order?',
    answer: 'Orders can enter processing quickly, so cancellation or modification cannot be guaranteed after an order is placed. Contact customer support as soon as possible if you need help.',
    category: 'Orders & Changes',
  },
  {
    question: 'Where do you ship?',
    answer: 'Available shipping destinations are shown during checkout. Shipping availability may include the United States and selected international destinations depending on the product.',
    category: 'Shipping & Delivery',
  },
  {
    question: 'How do I return a product?',
    answer: 'Eligible returns should be requested within 60 days of receipt and must meet the conditions described in our Refund & Return Policy.',
    category: 'Returns & Refunds',
  },
  {
    question: 'How long does a refund take?',
    answer: 'Approved refunds are normally processed within 7 days after the returned item is received and inspected, although payment providers may take additional time.',
    category: 'Returns & Refunds',
  },
  {
    question: 'How do I contact support?',
    answer: 'Use the Contact page on ILoveSurprises.com to submit your question, order issue, or feedback.',
    category: 'Customer Support',
  },
];

export const FAQ: React.FC<FAQProps> = ({
  onNavigateToHome,
  onNavigateToContact,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleAccordion = (idx: number) => {
    setExpandedIndex((prev) => (prev === idx ? null : idx));
  };

  const filteredFaqs = FAQ_LIST.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <MessageCircleQuestion className="w-3.5 h-3.5 shrink-0" />
            <span>Help & Common Questions</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#141219] tracking-tight leading-tight hero-title-font m-0 mb-3">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-[#55505a] max-w-3xl leading-relaxed m-0 font-medium mb-6">
            Find fast answers to common questions about our reveal surprises, soy candles, order handling, returns, and support.
          </p>

          {/* Quick Search Bar */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. shipping, returns, jewelry)..."
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#faf5f8] border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none transition-all"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8a858f] hover:text-[#141219]"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Accessible Accordion Section */}
        <div className="space-y-3" role="region" aria-label="Frequently Asked Questions Accordion">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#eedbe6] p-8 text-center">
              <p className="text-sm text-[#716d77] m-0">
                No matching questions found for "{searchQuery}".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="mt-3 text-xs font-bold text-[#D30915] hover:underline"
              >
                Reset search
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedIndex === idx;
              const headerId = `faq-title-${idx}`;
              const panelId = `faq-panel-${idx}`;

              return (
                <div
                  key={faq.question}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden text-left ${
                    isOpen
                      ? 'border-[#D30915]/30 shadow-sm'
                      : 'border-[#eedbe6] hover:border-[#dfc9d6]'
                  }`}
                >
                  <button
                    type="button"
                    id={headerId}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleAccordion(idx)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleAccordion(idx);
                      }
                    }}
                    className="w-full px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between gap-4 text-left cursor-pointer bg-transparent border-none transition-colors"
                  >
                    <span className="text-sm sm:text-base font-bold text-[#141219] leading-snug">
                      {faq.question}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                        isOpen
                          ? 'bg-[#fff1f2] text-[#D30915] rotate-180'
                          : 'bg-[#faf5f8] text-[#716d77]'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {isOpen && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="px-5 sm:px-7 pb-5 pt-1 text-sm text-[#4a4550] leading-relaxed border-t border-[#f7eff4] font-medium"
                    >
                      <p className="m-0">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Support Callout */}
        <div className="mt-10 bg-gradient-to-r from-[#fff1f2] to-[#fff7fa] rounded-2xl border border-[#f8d7dc] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 mb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D30915]" />
              <span>Still have questions or need assistance?</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#55505a] m-0 font-medium">
              Our 24/7 customer care concierge is ready to help with orders, reveals, or general inquiries.
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToContact}
            className="px-6 py-3 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg shrink-0 cursor-pointer"
          >
            Contact Customer Care
          </button>
        </div>

      </div>
    </div>
  );
};
