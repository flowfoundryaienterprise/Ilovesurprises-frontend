import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Gift,
  Star,
  Crown,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ShoppingBag,
  Zap,
  Video,
  Share2,
  Cake,
  RotateCcw,
  Flame,
  Gem,
} from 'lucide-react';
import type { UserProfile } from '../types';

export interface RewardsProps {
  user?: UserProfile | null;
  onNavigateToShop?: () => void;
  onOpenAuth?: (mode: 'login' | 'signup') => void;
  onShowToast?: (
    message: string,
    options?: {
      title?: string;
      type?: 'cart' | 'wishlist' | 'order' | 'success' | 'info';
    }
  ) => void;
}

interface RewardItem {
  id: string;
  title: string;
  category: 'voucher' | 'product' | 'vip';
  pointsCost: number;
  valueTag: string;
  image: string;
  description: string;
  code: string;
  badge?: string;
}

const REWARDS_CATALOG: RewardItem[] = [
  {
    id: 'reward-10-voucher',
    title: '$10 Storewide Surprise Voucher',
    category: 'voucher',
    pointsCost: 500,
    valueTag: '$10.00 Value',
    image: '/assets/ilovesurprises/products/Coke_CSH_Sodapop-CND_JC.jpg',
    description: 'Instant $10 discount valid on any cash candle, bath bomb, or jewelry surprise order over $35.',
    code: 'SURPRISE10VIP',
    badge: 'Popular',
  },
  {
    id: 'reward-bath-bomb',
    title: 'Free Cash Bath Bomb Reveal',
    category: 'product',
    pointsCost: 1000,
    valueTag: '$16.99 Value',
    image: '/assets/ilovesurprises/hero/hero-mini-1.png',
    description: 'Receive a free ultra-fizzy Cash Bath Bomb containing $2 to $2,500 real legal cash inside!',
    code: 'FREEBATHCASH',
    badge: 'Best Seller',
  },
  {
    id: 'reward-25-voucher',
    title: '$25 Cash Reveal Voucher',
    category: 'voucher',
    pointsCost: 1250,
    valueTag: '$25.00 Value',
    image: '/assets/ilovesurprises/products/18_Mockup_JC_af97ffd1-196d-4e5b-b1e6-887e74218266.jpg',
    description: 'Take $25 off any order over $60. Can be applied immediately at checkout.',
    code: 'CASH25REVEAL',
    badge: 'High Value',
  },
  {
    id: 'reward-ring-candle',
    title: 'Free Diamond Ring Candle ($10-$5,000)',
    category: 'product',
    pointsCost: 2000,
    valueTag: '$28.99 Value',
    image: '/assets/ilovesurprises/products/16_Mockup_Jewelry_JewelryCandles_6df1cda4-8954-4272-b3aa-01cc070d5a21.jpg',
    description: '100% hand-poured soy candle concealing an appraised genuine ring with certified value appraisal card.',
    code: 'DIAMONDRINGVIP',
    badge: 'Customer Favorite',
  },
  {
    id: 'reward-cash-candle',
    title: 'Free Best-Selling Cash Candle ($2-$2,500)',
    category: 'product',
    pointsCost: 2500,
    valueTag: '$29.99 Value',
    image: '/assets/ilovesurprises/products/21_Mockup_Jewelry_Jewelry_Candles_c9431a01-4f55-4359-8efd-73db455a537b.jpg',
    description: 'Our viral sensation. Pure soy candle with authentic legal tender foil-wrapped inside. Every candle wins!',
    code: 'FREECASHCANDLE',
    badge: 'Viral Pick',
  },
  {
    id: 'reward-vip-chest',
    title: 'Grand $100 VIP Mystery Treasure Chest',
    category: 'vip',
    pointsCost: 4000,
    valueTag: '$100.00 Value',
    image: '/assets/ilovesurprises/products/25_Mockup_Jewelry_JewelryCandles_455d8a9d-bd79-4284-977d-6cfad7ce1853.jpg',
    description: 'Curated luxury collection: 2 Cash Candles, 2 Bath Bombs, 2 Wax Melts & guaranteed elevated ring reveal.',
    code: 'ROYALCHEST100',
    badge: 'VIP Exclusive',
  },
];

const RECENT_WINNERS = [
  { name: 'Chloe M.', location: 'Scottsdale, AZ', action: 'redeemed Free Diamond Ring Candle', time: '4m ago', pts: '2,000 pts' },
  { name: 'Derek S.', location: 'Tampa, FL', action: 'won 250 Bonus PTS on Daily Spin Wheel', time: '11m ago', pts: '+250 pts' },
  { name: 'Hannah B.', location: 'Denver, CO', action: 'unlocked Platinum Radiance VIP Tier', time: '18m ago', pts: 'Tier 3' },
  { name: 'Marcus T.', location: 'Dallas, TX', action: 'redeemed $25 Cash Reveal Voucher', time: '29m ago', pts: '1,250 pts' },
  { name: 'Ashley K.', location: 'Charlotte, NC', action: 'earned 250 PTS for TikTok unboxing review', time: '42m ago', pts: '+250 pts' },
];

const WHEEL_PRIZES = [
  { label: '50 Bonus PTS', pts: 50, color: '#f43f5e' },
  { label: 'Free Shipping', pts: 25, color: '#059669' },
  { label: '100 Bonus PTS', pts: 100, color: '#d97706' },
  { label: '10% Secret Drop', pts: 40, color: '#7c3aed' },
  { label: '150 Bonus PTS', pts: 150, color: '#D30915' },
  { label: '25 Bonus PTS', pts: 25, color: '#0284c7' },
  { label: '250 Bonus PTS', pts: 250, color: '#b91c1c' },
  { label: 'VIP Mystery Gift', pts: 75, color: '#4f46e5' },
];

export const Rewards: React.FC<RewardsProps> = ({
  user,
  onNavigateToShop,
  onOpenAuth,
  onShowToast,
}) => {
  // Local points balance state initialized with demo or user balance
  const [pointsBalance, setPointsBalance] = useState<number>(() => {
    const saved = localStorage.getItem('ils_user_rewards_pts');
    if (saved) return parseInt(saved, 10);
    return user ? 1250 : 350;
  });

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'voucher' | 'product' | 'vip'>('all');
  const [spendSlider, setSpendSlider] = useState<number>(85);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [claimedRewardIds, setClaimedRewardIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ils_claimed_rewards');
    return saved ? JSON.parse(saved) : [];
  });

  // Daily Spin Wheel Interactive State
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [hasSpunToday, setHasSpunToday] = useState<boolean>(() => {
    const lastSpin = localStorage.getItem('ils_last_spin_date');
    const today = new Date().toDateString();
    return lastSpin === today;
  });
  const [spinResult, setSpinResult] = useState<string | null>(null);

  // FAQ open states
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Calculated rewards from spend slider
  const pointsFromSpend = spendSlider * 10;
  const cashbackValue = (pointsFromSpend / 100) * 2;

  // Filter rewards catalog
  const filteredRewards = useMemo(() => {
    if (activeCategoryFilter === 'all') return REWARDS_CATALOG;
    return REWARDS_CATALOG.filter((item) => item.category === activeCategoryFilter);
  }, [activeCategoryFilter]);

  // Handle spin wheel
  const handleSpinWheel = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    setSpinResult(null);

    // Pick random prize index
    const prizeIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = WHEEL_PRIZES[prizeIndex];

    // Calculate rotation: 5 full rotations + segment angle
    const segmentAngle = 360 / WHEEL_PRIZES.length;
    const targetAngle = 360 * 5 + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    setWheelRotation((prev) => prev + targetAngle);

    setTimeout(() => {
      setIsSpinning(false);
      setHasSpunToday(true);
      localStorage.setItem('ils_last_spin_date', new Date().toDateString());

      const newBalance = pointsBalance + prize.pts;
      setPointsBalance(newBalance);
      localStorage.setItem('ils_user_rewards_pts', newBalance.toString());

      setSpinResult(`🎉 Congratulations! You won "${prize.label}"! +${prize.pts} PTS added to your balance.`);

      onShowToast?.(`🎉 You won "${prize.label}"! +${prize.pts} PTS added!`, {
        title: 'Daily Surprise Wheel Winner!',
        type: 'success',
      });
    }, 4000);
  };

  // Handle copy voucher code
  const handleCopyCode = (code: string, rewardTitle: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);

    onShowToast?.(`Voucher code "${code}" copied to clipboard! Apply it at checkout.`, {
      title: `${rewardTitle} Ready!`,
      type: 'success',
    });
  };

  // Handle redeem reward
  const handleRedeemReward = (reward: RewardItem) => {
    if (pointsBalance < reward.pointsCost) {
      onShowToast?.(
        `You need ${reward.pointsCost - pointsBalance} more points to redeem this item. Keep unboxing to earn points!`,
        {
          title: 'More Points Needed',
          type: 'info',
        }
      );
      return;
    }

    const newBalance = pointsBalance - reward.pointsCost;
    setPointsBalance(newBalance);
    localStorage.setItem('ils_user_rewards_pts', newBalance.toString());

    const updatedClaimed = [...claimedRewardIds, reward.id];
    setClaimedRewardIds(updatedClaimed);
    localStorage.setItem('ils_claimed_rewards', JSON.stringify(updatedClaimed));

    handleCopyCode(reward.code, reward.title);
  };

  return (
    <div className="min-h-screen bg-white text-[#141219] pb-16">
      {/* 1. Hero VIP Announcement Ribbon */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#fff2f5] via-[#fff8fa] to-white border-b border-[#f3e1ec] pt-8 sm:pt-12 pb-10 sm:pb-16 px-4 sm:px-6">
        <div className="absolute inset-0 bg-[radial-gradient(#D30915_1px,transparent_1px)] opacity-[0.035] [background-size:24px_24px] pointer-events-none" />

        <div className="relative max-w-[1360px] mx-auto">
          {/* Top Badge */}
          <div className="flex items-center justify-center mb-4">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#f5cad7] shadow-xs text-xs font-black uppercase tracking-wider text-[#D30915]">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915] animate-spin" />
              <span>Surprise Club™ VIP Loyalty & Rewards</span>
            </span>
          </div>

          {/* Heading */}
          <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#141219] hero-title-font leading-[1.15] mb-3 sm:mb-4">
              Turn Every Unboxing Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] via-[#e61220] to-[#b60711]">
                Real Cash & Rare Jewelry
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#5c5763] font-medium leading-relaxed max-w-2xl mx-auto">
              Earn 10 points for every $1 spent on cash candles, jewelry surprises, and bath treats. Redeem points for
              guaranteed reveal vouchers, free candles, and exclusive VIP drops.
            </p>
          </div>

          {/* VIP Status Card (Dynamic Member Dashboard) */}
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-white via-[#fffafc] to-[#fff5f8] rounded-[28px] sm:rounded-[32px] border border-[#f0d4e3] shadow-[0_16px_48px_rgba(211,9,21,0.08)] p-5 sm:p-8 relative overflow-hidden">
            {/* Top ambient glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br from-[#D30915]/10 to-amber-400/10 rounded-full blur-2xl pointer-events-none" />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left Column: Member Info & Points */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D30915] to-[#f43f5e] flex items-center justify-center text-white shadow-md">
                    <Crown className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0">
                        {user ? `${user.name}’s VIP Pass` : 'Surprise Club VIP Pass'}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                        Gold Flame Tier
                      </span>
                    </div>
                    <p className="text-xs text-[#716d77] font-semibold m-0">
                      Member ID: {user?.id ? `VIP-${user.id.slice(0, 8).toUpperCase()}` : 'VIP-GUEST-REWARDS'}
                    </p>
                  </div>
                </div>

                {/* Points Counter Badge */}
                <div className="flex flex-wrap items-baseline gap-2 pt-2">
                  <span className="text-3xl sm:text-4xl font-black text-[#D30915] hero-title-font tracking-tight">
                    {pointsBalance.toLocaleString()}
                  </span>
                  <span className="text-sm font-bold text-[#716d77]">Available Points</span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    ≈ ${((pointsBalance / 500) * 10).toFixed(2)} in Surprise Vouchers
                  </span>
                </div>

                {/* Progress to Next Tier */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#55505a]">Progress to Platinum Radiance</span>
                    <span className="text-[#D30915] font-black">{pointsBalance} / 2,000 PTS</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-[#f3e3ed] overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#D30915] to-amber-500 transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.min(100, (pointsBalance / 2000) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-[#817c85] font-medium">
                    Earn {Math.max(0, 2000 - pointsBalance)} more points to unlock 2x points multiplier & free express shipping!
                  </p>
                </div>
              </div>

              {/* Right Column: Quick Perks & Action Buttons */}
              <div className="md:col-span-5 bg-white rounded-2xl p-4 sm:p-5 border border-[#eedde8] shadow-xs space-y-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#8a858f] block">
                  Active Tier Perks Unlocked:
                </span>
                <ul className="space-y-2 text-xs font-bold text-[#36323d]">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>1.5x Points on all surprise candles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free Shipping on orders $50+</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Free $15 Birthday Reveal Voucher</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Early 24h VIP access to new drops</span>
                  </li>
                </ul>

                {!user && (
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signup')}
                    className="w-full mt-2 py-2.5 px-4 rounded-xl bg-[#D30915] hover:bg-[#b60711] text-white text-xs font-black shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Join Free & Claim 100 Bonus PTS</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Gamified Mini-Game: Daily Surprise Spin Wheel */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-white to-[#fffafc] border-b border-[#f5e4ee]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200 mb-2">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Daily Free Spin</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font m-0 mb-2">
              Spin The Surprise Wheel Of Fortune
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77] font-medium">
              Every Surprise Club member gets 1 free daily spin. Win instant bonus points, free express shipping codes, or
              exclusive reveal vouchers!
            </p>
          </div>

          <div className="max-w-xl mx-auto bg-white rounded-[32px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_12px_36px_rgba(0,0,0,0.06)] flex flex-col items-center">
            {/* Wheel Container */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center mb-6">
              {/* Pointer Marker */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-[#D30915] filter drop-shadow-md" />

              {/* Rotating Wheel Circle */}
              <div
                className="w-full h-full rounded-full border-4 border-amber-400 shadow-lg relative overflow-hidden transition-transform duration-[4000ms] ease-[cubic-bezier(0.15,0.9,0.3,1)]"
                style={{
                  transform: `rotate(${wheelRotation}deg)`,
                  background:
                    'conic-gradient(#f43f5e 0deg 45deg, #059669 45deg 90deg, #d97706 90deg 135deg, #7c3aed 135deg 180deg, #D30915 180deg 225deg, #0284c7 225deg 270deg, #b91c1c 270deg 315deg, #4f46e5 315deg 360deg)',
                }}
              >
                {/* Center Ring */}
                <div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white border-4 border-amber-400 shadow-md flex flex-col items-center justify-center z-10 select-none">
                  <Gift className="w-5 h-5 text-[#D30915]" />
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#D30915] leading-none mt-0.5">
                    SPIN
                  </span>
                </div>
              </div>
            </div>

            {/* Spin CTA Button */}
            <button
              type="button"
              disabled={isSpinning || hasSpunToday}
              onClick={handleSpinWheel}
              className={`w-full max-w-sm py-3.5 px-6 rounded-full font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${hasSpunToday
                  ? 'bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#D30915] via-[#e10b17] to-[#B60711] hover:brightness-110 text-white hover:shadow-[0_6px_24px_rgba(211,9,21,0.35)] active:scale-98'
                }`}
            >
              <RotateCcw className={`w-4 h-4 ${isSpinning ? 'animate-spin' : ''}`} />
              <span>
                {isSpinning
                  ? 'Spinning the Wheel...'
                  : hasSpunToday
                    ? 'Spun Today! Come Back Tomorrow'
                    : 'Spin Now For Free!'}
              </span>
            </button>

            {/* Win Notification Banner */}
            {spinResult && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold text-center animate-in fade-in">
                {spinResult}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. Six Ways to Earn Points Matrix */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-[1360px] mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fff1f2] text-[#D30915] text-xs font-black uppercase tracking-wider border border-[#fecdd3] mb-2">
            <Flame className="w-3.5 h-3.5 text-[#D30915]" />
            <span>Fast Earning Ways</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font m-0 mb-2">
            How To Stack Your Surprise Points
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77] font-medium">
            Accumulating points is effortless. Complete simple activities and watch your points balance surge!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D30915] flex items-center justify-center mb-4">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Shop Any Surprise Product</h3>
              <span className="text-xs font-black text-[#D30915] bg-[#fff1f2] px-2.5 py-0.5 rounded-full">
                10 PTS / $1
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Every dollar spent on cash reveal candles, fine jewelry jars, and fizz treats earns you 10 automatic points.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Gift className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Create A Free Account</h3>
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                +100 PTS
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Sign up today and get 100 instant bonus points credited directly to your surprise loyalty balance.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <Video className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Post Unboxing Video</h3>
              <span className="text-xs font-black text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full">
                +250 PTS
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Tag @ILoveSurprises on TikTok or Instagram Reels when revealing your cash or jewelry to earn 250 PTS per video.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-4">
              <Cake className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Birthday Reveal Treat</h3>
              <span className="text-xs font-black text-pink-700 bg-pink-50 px-2.5 py-0.5 rounded-full">
                +500 PTS
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Celebrate your special day with a complimentary 500 points drop ($10 voucher value) during your birthday month!
            </p>
          </div>

          {/* Card 5 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Leave A Photo Review</h3>
              <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                +150 PTS
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Share a photo of your revealed prize with a genuine review on any product page to claim 150 points.
            </p>
          </div>

          {/* Card 6 */}
          <div className="bg-white rounded-[24px] p-6 border border-[#eedde8] shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Share2 className="w-6 h-6" />
            </div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-black text-[#141219] m-0">Refer A Friend</h3>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Give $15, Get 300 PTS
              </span>
            </div>
            <p className="text-xs text-[#5c5763] font-medium leading-relaxed">
              Share your personal link. Friends get $15 off their first reveal, and you get 300 points ($6 value) upon checkout!
            </p>
          </div>
        </div>
      </section>

      {/* 4. Interactive Spend & Rewards Calculator Slider */}
      <section className="py-12 px-4 sm:px-6 bg-[#fffafc] border-y border-[#f2e1ed]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              Points Calculator
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font mt-2 mb-1">
              See How Much You’ll Earn
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77]">
              Drag the slider below to simulate your monthly surprise haul and reward earnings.
            </p>
          </div>

          <div className="bg-white rounded-[28px] p-6 sm:p-8 border border-[#ecdbe6] shadow-sm">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs sm:text-sm font-bold text-[#55505a]">Your Estimated Spend:</span>
                <span className="text-2xl font-black text-[#D30915] hero-title-font">${spendSlider}</span>
              </div>
              <input
                type="range"
                min="20"
                max="250"
                step="5"
                value={spendSlider}
                onChange={(e) => setSpendSlider(parseInt(e.target.value, 10))}
                className="w-full h-2.5 bg-[#f5e4ee] rounded-lg appearance-none cursor-pointer accent-[#D30915]"
              />
              <div className="flex justify-between text-[11px] font-bold text-[#8a858f] mt-1.5">
                <span>$20 (1 Candle)</span>
                <span>$100 (VIP Haul)</span>
                <span>$250 (Party Box)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#f5e8ef] text-center">
              <div className="p-3.5 rounded-2xl bg-[#fff8fb] border border-[#f7e6f0]">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
                  Points Earned
                </span>
                <strong className="text-2xl font-black text-[#D30915] hero-title-font">
                  {pointsFromSpend.toLocaleString()} PTS
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f0fdf4] border border-emerald-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 block mb-1">
                  Cashback Value
                </span>
                <strong className="text-2xl font-black text-emerald-700 hero-title-font">
                  ${cashbackValue.toFixed(2)} Credit
                </strong>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#fbf5ff] border border-purple-200">
                <span className="text-[11px] font-black uppercase tracking-wider text-purple-800 block mb-1">
                  Rewards Unlocked
                </span>
                <strong className="text-base font-black text-purple-900 block mt-1">
                  {spendSlider >= 200
                    ? 'Free Cash Candle'
                    : spendSlider >= 100
                      ? 'Free Bath Treat'
                      : '$10 Store Voucher'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Rewards Redemption Catalog (Vouchers & Free Products) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-[1360px] mx-auto" id="rewards-catalog">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              Rewards Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font mt-2 mb-1">
              Redeem Your Points
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77] font-medium">
              Choose an instant cash discount voucher or claim free full-sized reveal products.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#fff5f8] rounded-full border border-[#f5cad7]">
            {(['all', 'voucher', 'product', 'vip'] as const).map((filterKey) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveCategoryFilter(filterKey)}
                className={`px-3 py-1 rounded-full text-xs font-black capitalize transition-all cursor-pointer ${activeCategoryFilter === filterKey
                    ? 'bg-[#D30915] text-white shadow-xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                  }`}
              >
                {filterKey === 'all'
                  ? 'All Rewards'
                  : filterKey === 'voucher'
                    ? 'Discount Vouchers'
                    : filterKey === 'product'
                      ? 'Free Reveal Candles'
                      : 'VIP Chests'}
              </button>
            ))}
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => {
            const isAffordable = pointsBalance >= reward.pointsCost;
            const isClaimed = claimedRewardIds.includes(reward.id);

            return (
              <div
                key={reward.id}
                className="bg-white rounded-[26px] border border-[#eedbe6] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Reward Image Header */}
                <div className="relative h-48 bg-[#fffafc] overflow-hidden flex items-center justify-center p-4">
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="h-full w-auto object-contain transition-transform duration-300 hover:scale-105"
                    loading="lazy"
                  />
                  {reward.badge && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-[#D30915] border border-[#f5cad7] shadow-xs">
                      {reward.badge}
                    </span>
                  )}
                  <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-[#D30915] text-white shadow-xs">
                    {reward.pointsCost} PTS
                  </span>
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider">
                        {reward.valueTag}
                      </span>
                      <span className="text-[10px] text-[#8a858f] font-bold capitalize">
                        {reward.category === 'voucher' ? 'Instant Voucher' : 'Physical Product'}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-[#141219] mb-2 leading-snug">{reward.title}</h3>
                    <p className="text-xs text-[#5e5963] font-medium leading-relaxed mb-4">
                      {reward.description}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#f7eff4]">
                    {isClaimed ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-2 text-xs font-mono font-black text-emerald-900">
                          <span>{reward.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(reward.code, reward.title)}
                            className="text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1 text-[11px]"
                          >
                            {copiedCode === reward.code ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                        <span className="block text-[10px] text-center text-emerald-700 font-bold">
                          ✓ Reward Unlocked & Ready For Checkout
                        </span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRedeemReward(reward)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${isAffordable
                            ? 'bg-[#059669] hover:bg-[#047857] text-white hover:shadow-sm active:scale-98'
                            : 'bg-stone-100 text-stone-500 border border-stone-200 hover:bg-stone-200'
                          }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {isAffordable
                            ? `Redeem for ${reward.pointsCost} PTS`
                            : `Need ${reward.pointsCost - pointsBalance} More PTS`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. VIP Tier Progression Levels */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-[#fffafc] via-white to-[#fff8fa] border-t border-[#f2e1ed]">
        <div className="max-w-[1240px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
              VIP Tier Levels
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font mt-2 mb-2">
              Level Up Your Unboxing Status
            </h2>
            <p className="text-xs sm:text-sm text-[#716d77] font-medium">
              The more you unbox, the higher your multiplier climbs. Reach higher tiers to unlock guaranteed high-value
              jewelry appraisals and free express delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            {/* Tier 1 */}
            <div className="bg-white rounded-[24px] p-5 border border-[#eedde8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center mb-3">
                  <Star className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#141219] m-0">Silver Spark</h3>
                <span className="text-[11px] font-bold text-[#8a858f]">0 - 499 Points</span>

                <ul className="mt-4 space-y-2 text-xs font-medium text-[#55505a]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1.0x Base Points multiplier</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Free Shipping on $50+</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>$5 Birthday Voucher</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f4edf2] text-[11px] font-bold text-stone-500">
                Entry Level Member
              </div>
            </div>

            {/* Tier 2: Current */}
            <div className="bg-white rounded-[24px] p-5 border-2 border-[#D30915] shadow-md flex flex-col justify-between relative overflow-hidden">
              <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#D30915] text-white">
                Current Tier
              </span>
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                  <Flame className="w-5 h-5 text-[#D30915]" />
                </div>
                <h3 className="text-base font-black text-[#141219] m-0">Gold Flame</h3>
                <span className="text-[11px] font-bold text-[#D30915]">500 - 1,999 Points</span>

                <ul className="mt-4 space-y-2 text-xs font-medium text-[#55505a]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1.5x Points Multiplier</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Priority Express Order Dispatch</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>$15 Birthday Reveal Voucher</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>24h Early Access to Drop Releases</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f4edf2] text-[11px] font-black text-[#D30915]">
                Unlocked & Active
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-white rounded-[24px] p-5 border border-[#eedde8] shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                  <Gem className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#141219] m-0">Platinum Radiance</h3>
                <span className="text-[11px] font-bold text-purple-700">2,000 - 4,999 Points</span>

                <ul className="mt-4 space-y-2 text-xs font-medium text-[#55505a]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>2.0x Double Points Multiplier</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>FREE Express Shipping on ALL orders</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Guaranteed $50+ Appraisal Ring Tag</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Dedicated VIP Concierge Desk</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-[#f4edf2] text-[11px] font-bold text-purple-700">
                Unlock at 2,000 PTS
              </div>
            </div>

            {/* Tier 4 */}
            <div className="bg-gradient-to-br from-[#fffdfa] via-white to-amber-50 rounded-[24px] p-5 border border-amber-300 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center mb-3 shadow-xs">
                  <Crown className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-[#141219] m-0">Diamond Royalty</h3>
                <span className="text-[11px] font-bold text-amber-700">5,000+ Points</span>

                <ul className="mt-4 space-y-2 text-xs font-medium text-[#55505a]">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>3.0x Triple Points Multiplier</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Free Surprise Candle on every $100 order</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Exclusive Access to $2,500 Cash Vault</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Annual Luxury Jewelry Gift Box</span>
                  </li>
                </ul>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-200 text-[11px] font-black text-amber-800">
                Highest VIP Royalty
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Live Activity Ticker (Real Customer Redemptions) */}
      <section className="py-8 px-4 sm:px-6 bg-white border-b border-[#eedbe6] overflow-hidden">
        <div className="max-w-[1360px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-[#141219]">
              Live Member Redemptions & Community Wins
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {RECENT_WINNERS.map((winner, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-[#fffafc] border border-[#f5e4ee] text-xs font-medium space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#141219]">{winner.name}</span>
                  <span className="text-[10px] text-[#8a858f]">{winner.time}</span>
                </div>
                <p className="text-[11px] text-[#55505a] leading-tight m-0">{winner.action}</p>
                <span className="text-[10px] font-black text-emerald-700 block">{winner.pts}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Frequently Asked Questions (Accordion) */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3]">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[#141219] hero-title-font mt-2 mb-2">
            Surprise Rewards Questions
          </h2>
          <p className="text-xs sm:text-sm text-[#716d77]">
            Everything you need to know about earning, redeeming, and enjoying your VIP points.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'Do Surprise Club points ever expire?',
              a: 'No! Your points never expire as long as your account makes at least one purchase or spin every 12 months. Your accumulated points stay safely in your wallet ready to redeem whenever you want.',
            },
            {
              q: 'How do I redeem my vouchers at checkout?',
              a: 'Simply click "Redeem" on any voucher in your Rewards Catalog. Your exclusive voucher code will copy to your clipboard. Paste it into the "Promo / Gift Code" field in your checkout drawer to receive your instant discount!',
            },
            {
              q: 'Can I earn rewards alongside consultant affiliate commissions?',
              a: 'Yes! If you are a subscribed representative, you earn full 20% sales commissions AND collect Surprise Club VIP reward points on your personal product orders!',
            },
            {
              q: 'What happens to points if an item is returned or refunded?',
              a: 'If an unboxing item is returned, the points earned for that specific purchase will be deducted from your loyalty balance.',
            },
            {
              q: 'How does the free daily spin work?',
              a: 'Every member gets one free spin every 24 hours. Spin the wheel to win bonus points, express shipping coupons, or surprise gift cards added directly to your account.',
            },
          ].map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl border border-[#eedbe6] overflow-hidden transition-all shadow-2xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-[#141219] hover:text-[#D30915] cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-[#D30915] shrink-0" />
                    <span>{faq.q}</span>
                  </span>
                  <span className="text-[#8a858f] font-mono text-base">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#55505a] font-medium leading-relaxed border-t border-[#f5e8ef] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. Final Call-To-Action Banner */}
      <section className="px-4 sm:px-6 max-w-[1360px] mx-auto pt-4">
        <div className="rounded-[32px] bg-gradient-to-r from-[#D30915] via-[#e61220] to-[#b60711] text-white p-8 sm:p-12 text-center relative overflow-hidden shadow-[0_20px_50px_rgba(211,9,21,0.28)]">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready To Start Earning?</span>
            </span>
            <h2 className="text-2xl sm:text-4xl font-black hero-title-font leading-tight m-0 text-white">
              Every Unboxing Holds A Real Surprise Inside
            </h2>
            <p className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">
              Join 85,000+ happy reveal fans. Get real cash ($2-$2,500) or genuine fine jewelry appraised up to $7,500 in
              every single order!
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={onNavigateToShop}
                className="h-11 sm:h-12 px-6 rounded-full bg-white text-[#D30915] font-black text-xs sm:text-sm shadow-md hover:shadow-lg hover:scale-102 active:scale-98 transition-all cursor-pointer flex items-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Shop Best-Seller Reveal Candles</span>
              </button>
              {!user && (
                <button
                  type="button"
                  onClick={() => onOpenAuth?.('signup')}
                  className="h-11 sm:h-12 px-6 rounded-full bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm border border-white/40 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Gift className="w-4 h-4" />
                  <span>Create Account & Get 100 PTS</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Rewards;
