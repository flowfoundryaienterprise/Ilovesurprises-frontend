export type CommissionTierLevel = 'personal' | 1 | 2 | 3 | 4 | 5;

export type CommissionStatus = 'paid' | 'pending' | 'processing' | 'approved' | 'reversed' | 'unqualified';

export interface MonthlyQualificationRecord {
  repUsername: string;
  repId?: string;
  calendarMonth: string; // "YYYY-MM" e.g. "2026-09"
  qualifyingRetailSales: number;
  qualificationThreshold: number; // 125.00
  isQualified: boolean;
  personalPurchasesExcluded: number;
  customerOrderCount: number;
  personalOrderCount: number;
  updatedAt: string;
}

export interface CommissionRecord {
  id: string;
  orderId: string;
  orderDate: string;
  customerName: string;
  productName: string;
  level: CommissionTierLevel;
  levelLabel: string; // e.g. "Personal Sale (20%)", "Level 1 Referral (5%)"
  orderAmount: number;
  commissionRate: number; // e.g. 0.20, 0.05, 0.04, 0.03, 0.02, 0.01
  commissionAmount: number;
  status: CommissionStatus;
  payoutDate?: string;
  unqualifiedReason?: string;
}

export type PayoutMethod = 'paypal' | 'bank_transfer' | 'venmo' | 'check';

export type PayoutStatus = 'completed' | 'processing' | 'pending' | 'rejected';

export interface PayoutRecord {
  id: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: PayoutMethod;
  destinationAccount: string;
  requestedAt: string;
  completedAt?: string;
  status: PayoutStatus;
  referenceId: string;
}

export type AffiliateRank = 'VIP Partner' | 'Silver Representative' | 'Gold Leader' | 'Diamond Ambassador' | 'Crown Director';

export interface ReferralMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  repUsername: string;
  level: 1 | 2 | 3 | 4 | 5;
  rank: AffiliateRank;
  joinDate: string;
  status: 'active' | 'inactive';
  personalSales: number;
  teamSales: number;
  totalTeamMembers: number;
  commissionGenerated: number;
  children?: ReferralMember[];
}

export interface AffiliateStats {
  totalEarnings: number;
  availableBalance: number;
  pendingCommissions: number;
  lifetimeSalesVolume: number;
  personalSalesVolume: number;
  teamSalesVolume: number;
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number; // e.g. 8.4 (%)
  currentRank: AffiliateRank;
  personalCommissionRate: number; // 0.20 (20%)
  repUsername: string;
  customReferralCode: string;
  referralLink: string;
  monthlyQualification?: MonthlyQualificationRecord;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  orderStatusUpdates: boolean;
  surpriseDropAlerts: boolean;
  marketingEmails: boolean;
  twoFactorEnabled: boolean;
  currency: string;
  language: string;
}
