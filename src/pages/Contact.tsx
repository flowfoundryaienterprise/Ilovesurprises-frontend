import React, { useState } from 'react';
import {
  Mail,
  Phone,
  Clock,
  Send,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Package,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface ContactFormData {
  fullName: string;
  email: string;
  phone: string;
  topic: string;
  orderNumber: string;
  message: string;
}

interface ContactFormErrors {
  fullName?: string;
  email?: string;
  topic?: string;
  message?: string;
}

const FAQ_ITEMS = [
  {
    question: 'How does the surprise reveal work inside the candle?',
    answer:
      'Every I Love Surprises candle contains a protective heat-resistant gold foil package hidden beneath the wax. As you burn your candle over 15 to 20 hours, the foil packet will gently reveal itself. Simply extinguish the flame, let the wax cool slightly, and carefully remove your packet with tweezers to unwrap your authentic cash or fine jewelry!',
  },
  {
    question: 'Are the cash prizes and fine jewelry 100% genuine?',
    answer:
      'Yes, absolutely! 100% of our products contain an authentic prize. Cash amounts range from $2, $5, $10, $20, $50, $100, $500, $1,000, up to $2,500 in real US currency. Jewelry items are crafted from solid .925 sterling silver or 14k gold with genuine stones and come with a certified jewelry appraisal tag valued up to $7,500.',
  },
  {
    question: 'What ingredients and wax blend do you use?',
    answer:
      'Our candles are hand-poured in the USA using 100% natural, renewable American soy wax, lead-free braided cotton wicks, and master-curated fragrance oils that are 100% phthalate-free, paraben-free, vegan, and cruelty-free.',
  },
  {
    question: 'How fast is nationwide shipping and handling?',
    answer:
      'Orders are packed and dispatched from our US shipping hubs within 1-2 business days. Express delivery typically takes 2-3 business days. We offer free tracked express shipping nationwide on all orders of $50 or more.',
  },
  {
    question: 'How do I join as an Independent Representative?',
    answer:
      'You can join our Representative Program to earn 20% direct commission on all customer candle sales through your personalized store link, plus up to 15% in 5-tier team override bonuses (up to 35% total program payout) with monthly direct payouts on the 15th of each month.',
  },
  {
    question: 'What is your guarantee and damaged package policy?',
    answer:
      'We stand behind our 100% Win & Satisfaction Guarantee. If your candle arrives damaged during transit, simply message us with a photo of the shipping box at support@ilovesurprises.com and we will immediately dispatch a complimentary replacement.',
  },
];

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    email: '',
    phone: '',
    topic: 'Order Status & Express Tracking',
    orderNumber: '',
    message: '',
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const validateForm = (): boolean => {
    const errs: ContactFormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.topic) {
      errs.topic = 'Please select an inquiry topic';
    }

    if (!formData.message.trim()) {
      errs.message = 'Message cannot be empty';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Please provide at least 10 characters of detail';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate clean async submission
    await new Promise((resolve) => setTimeout(resolve, 800));

    const generatedTicket = `ILS-CARE-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(generatedTicket);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleResetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      topic: 'Order Status & Express Tracking',
      orderNumber: '',
      message: '',
    });
    setErrors({});
    setIsSubmitted(false);
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-4 sm:py-10 lg:py-14 text-[#141219] overflow-x-hidden">
      <div className="max-w-[1360px] mx-auto px-2.5 sm:px-4 lg:px-6 space-y-6 sm:space-y-12 lg:space-y-16">

        {/* 1. Hero Section */}
        <div className="bg-gradient-to-br from-[#fff1f2] via-[#fff8fb] to-[#fbf4ff] rounded-[20px] sm:rounded-[32px] p-4 sm:p-10 lg:p-14 border-2 border-[#fecdd3] shadow-[0_12px_40px_rgba(211, 9, 21,0.08)] relative overflow-hidden text-center">
          <div className="absolute -top-12 -left-12 w-64 sm:w-72 h-64 sm:h-72 bg-[#D30915]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-64 sm:w-80 h-64 sm:h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-2 sm:space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1 rounded-full bg-white text-[#D30915] border border-[#fecdd3] text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
              <span>Customer Care & Help Center</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-[#141219] font-display tracking-tight leading-[1.15] m-0">
              We're Here to Help You Reveal the Magic
            </h1>

            <p className="text-xs sm:text-sm text-[#55505a] leading-relaxed font-medium m-0">
              Have questions about your surprise candle order, prize appraisals, or joining our representative partner team? Our customer care specialists are here for you.
            </p>
          </div>
        </div>

        {/* 2. Direct Contact Channels Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6">
          {/* Email Support Card */}
          <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border-2 border-[#fecdd3] shadow-[0_6px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between hover:border-[#D30915] transition-all group space-y-3">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] block">
                Email Customer Care
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#141219] m-0 mb-1 font-display">
                support@ilovesurprises.com
              </h3>
              <p className="text-xs text-[#716d77] leading-relaxed m-0">
                Direct written support for order inquiries, delivery updates, and prize appraisal verifications.
              </p>
            </div>

            <div className="pt-3 border-t border-[#f7eff4] flex items-center justify-between text-xs font-bold">
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                Under 24h Response
              </span>
              <a
                href="mailto:support@ilovesurprises.com"
                className="text-[#D30915] hover:underline font-black"
              >
                Send Email →
              </a>
            </div>
          </div>

          {/* Phone Support Card */}
          <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border-2 border-[#fecdd3] shadow-[0_6px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between hover:border-[#D30915] transition-all group space-y-3">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <Phone className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Toll-Free Phone
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#141219] m-0 mb-1 font-display">
                1-800-SURPRISE (1-800-787-7747)
              </h3>
              <p className="text-xs text-[#716d77] leading-relaxed m-0">
                Speak directly with our US-based unboxing customer care team for expedited order assistance.
              </p>
            </div>

            <div className="pt-3 border-t border-[#f7eff4] flex items-center justify-between text-xs font-bold">
              <span className="text-[#55505a] text-[10px] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#D30915] shrink-0" />
                <span>Mon–Fri 8am–6pm EST</span>
              </span>
              <a
                href="tel:18007877747"
                className="text-[#D30915] hover:underline font-black"
              >
                Call Now →
              </a>
            </div>
          </div>

          {/* Order Tracking & Rep Hub */}
          <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-6 border-2 border-[#fecdd3] shadow-[0_6px_20px_rgba(50,31,63,0.03)] flex flex-col justify-between hover:border-[#D30915] transition-all group space-y-3">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[12px] sm:rounded-[14px] bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                Self-Service Portals
              </span>
              <h3 className="text-sm sm:text-base font-black text-[#141219] m-0 mb-1 font-display">
                Track Orders & Rep Portal
              </h3>
              <p className="text-xs text-[#716d77] leading-relaxed m-0">
                Check real-time USPS/UPS courier milestones or manage your 20% representative sponsor earnings.
              </p>
            </div>

            <div className="pt-3 border-t border-[#f7eff4] flex items-center justify-between text-xs font-bold">
              <span className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200 text-[10px]">
                24/7 Access
              </span>
              <span className="text-[#D30915] font-black">
                Account Portal →
              </span>
            </div>
          </div>
        </div>

        {/* 3. Interactive Contact Form & Trust Highlights */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-white rounded-[20px] sm:rounded-[30px] p-4 sm:p-8 lg:p-9 border-2 border-[#fecdd3] shadow-[0_10px_30px_rgba(211, 9, 21,0.06)]">
            {isSubmitted ? (
              /* Success Confirmation Banner */
              <div className="py-6 sm:py-8 text-center space-y-3 sm:space-y-4 animate-in fade-in zoom-in-95">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5]" />
                </div>

                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full inline-block">
                  Message Sent Successfully
                </span>

                <h3 className="text-xl sm:text-2xl font-black text-[#141219] font-display m-0">
                  Thank You, {formData.fullName}!
                </h3>

                <p className="text-xs sm:text-sm text-[#716d77] max-w-md mx-auto leading-relaxed m-0">
                  Your inquiry regarding <strong className="text-[#141219] font-bold">"{formData.topic}"</strong> has been logged with ticket reference <code className="text-[#D30915] font-mono font-bold bg-[#fff1f2] px-2 py-0.5 rounded border border-[#fecdd3]">{ticketId}</code>. Our customer care team will respond to <strong className="text-[#141219]">{formData.email}</strong> within 24 hours.
                </p>

                <div className="pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="h-[40px] sm:h-[42px] px-6 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-xs cursor-pointer inline-flex items-center justify-center gap-2 transition-all w-full sm:w-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Send Another Inquiry</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Contact Input Form */
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                <div className="pb-2.5 sm:pb-3 border-b border-[#f5eaf1]">
                  <h3 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
                    Send Us a Message
                  </h3>
                  <p className="text-xs text-[#716d77] m-0 mt-0.5">
                    Fill out the form below and our team will get back to you promptly.
                  </p>
                </div>

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">
                      Full Name <span className="text-[#D30915]">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => {
                        setFormData({ ...formData, fullName: e.target.value });
                        if (errors.fullName) setErrors({ ...errors, fullName: undefined });
                      }}
                      placeholder="Your name"
                      className={`w-full h-[40px] sm:h-[42px] px-3 sm:px-3.5 rounded-[12px] bg-[#fffafb] border text-xs text-[#141219] outline-none transition-all ${errors.fullName ? 'border-red-400 bg-red-50/40' : 'border-[#e8dfe5] focus:border-[#D30915]'
                        }`}
                    />
                    {errors.fullName && (
                      <span className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.fullName}</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">
                      Email Address <span className="text-[#D30915]">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                      placeholder="example@gmail.com"
                      className={`w-full h-[40px] sm:h-[42px] px-3 sm:px-3.5 rounded-[12px] bg-[#fffafb] border text-xs text-[#141219] outline-none transition-all ${errors.email ? 'border-red-400 bg-red-50/40' : 'border-[#e8dfe5] focus:border-[#D30915]'
                        }`}
                    />
                    {errors.email && (
                      <span className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Topic & Order Number Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">
                      Inquiry Topic <span className="text-[#D30915]">*</span>
                    </label>
                    <select
                      value={formData.topic}
                      onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      className="w-full h-[40px] sm:h-[42px] px-3 sm:px-3.5 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none cursor-pointer"
                    >
                      <option value="Order Status & Express Tracking">Order Status & Express Tracking</option>
                      <option value="Prize Reveal & Jewelry Appraisal">Prize Reveal & Jewelry Appraisal</option>
                      <option value="Representative / Affiliate Program">Representative / Affiliate Program</option>
                      <option value="Wholesale & Bulk Boutique Inquiries">Wholesale & Bulk Boutique Inquiries</option>
                      <option value="Product Scents & Candle Care">Product Scents & Candle Care</option>
                      <option value="General Customer Care & Returns">General Customer Care & Returns</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">
                      Order ID <span className="text-[#8a858f] font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.orderNumber}
                      onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                      placeholder="e.g. ILS-78219"
                      className="w-full h-[40px] sm:h-[42px] px-3 sm:px-3.5 rounded-[12px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs text-[#141219] font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Message TextArea */}
                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1">
                    Your Message / Details <span className="text-[#D30915]">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (errors.message) setErrors({ ...errors, message: undefined });
                    }}
                    placeholder="Describe how we can assist you today with your order or inquiry..."
                    className={`w-full p-3 sm:p-3.5 rounded-[12px] sm:rounded-[14px] bg-[#fffafb] border text-xs text-[#141219] outline-none resize-none transition-all ${errors.message ? 'border-red-400 bg-red-50/40' : 'border-[#e8dfe5] focus:border-[#D30915]'
                      }`}
                  />
                  {errors.message && (
                    <span className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.message}</span>
                    </span>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-1 sm:pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-[44px] sm:min-h-[46px] rounded-[12px] sm:rounded-[14px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-[0_6px_20px_rgba(211, 9, 21,0.28)] active:scale-97 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Ticket...</span>
                      </span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Message to Customer Care</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right Column: Trust Card & FAQ Fast Track */}
          <div className="lg:col-span-5 space-y-4 sm:space-y-5">
            <div className="bg-gradient-to-br from-[#fff1f2] to-[#ffeef4] rounded-[20px] sm:rounded-[28px] p-4 sm:p-7 border-2 border-[#fecdd3] shadow-[0_8px_24px_rgba(211, 9, 21,0.06)] space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-[#D30915] shrink-0" />
                <h3 className="text-sm sm:text-base font-black text-[#141219] m-0 font-display">
                  Our Unboxing Customer Promise
                </h3>
              </div>

              <p className="text-xs text-[#55505a] leading-relaxed font-medium m-0">
                At I Love Surprises, we believe in 100% transparency. Every cash prize is authentic legal tender and every jewelry reveal is genuine solid precious metal with certified appraisal verification.
              </p>

              <div className="space-y-2 sm:space-y-2.5 pt-2 border-t border-[#fecdd3] text-xs font-bold text-[#141219]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free shipping on all US orders $50+</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>24-Hour support response guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Free replacement for transit damages</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[18px] sm:rounded-[24px] p-4 sm:p-5 border border-[#eedbe6] text-xs space-y-1.5 sm:space-y-2 text-[#716d77]">
              <strong className="block text-xs sm:text-sm font-bold text-[#141219]">Operating Hours:</strong>
              <p className="m-0">Monday – Friday: 8:00 AM – 6:00 PM EST</p>
              <p className="m-0">Saturday: 9:00 AM – 2:00 PM EST</p>
              <p className="m-0">Sunday: Closed for artisan candle pouring</p>
            </div>
          </div>
        </div>

        {/* 4. Interactive FAQ Accordion Section */}
        <div className="bg-white rounded-[20px] sm:rounded-[32px] p-4 sm:p-8 lg:p-12 border-2 border-[#eedbe6] shadow-[0_8px_30px_rgba(50,31,63,0.04)] space-y-4 sm:space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1 sm:space-y-1.5">
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              Help & Answers
            </span>
            <h2 className="text-xl sm:text-3xl font-black text-[#141219] font-display m-0">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77]">
              Find quick answers to common questions about reveals, prizes, and candles.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={faq.question}
                  className={`rounded-[14px] sm:rounded-[18px] border-2 transition-colors duration-300 ${isOpen
                      ? 'bg-[#fffafc] border-[#fecdd3] shadow-xs'
                      : 'bg-white border-[#f0e2ec] hover:border-[#fecdd3]'
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${idx}`}
                    id={`faq-header-${idx}`}
                    className="group w-full p-3.5 sm:p-5 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#141219] hover:text-[#D30915] active:scale-[0.99] transition-colors cursor-pointer"
                  >
                    <span className="pr-2 group-hover:text-[#D30915] transition-colors">{faq.question}</span>
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 ml-2 transition-colors duration-300 ${
                        isOpen
                          ? 'bg-[#D30915] text-white shadow-xs'
                          : 'bg-[#fff1f2] text-[#D30915] group-hover:bg-[#ffe5ea]'
                      }`}
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ease-out ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${idx}`}
                    role="region"
                    aria-labelledby={`faq-header-${idx}`}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-3.5 sm:px-5 pb-4 sm:pb-5 text-xs text-[#55505a] leading-relaxed">
                        <p className="m-0 pt-2 border-t border-[#f7eff4]">{faq.answer}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
