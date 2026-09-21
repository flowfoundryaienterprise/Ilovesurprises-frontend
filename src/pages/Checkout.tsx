import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CreditCard,
  Building,
  Tag,
  AlertCircle,
  ShoppingBag,
  Zap,
  Banknote,
  MapPin,
  Plus,
  Globe,
  Compass,
  Building2,
  Phone,
  Home,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { CartItem, ShippingAddress, DeliveryMethod, UserProfile, Order, PaymentSummary, SavedAddress } from '../types';
import { orderService, calculateEstimatedDelivery } from '../services/orderService';
import { accountService } from '../services/accountService';
import { isValidEmail, isValidMobile } from '../services/auth';
import { MapLocationPickerModal, type MapAddressResult } from '../components/checkout/MapLocationPickerModal';
import { COUNTRIES_DATA, getStatesByCountryName, getDistrictsByState } from '../data/geoData';
import { CustomSearchableSelect, type SelectOption } from '../components/ui/CustomSearchableSelect';
import { representativeService, type PublicRepresentative } from '../services/representativeService';

interface CheckoutProps {
  cart: CartItem[];
  user: UserProfile | null;
  appliedPromoCode?: string | null;
  onOrderCompleted: (order: Order) => void;
  onNavigateToShop: () => void;
  onBackToCart?: () => void;
}

type CheckoutStep = 'shipping' | 'delivery' | 'payment';

export const Checkout: React.FC<CheckoutProps> = ({
  cart,
  user,
  appliedPromoCode: initialPromo,
  onOrderCompleted,
  onNavigateToShop,
  onBackToCart: _onBackToCart,
}) => {
  const [attributedRep, setAttributedRep] = useState<PublicRepresentative | null>(() =>
    representativeService.getAttributedRepresentative()
  );

  useEffect(() => {
    const handleAttribution = (e: Event) => {
      const customEvent = e as CustomEvent<PublicRepresentative | null>;
      setAttributedRep(customEvent.detail || representativeService.getAttributedRepresentative());
    };
    window.addEventListener('ils_representative_attributed', handleAttribution);
    return () => window.removeEventListener('ils_representative_attributed', handleAttribution);
  }, []);

  const [currentStep, setCurrentStep] = useState<CheckoutStep>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/payment' || p === '/checkout/payment') return 'payment';
      if (p === '/checkout/delivery') return 'delivery';
      if (p === '/shipping' || p === '/checkout/shipping' || p === '/checkout') return 'shipping';
    }
    return 'shipping';
  });

  useEffect(() => {
    const handlePopStep = () => {
      if (typeof window !== 'undefined') {
        const p = window.location.pathname;
        if (p === '/payment' || p === '/checkout/payment') {
          setCurrentStep('payment');
        } else if (p === '/checkout/delivery') {
          setCurrentStep('delivery');
        } else if (p === '/shipping' || p === '/checkout/shipping' || p === '/checkout') {
          setCurrentStep('shipping');
        }
      }
    };
    window.addEventListener('popstate', handlePopStep);
    return () => window.removeEventListener('popstate', handlePopStep);
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Saved addresses for logged-in / local state
  const savedAddresses = useMemo(() => accountService.getSavedAddresses(), []);

  // Default to clean address entry form (no default saved address pre-selected)
  const [isAddingNewAddress, setIsAddingNewAddress] = useState<boolean>(true);

  const [selectedSavedId, setSelectedSavedId] = useState<string>('');

  // Shipping Form State with automatic user profile pre-population (no default saved address pre-fill)
  const [shippingForm, setShippingForm] = useState<ShippingAddress>(() => ({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: user?.mobile || user?.phone || '',
    addressLine1: user?.addressLine1 || user?.address || '',
    addressLine2: user?.addressLine2 || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zipCode || '',
    country: user?.country || 'United States',
  }));

  // Reactively auto-fill shipping fields if user authenticates or updates profile (no default saved address fallback)
  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        setShippingForm((prev) => ({
          ...prev,
          fullName: prev.fullName || user.name || '',
          email: prev.email || user.email || '',
          phone: prev.phone || user.mobile || user.phone || '',
          addressLine1: prev.addressLine1 || user.addressLine1 || user.address || '',
          addressLine2: prev.addressLine2 || user.addressLine2 || '',
          city: prev.city || user.city || '',
          state: prev.state || user.state || '',
          zipCode: prev.zipCode || user.zipCode || '',
          country: prev.country || user.country || 'United States',
        }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Dynamic Country / State / District dropdown lists
  const availableStates = useMemo(() => {
    return getStatesByCountryName(shippingForm.country || 'United States');
  }, [shippingForm.country]);

  const availableDistricts = useMemo(() => {
    return getDistrictsByState(
      shippingForm.country || 'United States',
      shippingForm.state || availableStates[0]?.code || availableStates[0]?.name || ''
    );
  }, [shippingForm.country, shippingForm.state, availableStates]);

  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('');

  // Formatted options for luxury searchable select components
  const countryOptions: SelectOption[] = useMemo(() => {
    return COUNTRIES_DATA.map((c) => ({
      value: c.name,
      label: c.name,
      badge: c.code,
    }));
  }, []);

  const stateOptions: SelectOption[] = useMemo(() => {
    return availableStates.map((s) => ({
      value: s.code,
      label: s.name,
      badge: s.code,
      subLabel: `${s.districts.length} districts / regions`,
    }));
  }, [availableStates]);

  const districtOptions: SelectOption[] = useMemo(() => {
    return availableDistricts.map((d) => ({
      value: d.name,
      label: d.name,
      subLabel: d.majorCities?.slice(0, 2).join(', '),
      badge: d.defaultZip ? `ZIP ${d.defaultZip}` : undefined,
    }));
  }, [availableDistricts]);

  const cityOptions: SelectOption[] = useMemo(() => {
    const currentDistrict = availableDistricts.find((d) => d.name === selectedDistrictName) || availableDistricts[0];
    const cities = currentDistrict?.majorCities || [];
    return cities.map((city) => ({
      value: city,
      label: city,
    }));
  }, [availableDistricts, selectedDistrictName]);

  const [shippingErrors, setShippingErrors] = useState<Record<string, string>>({});
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(true);

  // Delivery Method State
  const rawSubtotal = useMemo(
    () => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [cart]
  );

  // Rule 1: Check if current customer is a registered Representative placing their own personal order
  const isRepPurchaser = useMemo(() => {
    if (user?.role === 'representative' || !!user?.repUsername) return true;
    const email = (shippingForm.email || user?.email || '').toLowerCase().trim();
    if (!email) return false;
    const usernameFromEmail = email.split('@')[0];
    if (representativeService.lookupRepresentative(usernameFromEmail)) return true;
    if (email.includes('sparkles') || email.includes('candles') || email.includes('consultant')) return true;
    return false;
  }, [user, shippingForm.email]);

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPercent: number } | null>(() => {
    if (initialPromo === 'WIN20' || initialPromo === 'REP20') {
      return { code: initialPromo, discountPercent: 20 };
    }
    if (initialPromo) {
      return { code: initialPromo, discountPercent: 15 };
    }
    return null;
  });

  // Rule 1: Every registered Representative/Rep gets a 20% discount on their own personal orders.
  // This discount applies only to the Rep's own eligible personal purchases.
  // Do NOT apply this discount to normal customer orders.
  // Do NOT treat the 20% discount as commission or income.
  const repPersonalDiscount = isRepPurchaser ? parseFloat(((rawSubtotal * 20) / 100).toFixed(2)) : 0;
  const promoDiscountAmount = appliedPromo ? (rawSubtotal * appliedPromo.discountPercent) / 100 : 0;
  const discountAmount = isRepPurchaser ? repPersonalDiscount : promoDiscountAmount;
  const discountedSubtotal = Math.max(0, rawSubtotal - discountAmount);

  const freeShippingThreshold = 50;
  const isFreeStandard = discountedSubtotal >= freeShippingThreshold;

  const deliveryOptions: DeliveryMethod[] = useMemo(
    () => [
      {
        id: 'standard',
        name: 'Standard Tracked Delivery',
        subtitle: '2–3 Business Days • Full Live Insurance',
        price: isFreeStandard ? 0 : 4.99,
        estimatedDeliveryDate: calculateEstimatedDelivery(3),
        carrierInfo: 'USPS Priority Mail with Live Prize Insurance',
      },
      {
        id: 'express',
        name: 'Priority Express Dispatch',
        subtitle: 'Overnight Air • Guaranteed Rush',
        price: 14.99,
        estimatedDeliveryDate: calculateEstimatedDelivery(1),
        carrierInfo: 'FedEx Priority Overnight with Signature Confirmation',
      },
    ],
    [isFreeStandard]
  );

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<'standard' | 'express'>('standard');
  const selectedDelivery = useMemo(
    () => deliveryOptions.find((d) => d.id === selectedDeliveryId) || deliveryOptions[0],
    [deliveryOptions, selectedDeliveryId]
  );

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'apple_pay' | 'google_pay' | 'paypal'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState(shippingForm.fullName || user?.name || '');
  const [sameAsShippingBilling, setSameAsShippingBilling] = useState(true);
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Summary Calculations
  const shippingFee = selectedDelivery.price;
  const finalTotal = discountedSubtotal + shippingFee;
  const totalItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  // Auto-scroll to top on step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Handle Promo Code Apply
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError('');
    const code = promoInput.trim().toUpperCase();
    if (!code) return;

    if (code === 'VIP15' || code === 'SURPRISE15' || code === 'SPARKLE') {
      setAppliedPromo({ code, discountPercent: 15 });
      setPromoInput('');
    } else if (code === 'WIN20' || code === 'REP20') {
      setAppliedPromo({ code, discountPercent: 20 });
      setPromoInput('');
    } else {
      setPromoError('Invalid promo code. Try "VIP15" or "WIN20"!');
    }
  };

  // Card Number Auto-Formatting (e.g. 4242 4242 4242 4242)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const parts = raw.match(/[\s\S]{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  // Card Expiry Auto-Formatting (e.g. MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Card Brand Detection
  const detectedCardBrand = useMemo(() => {
    const clean = cardNumber.replace(/\s/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('51') || clean.startsWith('52') || clean.startsWith('53') || clean.startsWith('54') || clean.startsWith('55')) return 'Mastercard';
    if (clean.startsWith('34') || clean.startsWith('37')) return 'Amex';
    if (clean.startsWith('6011') || clean.startsWith('65')) return 'Discover';
    return 'Credit Card';
  }, [cardNumber]);

  // Validate Step 1: Shipping Form
  const validateShippingForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!shippingForm.fullName.trim() || shippingForm.fullName.trim().length < 2) {
      errors.fullName = 'Full name is required';
    }
    if (!shippingForm.email.trim() || !isValidEmail(shippingForm.email)) {
      errors.email = 'Please provide a valid email for tracking updates';
    }
    if (!shippingForm.phone.trim() || !isValidMobile(shippingForm.phone)) {
      errors.phone = 'Please provide a valid 10-digit phone number';
    }
    if (!shippingForm.addressLine1.trim()) {
      errors.addressLine1 = 'Street address is required';
    }
    if (!shippingForm.city.trim()) {
      errors.city = 'City is required';
    }
    if (!shippingForm.state.trim()) {
      errors.state = 'State / Province is required';
    }
    if (!shippingForm.zipCode.trim() || shippingForm.zipCode.trim().length < 4) {
      errors.zipCode = 'Valid ZIP code is required';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Step 3: Payment
  const validatePaymentForm = (): boolean => {
    if (paymentMethod !== 'card') return true;

    const errors: Record<string, string> = {};
    const cleanNum = cardNumber.replace(/\s/g, '');

    if (!cleanNum || cleanNum.length < 15) {
      errors.cardNumber = 'Valid 15-16 digit card number is required';
    }
    if (!cardExpiry || cardExpiry.length < 5) {
      errors.cardExpiry = 'Valid expiry (MM/YY) is required';
    } else {
      const [m, _y] = cardExpiry.split('/').map(Number);
      if (m < 1 || m > 12) {
        errors.cardExpiry = 'Invalid month';
      }
    }
    if (!cardCvv || cardCvv.length < 3) {
      errors.cardCvv = 'CVV code required';
    }
    if (!cardName.trim()) {
      errors.cardName = 'Name on card is required';
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Map and New Address Handlers
  const handleSelectFromMap = (result: MapAddressResult) => {
    setIsAddingNewAddress(true);
    setShippingForm((prev) => ({
      ...prev,
      addressLine1: result.addressLine1,
      city: result.city,
      state: result.state,
      zipCode: result.zipCode,
      country: result.country || 'United States',
    }));
    setShippingErrors((prev) => {
      const next = { ...prev };
      delete next.addressLine1;
      delete next.city;
      delete next.state;
      delete next.zipCode;
      return next;
    });
  };

  const handleAddNewAddress = () => {
    setIsAddingNewAddress(true);
    setShippingForm({
      fullName: user?.name || '',
      email: user?.email || shippingForm.email,
      phone: user?.mobile || user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      city: availableDistricts[0]?.majorCities?.[0] || '',
      state: availableStates[0]?.code || '',
      zipCode: availableDistricts[0]?.defaultZip || '',
      country: 'United States',
    });
    setShippingErrors({});
  };

  const handleSelectSavedAddress = (addr: SavedAddress) => {
    setSelectedSavedId(addr.id);
    setIsAddingNewAddress(false);
    setShippingForm({
      fullName: addr.fullName,
      email: user?.email || shippingForm.email,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
    });
    setShippingErrors({});
  };

  const handleDeliverToSelectedSavedAddress = () => {
    const selected = savedAddresses.find((a) => a.id === selectedSavedId) || savedAddresses[0];
    if (selected) {
      handleSelectSavedAddress(selected);
    }
    setCurrentStep('delivery');
    if (window.history.pushState) {
      window.history.pushState({ view: 'checkout', step: 'delivery' }, '', '/checkout/delivery');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCountryChange = (newCountry: string) => {
    const states = getStatesByCountryName(newCountry);
    const firstState = states[0];
    const firstDistrict = firstState?.districts[0];
    setShippingForm((prev) => ({
      ...prev,
      country: newCountry,
      state: firstState?.code || firstState?.name || '',
      city: firstDistrict?.majorCities?.[0] || prev.city || '',
      zipCode: firstDistrict?.defaultZip || prev.zipCode || '',
    }));
    setSelectedDistrictName(firstDistrict?.name || '');
  };

  const handleStateChange = (newState: string) => {
    const districts = getDistrictsByState(shippingForm.country, newState);
    const firstDistrict = districts[0];
    setShippingForm((prev) => ({
      ...prev,
      state: newState,
      city: firstDistrict?.majorCities?.[0] || prev.city,
      zipCode: firstDistrict?.defaultZip || prev.zipCode,
    }));
    setSelectedDistrictName(firstDistrict?.name || '');
    if (shippingErrors.state) {
      setShippingErrors((prev) => {
        const next = { ...prev };
        delete next.state;
        return next;
      });
    }
  };

  const handleDistrictChange = (districtName: string) => {
    setSelectedDistrictName(districtName);
    const district = availableDistricts.find((d) => d.name === districtName);
    if (district) {
      setShippingForm((prev) => ({
        ...prev,
        city: district.majorCities?.[0] || prev.city,
        zipCode: district.defaultZip || prev.zipCode,
      }));
      if (shippingErrors.city || shippingErrors.zipCode) {
        setShippingErrors((prev) => {
          const next = { ...prev };
          delete next.city;
          delete next.zipCode;
          return next;
        });
      }
    }
  };

  // Step Transitions
  const handleProceedToDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateShippingForm()) {
      if (saveAddressToAccount) {
        accountService.saveAddress({
          fullName: shippingForm.fullName,
          phone: shippingForm.phone,
          addressLine1: shippingForm.addressLine1,
          addressLine2: shippingForm.addressLine2,
          city: shippingForm.city,
          state: shippingForm.state,
          zipCode: shippingForm.zipCode,
          country: shippingForm.country,
          label: 'Delivery Address',
          isDefault: false,
        });
      }
      setCurrentStep('delivery');
      if (window.history.pushState) {
        window.history.pushState({ view: 'checkout', step: 'delivery' }, '', '/checkout/delivery');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleProceedToPayment = () => {
    setCurrentStep('payment');
    if (window.history.pushState) {
      window.history.pushState({ view: 'checkout', step: 'payment' }, '', '/payment');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Place Mock Order
  const handlePlaceOrder = async () => {
    if (paymentMethod === 'card' && !validatePaymentForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const paymentSummary: PaymentSummary = {
        method: paymentMethod,
        isPaid: paymentMethod !== 'cod',
        cardholderName: paymentMethod === 'card' ? cardName : (shippingForm.fullName || 'Shopper'),
        last4: paymentMethod === 'card' ? cardNumber.replace(/\s/g, '').slice(-4) || '4242' : undefined,
        cardBrand: paymentMethod === 'card' ? detectedCardBrand : paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod.replace('_', ' ').toUpperCase(),
        transactionId: `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        paidAt: paymentMethod === 'cod' ? 'Due upon Doorstep Delivery' : new Date().toISOString(),
      };

      const orderItems = cart.map((item) => ({
        product: item.product,
        quantity: item.quantity,
        selectedSurpriseOption: item.selectedSurpriseOption || (item.product.surpriseType === 'cash' ? 'Real Cash $2 - $2,500 Inside' : 'Guaranteed Jewelry Inside'),
        selectedRingSize: item.selectedRingSize,
        selectedJewelryType: item.selectedJewelryType,
        selectedSize: item.selectedSize,
        unitPrice: item.product.price,
        totalPrice: item.product.price * item.quantity,
      }));

      // If user provided marketing consent, record in user settings
      if (marketingConsent) {
        accountService.updateUserSettings({ marketingEmails: true });
      }

      const createdOrder = await orderService.createOrder({
        items: orderItems,
        shippingAddress: shippingForm,
        deliveryMethod: selectedDelivery,
        paymentSummary,
        subtotal: rawSubtotal,
        discount: discountAmount,
        promoCode: isRepPurchaser ? 'REP_20_PERSONAL' : appliedPromo?.code,
        shippingFee,
        total: finalTotal,
        attributedRep: attributedRep && !attributedRep.isSuspended && !representativeService.isRepresentativeSuspended(attributedRep.repUsername) ? {
          name: attributedRep.name,
          repUsername: attributedRep.repUsername,
        } : undefined,
        userId: user?.id,
        isPersonalPurchase: isRepPurchaser,
        repDiscountAmount: isRepPurchaser ? repPersonalDiscount : undefined,
        notes: isRepPurchaser ? 'rep_personal_order: 20% rep discount applied' : undefined,
      });

      // Automatically sync & record delivery address (max 3, deduplicated)
      accountService.recordOrderShippingAddress(shippingForm);

      // Immediately navigate to Order Confirmation page
      onOrderCompleted(createdOrder);
    } catch (err) {
      console.error('Order creation failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If cart is empty, show empty state
  if (cart.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-[#fff1f2] border-2 border-[#fecdd3] text-[#D30915] flex items-center justify-center mx-auto mb-5 shadow-xs">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-[#141219] mb-2 font-display">
          Your Shopping Cart is Empty
        </h2>
        <p className="text-sm sm:text-base text-[#716d77] max-w-md mx-auto mb-8 leading-relaxed">
          Looks like you haven&apos;t added any luxury surprise candles or mystery prize reveals yet.
        </p>
        <button
          type="button"
          onClick={onNavigateToShop}
          className="h-[50px] px-8 rounded-[16px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-sm uppercase tracking-wider shadow-[0_8px_24px_rgba(211, 9, 21,0.3)] active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Explore All Surprise Candles</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9fb] pt-4 sm:pt-6 md:pt-8 pb-28 sm:pb-12 md:pb-16">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">

        {/* 1. REAL APP MOBILE HEADER & STEP TRACKER */}
        <div className="mb-4 sm:mb-8">

          {/* Top Bar for Mobile & Desktop */}
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#ebdbe6]">
            {/* Left: Back button + Step Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 'payment') {
                    setCurrentStep('delivery');
                    if (window.history.pushState) window.history.pushState({ view: 'checkout', step: 'delivery' }, '', '/checkout/delivery');
                  } else if (currentStep === 'delivery') {
                    setCurrentStep('shipping');
                    if (window.history.pushState) window.history.pushState({ view: 'checkout', step: 'shipping' }, '', '/checkout/shipping');
                  } else {
                    onNavigateToShop();
                  }
                }}
                aria-label="Go Back"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-[#fff1f2] border border-[#e8dfe5] hover:border-[#D30915] text-[#141219] hover:text-[#D30915] flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90 shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1 leading-none mb-0.5 truncate">
                  <Lock className="w-3 h-3 shrink-0" />
                  <span>256-Bit SSL Encrypted</span>
                </span>
                <h1 className="text-base sm:text-2xl md:text-3xl font-black text-[#141219] m-0 font-display truncate leading-tight">
                  {currentStep === 'shipping' && 'Step 1: Shipping Destination'}
                  {currentStep === 'delivery' && 'Step 2: Delivery Method'}
                  {currentStep === 'payment' && 'Step 3: Secure Payment'}
                </h1>
              </div>
            </div>

            {/* Right: Step Pills / Store Return */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-[#fff1f2] text-[#D30915] border border-[#fecdd3]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>100% Win Guarantee</span>
              </span>

              <button
                type="button"
                onClick={onNavigateToShop}
                className="text-xs font-bold text-[#716d77] hover:text-[#D30915] transition-colors flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-white/80"
              >
                <span className="hidden sm:inline">Store</span>
                <span className="sm:hidden text-[11px]">Exit</span>
              </button>
            </div>
          </div>

          {/* Stepper Progress Bar (Responsive Segmented App Bar) */}
          <div className="mt-3 sm:mt-6 max-w-2xl mx-auto">
            {/* Mobile Segmented Progress Indicator (< 640px) */}
            <div className="sm:hidden grid grid-cols-3 gap-1.5">
              <div
                onClick={() => setCurrentStep('shipping')}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${currentStep === 'shipping'
                    ? 'bg-[#D30915] shadow-[0_0_8px_rgba(211, 9, 21,0.6)]'
                    : 'bg-emerald-500'
                  }`}
              />
              <div
                onClick={() => {
                  if (validateShippingForm()) setCurrentStep('delivery');
                }}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${currentStep === 'delivery'
                    ? 'bg-[#D30915] shadow-[0_0_8px_rgba(211, 9, 21,0.6)]'
                    : currentStep === 'payment'
                      ? 'bg-emerald-500'
                      : 'bg-[#ebdbe6]'
                  }`}
              />
              <div
                className={`h-1.5 rounded-full transition-all ${currentStep === 'payment'
                    ? 'bg-[#D30915] shadow-[0_0_8px_rgba(211, 9, 21,0.6)]'
                    : 'bg-[#ebdbe6]'
                  }`}
              />
            </div>

            {/* Desktop Full Interactive Stepper (>= 640px) */}
            <div className="hidden sm:block relative">
              <div className="relative flex items-center justify-between">
                {/* Connector line background */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#eedbe6] w-full z-0" />
                {/* Active Connector line */}
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#D30915] transition-all duration-300 z-0"
                  style={{
                    width:
                      currentStep === 'shipping'
                        ? '0%'
                        : currentStep === 'delivery'
                          ? '50%'
                          : '100%',
                  }}
                />

                {/* Step 1 Indicator */}
                <button
                  type="button"
                  onClick={() => setCurrentStep('shipping')}
                  className="relative z-10 flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-xs ${currentStep === 'shipping'
                        ? 'bg-[#D30915] text-white ring-4 ring-[#D30915]/20 scale-105'
                        : 'bg-emerald-600 text-white'
                      }`}
                  >
                    {currentStep !== 'shipping' ? <Check className="w-4 h-4 stroke-[3]" /> : '1'}
                  </div>
                  <span className={`text-xs font-bold mt-1.5 ${currentStep === 'shipping' ? 'text-[#D30915]' : 'text-[#141219]'}`}>
                    1. Shipping
                  </span>
                </button>

                {/* Step 2 Indicator */}
                <button
                  type="button"
                  onClick={() => {
                    if (validateShippingForm()) setCurrentStep('delivery');
                  }}
                  className="relative z-10 flex flex-col items-center cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-xs ${currentStep === 'delivery'
                        ? 'bg-[#D30915] text-white ring-4 ring-[#D30915]/20 scale-105'
                        : currentStep === 'payment'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border-2 border-[#eedbe6] text-[#8a858f]'
                      }`}
                  >
                    {currentStep === 'payment' ? <Check className="w-4 h-4 stroke-[3]" /> : '2'}
                  </div>
                  <span className={`text-xs font-bold mt-1.5 ${currentStep === 'delivery' ? 'text-[#D30915]' : 'text-[#716d77]'}`}>
                    2. Delivery
                  </span>
                </button>

                {/* Step 3 Indicator */}
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs transition-all shadow-xs ${currentStep === 'payment'
                        ? 'bg-[#D30915] text-white ring-4 ring-[#D30915]/20 scale-105'
                        : 'bg-white border-2 border-[#eedbe6] text-[#8a858f]'
                      }`}
                  >
                    3
                  </div>
                  <span className={`text-xs font-bold mt-1.5 ${currentStep === 'payment' ? 'text-[#D30915]' : 'text-[#716d77]'}`}>
                    3. Payment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. REAL APP MOBILE EXPANDABLE ORDER SUMMARY BAR (< 1024px) */}
        <div className="block lg:hidden mb-4">
          <div className="rounded-[18px] border border-[#f0dce7] bg-white shadow-xs overflow-hidden">
            {/* Header / Clickable Accordion Bar */}
            <button
              type="button"
              onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
              className="w-full p-3.5 bg-gradient-to-r from-[#fff9fc] via-white to-[#fff9fc] flex items-center justify-between gap-3 text-left cursor-pointer active:bg-[#fff1f2] transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-[10px] bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-center justify-center shrink-0 shadow-2xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[#141219] truncate">
                      Order Summary ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                    </span>
                    <span className="text-[10px] font-bold text-[#D30915] flex items-center gap-0.5">
                      {isMobileSummaryOpen ? 'Hide' : 'View'}
                      {isMobileSummaryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#716d77] m-0 truncate">
                    Includes guaranteed prizes & live tracking
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-black text-[#D30915] block">
                  ${finalTotal.toFixed(2)}
                </span>
                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  100% Prize
                </span>
              </div>
            </button>

            {/* Expandable Order Details Panel */}
            {isMobileSummaryOpen && (
              <div className="p-3.5 border-t border-[#f5eaf1] bg-[#fffcfd] space-y-3.5 animate-in fade-in duration-200">
                {/* Dynamic User / Consultant Attribution Badge */}
                {(user || attributedRep) && (
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#fff5f6] to-[#fff9fa] border border-[#ffd8dc] flex items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={user?.avatar || attributedRep?.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                        alt={user?.name || attributedRep?.name || 'Customer'}
                        className="w-7 h-7 rounded-full object-cover ring-2 ring-[#D30915]/30 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] text-[#645c68] font-medium leading-none mb-0.5">
                          Shopping with
                        </p>
                        <p className="text-xs font-bold text-[#141219] truncate">
                          {user?.name || attributedRep?.name}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                      Credited
                    </span>
                  </div>
                )}

                {/* Product Items List */}
                <div className="space-y-3 max-h-[240px] overflow-y-auto pt-2.5 pb-1.5 px-2 divide-y divide-[#f7eff4]">
                  {cart.map((item) => (
                    <div key={item.product.id} className="pt-3 first:pt-1 flex items-center justify-between gap-3 overflow-visible">
                      <div className="relative shrink-0 overflow-visible" style={{ overflow: 'visible' }}>
                        <div className="w-12 h-12 rounded-[10px] bg-white border border-[#ecdbe6] flex items-center justify-center p-1 shadow-2xs overflow-hidden">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span
                          className="absolute rounded-full bg-[#141219] text-white font-bold flex items-center justify-center border-2 border-white shadow-xs z-20 leading-none select-none pointer-events-none"
                          style={{
                            top: '-8px',
                            right: '-8px',
                            width: '20px',
                            height: '20px',
                            fontSize: '12px',
                            lineHeight: '1',
                            backgroundColor: '#141219',
                            color: '#ffffff',
                            border: '2px solid #ffffff',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxSizing: 'border-box',
                          }}
                        >
                          {item.quantity}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-[#141219] m-0 truncate">
                          {item.product.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                            {item.product.surpriseType === 'cash' ? 'Cash Inside' : 'Jewelry Inside'}
                          </span>
                          <span className="text-[10px] text-[#716d77]">
                            ${item.product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-[#141219]">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo Code Input on Mobile */}
                <div className="pt-2 border-t border-[#f5eaf1]">
                  {appliedPromo ? (
                    <div className="p-2 rounded-[10px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-emerald-800 truncate">
                        <Tag className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span className="truncate"><strong>{appliedPromo.code}</strong> applied ({appliedPromo.discountPercent}% OFF)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAppliedPromo(null)}
                        className="text-[10px] text-red-600 font-bold hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="PROMO CODE (VIP15)"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="w-full h-[36px] pl-8 pr-2 rounded-[10px] bg-white border border-[#e8dfe5] text-xs font-bold uppercase text-[#141219] outline-none"
                        />
                        <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#8a858f]" />
                      </div>
                      <button
                        type="submit"
                        className="h-[36px] px-3 rounded-[10px] bg-white border border-[#e8dfe5] text-xs font-black text-[#141219] shrink-0"
                      >
                        Apply
                      </button>
                    </form>
                  )}
                  {promoError && (
                    <p className="text-[10px] text-red-600 mt-1 font-semibold">{promoError}</p>
                  )}
                </div>

                {/* Mobile Breakdown */}
                <div className="pt-2 border-t border-[#f5eaf1] space-y-1.5 text-xs text-[#716d77]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-[#141219]">${rawSubtotal.toFixed(2)}</span>
                  </div>
                  {isRepPurchaser ? (
                    <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50/80 px-2 py-1 rounded border border-emerald-200">
                      <span>Rep Personal Discount (20%)</span>
                      <span>-${repPersonalDiscount.toFixed(2)}</span>
                    </div>
                  ) : appliedPromo ? (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount ({appliedPromo.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  ) : null}
                  {isRepPurchaser && (
                    <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-[10px] text-purple-900 leading-tight">
                      <span className="font-bold block">Rep Personal Purchase:</span>
                      Personal purchases receive a 20% Rep discount but do not count toward the $125 monthly qualification.
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Delivery ({selectedDelivery.name.split(' ')[0]})</span>
                    <span className={`font-bold ${shippingFee === 0 ? 'text-emerald-700 font-black' : 'text-[#141219]'}`}>
                      {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-[#f5eaf1] font-black text-sm text-[#141219]">
                    <span>Total</span>
                    <span className="text-[#D30915]">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. MAIN CHECKOUT GRID LAYOUT (Left Step Forms + Right Desktop Summary) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 w-full max-w-full items-start">

          {/* Left Column: Multi-Step Forms */}
          <div className="w-full max-w-full space-y-6">

            {/* ================= STEP 1: SHIPPING ADDRESS ================= */}
            {currentStep === 'shipping' && (
              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] animate-in fade-in duration-200">

                {/* Mobile Segmented Address Switcher (if saved addresses exist) */}
                {savedAddresses.length > 0 && (
                  <div className="mb-5 p-1 bg-[#faf4f8] rounded-[16px] border border-[#f0e2ec] flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNewAddress(false)}
                      className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-[12px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${!isAddingNewAddress
                          ? 'bg-white text-[#D30915] shadow-xs border border-[#f2dbe8]'
                          : 'text-[#716d77] hover:text-[#141219]'
                        }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Saved Addresses ({savedAddresses.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className={`flex-1 min-h-[38px] py-1.5 px-3 rounded-[12px] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isAddingNewAddress
                          ? 'bg-white text-[#D30915] shadow-xs border border-[#f2dbe8]'
                          : 'text-[#716d77] hover:text-[#141219]'
                        }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Address</span>
                    </button>
                  </div>
                )}

                {/* 1. SAVED ADDRESSES VIEW */}
                {!isAddingNewAddress && savedAddresses.length > 0 ? (
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f5eaf1]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-[#D30915] to-[#ff6097] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                          1
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-black text-[#141219] m-0 tracking-tight">
                            Select Delivery Destination
                          </h2>
                          <p className="text-xs text-[#716d77] m-0">
                            Choose where your surprise package will be sent
                          </p>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className="h-[36px] px-3 rounded-[11px] bg-white hover:bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Pin on Map</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAddNewAddress}
                          className="h-[36px] px-3.5 rounded-[11px] bg-gradient-to-r from-[#D30915] to-[#B60711] text-white text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          <span>Add New</span>
                        </button>
                      </div>
                    </div>

                    {/* Saved Address Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {savedAddresses.map((addr) => {
                        const isSelected =
                          selectedSavedId === addr.id ||
                          (shippingForm.addressLine1 === addr.addressLine1 && shippingForm.city === addr.city);
                        const isHome = (addr.label || '').toLowerCase().includes('home');
                        const isOffice =
                          (addr.label || '').toLowerCase().includes('office') ||
                          (addr.label || '').toLowerCase().includes('work') ||
                          (addr.label || '').toLowerCase().includes('studio');

                        return (
                          <div
                            key={addr.id}
                            onClick={() => handleSelectSavedAddress(addr)}
                            className={`group relative p-4 sm:p-5 rounded-[18px] sm:rounded-[20px] border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between active:scale-[0.99] ${isSelected
                                ? 'bg-gradient-to-br from-[#fffbfd] via-white to-[#fff8fb] border-[#D30915] shadow-[0_10px_28px_rgba(211, 9, 21,0.12)] ring-3 ring-[#D30915]/10'
                                : 'bg-white border-[#f0e4ec] hover:border-[#D30915]/60 hover:shadow-xs'
                              }`}
                          >
                            <div>
                              {/* Header: Custom Radio + Type Badge + Default Tag */}
                              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[#f7eef4]">
                                <div className="flex items-center gap-2">
                                  {/* Custom Radio Button */}
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                        ? 'border-[#D30915] bg-[#D30915] shadow-xs'
                                        : 'border-[#d4c8d1] bg-white group-hover:border-[#D30915]'
                                      }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 text-white stroke-[3.5]" />}
                                  </div>

                                  {/* Type Tag */}
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] text-[11px] font-bold bg-[#faf5f8] text-[#55505a] border border-[#f0e4ec]">
                                    {isHome ? (
                                      <Home className="w-3 h-3 text-[#D30915]" />
                                    ) : isOffice ? (
                                      <Briefcase className="w-3 h-3 text-[#D30915]" />
                                    ) : (
                                      <MapPin className="w-3 h-3 text-[#D30915]" />
                                    )}
                                    <span>{addr.label || 'Delivery Address'}</span>
                                  </span>
                                </div>

                                {addr.isDefault && (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3]">
                                    ★ DEFAULT
                                  </span>
                                )}
                              </div>

                              {/* Recipient Full Name */}
                              <h3 className="text-sm sm:text-[15px] font-black text-[#141219] m-0 tracking-tight">
                                {addr.fullName}
                              </h3>

                              {/* Phone Pill */}
                              <div className="my-2">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] bg-[#fbf8fa] border border-[#ede3ea] text-[11px] font-semibold text-[#55505a]">
                                  <Phone className="w-3 h-3 text-[#D30915]" />
                                  <span>{addr.phone}</span>
                                </span>
                              </div>

                              {/* Formatted Address */}
                              <div className="space-y-0.5 text-xs text-[#55505a]">
                                <p className="font-medium leading-relaxed m-0 text-[#44404a]">
                                  {addr.addressLine1}
                                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                                </p>
                                <p className="font-bold text-[#141219] m-0 pt-0.5">
                                  {addr.city}, {addr.state} {addr.zipCode}
                                </p>
                                <p className="text-[10px] text-[#8a858f] font-semibold uppercase tracking-wider m-0">
                                  {addr.country}
                                </p>
                              </div>
                            </div>

                            {/* Card Footer: Selection Indicator (Mobile) & Deliver Button (Desktop) */}
                            <div className="mt-3.5 pt-2.5 border-t border-[#f7eef4] flex items-center justify-between">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#D30915]">
                                  <CheckCircle2 className="w-4 h-4 text-[#D30915]" />
                                  <span>Selected Address</span>
                                </span>
                              ) : (
                                <span className="text-xs text-[#8a858f] font-medium">
                                  Tap to select
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectSavedAddress(addr);
                                  setCurrentStep('delivery');
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`hidden lg:flex h-[32px] px-3.5 rounded-[10px] text-xs font-black transition-all items-center gap-1 cursor-pointer active:scale-95 ${isSelected
                                    ? 'bg-gradient-to-r from-[#D30915] to-[#B60711] text-white shadow-2xs'
                                    : 'text-[#D30915] bg-[#fff1f2] hover:bg-[#ffe5ee]'
                                  }`}
                              >
                                <span>Deliver Here</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Add New Address Invite Card */}
                      <div
                        onClick={handleAddNewAddress}
                        className="p-5 rounded-[18px] sm:rounded-[20px] border-2 border-dashed border-[#f2cfdb] hover:border-[#D30915] bg-gradient-to-b from-[#fffafc] to-[#fff5f8]/60 hover:bg-[#fff1f2] transition-all duration-200 cursor-pointer flex flex-col items-center justify-center text-center min-h-[170px] sm:min-h-[190px] group shadow-2xs active:scale-[0.99]"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-[#fecdd3] text-[#D30915] flex items-center justify-center text-lg mb-2 shadow-xs group-hover:scale-110 group-hover:bg-[#D30915] group-hover:text-white transition-all">
                          <Plus className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-xs sm:text-sm font-black text-[#141219] group-hover:text-[#D30915] transition-colors">
                          Add New Delivery Address
                        </span>
                        <span className="text-[11px] text-[#7d7883] mt-0.5 max-w-[200px] leading-snug">
                          Deliver to a friend, office, or new address
                        </span>
                      </div>
                    </div>

                    {/* Bottom Deliver CTA Floating Bar (Desktop only, on mobile handled by single sticky bar) */}
                    <div className="hidden lg:flex mt-5 p-4 rounded-[18px] bg-gradient-to-r from-[#fff8fb] via-white to-[#fff8fb] border border-[#fecdd3] items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#fff1f2] border border-[#fecdd3] text-[#D30915] flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="block text-[10px] font-black uppercase tracking-wider text-[#D30915]">
                            Selected Destination
                          </span>
                          <p className="text-xs font-medium text-[#55505a] m-0 truncate">
                            <strong className="text-[#141219] font-black">{shippingForm.fullName}</strong> — {shippingForm.addressLine1}, {shippingForm.city}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeliverToSelectedSavedAddress}
                        className="h-[42px] px-6 rounded-[12px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:from-[#B60711] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(211, 9, 21,0.3)] active:scale-[0.98] transition-all cursor-pointer shrink-0"
                      >
                        <span>Deliver to this Address</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 2. DEDICATED NEW ADDRESS ENTRY FORM (MOBILE-FIRST REAL APP FORM) */
                  <div className="space-y-5 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f5eaf1]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[12px] bg-gradient-to-tr from-[#D30915] to-[#ff6097] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0">
                          1
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-black text-[#141219] m-0 tracking-tight">
                            Add Delivery Address
                          </h2>
                          <p className="text-xs text-[#716d77] m-0">
                            Enter recipient and shipping address details
                          </p>
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsMapModalOpen(true)}
                          className="h-[36px] px-3.5 rounded-[11px] bg-[#fff1f2] hover:bg-[#D30915] text-[#D30915] hover:text-white border border-[#fecdd3] text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-[0.98]"
                        >
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>Pin on Map</span>
                        </button>

                        {savedAddresses.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingNewAddress(false);
                            }}
                            className="h-[36px] px-3 rounded-[11px] bg-white text-[#716d77] hover:text-[#D30915] border border-[#e8dfe5] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>← Saved</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quick GPS / Map Banner for Mobile */}
                    <div
                      onClick={() => setIsMapModalOpen(true)}
                      className="p-3 rounded-[14px] bg-gradient-to-r from-[#fff5f5] to-[#fbf2f8] border border-[#fecdd3] flex items-center justify-between gap-2.5 cursor-pointer hover:bg-[#ffeef4] active:scale-[0.99] transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#D30915] text-white flex items-center justify-center shrink-0 shadow-xs">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <strong className="block text-xs font-black text-[#141219] truncate">
                            Want to auto-fill your doorstep address?
                          </strong>
                          <span className="text-[11px] text-[#716d77] block truncate">
                            Tap to pinpoint your live location on Google Maps
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-[#D30915] shrink-0 whitespace-nowrap">
                        Open Map →
                      </span>
                    </div>

                    <form onSubmit={handleProceedToDelivery} className="space-y-3.5 sm:space-y-4">
                      {/* Full Name & Email */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#141219] mb-1">
                            Full Name <span className="text-[#D30915]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            autoComplete="name"
                            value={shippingForm.fullName}
                            onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                            placeholder="Your name"
                            className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.fullName ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          {shippingErrors.fullName && (
                            <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.fullName}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#141219] mb-1">
                            Email Address <span className="text-[#D30915]">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            inputMode="email"
                            autoComplete="email"
                            value={shippingForm.email}
                            onChange={(e) => setShippingForm({ ...shippingForm, email: e.target.value })}
                            placeholder="example@gmail.com"
                            className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.email ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          {shippingErrors.email && (
                            <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.email}</p>
                          )}
                        </div>
                      </div>

                      {/* Explicit Marketing Consent Checkbox (Section 14 requirement, unchecked by default) */}
                      <div className="flex items-start gap-2.5 p-3 rounded-[14px] bg-[#fffbfd] border border-[#f2e2ec] mb-4">
                        <input
                          type="checkbox"
                          id="marketing-consent-checkbox"
                          checked={marketingConsent}
                          onChange={(e) => setMarketingConsent(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-gray-300 text-[#D30915] focus:ring-[#D30915] cursor-pointer"
                        />
                        <label
                          htmlFor="marketing-consent-checkbox"
                          className="text-xs text-[#55505a] leading-relaxed cursor-pointer select-none"
                        >
                          Keep me updated with secret unboxings, cash reveals, and special promotions
                        </label>
                      </div>

                      {/* Phone & Street Address */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#141219] mb-1">
                            Mobile Phone <span className="text-[#D30915]">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            inputMode="tel"
                            autoComplete="tel"
                            value={shippingForm.phone}
                            onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                            placeholder="(555) 000-0000"
                            className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.phone ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          {shippingErrors.phone && (
                            <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.phone}</p>
                          )}
                        </div>

                        <div className="sm:col-span-2">
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-[#141219]">
                              Street Address <span className="text-[#D30915]">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => setIsMapModalOpen(true)}
                              className="text-[11px] font-bold text-[#D30915] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <MapPin className="w-3 h-3" />
                              <span>Pin on Map</span>
                            </button>
                          </div>
                          <input
                            type="text"
                            required
                            autoComplete="street-address"
                            value={shippingForm.addressLine1}
                            onChange={(e) => setShippingForm({ ...shippingForm, addressLine1: e.target.value })}
                            placeholder="House / Flat No., Street, Building"
                            className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.addressLine1 ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          {shippingErrors.addressLine1 && (
                            <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.addressLine1}</p>
                          )}
                        </div>
                      </div>

                      {/* Country & State / Province Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <CustomSearchableSelect
                          label="Country / Region"
                          required
                          icon={<Globe className="w-4 h-4" />}
                          options={countryOptions}
                          value={shippingForm.country}
                          onChange={handleCountryChange}
                          placeholder="Select Country..."
                          searchPlaceholder="Search country..."
                        />

                        <CustomSearchableSelect
                          label="State / Province"
                          required
                          icon={<MapPin className="w-4 h-4" />}
                          options={stateOptions}
                          value={shippingForm.state}
                          onChange={handleStateChange}
                          placeholder="Select State..."
                          searchPlaceholder="Search state / province..."
                          error={shippingErrors.state}
                        />
                      </div>

                      {/* District / County & City / Town Dropdowns */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <CustomSearchableSelect
                          label="District / County"
                          required
                          icon={<Compass className="w-4 h-4" />}
                          options={districtOptions}
                          value={selectedDistrictName}
                          onChange={handleDistrictChange}
                          placeholder="Select District..."
                          searchPlaceholder="Search district..."
                        />

                        {cityOptions.length > 0 ? (
                          <CustomSearchableSelect
                            label="City / Town"
                            required
                            icon={<Building2 className="w-4 h-4" />}
                            options={cityOptions}
                            value={shippingForm.city}
                            onChange={(c) => {
                              setShippingForm({ ...shippingForm, city: c });
                              if (shippingErrors.city) {
                                setShippingErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.city;
                                  return next;
                                });
                              }
                            }}
                            placeholder="Select City..."
                            searchPlaceholder="Search city..."
                            error={shippingErrors.city}
                          />
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-[#141219] mb-1">
                              City / Town <span className="text-[#D30915]">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              autoComplete="address-level2"
                              value={shippingForm.city}
                              onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                              placeholder="City name"
                              className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.city ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                                }`}
                            />
                            {shippingErrors.city && (
                              <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.city}</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ZIP Code & Apt / Suite */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#141219] mb-1">
                            ZIP / Postal Code <span className="text-[#D30915]">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            autoComplete="postal-code"
                            maxLength={10}
                            value={shippingForm.zipCode}
                            onChange={(e) => setShippingForm({ ...shippingForm, zipCode: e.target.value })}
                            placeholder="ZIP / Postal Code"
                            className={`w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border text-base sm:text-sm text-[#141219] outline-none transition-all ${shippingErrors.zipCode ? 'border-red-500 bg-red-50/20' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          {shippingErrors.zipCode && (
                            <p className="text-[11px] text-red-600 mt-1 font-semibold">{shippingErrors.zipCode}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-[#141219] mb-1">
                            Apt / Suite / Floor <span className="text-[#8a858f] font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            autoComplete="address-line2"
                            value={shippingForm.addressLine2 || ''}
                            onChange={(e) => setShippingForm({ ...shippingForm, addressLine2: e.target.value })}
                            placeholder="Apt 4B, Suite 100"
                            className="w-full min-h-[46px] px-3.5 rounded-[14px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-base sm:text-sm text-[#141219] outline-none"
                          />
                        </div>
                      </div>

                      {/* Save address checkbox */}
                      <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveAddressToAccount}
                          onChange={(e) => setSaveAddressToAccount(e.target.checked)}
                          className="w-4.5 h-4.5 rounded text-[#D30915] accent-[#D30915]"
                        />
                        <span className="text-xs text-[#55505a] font-semibold">
                          Save this address to my account for faster 1-tap checkout
                        </span>
                      </label>

                      {/* Form Submit Button (Desktop only, on mobile handled by single sticky bar) */}
                      <div className="hidden lg:flex items-center justify-end pt-4 border-t border-[#f5eaf1]">
                        <button
                          type="submit"
                          className="h-[44px] px-7 rounded-[12px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:from-[#B60711] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(211, 9, 21,0.3)] active:scale-98 transition-all cursor-pointer"
                        >
                          <span>Continue to Delivery Method</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ================= STEP 2: DELIVERY METHOD ================= */}
            {currentStep === 'delivery' && (
              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5eaf1]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#fff1f2] text-[#D30915] flex items-center justify-center font-black text-xs">
                      2
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#141219] m-0">Select Delivery Speed</h2>
                      <p className="text-xs text-[#716d77] m-0">Choose your preferred shipping speed and carrier</p>
                    </div>
                  </div>
                </div>

                {/* Shipping destination summary card */}
                <div className="p-3.5 sm:p-4 rounded-[16px] bg-gradient-to-r from-[#fffafc] to-[#fff5f5] border border-[#fecdd3] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="text-xs">
                    <span className="text-[#D30915] font-black block text-[10px] uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      <span>Delivering to</span>
                    </span>
                    <strong className="font-black text-[#141219] block text-xs sm:text-sm mt-0.5">
                      {shippingForm.fullName}
                    </strong>
                    <span className="text-[#716d77] block text-xs mt-0.5">
                      {shippingForm.addressLine1}{shippingForm.addressLine2 ? `, ${shippingForm.addressLine2}` : ''}, {shippingForm.city}, {shippingForm.state} {shippingForm.zipCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('shipping')}
                      className="h-[32px] px-3 rounded-[9px] bg-white hover:bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] text-xs font-black transition-all cursor-pointer shadow-2xs"
                    >
                      <span>Change Address</span>
                    </button>
                  </div>
                </div>

                {/* Delivery Options Radios */}
                <div className="space-y-3">
                  {deliveryOptions.map((opt) => {
                    const isSelected = selectedDeliveryId === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => setSelectedDeliveryId(opt.id)}
                        className={`p-4 rounded-[16px] border-2 transition-all cursor-pointer flex items-center justify-between active:scale-[0.99] ${isSelected
                            ? 'bg-[#fff7fa] border-[#D30915] shadow-xs'
                            : 'bg-white border-[#eee2eb] hover:border-[#fecdd3]'
                          }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-colors ${isSelected ? 'border-[#D30915] bg-[#D30915]' : 'border-[#d0c6cd]'
                              }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0">{opt.name}</h4>
                              {opt.id === 'standard' && isFreeStandard && (
                                <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded-full">
                                  FREE
                                </span>
                              )}
                              {opt.id === 'express' && (
                                <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2 py-0.2 rounded-full border border-[#fecdd3]">
                                  ⚡ RUSH
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#716d77] m-0 mt-0.5">{opt.subtitle}</p>
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-600 mt-1.5">
                              <Truck className="w-3.5 h-3.5 text-[#D30915] shrink-0" />
                              <span className="truncate">Estimated arrival: <strong className="text-[#141219]">{opt.estimatedDeliveryDate}</strong></span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-2">
                          <span className="text-sm sm:text-base font-black text-[#141219]">
                            {opt.price === 0 ? 'FREE' : `$${opt.price.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Navigation Buttons (Desktop only, on mobile handled by single sticky bar) */}
                <div className="hidden lg:flex items-center justify-between gap-3 pt-5 mt-4 border-t border-[#f5eaf1]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('shipping')}
                    className="h-[40px] px-4 rounded-[11px] border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] text-xs font-bold text-[#55505a] flex items-center gap-1.5 transition-colors cursor-pointer bg-white"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    className="h-[42px] px-7 rounded-[12px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:from-[#B60711] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(211, 9, 21,0.3)] active:scale-98 transition-all cursor-pointer"
                  >
                    <span>Continue to Payment</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ================= STEP 3: PAYMENT ================= */}
            {currentStep === 'payment' && (
              <div className="bg-white rounded-[20px] sm:rounded-[24px] p-4 sm:p-7 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f5eaf1]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#D30915] text-white flex items-center justify-center font-black text-xs shadow-xs">
                      3
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-[#141219] m-0">Payment Method</h2>
                      <p className="text-xs text-[#716d77] m-0">Secure end-to-end encrypted checkout</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3 h-3" />
                    <span>SSL 256-Bit</span>
                  </div>
                </div>

                {/* Delivery details recap */}
                <div className="p-3 rounded-[14px] bg-[#fffafc] border border-[#eedbe6] mb-4 text-xs flex items-center justify-between">
                  <div className="min-w-0 flex-1 truncate mr-2">
                    <span className="text-[#716d77] font-bold block text-[10px] uppercase">Delivery Speed</span>
                    <span className="font-black text-[#141219] truncate block">
                      {selectedDelivery.name} ({selectedDelivery.estimatedDeliveryDate})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('delivery')}
                    className="text-xs font-black text-[#D30915] hover:underline cursor-pointer shrink-0"
                  >
                    Change
                  </button>
                </div>

                {/* Payment Method Selector Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
                  {/* Card Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-[12px] border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${paymentMethod === 'card'
                        ? 'bg-[#fff1f2] border-[#D30915] text-[#D30915] shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a]'
                      }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span className="text-xs font-black">Card</span>
                  </button>

                  {/* Cash on Delivery Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-2.5 rounded-[12px] border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${paymentMethod === 'cod'
                        ? 'bg-[#fff8f2] border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a]'
                      }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black">Cash on Delivery</span>
                  </button>

                  {/* Apple Pay Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('apple_pay')}
                    className={`p-2.5 rounded-[12px] border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${paymentMethod === 'apple_pay'
                        ? 'bg-[#141219] border-[#141219] text-white shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#141219]'
                      }`}
                  >
                    <span className="text-xs font-black tracking-tight">Pay</span>
                    <span className="text-[9px] font-bold">1-Click</span>
                  </button>

                  {/* Google Pay Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('google_pay')}
                    className={`p-2.5 rounded-[12px] border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 ${paymentMethod === 'google_pay'
                        ? 'bg-[#fff8f2] border-amber-600 text-amber-900 shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a]'
                      }`}
                  >
                    <span className="text-xs font-black">G Pay</span>
                    <span className="text-[9px] font-bold text-amber-700">Google</span>
                  </button>

                  {/* PayPal Option */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-2.5 rounded-[12px] border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 active:scale-95 col-span-2 sm:col-span-1 ${paymentMethod === 'paypal'
                        ? 'bg-[#f0f7ff] border-blue-600 text-blue-900 shadow-xs'
                        : 'bg-white border-[#e8dfe5] text-[#55505a]'
                      }`}
                  >
                    <span className="text-xs font-black text-blue-700">PayPal</span>
                    <span className="text-[9px] font-bold">Express</span>
                  </button>
                </div>

                {/* Render Selected Payment UI */}
                {paymentMethod === 'card' && (
                  <div className="space-y-3.5 p-3.5 sm:p-4 rounded-[16px] bg-[#fffafc] border border-[#f2e4ee]">
                    {/* Card Number */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#141219]">
                          Card Number <span className="text-[#D30915]">*</span>
                        </label>
                        <span className="text-[11px] font-black text-[#D30915] uppercase">
                          {detectedCardBrand}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          className={`w-full min-h-[46px] pl-10 pr-3.5 rounded-[13px] bg-white border text-base sm:text-sm text-[#141219] font-mono outline-none ${paymentErrors.cardNumber ? 'border-red-500' : 'border-[#e8dfe5] focus:border-[#D30915]'
                            }`}
                        />
                        <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
                      </div>
                      {paymentErrors.cardNumber && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">{paymentErrors.cardNumber}</p>
                      )}
                    </div>

                    {/* Expiry & CVV */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#141219] mb-1">
                          Expiration <span className="text-[#D30915]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className={`w-full min-h-[46px] px-3.5 rounded-[13px] bg-white border text-base sm:text-sm text-[#141219] font-mono outline-none ${paymentErrors.cardExpiry ? 'border-red-500' : 'border-[#e8dfe5] focus:border-[#D30915]'
                            }`}
                        />
                        {paymentErrors.cardExpiry && (
                          <p className="text-[11px] text-red-600 mt-1 font-semibold">{paymentErrors.cardExpiry}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-[#141219] mb-1">
                          CVV Code <span className="text-[#D30915]">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                            className={`w-full min-h-[46px] pl-3.5 pr-8 rounded-[13px] bg-white border text-base sm:text-sm text-[#141219] font-mono outline-none ${paymentErrors.cardCvv ? 'border-red-500' : 'border-[#e8dfe5] focus:border-[#D30915]'
                              }`}
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a858f]" />
                        </div>
                        {paymentErrors.cardCvv && (
                          <p className="text-[11px] text-red-600 mt-1 font-semibold">{paymentErrors.cardCvv}</p>
                        )}
                      </div>
                    </div>

                    {/* Cardholder Name */}
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">
                        Cardholder Name <span className="text-[#D30915]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        autoComplete="cc-name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Your name"
                        className={`w-full min-h-[46px] px-3.5 rounded-[13px] bg-white border text-base sm:text-sm text-[#141219] outline-none ${paymentErrors.cardName ? 'border-red-500' : 'border-[#e8dfe5] focus:border-[#D30915]'
                          }`}
                      />
                      {paymentErrors.cardName && (
                        <p className="text-[11px] text-red-600 mt-1 font-semibold">{paymentErrors.cardName}</p>
                      )}
                    </div>

                    {/* Billing address toggle */}
                    <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sameAsShippingBilling}
                        onChange={(e) => setSameAsShippingBilling(e.target.checked)}
                        className="w-4 h-4 rounded text-[#D30915] accent-[#D30915]"
                      />
                      <span className="text-xs text-[#55505a] font-semibold">
                        Billing address matches shipping address ({shippingForm.addressLine1})
                      </span>
                    </label>

                    {!sameAsShippingBilling && (
                      <div className="pt-2 text-xs text-[#716d77] bg-white p-2.5 rounded-[10px] border border-[#e8dfe5]">
                        <Building className="w-3.5 h-3.5 inline mr-1 text-[#D30915]" />
                        <span>Using separate billing address for tax compliance.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Cash on Delivery (COD) Panel */}
                {paymentMethod === 'cod' && (
                  <div className="p-4 sm:p-6 rounded-[18px] bg-[#fffaf5] border border-amber-200 text-center space-y-3 animate-in fade-in duration-200">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-black text-[#141219] m-0">Cash on Delivery (Doorstep Payment)</h3>
                      <p className="text-xs text-[#716d77] max-w-md mx-auto mt-1 leading-relaxed">
                        Pay in cash or contactless card when your surprise package is handed to you by the courier at <strong className="text-[#141219]">{shippingForm.addressLine1}</strong>.
                      </p>
                    </div>
                    <div className="p-2.5 bg-white rounded-[12px] border border-amber-200/80 max-w-sm mx-auto text-xs text-amber-900 font-bold flex items-center justify-between shadow-2xs">
                      <span>Exact amount due on delivery:</span>
                      <span className="text-sm sm:text-base font-black text-[#D30915]">${finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>100% Win Guarantee Verified Before Payment</span>
                    </div>
                  </div>
                )}

                {/* Apple Pay Mock State */}
                {paymentMethod === 'apple_pay' && (
                  <div className="p-5 rounded-[18px] bg-[#141219] text-white text-center space-y-2.5">
                    <div className="text-2xl font-black">Pay</div>
                    <p className="text-xs text-stone-300 max-w-sm mx-auto">
                      Click below to authorize payment of <strong className="text-white">${finalTotal.toFixed(2)}</strong> with Face ID / Touch ID.
                    </p>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-stone-800 text-stone-300 text-[10px] rounded-full">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>Instant Device Verification</span>
                    </div>
                  </div>
                )}

                {/* Google Pay Mock State */}
                {paymentMethod === 'google_pay' && (
                  <div className="p-5 rounded-[18px] bg-[#fff8f2] border border-amber-200 text-center space-y-2">
                    <div className="text-lg font-black text-amber-900">Google Pay</div>
                    <p className="text-xs text-stone-600 max-w-sm mx-auto">
                      Pay instantly with cards saved in your Google Account. Total: <strong>${finalTotal.toFixed(2)}</strong>.
                    </p>
                  </div>
                )}

                {/* PayPal Mock State */}
                {paymentMethod === 'paypal' && (
                  <div className="p-5 rounded-[18px] bg-[#f0f7ff] border border-blue-200 text-center space-y-2">
                    <div className="text-lg font-black text-blue-900">PayPal Express Checkout</div>
                    <p className="text-xs text-stone-600 max-w-sm mx-auto">
                      You will complete your payment of <strong>${finalTotal.toFixed(2)}</strong> safely via PayPal.
                    </p>
                  </div>
                )}

                {/* Primary Place Order CTA (Desktop only, on mobile handled by single sticky bar) */}
                <div className="hidden lg:flex items-center justify-between gap-3 pt-5 mt-4 border-t border-[#f5eaf1]">
                  <button
                    type="button"
                    onClick={() => setCurrentStep('delivery')}
                    className="h-[40px] px-4 rounded-[11px] border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] text-xs font-bold text-[#55505a] flex items-center gap-1.5 transition-all cursor-pointer bg-white active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handlePlaceOrder}
                    className={`h-[44px] px-7 rounded-[12px] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(211, 9, 21,0.3)] active:scale-97 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D30915]/50 focus-visible:ring-offset-2 ${isSubmitting
                        ? 'bg-[#B60711] text-white opacity-80 cursor-wait'
                        : 'bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:from-[#B60711] text-white hover:shadow-[0_6px_20px_rgba(211, 9, 21,0.45)] hover:-translate-y-0.5'
                      }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>{paymentMethod === 'cod' ? 'Confirm Doorstep COD Order' : `Pay $${finalTotal.toFixed(2)} & Reveal Surprises`}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Desktop Order Summary (Fixed 380px sidebar, visible on lg screens) */}
          <div className="hidden lg:block w-full max-w-[380px] overflow-visible space-y-5 sticky top-24">

            <div className="w-full rounded-[20px] border border-[#eedbe6] bg-white p-5 shadow-[0_10px_30px_rgba(50,31,63,0.04)] overflow-visible">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#f5eaf1] mb-4 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="w-4 h-4 text-[#D30915] shrink-0" />
                  <h3 className="text-sm font-black text-[#141219] m-0 font-display truncate">
                    Order Summary ({totalItemCount} {totalItemCount === 1 ? 'item' : 'items'})
                  </h3>
                </div>
                <span className="text-xs font-black text-[#D30915] shrink-0 whitespace-nowrap">100% Win Guarantee</span>
              </div>

              {/* Dynamic User / Consultant Attribution Badge */}
              {(user || attributedRep) && (
                <div className="mb-4 p-2.5 rounded-xl bg-gradient-to-r from-[#fff5f6] to-[#fff9fa] border border-[#ffd8dc] flex items-center justify-between gap-2.5 shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={user?.avatar || attributedRep?.avatar || '/assets/ilovesurprises/Profile/profile%20image.webp'}
                      alt={user?.name || attributedRep?.name || 'Customer'}
                      className="w-7 h-7 rounded-full object-cover ring-2 ring-[#D30915]/30 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-[#645c68] font-medium leading-none mb-0.5">
                        Shopping with
                      </p>
                      <p className="text-xs font-bold text-[#141219] truncate">
                        {user?.name || attributedRep?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Credited
                  </span>
                </div>
              )}

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto space-y-3 pt-2.5 pb-1.5 px-2.5 divide-y divide-[#f7eff4]">
                {cart.map((item) => (
                  <div key={item.product.id} className="pt-3 first:pt-1 flex items-center justify-between gap-3 overflow-visible">
                    <div className="relative shrink-0 overflow-visible" style={{ overflow: 'visible' }}>
                      <div className="w-13 h-13 rounded-[12px] bg-[#faf5f8] border border-[#ecdbe6] flex items-center justify-center p-1 shadow-2xs overflow-hidden">
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span
                        className="absolute rounded-full bg-[#141219] text-white font-bold flex items-center justify-center border-2 border-white shadow-xs z-20 leading-none select-none pointer-events-none"
                        style={{
                          top: '-8px',
                          right: '-8px',
                          width: '20px',
                          height: '20px',
                          fontSize: '12px',
                          lineHeight: '1',
                          backgroundColor: '#141219',
                          color: '#ffffff',
                          border: '2px solid #ffffff',
                          borderRadius: '9999px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                        }}
                      >
                        {item.quantity}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 pl-1">
                      <h4 className="text-xs font-bold text-[#141219] m-0 truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                          {item.product.surpriseType === 'cash' ? 'Cash Inside' : 'Jewelry Inside'}
                        </span>
                        <span className="text-[10px] text-[#716d77]">
                          ${item.product.price.toFixed(2)} ea
                        </span>
                      </div>
                      {(item.selectedRingSize || item.selectedJewelryType || item.selectedSize) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {item.selectedJewelryType && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              {item.selectedJewelryType}
                            </span>
                          )}
                          {item.selectedRingSize && (
                            <span className="text-[9px] font-bold text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded border border-[#fecdd3]">
                              Size {item.selectedRingSize}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[9px] font-medium text-[#716d77] bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-[#141219]">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Form */}
              <div className="pt-4 mt-4 border-t border-[#f5eaf1]">
                {appliedPromo ? (
                  <div className="p-2.5 rounded-[12px] bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-800 truncate">
                      <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">Code <strong>{appliedPromo.code}</strong> ({appliedPromo.discountPercent}% OFF)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-[11px] text-red-600 font-bold hover:underline shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyPromo} className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="PROMO CODE (VIP15 / WIN20)"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        className="w-full h-[38px] pl-8 pr-2 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs text-[#141219] outline-none uppercase font-bold"
                      />
                      <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8a858f]" />
                    </div>
                    <button
                      type="submit"
                      className="h-[38px] px-3.5 rounded-[11px] bg-white border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] text-xs font-black text-[#141219] shadow-2xs transition-colors cursor-pointer shrink-0"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {promoError && (
                  <p className="text-[10px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{promoError}</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 mt-4 border-t border-[#f5eaf1] space-y-2 text-xs text-[#716d77]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-[#141219]">${rawSubtotal.toFixed(2)}</span>
                </div>

                {isRepPurchaser ? (
                  <div className="flex justify-between items-center text-emerald-800 font-bold bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Rep Personal Order Discount (20% Off)</span>
                    </div>
                    <span>-${repPersonalDiscount.toFixed(2)}</span>
                  </div>
                ) : appliedPromo ? (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount ({appliedPromo.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                ) : null}

                {isRepPurchaser && (
                  <div className="p-2.5 rounded-xl bg-purple-50/80 border border-purple-200 text-[11px] text-purple-950 font-medium">
                    <p className="m-0 font-bold flex items-center gap-1 text-purple-900">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                      Representative Personal Purchase:
                    </p>
                    <p className="m-0 mt-0.5 text-[10px] text-purple-800 leading-snug">
                      Personal purchases receive a 20% Rep discount but do not count toward the $125 monthly qualification.
                    </p>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Delivery ({selectedDelivery.name.split(' ')[0]})</span>
                  <span className={`font-bold ${shippingFee === 0 ? 'text-emerald-700 font-black' : 'text-[#141219]'}`}>
                    {shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(2)}`}
                  </span>
                </div>

                <div className="flex justify-between pt-2 border-t border-[#f5eaf1] text-sm font-black text-[#141219]">
                  <span>Total Amount</span>
                  <span className="text-base text-[#D30915]">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Free shipping reminder badge */}
              {!isFreeStandard && (
                <div className="mt-3.5 p-2.5 rounded-[12px] bg-[#fff1f2] border border-[#fecdd3] text-[11px] text-[#D30915] font-bold flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    Add ${(freeShippingThreshold - discountedSubtotal).toFixed(2)} more for <strong>FREE Delivery</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Satisfaction Guarantee card */}
            <div className="p-4 rounded-[18px] bg-gradient-to-r from-[#fff5f5] to-[#fbf7fc] border border-[#fecdd3] text-xs text-[#55505a] flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white text-[#D30915] border border-[#fecdd3] flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <strong className="block text-[#141219] font-black text-xs truncate">
                  Real Win Inside Every Item
                </strong>
                <span className="text-[11px] text-[#716d77] block line-clamp-2">
                  Real cash up to $2,500 or appraised fine jewelry.
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. REAL APP MOBILE STICKY BOTTOM ACTION BAR (Single primary action button on mobile screens < 1024px) */}
      <div className="block lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#eedbe6] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-8px_25px_rgba(0,0,0,0.09)]">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Price summary preview */}
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#716d77] block leading-none mb-0.5">
              {currentStep === 'shipping' ? 'Order Total' : currentStep === 'delivery' ? 'With Delivery' : 'Total Due'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-[#D30915] leading-tight">
                ${finalTotal.toFixed(2)}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>

          {/* Single Primary Action Button */}
          <div className="flex-1 max-w-[250px]">
            {currentStep === 'shipping' && (
              !isAddingNewAddress && savedAddresses.length > 0 ? (
                <button
                  type="button"
                  onClick={handleDeliverToSelectedSavedAddress}
                  className="w-full h-[46px] px-4 rounded-[14px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(211,9,21,0.35)] hover:shadow-[0_6px_20px_rgba(211,9,21,0.45)]"
                >
                  <span>Deliver to this Address</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    handleProceedToDelivery(e);
                  }}
                  className="w-full h-[46px] px-4 rounded-[14px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(211,9,21,0.35)] hover:shadow-[0_6px_20px_rgba(211,9,21,0.45)]"
                >
                  <span>Continue to Delivery</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            )}

            {currentStep === 'delivery' && (
              <button
                type="button"
                onClick={handleProceedToPayment}
                className="w-full h-[46px] px-4 rounded-[14px] bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:brightness-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(211,9,21,0.35)] hover:shadow-[0_6px_20px_rgba(211,9,21,0.45)]"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'payment' && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handlePlaceOrder}
                className={`w-full h-[46px] px-4 rounded-[14px] font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_16px_rgba(211,9,21,0.35)] active:scale-95 transition-all cursor-pointer whitespace-nowrap ${isSubmitting
                    ? 'bg-[#B60711] text-white opacity-80 cursor-wait'
                    : 'bg-gradient-to-r from-[#D30915] via-[#ff3b81] to-[#B60711] hover:brightness-105 hover:shadow-[0_6px_20px_rgba(211,9,21,0.45)] text-white'
                  }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>{paymentMethod === 'cod' ? 'Confirm COD Order' : `Pay $${finalTotal.toFixed(2)} & Reveal`}</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Map Location Picker Modal */}
      <MapLocationPickerModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        onSelectAddress={handleSelectFromMap}
        initialAddress={shippingForm}
      />
    </div>
  );
};
