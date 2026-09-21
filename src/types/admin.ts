export type AdminRole = 'super_admin' | 'store_manager' | 'affiliate_manager' | 'support_rep';

export type AdminTab =
  | 'overview'
  | 'products'
  | 'collections'
  | 'orders'
  | 'customers'
  | 'representatives'
  | 'memberships'
  | 'commerce'
  | 'commissions'
  | 'reports'
  | 'content'
  | 'settings'
  | 'permissions'
  | 'appraisals';

export interface AdminRoleDefinition {
  id: AdminRole;
  name: string;
  badge: string;
  description: string;
  allowedTabs: AdminTab[];
  canEdit: boolean;
  canApprovePayouts: boolean;
  canManageSettings: boolean;
}

export interface AdminKPIs {
  grossRevenue: number;
  grossRevenueMoM: number;
  totalOrders: number;
  totalOrdersMoM: number;
  totalCustomers: number;
  totalCustomersMoM: number;
  activeRepresentatives: number;
  activeRepresentativesMoM: number;
  activeMemberships: number;
  activeMembershipsMoM: number;
  monthlyRecurringRevenue: number;
  pendingCommissionLiability: number;
  totalCommissionsPaid: number;
  averageOrderValue: number;
}

export interface AdminActivityItem {
  id: string;
  timestamp: string;
  type: 'order' | 'rep_signup' | 'membership_renew' | 'commission_payout' | 'refund' | 'status_alert';
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  amount?: number;
}

export type RepStatus = 'active' | 'past_due' | 'suspended';
export type RepApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface RepresentativeAdminRecord {
  id: string;
  name: string;
  repUsername: string;
  email: string;
  phone: string;
  avatar: string;
  sponsorUsername: string;
  sponsorName: string;
  status: RepStatus;
  approvalStatus: RepApprovalStatus;
  currentRank: string;
  membershipStatus: 'active' | 'past_due' | 'suspended' | 'cancelled';
  membershipPlan: string;
  joinDate: string;
  lifetimeSales: number;
  personalSalesMonth: number;
  teamSalesMonth: number;
  teamSize: number;
  totalCommissionsEarned: number;
  qualifyingRetailSalesMonth?: number;
  isDownlineCommissionQualified?: boolean;
  qualificationThreshold?: number;
  personalPurchasesMonth?: number;
}

export type MembershipPlanType = 'monthly' | 'six_month' | 'twelve_month';
export type MembershipPaymentStatus = 'paid' | 'failed' | 'pending';
export type MembershipRenewalStatus = 'auto_renew' | 'manual' | 'failing';
export type MembershipCancellationStatus = 'none' | 'pending_end_of_period' | 'cancelled';

export interface MembershipAdminRecord {
  id: string;
  representativeId: string;
  repName: string;
  repUsername: string;
  repAvatar: string;
  plan: MembershipPlanType;
  planName: string;
  price: number;
  billingFrequency: 'monthly' | 'every_6_months' | 'annually';
  discountNotice?: string;
  paymentStatus: MembershipPaymentStatus;
  status: 'active' | 'past_due' | 'suspended' | 'cancelled';
  nextBillingDate: string;
  renewalStatus: MembershipRenewalStatus;
  cancellationStatus: MembershipCancellationStatus;
  startedAt: string;
  paymentMethodSnippet: string; // e.g. "Visa ending in •••• 4242"
}

export interface AdminProductOption {
  name: string;
  values: string[];
}

export interface AdminProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  options: Record<string, string>;
  image?: string;
}

export interface AdminProductItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number;
  description?: string;
  stock: number;
  lowStockThreshold: number;
  surpriseType: string;
  surpriseValue?: string;
  image: string;
  images?: string[];
  options?: AdminProductOption[];
  variants?: AdminProductVariant[];
  rating: number;
  reviewCount: number;
  status: 'active' | 'draft' | 'archived';
  isBestSeller?: boolean;
}

export interface AdminCollectionItem {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  featured: boolean;
  orderIndex?: number;
  image: string;
  tagline: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
}

export interface AdminOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'paid' | 'refunded' | 'pending';
  itemCount: number;
  itemsSummary: string;
  createdAt: string;
}

export interface AdminCustomerItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string;
  repReferredBy?: string;
  status: 'active' | 'inactive';
}

export interface AdminRefundRecord {
  id: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  reason: string;
  status: 'completed' | 'processing' | 'rejected';
  requestedAt: string;
  restocked: boolean;
  approvedBy?: string;
}

export interface AdminDiscountCode {
  id: string;
  code: string;
  discountPercent: number;
  minSpend: number;
  usageCount: number;
  maxUsage?: number;
  expiresAt: string;
  active: boolean;
}

export type AdminCommissionTierLevel = 'selling_rep' | 1 | 2 | 3 | 4 | 5;
export type CommissionLedgerStatus = 'pending' | 'approved' | 'reversed' | 'paid' | 'unqualified';

export interface AdminCommissionRecord {
  id: string;
  repId: string;
  repName: string;
  repUsername: string;
  orderId: string;
  orderAmount: number;
  tier: AdminCommissionTierLevel;
  tierLabel: string;
  ratePercent: number; // e.g. 20, 5, 4, 3, 2, 1
  commissionAmount: number;
  status: CommissionLedgerStatus;
  date: string;
  customerName: string;
  payoutReference?: string;
  unqualifiedReason?: string;
}

export interface AdminReportData {
  timeframe: '7d' | '30d' | '90d' | 'ytd';
  grossSales: number;
  netSales: number;
  ordersCount: number;
  averageOrderValue: number;
  visitors: number;
  conversionRate: number;
  activeRepresentatives: number;
  membershipMRR: number;
  commissionLiability: number;
  totalPayoutsDisbursed: number;
  salesByDay: { date: string; sales: number; orders: number }[];
  trafficByDay: { date: string; visitors: number; orders: number }[];
  tierDistribution: { tier: string; rate: string; amount: number; percentage: number }[];
  membershipBreakdown: { plan: string; count: number; revenue: number }[];
}

export interface StarterKitConfig {
  id: string;
  name: string;
  price: number;
  includedProductsCount: number;
  active: boolean;
  description: string;
  sampleItems: string[];
}

export interface EmailTemplateConfig {
  id: string;
  name: string;
  subject: string;
  trigger: string;
  active: boolean;
}

export interface AdminSettingsData {
  referralAttributionDays: 30 | 60 | 90 | 180;
  restrictedUsernames: string[];
  starterKits: StarterKitConfig[];
  emailProvider: 'sendgrid' | 'ses' | 'postmark';
  emailSenderName: string;
  emailSenderAddress: string;
  emailApiKeyConfigured: boolean;
  emailTemplates: EmailTemplateConfig[];
  gateways: {
    stripe: { enabled: boolean; testMode: boolean; webhookHealthy: boolean };
    paypal: { enabled: boolean; sandbox: boolean; webhookHealthy: boolean };
    applePay: { enabled: boolean };
  };
  siteContent: {
    announcementText: string;
    announcementActive: boolean;
    promoBannerText: string;
    promoBannerActive: boolean;
    vipPerkText: string;
  };
}

export interface HomepageFeaturedCard {
  id: string;
  title: string;
  categoryKey: string;
  badge: string;
  tagline: string;
  ctaText: string;
  image: string;
  itemCount: number;
  accentBorder: string;
  active: boolean;
}

export interface HomepageContentConfig {
  announcementText: string;
  announcementActive: boolean;
  announcementLink?: string;
  promoBannerText: string;
  promoBannerCode?: string;
  promoBannerActive: boolean;
  featuredCards: HomepageFeaturedCard[];
}

export interface AdminStaffUser {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  avatarUrl?: string;
  lastActive?: string;
  createdAt: string;
}

