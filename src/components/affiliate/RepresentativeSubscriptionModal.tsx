import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Check,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Store,
  Package,
  CheckCircle2,
  Zap,
  Truck,
  DollarSign,
  Gift,
  HelpCircle,
  Award,
  Copy,
  ExternalLink,
  Sparkles,
  Upload,
  Camera,
  Trash2,
} from 'lucide-react';
import type { UserProfile } from '../../types';
import { representativeService } from '../../services/representativeService';
import { adminService } from '../../services/adminService';
import { accountService } from '../../services/accountService';

export interface RepresentativeSubscriptionModalProps {
  isOpen: boolean;
  user?: UserProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
  onShowToast?: (message: string, options?: { title?: string; type?: 'success' | 'info' | 'cart' }) => void;
}

export type PlanOptionId = 'monthly' | 'six_month' | 'twelve_month';
export type StarterKitId = 'kit-standard' | 'kit-pro';
export type EnrollmentStep = 'configure' | 'payment' | 'success';

interface PlanConfig {
  id: PlanOptionId;
  name: string;
  price: number;
  monthlyEquivalent: number;
  discountBadge?: string;
  billingFrequency: string;
  description: string;
  perks: string[];
  popular?: boolean;
}

const MEMBERSHIP_PLANS: PlanConfig[] = [
  {
    id: 'monthly',
    name: 'Monthly License',
    price: 19.99,
    monthlyEquivalent: 19.99,
    billingFrequency: 'Billed monthly ($19.99/mo)',
    description: 'Standard auto-renewing consultant license & replicated storefront.',
    perks: [
      'Replicated storefront URL',
      'Live analytics portal',
      'Standard support',
    ],
  },
  {
    id: 'six_month',
    name: '6-Month Prepaid',
    price: 107.95,
    monthlyEquivalent: 17.99,
    discountBadge: 'Save 10%',
    billingFrequency: 'Billed $107.95 every 6 months',
    description: 'Save $12 upfront. Lock in your rate for 6 months of active storefront status.',
    perks: [
      'Save $12 upfront (10% off)',
      '5-Level team overrides',
      'Digital promo pack',
    ],
  },
  {
    id: 'twelve_month',
    name: '12-Month Annual VIP',
    price: 203.90,
    monthlyEquivalent: 16.99,
    discountBadge: 'Save 15% • Best Value',
    billingFrequency: 'Billed $203.90 annually',
    description: 'Save $36 upfront. Highest savings, priority support & official VIP badge.',
    perks: [
      'Save $36 upfront (15% off)',
      'Official VIP Consultant Badge',
      'Priority 24/7 dedicated line',
    ],
    popular: true,
  },
];

const STARTER_KITS = [
  {
    id: 'kit-standard' as StarterKitId,
    name: 'Essential Launch Starter Kit',
    price: 49.0,
    retailValue: 120.0,
    savingsBadge: 'Save 59%',
    badge: 'Popular Entry Kit',
    description: 'Includes reveal candle, surprise ring candle, 2 bath bombs, and digital launch guides.',
    items: [
      { name: 'Cash Candle (1x)', desc: 'Real cash inside ($2-$2,500)' },
      { name: 'Surprise Ring Candle (1x)', desc: 'Jewelry reveal appraised $10-$5,000' },
      { name: 'Bath Bomb Cash (2x)', desc: 'Fizzy cash reveal bath treats' },
      { name: 'Quickstart Digital Guide', desc: 'Step-by-step launch roadmap' },
    ],
  },
  {
    id: 'kit-pro' as StarterKitId,
    name: 'Pro Ambassador Starter Kit',
    price: 99.0,
    retailValue: 250.0,
    savingsBadge: 'Save 60% • Best for Parties',
    badge: 'Recommended for High Earners',
    description: 'Contains 4 Best-Selling Cash Candles, 2 Bath Bombs, 2 Wax Melts, scent strips & catalogs.',
    items: [
      { name: 'Cash Candles (2x)', desc: '2 best-selling cash reveal candles' },
      { name: 'Diamond Ring Candles (2x)', desc: '2 ring surprise candles' },
      { name: 'Aroma Samplers (50x)', desc: 'Scratch & sniff customer scent strips' },
      { name: 'Branded Swag & Apron', desc: 'Consultant apron & launch catalogs' },
    ],
    highlighted: true,
  },
];

const RESTRICTED_USERNAMES = [
  'admin',
  'administrator',
  'ilovesurprises',
  'official',
  'support',
  'help',
  'ceo',
  'founder',
  'billing',
  'root',
  'payouts',
  'security',
  'mod',
  'staff',
];

export const RepresentativeSubscriptionModal: React.FC<RepresentativeSubscriptionModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [step, setStep] = useState<EnrollmentStep>('configure');
  const [selectedPlan, setSelectedPlan] = useState<PlanOptionId>('twelve_month');
  const [selectedKit, setSelectedKit] = useState<StarterKitId>('kit-standard');
  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(
    user?.name ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'my_surprise_store'
  );
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Payment Form States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_pay' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardholderName, setCardholderName] = useState(fullName || '');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Profile Photo Upload States (Section 3 Requirement)
  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'
  );
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isPhotoCustom, setIsPhotoCustom] = useState<boolean>(Boolean(user?.avatar));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setPhotoError('Image size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarUrl(event.target.result as string);
        setIsPhotoCustom(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('/assets/ilovesurprises/Profile/profile%20image.webp');
    setIsPhotoCustom(false);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Reset step when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setStep('configure');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Sync user details if user prop changes
  useEffect(() => {
    if (user?.name) {
      const timer = setTimeout(() => {
        setFullName((prev) => prev || user.name);
        setCardholderName((prev) => prev || user.name);
        setEmail((prev) => prev || user.email);
        setUsername((prev) =>
          prev === 'my_surprise_store' ? user.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : prev
        );
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Username validation per PDF requirements
  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);

    if (RESTRICTED_USERNAMES.includes(clean)) {
      setUsernameError(`"${clean}" is a reserved system word. Please choose another.`);
    } else if (clean.length < 3) {
      setUsernameError('Username must be at least 3 characters.');
    } else {
      setUsernameError(null);
    }
  };

  if (!isOpen) return null;

  const currentPlan = MEMBERSHIP_PLANS.find((p) => p.id === selectedPlan)!;
  const currentKit = STARTER_KITS.find((k) => k.id === selectedKit)!;
  const grandTotal = currentPlan.price + currentKit.price;
  const estimatedPackageValue = currentKit.retailValue + 120 + 50 + 14.99;

  // Step 1: Proceed from Configuration to Payment Page
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (usernameError || !username.trim()) {
      onShowToast?.('Please resolve the username warning before continuing.', {
        title: 'Validation Error',
        type: 'info',
      });
      return;
    }

    if (!fullName.trim() || !email.trim()) {
      onShowToast?.('Please enter your full name and email address.', {
        title: 'Required Fields',
        type: 'info',
      });
      return;
    }

    setCardholderName(fullName);
    setStep('payment');
  };

  // Step 2: Process Payment & Finalize Activation
  const handleCompleteSubscriptionPayment = (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);

      // 1. Create or update attributed representative
      representativeService.setAttributedRepresentative({
        id: `rep-custom-${Date.now()}`,
        name: fullName,
        repUsername: username.toLowerCase().trim(),
        avatar: avatarUrl || '/assets/ilovesurprises/Profile/profile%20image.webp',
        tagline: 'Your Independent Surprise Consultant ✨',
        rank: 'VIP Partner',
        joinedYear: '2026',
        storeUrl: `https://ilovesurprises.com/${username.toLowerCase().trim()}`,
        favoriteProduct: 'Tahitian Vanilla & Gold Cash Candle',
      });

      // 2. Add membership record into adminService store
      try {
        const adminMemberships = adminService.getMemberships();
        const newRecord = {
          id: `mem-${Date.now()}`,
          representativeId: `rep-${Date.now()}`,
          repName: fullName,
          repUsername: username.toLowerCase().trim(),
          repAvatar: avatarUrl || '/assets/ilovesurprises/Profile/profile%20image.webp',
          plan: selectedPlan,
          planName: currentPlan.name,
          price: currentPlan.price,
          billingFrequency: (currentPlan.id === 'monthly'
            ? 'monthly'
            : currentPlan.id === 'six_month'
            ? 'every_6_months'
            : 'annually') as 'monthly' | 'every_6_months' | 'annually',
          discountNotice: currentPlan.discountBadge || 'Standard Enrollment',
          paymentStatus: 'paid' as const,
          status: 'active' as const,
          nextBillingDate: '2026-04-01',
          renewalStatus: 'auto_renew' as const,
          cancellationStatus: 'none' as const,
          startedAt: new Date().toISOString().split('T')[0],
          paymentMethodSnippet: `Visa •••• ${cardNumber.slice(-4) || '4242'}`,
        };
        adminMemberships.unshift(newRecord);
        localStorage.setItem('ils_admin_memberships_v1', JSON.stringify(adminMemberships));
      } catch {
        // Fallback
      }

      // 3. Mark consultant subscription in persistent storage & update user profile
      try {
        localStorage.setItem('ils_consultant_subscribed', 'true');
        localStorage.setItem('ils_consultant_username', username.toLowerCase().trim());
        localStorage.setItem('ils_consultant_name', fullName);

        const currentStored = accountService.getStoredUser() || user;
        if (currentStored) {
          const updatedUser: UserProfile = {
            ...currentStored,
            role: 'representative',
            repUsername: username.toLowerCase().trim(),
          };
          accountService.updateStoredUser(updatedUser);
        } else {
          const newRepUser: UserProfile = {
            id: `user-rep-${Date.now()}`,
            name: fullName,
            email: email || 'consultant@ilovesurprises.com',
            role: 'representative',
            repUsername: username.toLowerCase().trim(),
            avatar: '/assets/ilovesurprises/Profile/profile%20image.webp',
          };
          accountService.updateStoredUser(newRepUser);
        }

        window.dispatchEvent(new CustomEvent('ils_consultant_subscribed', {
          detail: { username: username.toLowerCase().trim(), fullName }
        }));
        window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
      } catch (err) {
        console.error('Error saving consultant subscription status', err);
      }

      onShowToast?.(`Congratulations ${fullName}! Payment confirmed & storefront is active!`, {
        title: '🎉 Enrollment Paid & Active',
        type: 'success',
      });

      setStep('success');
    }, 1400);
  };

  const handleCopyStoreUrl = () => {
    const url = `https://ilovesurprises.com/${username.toLowerCase().trim()}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    onShowToast?.('Storefront URL copied to clipboard!', { type: 'success' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className={`relative w-full ${step === 'success' ? 'max-w-lg sm:max-w-xl' : 'max-w-5xl lg:max-w-6xl xl:max-w-7xl'} my-auto bg-white rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.32)] border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300`}>
        
        {/* Simple, Clean & Elegant Header (Only shown during configuration and payment) */}
        {step !== 'success' && (
          <div className="bg-gradient-to-r from-[#B60711] via-[#D30915] to-[#B60711] text-white px-6 py-5 sm:px-8 sm:py-6 relative shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 sm:top-5 right-4 sm:right-6 w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-black uppercase tracking-wider text-white">
                  Official Consultant Enrollment
                </span>
                <span className="text-[11px] font-bold text-white/85">
                  Earn 20% Personal + Up to 35% Across 5 Levels
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white m-0">
                {step === 'payment'
                  ? 'Complete Subscription & Payment'
                  : 'Start Your Surprise Business Today'}
              </h2>

              <p className="text-xs sm:text-sm text-white/90 mt-1 m-0 leading-normal">
                {step === 'payment'
                  ? 'Enter your payment details and starter kit delivery address to activate your official custom storefront.'
                  : 'Choose your membership billing term and starter kit to activate your custom storefront and start earning recurring commissions.'}
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: CONFIGURE PLAN, KIT & PROFILE */}
        {step === 'configure' && (
          <form onSubmit={handleProceedToPayment} className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-7 lg:p-8 items-stretch">
              
              {/* LEFT COLUMN: Configuration Steps */}
              <div className="lg:col-span-7 xl:col-span-7 space-y-6 flex flex-col justify-between">
                
                {/* Consultant Advantage Highlights Bar */}
                <div className="grid grid-cols-3 gap-2 sm:gap-3 p-3 sm:p-3.5 rounded-2xl bg-gradient-to-b from-rose-50/70 to-[#fff5f6] border border-rose-200/70 text-center">
                  <div className="flex flex-col items-center justify-center p-1">
                    <div className="w-8 h-8 rounded-full bg-white text-[#D30915] shadow-xs flex items-center justify-center mb-1.5 border border-rose-100">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-[13px] font-black text-stone-900 leading-tight">20% Direct Sales</span>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium mt-0.5 whitespace-nowrap">Instant profit per order</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-1 border-x border-rose-200/70">
                    <div className="w-8 h-8 rounded-full bg-white text-purple-700 shadow-xs flex items-center justify-center mb-1.5 border border-purple-100">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-[13px] font-black text-stone-900 leading-tight">5-Tier Overrides</span>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium mt-0.5 whitespace-nowrap">Up to 35% total payout</span>
                  </div>

                  <div className="flex flex-col items-center justify-center p-1">
                    <div className="w-8 h-8 rounded-full bg-white text-emerald-600 shadow-xs flex items-center justify-center mb-1.5 border border-emerald-100">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-xs sm:text-[13px] font-black text-stone-900 leading-tight">100% Drop-Shipped</span>
                    <span className="text-[10px] sm:text-[11px] text-stone-500 font-medium mt-0.5 whitespace-nowrap">Zero inventory needed</span>
                  </div>
                </div>

                {/* STEP 1: CHOOSE MEMBERSHIP PLAN */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#D30915] text-white text-xs flex items-center justify-center font-black shrink-0">
                        1
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight m-0">
                        Choose Membership Billing Plan
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium">
                      Automatic recurring renewal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                    {MEMBERSHIP_PLANS.map((plan) => {
                      const isSelected = selectedPlan === plan.id;
                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan.id)}
                          className={`relative rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#D30915] bg-[#fffafb] ring-2 ring-[#D30915]/15 shadow-sm'
                              : 'border-stone-200 hover:border-rose-300 bg-white hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex flex-col flex-1">
                            {/* Uniform Badge Header Row */}
                            <div className="flex items-center justify-between gap-1.5 mb-2 h-6">
                              {plan.discountBadge ? (
                                <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black tracking-wider uppercase shadow-xs ${
                                  plan.popular ? 'bg-[#D30915] text-white' : 'bg-rose-100 text-[#D30915] border border-rose-200'
                                }`}>
                                  {plan.discountBadge}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[9.5px] font-bold tracking-wider uppercase">
                                  Standard Tier
                                </span>
                              )}

                              <div
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                                  isSelected ? 'border-[#D30915] bg-[#D30915]' : 'border-stone-300'
                                }`}
                              >
                                {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                              </div>
                            </div>

                            {/* Plan Name */}
                            <h4 className="text-sm font-black text-stone-900 leading-tight m-0">
                              {plan.name}
                            </h4>

                            {/* Monthly Price */}
                            <div className="flex items-baseline gap-1 my-2">
                              <span className="text-2xl font-black text-[#D30915] tracking-tight">
                                ${plan.monthlyEquivalent.toFixed(2)}
                              </span>
                              <span className="text-xs text-stone-500 font-bold">/mo</span>
                            </div>

                            {/* Plan Description with uniform min-height */}
                            <p className="text-[11px] text-stone-600 leading-snug font-medium min-h-[34px] mb-3 m-0">
                              {plan.description}
                            </p>

                            {/* Perks list: clean, straight, un-truncated with emerald check icons */}
                            <div className="space-y-1.5 pt-2.5 border-t border-stone-100 flex-1">
                              {plan.perks.map((perk) => (
                                <div key={perk} className="flex items-start gap-1.5 text-[11px] text-stone-700 font-medium leading-tight">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{perk}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer: Billed terms and total */}
                          <div className="pt-2.5 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px]">
                            <span className="text-stone-500 font-medium">{plan.billingFrequency}</span>
                            <span className="text-stone-900 font-black shrink-0 text-xs">${plan.price.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Flexibility guarantee: Pause, switch billing terms, or cancel anytime with 1 click in your portal.</span>
                  </div>
                </div>

                {/* STEP 2: SELECT REQUIRED STARTER KIT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#D30915] text-white text-xs flex items-center justify-center font-black shrink-0">
                        2
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight m-0">
                        Select Your Required Starter Kit
                      </h3>
                    </div>
                    <span className="text-[11px] text-[#D30915] font-black uppercase tracking-wider">
                      Mandatory for Activation
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3.5">
                    {STARTER_KITS.map((kit) => {
                      const isSelected = selectedKit === kit.id;
                      return (
                        <div
                          key={kit.id}
                          onClick={() => setSelectedKit(kit.id)}
                          className={`relative rounded-2xl p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#D30915] bg-[#fffafb] ring-2 ring-[#D30915]/15 shadow-sm'
                              : 'border-stone-200 hover:border-rose-300 bg-white hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Top Header Row: Badges, Name, Price & Radio Indicator all straight */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1 flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-block text-[9.5px] font-black uppercase tracking-wider text-[#D30915] bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md whitespace-nowrap">
                                    {kit.badge}
                                  </span>
                                  <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 whitespace-nowrap">
                                    {kit.savingsBadge}
                                  </span>
                                </div>
                                <h4 className="text-sm sm:text-base font-black text-stone-900 m-0 leading-tight">
                                  {kit.name}
                                </h4>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right flex items-baseline gap-1.5">
                                  <span className="text-lg sm:text-xl font-black text-[#D30915]">
                                    ${kit.price.toFixed(2)}
                                  </span>
                                  <span className="text-xs text-stone-400 line-through font-semibold">
                                    ${kit.retailValue.toFixed(2)}
                                  </span>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                    isSelected ? 'border-[#D30915] bg-[#D30915]' : 'border-stone-300'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-stone-600 leading-normal m-0 font-medium">
                              {kit.description}
                            </p>

                            {/* Included Items: Clean Single Straight Lines */}
                            <div className="pt-2.5 border-t border-stone-100 space-y-1.5">
                              <div className="flex items-center justify-between text-[10.5px] font-bold pb-0.5">
                                <span className="uppercase text-stone-400 tracking-wider">
                                  Included in box:
                                </span>
                                <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                                  <Truck className="w-3 h-3" />
                                  Priority Tracked
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {kit.items.map((it) => (
                                  <div
                                    key={it.name}
                                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl bg-stone-50/90 border border-stone-200/70 hover:bg-stone-100/70 transition-colors text-[11.5px] sm:text-xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span className="font-bold text-stone-900 whitespace-nowrap shrink-0">
                                      {it.name}
                                    </span>
                                    <span className="text-stone-400 font-normal shrink-0">—</span>
                                    <span className="text-stone-600 font-medium truncate sm:whitespace-nowrap">
                                      {it.desc}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* STEP 3: CONSULTANT PROFILE & STOREFRONT URL */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#D30915] text-white text-xs flex items-center justify-center font-black shrink-0">
                        3
                      </span>
                      <h3 className="text-sm sm:text-base font-black text-stone-900 tracking-tight m-0">
                        Personal Storefront & Profile Details
                      </h3>
                    </div>
                    <span className="text-[11px] text-stone-500 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Phone strictly private
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-4">
                    {/* SECTION 3 REQUIREMENT: PROFILE PHOTO UPLOAD WITH PREVIEW */}
                    <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5 m-0">
                          <Camera className="w-3.5 h-3.5 text-[#D30915]" />
                          <span>Representative Profile Photo *</span>
                        </label>
                        <span className="text-[10px] text-stone-400">JPG, PNG, WebP (Max 5MB)</span>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <img
                            src={avatarUrl}
                            alt="Representative Preview"
                            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#D30915]/30 shadow-xs border border-stone-200"
                          />
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-1.5">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/jpg"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="rep-photo-file-input"
                          />

                          <div className="flex flex-wrap items-center gap-2">
                            <label
                              htmlFor="rep-photo-file-input"
                              className="px-3 py-1.5 rounded-xl bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 active:scale-95 shadow-2xs"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{isPhotoCustom ? 'Change Photo' : 'Upload Photo'}</span>
                            </label>

                            {isPhotoCustom && (
                              <button
                                type="button"
                                onClick={handleRemovePhoto}
                                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-700 text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          <p className="text-[10.5px] text-stone-500 m-0">
                            Your photo will be displayed prominently on your personal storefront banner.
                          </p>
                        </div>
                      </div>

                      {photoError && (
                        <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                          {photoError}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Your Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Your name"
                          className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15 transition-all"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="example@gmail.com"
                          className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15 transition-all"
                        />
                      </div>
                    </div>

                    {/* Storefront URL Builder */}
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Choose Your Replicated Storefront URL *
                      </label>
                      <div className="flex items-center rounded-xl bg-white border border-stone-300 focus-within:border-[#D30915] focus-within:ring-2 focus-within:ring-[#D30915]/15 overflow-hidden transition-all">
                        <span className="px-3.5 text-xs font-mono font-bold text-stone-500 bg-stone-100 border-r border-stone-200 select-none py-2.5 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-stone-400" />
                          ilovesurprises.com/
                        </span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          placeholder="my_surprise_store"
                          className="flex-1 h-10 px-3.5 text-xs sm:text-sm font-mono font-bold text-[#D30915] focus:outline-none bg-transparent"
                        />
                      </div>

                      {usernameError ? (
                        <p className="text-[11px] font-bold text-red-600 mt-1.5 flex items-center gap-1">
                          <span>⚠️</span> {usernameError}
                        </p>
                      ) : (
                        <div className="mt-2 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="text-[11px] text-emerald-900 leading-tight">
                            <span className="font-bold">Available Storefront: </span>
                            <span className="font-mono font-bold text-emerald-700">
                              ilovesurprises.com/{username || 'yourname'}
                            </span>
                            <span className="block text-[10px] text-emerald-700 mt-0.5">
                              Customers who visit your link are permanently tracked to your account for 20% commission on every order!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Order Summary & Proceed Button */}
              <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between h-full space-y-4">
                <div className="rounded-2xl bg-[#faf9fa] border border-stone-200 p-5 sm:p-6 shadow-sm flex flex-col justify-between flex-1 space-y-4">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 m-0 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#D30915]" />
                      Order & Enrollment Summary
                    </h4>
                    <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Active Instant Setup
                    </span>
                  </div>

                  {/* Line Items */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {currentPlan.name}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          {currentPlan.billingFrequency}
                        </span>
                      </div>
                      <span className="font-black text-stone-900 text-sm">
                        ${currentPlan.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-stone-900 block">
                          {currentKit.name}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          Physical Starter Kit (${currentKit.retailValue.toFixed(2)} value)
                        </span>
                      </div>
                      <span className="font-black text-stone-900 text-sm">
                        ${currentKit.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <div>
                        <span className="text-[11.5px] block">Replicated Custom Storefront</span>
                        <span className="text-[10px] text-stone-400">$120/yr Retail Value</span>
                      </div>
                      <span className="font-bold text-emerald-700 uppercase text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded">
                        Included Free
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <div>
                        <span className="text-[11.5px] block">Starter Kit Delivery & Handling</span>
                        <span className="text-[10px] text-stone-400">Tracked Priority Courier</span>
                      </div>
                      <span className="font-bold text-emerald-700 uppercase text-[10.5px] bg-emerald-50 px-2 py-0.5 rounded">
                        Free Express
                      </span>
                    </div>

                    <div className="pt-3 border-t border-stone-200 space-y-1">
                      <div className="flex justify-between items-baseline text-[11px] text-stone-500">
                        <span>Total Package Value:</span>
                        <span className="line-through">${estimatedPackageValue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-black text-stone-900">
                          Total Due Today:
                        </span>
                        <span className="text-2xl font-black text-[#D30915]">
                          ${grandTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5-Level Commission Structure Recap Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-rose-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-stone-900">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>5-Level Commission Structure:</span>
                      </div>
                      <span className="text-[10px] font-bold text-[#D30915] bg-rose-50 px-2 py-0.5 rounded-md">
                        Up to 35% Total
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-stone-600">
                      <span className="bg-rose-50 text-[#D30915] px-2 py-0.5 rounded-md border border-rose-200">
                        Personal: 20%
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-purple-800">
                        L1: 5%
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-purple-800">
                        L2: 4%
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-purple-800">
                        L3: 3%
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-purple-800">
                        L4: 2%
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="bg-stone-50 px-1.5 py-0.5 rounded border border-stone-200 text-purple-800">
                        L5: 1%
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 m-0">
                      Earn 20% immediate retail commission + up to 15% override across 5 levels of your team.
                    </p>
                  </div>

                  {/* Included Turnkey Consultant Tools */}
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-black text-stone-900">
                        <Award className="w-3.5 h-3.5 text-[#D30915]" />
                        <span>Included With Your Consultant License:</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Turnkey
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10.5px] text-stone-700">
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Personal URL Shop:</strong> Live in 60 seconds</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Monthly Payouts:</strong> Direct on the 15th</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Team Backoffice:</strong> Real-time CRM & analytics</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>Marketing Assets:</strong> Viral reveal video clips</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Consultant FAQs */}
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200 text-[10.5px] space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900 text-xs">
                      <HelpCircle className="w-3.5 h-3.5 text-[#D30915]" />
                      <span>Quick Consultant FAQs</span>
                    </div>
                    <div className="space-y-1.5 text-stone-600 leading-snug">
                      <div>
                        <strong className="text-stone-800">Do I need to store inventory at home?</strong>
                        <p className="m-0 text-[10px] text-stone-500">No. We fulfill, package, and ship all surprise reveals directly to your customers.</p>
                      </div>
                      <div>
                        <strong className="text-stone-800">How does the 20% commission work?</strong>
                        <p className="m-0 text-[10px] text-stone-500">Every customer shopping through your link automatically credits 20% to your account.</p>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Security & Primary Action Button */}
                  <div className="space-y-3 pt-2">
                    {/* Payment Simulator Badge */}
                    <div className="p-2.5 rounded-xl bg-white border border-stone-200 flex items-center justify-between text-xs text-stone-600">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[#D30915]" />
                        <span className="font-medium text-[11.5px]">Secure Checkout via Stripe • Visa •••• 4242</span>
                      </div>
                      <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        256-Bit SSL
                      </span>
                    </div>

                    {/* Primary Button */}
                    <button
                      type="submit"
                      disabled={!!usernameError}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96060e] text-white font-black text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.35)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Enroll & Activate Storefront (${grandTotal.toFixed(2)})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <div className="space-y-1 text-center">
                      <p className="text-[10.5px] text-stone-400 leading-relaxed m-0">
                        By enrolling, you agree to the Consultant Independent Representative Agreement and recurring renewal of ${currentPlan.monthlyEquivalent.toFixed(2)}/mo. You may cancel at any time via your dashboard.
                      </p>
                      <div className="flex items-center justify-center gap-3 pt-1 text-[10px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Gift className="w-3 h-3 text-[#D30915]" /> Instant Setup
                        </span>
                        <span>•</span>
                        <span>30-Day Satisfaction</span>
                        <span>•</span>
                        <span>Zero Commitments</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </form>
        )}

        {/* STEP 2: DEDICATED SUBSCRIPTION PAYMENT PAGE */}
        {step === 'payment' && (
          <form onSubmit={handleCompleteSubscriptionPayment} className="overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 p-5 sm:p-7 lg:p-8 items-start">
              
              {/* LEFT COLUMN: Payment Methods & Details */}
              <div className="md:col-span-7 space-y-6">
                
                {/* Back Button */}
                <button
                  type="button"
                  onClick={() => setStep('configure')}
                  className="inline-flex items-center gap-2 text-xs font-bold text-stone-600 hover:text-[#D30915] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Plan & Kit Options</span>
                </button>

                {/* 1. Payment Method Selector Tabs */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                    <h3 className="text-sm font-black text-stone-900 tracking-tight m-0 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-[#D30915]" />
                      <span>Select Payment Method</span>
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      256-Bit SSL Encrypted
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'card'
                          ? 'border-[#D30915] bg-[#fffafb] shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <CreditCard className={`w-5 h-5 ${paymentMethod === 'card' ? 'text-[#D30915]' : 'text-stone-500'}`} />
                      <span className="text-xs font-bold text-stone-900">Credit Card</span>
                      <span className="text-[9.5px] text-stone-400">Visa, MC, Amex</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('apple_pay')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'apple_pay'
                          ? 'border-[#D30915] bg-[#fffafb] shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <Zap className={`w-5 h-5 ${paymentMethod === 'apple_pay' ? 'text-[#D30915]' : 'text-stone-500'}`} />
                      <span className="text-xs font-bold text-stone-900">Apple / GPay</span>
                      <span className="text-[9.5px] text-stone-400">1-Tap Fast Pay</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('paypal')}
                      className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        paymentMethod === 'paypal'
                          ? 'border-[#D30915] bg-[#fffafb] shadow-xs'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <DollarSign className={`w-5 h-5 ${paymentMethod === 'paypal' ? 'text-[#D30915]' : 'text-stone-500'}`} />
                      <span className="text-xs font-bold text-stone-900">PayPal</span>
                      <span className="text-[9.5px] text-stone-400">Pay in 4 available</span>
                    </button>
                  </div>
                </div>

                {/* 2. Interactive Card Form Fields */}
                <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      required
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder="Your name"
                      className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="•••• •••• •••• ••••"
                        className="w-full h-10 pl-3.5 pr-20 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm font-mono text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15"
                      />
                      <div className="absolute right-3 top-2.5 flex items-center gap-1 text-[10px] font-black text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                        <span>VISA</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        placeholder="MM / YY"
                        className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm font-mono text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        CVC / Security Code
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value)}
                        placeholder="•••"
                        className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm font-mono text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Physical Starter Kit Delivery Address */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-stone-100">
                    <h3 className="text-sm font-black text-stone-900 tracking-tight m-0 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-[#D30915]" />
                      <span>Starter Kit Delivery Address (Ships in 24 Hours)</span>
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-700">
                      Free Insured Shipping
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={streetAddress}
                        onChange={(e) => setStreetAddress(e.target.value)}
                        placeholder="123 Main St, Apt or Suite"
                        className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915] focus:ring-2 focus:ring-[#D30915]/15"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Springfield"
                          className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={stateCode}
                          onChange={(e) => setStateCode(e.target.value)}
                          placeholder="OR"
                          className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915]"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-stone-700 block mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="97477"
                          className="w-full h-10 px-3.5 rounded-xl bg-white border border-stone-300 text-xs sm:text-sm text-stone-900 font-medium focus:outline-none focus:border-[#D30915]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Order Summary & Authorize Payment */}
              <div className="md:col-span-5 space-y-4">
                <div className="rounded-2xl bg-[#faf9fa] border border-stone-200 p-5 sm:p-6 shadow-sm space-y-4">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                    <h4 className="text-xs font-black uppercase tracking-wider text-stone-800 m-0">
                      Payment Summary
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified Secure
                    </span>
                  </div>

                  <div className="space-y-2.5 text-xs text-stone-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-stone-900 block">{currentPlan.name}</span>
                        <span className="text-[11px] text-stone-500">{currentPlan.billingFrequency}</span>
                      </div>
                      <span className="font-bold text-stone-900">${currentPlan.price.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-stone-900 block">{currentKit.name}</span>
                        <span className="text-[11px] text-stone-500">Physical Starter Kit</span>
                      </div>
                      <span className="font-bold text-stone-900">${currentKit.price.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <span>Storefront URL (ilovesurprises.com/{username})</span>
                      <span className="font-bold text-emerald-700 uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">FREE</span>
                    </div>

                    <div className="flex justify-between items-center text-stone-600">
                      <span>Starter Kit Tracked Courier</span>
                      <span className="font-bold text-emerald-700 uppercase text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded">FREE</span>
                    </div>

                    <div className="pt-3 border-t border-stone-200 flex justify-between items-baseline">
                      <span className="text-sm font-black text-stone-900">Total Charged Today:</span>
                      <span className="text-2xl font-black text-[#D30915]">
                        ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-1.5 text-[11px] text-stone-600">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Bank-Grade Encryption</span>
                    </div>
                    <p className="text-[10px] text-stone-500 m-0">
                      Payments processed via Stripe Certified Level 1 PCI Service Provider.
                    </p>
                  </div>

                  {/* Primary Pay Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-[#D30915] to-[#B60711] hover:from-[#B60711] hover:to-[#96060e] text-white font-black text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.25)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.35)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Authorizing Payment via Stripe...
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay & Activate Storefront (${grandTotal.toFixed(2)})</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] text-stone-400 leading-relaxed m-0">
                    By confirming payment, you authorize the charge of ${grandTotal.toFixed(2)} and future recurring renewal of ${currentPlan.monthlyEquivalent.toFixed(2)}/mo. Cancel anytime via your consultant portal.
                  </p>
                </div>
              </div>

            </div>
          </form>
        )}

        {/* STEP 3: CELEBRATION & STOREFRONT ACTIVATION */}
        {step === 'success' && (
          <div className="relative p-6 sm:p-7 flex flex-col items-center text-center overflow-y-auto max-h-[88vh] space-y-4 max-w-xl mx-auto w-full">
            {/* Close Button on Success Screen */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-stone-800 flex items-center justify-center transition-all cursor-pointer z-10 shadow-xs"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
            
            {/* Professional Stripe/Apple-Pay Style Animated Checkmark */}
            <div className="relative flex items-center justify-center -mt-2 sm:-mt-3.5 mb-1">
              <style>{`
                @keyframes ilsCheckCirclePop {
                  0% { transform: scale(0.65); opacity: 0; }
                  60% { transform: scale(1.08); opacity: 1; }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes ilsCheckStrokeDraw {
                  0% { stroke-dashoffset: 36; opacity: 0.2; }
                  20% { opacity: 1; }
                  100% { stroke-dashoffset: 0; opacity: 1; }
                }
                @keyframes ilsPingWave {
                  0% { transform: scale(0.9); opacity: 0.6; }
                  70% { transform: scale(1.45); opacity: 0; }
                  100% { transform: scale(1.55); opacity: 0; }
                }
              `}</style>
              
              {/* Expanding Ripple Rings */}
              <div
                className="absolute w-22 h-22 sm:w-26 sm:h-26 rounded-full bg-emerald-400/30"
                style={{ animation: 'ilsPingWave 2.4s ease-out infinite' }}
              />
              <div className="absolute w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-emerald-500/20 blur-md animate-pulse" />

              {/* Main Glowing Checkmark Circle */}
              <div
                className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_10px_32px_rgba(16,185,129,0.48)] border-4 border-white ring-4 ring-emerald-100"
                style={{ animation: 'ilsCheckCirclePop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}
              >
                <svg
                  className="w-9 h-9 sm:w-10 sm:h-10 text-white drop-shadow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    d="M4.5 12.75l6 6 9-13.5"
                    style={{
                      strokeDasharray: 36,
                      strokeDashoffset: 36,
                      animation: 'ilsCheckStrokeDraw 0.55s 0.2s cubic-bezier(0.65, 0, 0.45, 1) forwards',
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Celebratory Badge & Attractive Heading */}
            <div className="space-y-2 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[11px] font-black uppercase tracking-wider shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Enrollment & Payment Confirmed</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight m-0 leading-tight">
                Your Storefront is{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-rose-600 to-amber-500">
                  Official & Live!
                </span>
              </h2>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-bold text-stone-800 m-0 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Congratulations, {fullName || 'Janarthanan'}!</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </p>
                <p className="text-xs sm:text-[13px] text-stone-600 leading-snug m-0 max-w-md mx-auto">
                  Your consultant license is active and your personalized surprise storefront is now live and ready to generate commissions!
                </p>
              </div>
            </div>

            {/* Replicated Storefront URL Box */}
            <div className="w-full p-4 rounded-2xl bg-gradient-to-br from-stone-50 via-[#fff8f9] to-rose-50/40 border border-rose-200/70 shadow-xs space-y-2 text-left">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-stone-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-[#D30915]" />
                  Your Official Storefront Link:
                </span>
                <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  ● Ready to Share
                </span>
              </div>

              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-white border border-stone-300 gap-2 shadow-xs">
                <span className="text-xs sm:text-sm font-mono font-bold text-[#D30915] truncate select-all">
                  https://ilovesurprises.com/{username.toLowerCase().trim()}
                </span>
                <button
                  type="button"
                  onClick={handleCopyStoreUrl}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-black tracking-wide uppercase transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 hover:bg-[#D30915] text-white'
                  }`}
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>

              <p className="text-[10.5px] sm:text-[11px] text-stone-500 m-0 leading-relaxed">
                Share this link with your friends, family, and followers. You will automatically receive <span className="font-black text-[#D30915]">20% commission</span> on every order!
              </p>
            </div>

            {/* Quick Next Steps Grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100/90 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#D30915] flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#D30915]" />
                    Starter Kit Dispatch
                  </span>
                  <span className="text-[9px] font-black uppercase bg-rose-100 text-[#D30915] px-1.5 py-0.5 rounded">
                    Express
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-stone-600 m-0 leading-snug">
                  Your <strong className="text-stone-800 font-bold">{currentKit.name}</strong> is being prepared for express delivery to {city || 'Springfield'}, {stateCode || 'OR'}.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-100/90 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-800 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-700" />
                    5-Level Payouts
                  </span>
                  <span className="text-[9px] font-black uppercase bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <p className="text-[10.5px] sm:text-[11px] text-stone-600 m-0 leading-snug">
                  Direct monthly deposits on the 15th of each month are unlocked for personal and team overrides.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSuccess?.();
                }}
                className="w-full sm:flex-1 h-12 rounded-xl bg-gradient-to-r from-[#D30915] via-[#B60711] to-[#96060e] hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_20px_rgba(211,9,21,0.28)] hover:shadow-[0_12px_28px_rgba(211,9,21,0.38)] transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                <span>Launch My Storefront Now</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-7 h-12 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-extrabold text-xs sm:text-sm transition-colors cursor-pointer active:scale-98"
              >
                Done
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

