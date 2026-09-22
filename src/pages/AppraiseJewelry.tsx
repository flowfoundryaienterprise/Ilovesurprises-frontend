import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  ChevronDown,
  ShieldCheck,
  Tag,
  Copy,
  Check,
  Printer,
  X,
  Upload,
  Camera,
  FileText,
  Clock,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import type { PublicAppraisalResult } from '../types/appraisal';
import { appraisalService } from '../services/appraisalService';
import { accountService } from '../services/accountService';

interface AppraiseJewelryProps {
  onNavigateToShop?: () => void;
  onNavigateToHome?: () => void;
}


const FAQS = [
  {
    q: 'Where do I find my jewelry code?',
    a: 'Every piece of fine jewelry revealed inside our surprise candles, wax melts, or bath treats is sealed inside a heat-resistant protective pouch. Attached directly to the jewelry or packaging is an official appraisal tag printed with your unique authentication code (e.g., ILS-GOLD-550).',
  },
  {
    q: 'How is the jewelry value estimated?',
    a: 'Our jewelry values represent certified manufacturer suggested retail values (MSRP) verified by professional independent gemologists and appraisers. Valuations are based on current precious metal purity (.925 solid sterling silver, 14K solid gold), gemstone carat weight, color, clarity, and craftsmanship.',
  },
  {
    q: 'Can I have my revealed jewelry appraised by my local jeweler?',
    a: 'Yes! We encourage it. 100% of our fine jewelry is crafted from solid precious metals stamped with authentic hallmarks (.925 or 14K) and genuine stones. Any certified jeweler or pawn appraiser will verify its authentic precious metal content.',
  },
  {
    q: 'What if my jewelry code comes back as not found?',
    a: 'Please double-check the characters printed on your tag. Codes are usually formatted as ILS-XXXX-XXXX. Ensure there are no typos, or submit your jewelry photos and details through our appraisal form for direct valuation.',
  },
];

export const AppraiseJewelry: React.FC<AppraiseJewelryProps> = ({
  onNavigateToShop,
  onNavigateToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'submit' | 'lookup'>('submit');

  // Form states for "What to Submit"
  const [customerName, setCustomerName] = useState(() => accountService.getStoredUser()?.name || '');
  const [email, setEmail] = useState(() => accountService.getStoredUser()?.email || '');
  const [orderNumber, setOrderNumber] = useState('');
  const [productName, setProductName] = useState('');
  const [jewelryType, setJewelryType] = useState('Ring');
  const [codeInfo, setCodeInfo] = useState('');
  const [selectedPhotoNames, setSelectedPhotoNames] = useState<string[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    type: 'success' | 'pending_backend' | 'error';
    message: string;
  } | null>(null);

  // Instant code lookup states
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appraisalResult, setAppraisalResult] = useState<PublicAppraisalResult | null>(null);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedPhotoNames(files.map((f) => f.name));

      const previews: string[] = [];
      files.forEach((f) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          if (ev.target?.result) {
            previews.push(ev.target.result as string);
            if (previews.length === files.length) {
              setPhotoPreviews(previews);
            }
          }
        };
        reader.readAsDataURL(f);
      });
    }
  };

  const handleAppraisalFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !email.trim() || !productName.trim() || !jewelryType.trim()) {
      setSubmissionFeedback({
        type: 'error',
        message: 'Please fill in all required fields: Customer name, email address, product name, and jewelry type.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);

    try {
      // 1. Save to authoritative customer appraisal submissions registry
      const savedSubmission = appraisalService.submitAppraisal({
        customerName: customerName.trim(),
        customerEmail: email.trim(),
        orderNumber: orderNumber.trim() || undefined,
        productName: productName.trim(),
        jewelryType,
        codeInfo: codeInfo.trim() || undefined,
        photoPreviews: photoPreviews.length > 0 ? photoPreviews : undefined,
      });

      setIsSubmitting(false);
      setSubmissionFeedback({
        type: 'success',
        message: `Your jewelry appraisal submission was received successfully! Reference ID: #${savedSubmission.id}. Our gemology team has logged your photos and details for appraisal.`,
      });

      // Reset form fields
      setCustomerName('');
      setProductName('');
      setOrderNumber('');
      setCodeInfo('');
      setSelectedPhotoNames([]);
      setPhotoPreviews([]);
    } catch (err: any) {
      setIsSubmitting(false);
      setSubmissionFeedback({
        type: 'error',
        message: `Unable to submit appraisal request: ${err?.message || 'Unexpected error'}. Please try again or contact support@ilovesurprises.com.`,
      });
    }
  };

  const handleLookup = async (codeToLookup?: string) => {
    const targetCode = (codeToLookup !== undefined ? codeToLookup : code).trim();

    if (!targetCode) {
      setError('Please enter your jewelry code to discover its appraised value.');
      setAppraisalResult(null);
      inputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await appraisalService.lookupJewelryCode(targetCode);

      if (res.success && res.data) {
        setAppraisalResult(res.data);
        setError(null);
        setTimeout(() => {
          resultCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      } else {
        setAppraisalResult(null);
        setError(res.error || "We couldn't find that jewelry code. Please check the code and try again.");
      }
    } catch {
      setAppraisalResult(null);
      setError("We couldn't find that jewelry code. Please check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (appraisalResult?.code) {
      navigator.clipboard.writeText(appraisalResult.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffafc] via-white to-[#fff8fa] text-[#141219] py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-[1100px] mx-auto space-y-8 sm:space-y-12 text-left">

        {/* Back navigation */}
        {onNavigateToHome && (
          <div>
            <button
              type="button"
              onClick={onNavigateToHome}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#716d77] hover:text-[#D30915] transition-colors cursor-pointer bg-transparent border-none p-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </button>
          </div>
        )}

        {/* ================================================================
            1. HERO SECTION & FOUNDER REQUIRED INTRO
        ================================================================ */}
        <section className="text-center max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D30915]/10 border border-[#D30915]/20 text-[#D30915] text-xs font-black uppercase tracking-wider mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Official Gemological Verification</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#141219] tracking-tight leading-[1.15] hero-title-font mb-4">
            Free Jewelry Value / Appraisal
          </h1>

          <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight m-0 mb-2">
              Discover More About Your Jewelry
            </h2>
            <p className="text-sm sm:text-base text-[#55505a] leading-relaxed m-0 font-medium">
              Found jewelry inside an eligible I Love Surprises product? Use our appraisal service to submit your jewelry information and request an estimated value or appraisal information.
            </p>
            {onNavigateToShop && (
              <div className="mt-4 pt-3 border-t border-[#f7eff4] flex items-center justify-between">
                <span className="text-xs text-[#716d77] font-medium">Looking to discover more jewelry reveals?</span>
                <button
                  type="button"
                  onClick={onNavigateToShop}
                  className="text-xs font-bold text-[#D30915] hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Shop Surprise Candles &rarr;
                </button>
              </div>
            )}
          </div>

          {/* Tab Selector */}
          <div className="inline-flex p-1.5 rounded-2xl bg-[#faf5f8] border border-[#eedbe6] shadow-inner mb-2">
            <button
              type="button"
              onClick={() => setActiveTab('submit')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'submit'
                  ? 'bg-[#D30915] text-white shadow-md'
                  : 'text-[#55505a] hover:text-[#141219]'
              }`}
            >
              Submit for Appraisal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('lookup')}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'lookup'
                  ? 'bg-[#D30915] text-white shadow-md'
                  : 'text-[#55505a] hover:text-[#141219]'
              }`}
            >
              Instant Code Lookup
            </button>
          </div>
        </section>

        {/* ================================================================
            2. FOUNDER APPRAISAL SUBMISSION SECTION (TAB 1)
        ================================================================ */}
        {activeTab === 'submit' && (
          <section className="space-y-8">
            {/* What to Submit & How It Works Dual Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* What to Submit Card */}
              <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left">
                <div className="flex items-center gap-2.5 mb-3 text-[#D30915]">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-black text-[#141219] m-0">
                    What to Submit:
                  </h3>
                </div>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-[#4a4550] font-medium leading-relaxed m-0">
                  <li>Customer name</li>
                  <li>Email address</li>
                  <li>Order number, if available</li>
                  <li>Product name</li>
                  <li>Jewelry type</li>
                  <li>Clear photos of the jewelry</li>
                  <li>Any appraisal/code information included with the product</li>
                </ul>
              </div>

              {/* How It Works Card */}
              <div className="bg-white rounded-2xl border border-[#eedbe6] p-6 sm:p-8 shadow-xs text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-3 text-emerald-600">
                    <Clock className="w-5 h-5" />
                    <h3 className="text-lg font-black text-[#141219] m-0">
                      How It Works:
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4a4550] font-medium leading-relaxed m-0 mb-4">
                    Complete the appraisal form and upload the requested information. Our team will review the submission and provide the available appraisal or valuation information.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#effaf4] border border-[#c3eed7] text-[11px] font-bold text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Submissions are cataloged and reviewed by our certified appraisal specialists.</span>
                </div>
              </div>

            </div>

            {/* Important Disclaimer */}
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/80 border border-amber-200 text-left">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-900 m-0 mb-1">
                    Important:
                  </h4>
                  <p className="text-xs sm:text-sm text-amber-900/90 font-medium leading-relaxed m-0">
                    An appraisal or estimated value is informational and may not represent a guaranteed resale, replacement, or market price. Actual value can vary based on condition, market demand, materials, and independent professional assessment.
                  </p>
                </div>
              </div>
            </div>

            {/* Appraisal Request Form */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border-2 border-[#eedbe6] p-6 sm:p-10 shadow-sm text-left">
              <h3 className="text-xl font-black text-[#141219] mb-1">
                Jewelry Appraisal Request Form
              </h3>
              <p className="text-xs sm:text-sm text-[#716d77] mb-6 font-medium">
                Please complete the form below. Required fields are marked with an asterisk (*).
              </p>

              {submissionFeedback && (
                <div
                  className={`p-4 rounded-xl mb-6 text-xs sm:text-sm font-medium border ${
                    submissionFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : submissionFeedback.type === 'pending_backend'
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <p className="m-0 leading-relaxed">{submissionFeedback.message}</p>
                </div>
              )}

              <form onSubmit={handleAppraisalFormSubmit} className="space-y-4 sm:space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@gmail.com"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      Order Number (if available)
                    </label>
                    <input
                      type="text"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="e.g. ILS-10492"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="e.g. Birthday Cake Cash Candle"
                      className="w-full h-11 px-3.5 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1.5">
                      Jewelry Type *
                    </label>
                    <select
                      value={jewelryType}
                      onChange={(e) => setJewelryType(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none bg-white"
                    >
                      <option value="Ring">Ring</option>
                      <option value="Necklace">Necklace</option>
                      <option value="Bracelet">Bracelet</option>
                      <option value="Earrings">Earrings</option>
                      <option value="Pendant">Pendant</option>
                      <option value="Other">Other Jewelry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1.5">
                    Any Appraisal/Code Information Included With Product
                  </label>
                  <input
                    type="text"
                    value={codeInfo}
                    onChange={(e) => setCodeInfo(e.target.value)}
                    placeholder="e.g. Tag Code ILS-GOLD-550, foil pouch markings, hallmark stamps"
                    className="w-full h-11 px-3.5 rounded-xl border border-[#eedbe6] focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/10 text-xs sm:text-sm text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1.5">
                    Clear Photos of the Jewelry
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#eedbe6] hover:border-[#D30915] rounded-2xl p-6 text-center cursor-pointer bg-[#fffbfd] hover:bg-[#fff5f8] transition-colors"
                  >
                    <Upload className="w-6 h-6 text-[#D30915] mx-auto mb-2" />
                    <span className="text-xs sm:text-sm font-bold text-[#141219] block mb-1">
                      Click to upload photos (front, hallmark stamp, gemstone close-up)
                    </span>
                    <span className="text-[11px] text-[#716d77] block">
                      PNG, JPG, WEBP up to 10MB each
                    </span>
                  </div>

                  {selectedPhotoNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedPhotoNames.map((name, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#fff1f2] border border-[#ffd5d9] text-[11px] font-bold text-[#D30915]"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {photoPreviews.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {photoPreviews.map((src, i) => (
                        <img
                          key={i}
                          src={src}
                          alt="Jewelry Preview"
                          className="w-16 h-16 object-cover rounded-xl border border-[#eedbe6]"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider transition-all duration-200 shadow-[0_6px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_10px_24px_rgba(211,9,21,0.38)] cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting Appraisal Request...' : 'Submit Appraisal Request'}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ================================================================
            3. INSTANT CODE LOOKUP TOOL (TAB 2)
        ================================================================ */}
        {activeTab === 'lookup' && (
          <section className="max-w-2xl mx-auto">
            <div className="rounded-3xl bg-white border-2 border-[#f0e0ea] shadow-sm p-6 sm:p-8 text-left">
              <h3 className="text-xl font-black text-[#141219] mb-1">
                Instant Code Verification
              </h3>
              <p className="text-xs sm:text-sm text-[#716d77] mb-6 font-medium">
                Enter the unique appraisal code printed on your jewelry tag (e.g. ILS-GOLD-550).
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookup();
                }}
                className="space-y-4"
              >
                <div>
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="Enter jewelry code (e.g. ILS-DIAMOND-7500)..."
                      className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-xl sm:rounded-2xl bg-white border-2 border-[#eedbe6] focus:border-[#D30915] focus:ring-4 focus:ring-[#D30915]/10 text-sm sm:text-base font-mono font-bold uppercase tracking-wider text-[#141219] outline-none shadow-inner transition-all"
                    />
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8a858f]" />
                  </div>
                  {error && (
                    <div className="mt-2 text-xs font-bold text-rose-600 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verifying Tag Code...</span>
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4" />
                        <span>Verify Jewelry Value</span>
                      </>
                    )}
                  </button>
                  {code && (
                    <button
                      type="button"
                      onClick={() => {
                        setCode('');
                        setAppraisalResult(null);
                        setError(null);
                      }}
                      className="h-12 px-5 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#141219] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </form>

              {/* Information Note */}
              <div className="mt-6 pt-5 border-t border-[#f7eff4] flex items-center gap-2 text-xs text-[#716d77]">
                <ShieldCheck className="w-4 h-4 text-[#D30915] shrink-0" />
                <span>Enter the unique appraisal code printed on your physical jewelry pouch or foil tag.</span>
              </div>
            </div>

            {/* Appraisal Result Card */}
            {appraisalResult && (
              <div
                ref={resultCardRef}
                className="mt-8 rounded-3xl bg-white border-2 border-amber-300 shadow-xl p-6 sm:p-8 text-left relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-amber-100">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Authentic Verified Reveal</span>
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-[#141219] m-0">
                      {appraisalResult.name}
                    </h3>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-xs uppercase font-bold text-amber-900 block">
                      Certified Appraisal Value
                    </span>
                    <span className="text-2xl sm:text-3xl font-black text-amber-700">
                      ${appraisalResult.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-amber-100 text-xs">
                  <div>
                    <span className="text-[#8a858f] font-bold block">Type</span>
                    <span className="font-bold text-[#141219]">{appraisalResult.type}</span>
                  </div>
                  <div>
                    <span className="text-[#8a858f] font-bold block">Metal</span>
                    <span className="font-bold text-[#141219]">{appraisalResult.material}</span>
                  </div>
                  <div>
                    <span className="text-[#8a858f] font-bold block">Serial #</span>
                    <span className="font-mono font-bold text-[#141219]">{appraisalResult.serialNumber}</span>
                  </div>
                  <div>
                    <span className="text-[#8a858f] font-bold block">Inspection</span>
                    <span className="font-bold text-[#141219]">{appraisalResult.inspectedDate}</span>
                  </div>
                </div>

                <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="text-xs font-bold text-[#55505a] hover:text-[#141219] inline-flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Code Copied!' : `Copy Code: ${appraisalResult.code}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsCertificateOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    View Official Certificate
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ================================================================
            4. FOUNDER REQUIRED "IMPORTANT" NOTICE
        ================================================================ */}
        <section className="bg-amber-50/80 rounded-2xl border border-amber-200 p-5 sm:p-7 text-left">
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-black text-amber-900 uppercase tracking-wider m-0 mb-1">
                Important Valuation Notice:
              </h4>
              <p className="text-xs sm:text-sm text-amber-900/90 leading-relaxed m-0 font-medium">
                An appraisal or estimated value is informational and may not represent a guaranteed resale, replacement, or market price. Actual value can vary based on condition, market demand, materials, and independent professional assessment.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            5. APPRAISAL FAQS
        ================================================================ */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] p-6 sm:p-8 text-left">
          <h3 className="text-lg sm:text-xl font-black text-[#141219] mb-4">
            Jewelry Appraisal Questions & Answers
          </h3>
          <div className="space-y-3">
            {FAQS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={faq.q}
                  className="rounded-xl border border-[#eedbe6] overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-4 py-3 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-[#141219] bg-transparent"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[#716d77] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-3 text-xs sm:text-sm text-[#55505a] leading-relaxed border-t border-[#f7eff4] pt-2 font-medium">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* Certificate Modal */}
      {isCertificateOpen && appraisalResult && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-amber-300">
            <button
              type="button"
              onClick={() => setIsCertificateOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 sm:p-10 bg-[#fdfcf9] text-[#141219]">
              <div className="border-2 border-amber-400/60 p-6 sm:p-8 rounded-2xl bg-white/80 text-center">
                <div className="pb-4 border-b border-amber-200 mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-black uppercase tracking-widest mb-2">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Official Document
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#141219]">
                    Certificate of Appraisal
                  </h2>
                  <p className="text-xs text-amber-800/80 font-serif italic mt-0.5">
                    Authenticity & Gemological Valuation Guarantee
                  </p>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#8a858f] block mb-0.5">
                      This Certifies That The Following Item
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#141219]">
                      {appraisalResult.name}
                    </h3>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-amber-900 block mb-0.5">
                      Certified Retail Appraisal Value
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-amber-700">
                      ${appraisalResult.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 text-left">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8a858f] block">Serial Number</span>
                      <span className="font-mono font-bold text-[#141219]">{appraisalResult.serialNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8a858f] block">Tag Auth Code</span>
                      <span className="font-mono font-bold text-[#D30915]">{appraisalResult.code}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8a858f] block">Precious Metal</span>
                      <span className="font-semibold text-[#141219]">{appraisalResult.material}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#8a858f] block">Inspection Date</span>
                      <span className="font-semibold text-[#141219]">{appraisalResult.inspectedDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-[#fff0f3] hover:bg-[#ffe0e6] text-[#D30915] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCertificateOpen(false)}
                  className="px-5 py-2 rounded-xl bg-[#141219] hover:bg-black text-white text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
