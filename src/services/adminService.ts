import type {
  AdminRole,
  AdminRoleDefinition,
  AdminTab,
  AdminKPIs,
  AdminActivityItem,
  RepresentativeAdminRecord,
  RepStatus,
  MembershipAdminRecord,
  AdminProductItem,
  AdminCollectionItem,
  AdminCustomerItem,
  AdminRefundRecord,
  AdminDiscountCode,
  AdminCommissionRecord,
  CommissionLedgerStatus,
  AdminReportData,
  AdminSettingsData,
  AdminOrderItem,
  HomepageContentConfig,
  AdminStaffUser,
} from '../types/admin';
import { productsData } from '../data/products';
import { categoriesData } from '../data/categories';
// Standalone admin service with persistent local storage

const ADMIN_ROLE_KEY = 'ils_admin_current_role_v1';
const ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY = 'ils_admin_roles_permissions_v1';
const ADMIN_REPS_KEY = 'ils_admin_representatives_v1';
const ADMIN_MEMBERSHIPS_KEY = 'ils_admin_memberships_v1';
const ADMIN_COMMISSIONS_KEY = 'ils_admin_commissions_v1';
const ADMIN_REFUNDS_KEY = 'ils_admin_refunds_v1';
const ADMIN_DISCOUNTS_KEY = 'ils_admin_discounts_v1';
const ADMIN_SETTINGS_KEY = 'ils_admin_settings_v1';
const ADMIN_PRODUCTS_OVERRIDE_KEY = 'ils_admin_products_override_v1';
const ADMIN_COLLECTIONS_OVERRIDE_KEY = 'ils_admin_collections_override_v1';
const ADMIN_HOMEPAGE_CONTENT_KEY = 'ils_admin_homepage_content_v1';
const ADMIN_STAFF_OVERRIDE_KEY = 'ils_admin_staff_override_v1';

export const ADMIN_ROLES_CONFIG: Record<AdminRole, AdminRoleDefinition> = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Administrator',
    badge: 'Full Access',
    description: 'Unrestricted control over commerce, reps, payouts, settings, and permissions.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'representatives',
      'memberships',
      'commerce',
      'commissions',
      'reports',
      'content',
      'settings',
      'permissions',
      'appraisals',
    ],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: true,
  },
  store_manager: {
    id: 'store_manager',
    name: 'Store Manager',
    badge: 'Commerce & Ops',
    description: 'Manages catalog, inventory, order refunds, discount promotions, and sales reports. Restricted from MLM and financial settings.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'commerce',
      'content',
      'reports',
      'appraisals',
      'representatives',
    ],
    canEdit: true,
    canApprovePayouts: false,
    canManageSettings: false,
  },
  affiliate_manager: {
    id: 'affiliate_manager',
    name: 'Affiliate & Rep Director',
    badge: 'Downline & Comms',
    description: 'Manages reps, approvals, memberships, downline tiers, and commission ledgers.',
    allowedTabs: [
      'overview',
      'representatives',
      'memberships',
      'commissions',
      'reports',
      'customers',
    ],
    canEdit: true,
    canApprovePayouts: true,
    canManageSettings: false,
  },
  support_rep: {
    id: 'support_rep',
    name: 'Customer Support Lead',
    badge: 'Read & Assist',
    description: 'Access to customer orders, lookup reps, memberships, and refunds processing. Read-only permissions.',
    allowedTabs: [
      'overview',
      'products',
      'collections',
      'orders',
      'customers',
      'commerce',
      'representatives',
      'memberships',
      'appraisals',
      'reports',
    ],
    canEdit: false,
    canApprovePayouts: false,
    canManageSettings: false,
  },
};

const INITIAL_MEMBERSHIPS: MembershipAdminRecord[] = [];

const INITIAL_REFUNDS: AdminRefundRecord[] = [];

const INITIAL_DISCOUNTS: AdminDiscountCode[] = [
  {
    id: 'disc-01',
    code: 'SURPRISE15',
    discountPercent: 15,
    minSpend: 40,
    usageCount: 0,
    maxUsage: 1000,
    expiresAt: '2026-12-31',
    active: true,
  },
  {
    id: 'disc-02',
    code: 'VIPGOLD',
    discountPercent: 20,
    minSpend: 75,
    usageCount: 0,
    maxUsage: 500,
    expiresAt: '2026-06-30',
    active: true,
  },
  {
    id: 'disc-03',
    code: 'WELCOME10',
    discountPercent: 10,
    minSpend: 25,
    usageCount: 0,
    expiresAt: '2026-12-31',
    active: true,
  },
];

const INITIAL_SETTINGS: AdminSettingsData = {
  referralAttributionDays: 60,
  restrictedUsernames: [
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
  ],
  starterKits: [
    {
      id: 'kit-pro',
      name: 'Pro Ambassador Starter Kit',
      price: 99.00,
      includedProductsCount: 8,
      active: true,
      description: 'Contains 4 Best-Selling Cash Candles, 2 Bath Bombs, 2 Wax Melts, Scent Sampler Strips, and 100 Catalogs.',
      sampleItems: ['Cash Candles (2x)', 'Diamond Ring Candles (2x)', 'Aroma Samplers (50x)', 'Branded Swag Bag'],
    },
    {
      id: 'kit-standard',
      name: 'Essential Launch Starter Kit',
      price: 49.00,
      includedProductsCount: 4,
      active: true,
      description: 'Ideal starter inventory to host initial home reveal parties and unboxing live streams.',
      sampleItems: ['Cash Candle (1x)', 'Surprise Ring Candle (1x)', 'Bath Bomb Cash (2x)', 'Quickstart Digital Guide'],
    },
  ],
  emailProvider: 'sendgrid',
  emailSenderName: 'ILoveSurprises Customer Experience',
  emailSenderAddress: 'support@ilovesurprises.com',
  emailApiKeyConfigured: true,
  emailTemplates: [
    { id: 'tpl-1', name: 'Order Confirmation & Tracking', subject: 'Your Surprise is on the way! [Order #{{orderId}}]', trigger: 'order_placed', active: true },
    { id: 'tpl-2', name: 'Representative Welcome & Store Link', subject: 'Welcome to the Team! Here is your 20% Rep Store Link', trigger: 'rep_approved', active: true },
    { id: 'tpl-3', name: 'Commission Approved Notice', subject: 'Cha-ching! You just earned ${{amount}} commission', trigger: 'commission_approved', active: true },
    { id: 'tpl-4', name: 'Membership Renewal Receipt', subject: 'Your Representative Membership Renewal Receipt', trigger: 'membership_renewed', active: true },
    { id: 'tpl-5', name: 'Payment Past Due Alert', subject: 'Action Required: Update your billing method to keep rep privileges', trigger: 'payment_failed', active: true },
  ],
  gateways: {
    stripe: { enabled: true, testMode: false, webhookHealthy: true },
    paypal: { enabled: true, sandbox: false, webhookHealthy: true },
    applePay: { enabled: true },
  },
  siteContent: {
    announcementText: '✨ FREE EXPRESS SHIPPING OVER $50 • GUARANTEED REAL SURPRISE INSIDE EVERY ORDER ✨',
    announcementActive: true,
    promoBannerText: 'VIP Reveal Club: Save 15% with code SURPRISE15 at checkout',
    promoBannerActive: true,
    vipPerkText: 'Up to $7,500 Cash & Fine Diamond Jewelry Hidden in Hand-Poured USA Soy Candles',
  },
};

export const adminService = {
  getCurrentRole(): AdminRole {
    if (typeof window === 'undefined') return 'super_admin';
    try {
      const stored = localStorage.getItem(ADMIN_ROLE_KEY);
      if (stored && stored in ADMIN_ROLES_CONFIG) {
        return stored as AdminRole;
      }
      return 'super_admin';
    } catch {
      return 'super_admin';
    }
  },

  setCurrentRole(role: AdminRole): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_ROLE_KEY, role);
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to set admin role', err);
      }
    }
  },

  getRoleDefinitions(): Record<AdminRole, AdminRoleDefinition> {
    if (typeof window === 'undefined') return ADMIN_ROLES_CONFIG;
    try {
      const stored = localStorage.getItem(ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY);
      if (stored) {
        const overrides = JSON.parse(stored);
        return {
          ...ADMIN_ROLES_CONFIG,
          ...overrides,
        };
      }
    } catch {
      // fallback
    }
    return ADMIN_ROLES_CONFIG;
  },

  updateRolePermissions(role: AdminRole, allowedTabs: AdminTab[], canEdit?: boolean): Record<AdminRole, AdminRoleDefinition> {
    if (typeof window !== 'undefined') {
      try {
        const currentDefs = this.getRoleDefinitions();
        const updated: Record<AdminRole, AdminRoleDefinition> = {
          ...currentDefs,
          [role]: {
            ...currentDefs[role],
            allowedTabs,
            canEdit: canEdit !== undefined ? canEdit : currentDefs[role].canEdit,
          },
        };
        localStorage.setItem(ADMIN_ROLES_PERMISSIONS_OVERRIDE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
        return updated;
      } catch (err) {
        console.error('Failed to save role permissions', err);
      }
    }
    return this.getRoleDefinitions();
  },

  hasTabAccess(tab: AdminTab, role?: AdminRole): boolean {
    const currentRole = role || this.getCurrentRole();
    const config = this.getRoleDefinitions()[currentRole];
    return config ? config.allowedTabs.includes(tab) : false;
  },

  getKPIs(): AdminKPIs {
    const reps = this.getRepresentatives();
    const activeReps = reps.filter((r) => r.status === 'active').length;
    const commissions = this.getCommissionLedger();
    const pendingLiability = commissions
      .filter((c) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalPaid = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    const memberships = this.getMemberships();
    const activeMemberships = memberships.filter((m) => m.status === 'active').length;
    const mrr = memberships
      .filter((m) => m.status === 'active')
      .reduce((sum, m) => sum + (m.price || 19.99), 0);

    const customers = this.getCustomers();

    let totalOrders = 0;
    let grossRevenue = 0;
    try {
      if (typeof window !== 'undefined') {
        const storedOrders = localStorage.getItem('ilovesurprises_orders_v1');
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed)) {
            totalOrders = parsed.length;
            grossRevenue = parsed.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
          }
        }
      }
    } catch {
      // fallback
    }

    const averageOrderValue = totalOrders > 0 ? Number((grossRevenue / totalOrders).toFixed(2)) : 0;

    return {
      grossRevenue: Number(grossRevenue.toFixed(2)),
      grossRevenueMoM: 0,
      totalOrders,
      totalOrdersMoM: 0,
      totalCustomers: customers.length,
      totalCustomersMoM: 0,
      activeRepresentatives: activeReps,
      activeRepresentativesMoM: 0,
      activeMemberships,
      activeMembershipsMoM: 0,
      monthlyRecurringRevenue: Number(mrr.toFixed(2)),
      pendingCommissionLiability: Number(pendingLiability.toFixed(2)),
      totalCommissionsPaid: Number(totalPaid.toFixed(2)),
      averageOrderValue,
    };
  },

  async fetchKPIs(): Promise<AdminKPIs> {
    return this.getKPIs();
  },

  getRecentActivity(): AdminActivityItem[] {
    const activities: AdminActivityItem[] = [];
    try {
      if (typeof window !== 'undefined') {
        const storedOrders = localStorage.getItem('ilovesurprises_orders_v1');
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed)) {
            parsed.slice(0, 10).forEach((ord: any) => {
              activities.push({
                id: `act-${ord.id}`,
                timestamp: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-US') : 'Recent',
                type: 'order',
                title: `New Store Order #${ord.id}`,
                description: `Order placed for $${(Number(ord.total) || 0).toFixed(2)}`,
                badge: 'Order',
                badgeColor: 'bg-emerald-50 text-emerald-700',
                amount: Number(ord.total) || 0,
              });
            });
          }
        }
      }
    } catch {
      // fallback
    }
    return activities;
  },

  getRepresentatives(): RepresentativeAdminRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ADMIN_REPS_KEY);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  },

  async fetchRepresentatives(): Promise<RepresentativeAdminRecord[]> {
    return this.getRepresentatives();
  },

  updateRepresentativeStatus(id: string, status: RepStatus): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.status = status;
    if (status === 'suspended') {
      target.membershipStatus = 'suspended';
    } else if (status === 'active') {
      target.membershipStatus = 'active';
    } else if (status === 'past_due') {
      target.membershipStatus = 'past_due';
    }
    this.saveRepresentatives(list);
    return true;
  },

  approveRepresentative(id: string): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.approvalStatus = 'approved';
    target.status = 'active';
    target.currentRank = 'VIP Partner';
    this.saveRepresentatives(list);
    return true;
  },

  rejectRepresentative(id: string): boolean {
    const list = this.getRepresentatives();
    const target = list.find((r) => r.id === id);
    if (!target) return false;
    target.approvalStatus = 'rejected';
    target.status = 'suspended';
    this.saveRepresentatives(list);
    return true;
  },

  saveRepresentatives(data: RepresentativeAdminRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_REPS_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save reps', err);
      }
    }
  },

  getMemberships(): MembershipAdminRecord[] {
    if (typeof window === 'undefined') return INITIAL_MEMBERSHIPS;
    try {
      const stored = localStorage.getItem(ADMIN_MEMBERSHIPS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(INITIAL_MEMBERSHIPS));
      return INITIAL_MEMBERSHIPS;
    } catch {
      return INITIAL_MEMBERSHIPS;
    }
  },

  updateMembershipStatus(id: string, status: 'active' | 'past_due' | 'suspended' | 'cancelled'): boolean {
    const list = this.getMemberships();
    const target = list.find((m) => m.id === id);
    if (!target) return false;
    target.status = status;
    if (status === 'active') target.paymentStatus = 'paid';
    if (status === 'past_due') target.paymentStatus = 'failed';
    this.saveMemberships(list);
    return true;
  },

  saveMemberships(data: MembershipAdminRecord[]): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_MEMBERSHIPS_KEY, JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save memberships', err);
      }
    }
  },

  getCommerceProducts(): AdminProductItem[] {
    const base: AdminProductItem[] = productsData.map((p, idx) => ({
      id: p.id,
      name: p.name,
      sku: `ILS-SKU-${p.id.slice(0, 4).toUpperCase()}`,
      category: p.category,
      price: p.price,
      originalPrice: p.originalPrice,
      description: p.description,
      stock: 35 + (idx * 17) % 65,
      lowStockThreshold: 15,
      surpriseType: p.surpriseType,
      surpriseValue: p.surpriseValue,
      image: p.image,
      rating: p.rating,
      reviewCount: p.reviewCount,
      status: (p.inStock ? 'active' : 'draft') as 'active' | 'draft' | 'archived',
      isBestSeller: p.isBestSeller,
    }));

    if (typeof window === 'undefined') return base;

    try {
      const stored = localStorage.getItem(ADMIN_PRODUCTS_OVERRIDE_KEY);
      if (stored) {
        const overrides: AdminProductItem[] = JSON.parse(stored);
        if (Array.isArray(overrides) && overrides.length > 0) {
          return overrides;
        }
      }
    } catch {
      // ignore
    }

    return base;
  },

  async fetchCommerceProducts(): Promise<AdminProductItem[]> {
    return this.getCommerceProducts();
  },

  async createProduct(data: Partial<AdminProductItem>): Promise<AdminProductItem> {
    const products = this.getCommerceProducts();
    const id = data.id || `prod_${Date.now().toString(36)}`;
    const matchedCategory =
      categoriesData.find((c) => c.name.toLowerCase() === (data.category || '').toLowerCase()) ||
      categoriesData[1];

    const newProduct: AdminProductItem = {
      id,
      name: data.name || 'New Surprise Candle',
      sku: data.sku || `ILS-SKU-${Date.now().toString().slice(-4)}`,
      category: matchedCategory.name,
      price: Number(data.price) || 29.99,
      originalPrice: data.originalPrice ? Number(data.originalPrice) : undefined,
      description: data.description || undefined,
      stock: Number(data.stock) || 50,
      lowStockThreshold: Number(data.lowStockThreshold) || 15,
      surpriseType: data.surpriseType || 'cash',
      surpriseValue: data.surpriseValue || '$100 Cash Prize',
      image: data.image || matchedCategory.image,
      rating: 5.0,
      reviewCount: 0,
      status: (data.status as any) || 'active',
      isBestSeller: Boolean(data.isBestSeller),
    };

    const updated = [newProduct, ...products];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_PRODUCTS_OVERRIDE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
        window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
      } catch (err) {
        console.error('Failed to save product override', err);
      }
    }

    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<AdminProductItem>): Promise<boolean> {
    const products = this.getCommerceProducts();
    const targetIdx = products.findIndex((p) => p.id === id);
    if (targetIdx === -1) return false;

    const matchedCat = updates.category
      ? categoriesData.find((c) => c.name.toLowerCase() === updates.category!.toLowerCase()) ||
        categoriesData[0]
      : undefined;

    const updatedItem: AdminProductItem = {
      ...products[targetIdx],
      ...updates,
      category: matchedCat ? matchedCat.name : updates.category || products[targetIdx].category,
    };

    products[targetIdx] = updatedItem;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_PRODUCTS_OVERRIDE_KEY, JSON.stringify(products));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
        window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
      } catch (err) {
        console.error('Failed to update product', err);
      }
    }

    return true;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const products = this.getCommerceProducts();
    const filtered = products.filter((p) => p.id !== id);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_PRODUCTS_OVERRIDE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
        window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
      } catch (err) {
        console.error('Failed to delete product', err);
      }
    }

    return true;
  },

  async toggleProductStatus(id: string): Promise<boolean> {
    const products = this.getCommerceProducts();
    const item = products.find((p) => p.id === id);
    if (!item) return false;
    const newStatus = item.status === 'active' ? 'draft' : 'active';
    return this.updateProduct(id, { status: newStatus });
  },

  getCollections(): AdminCollectionItem[] {
    const base: AdminCollectionItem[] = categoriesData.map((c, idx) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c.itemCount,
      featured: !!c.featured,
      orderIndex: idx + 1,
      image: c.image,
      tagline: c.tagline,
    }));

    if (typeof window === 'undefined') return base;

    try {
      const stored = localStorage.getItem(ADMIN_COLLECTIONS_OVERRIDE_KEY);
      if (stored) {
        const overrides: AdminCollectionItem[] = JSON.parse(stored);
        if (Array.isArray(overrides) && overrides.length > 0) {
          return overrides.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
        }
      }
    } catch {
      // ignore
    }

    return base.sort((a, b) => (a.orderIndex || 99) - (b.orderIndex || 99));
  },

  updateCollectionOrdering(id: string, direction: 'up' | 'down'): AdminCollectionItem[] {
    const list = this.getCollections();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return list;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return list;

    // Swap positions and orderIndexes
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    list.forEach((item, index) => {
      item.orderIndex = index + 1;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update collection order', err);
      }
    }
    return list;
  },

  async assignProductToCollection(productId: string, categoryNameOrId: string): Promise<boolean> {
    const matchedCategory =
      categoriesData.find(
        (c) =>
          c.id === categoryNameOrId ||
          c.name.toLowerCase() === categoryNameOrId.toLowerCase()
      ) || categoriesData[0];

    // Update in local product override
    await this.updateProduct(productId, { category: matchedCategory.name });

    // Local storage persistence

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      window.dispatchEvent(new CustomEvent('ils_catalog_updated'));
    }
    return true;
  },

  async removeProductFromCollection(productId: string): Promise<boolean> {
    const defaultCategory = categoriesData[0];
    return this.assignProductToCollection(productId, defaultCategory.id);
  },

  getProductsByCollection(categoryNameOrId: string): AdminProductItem[] {
    const products = this.getCommerceProducts();
    const catLower = categoryNameOrId.toLowerCase().trim();
    return products.filter(
      (p) =>
        p.category.toLowerCase() === catLower ||
        (catLower.includes('zodiac') && p.name.toLowerCase().includes('zodiac'))
    );
  },

  async createCollection(col: Partial<AdminCollectionItem>): Promise<AdminCollectionItem> {
    const list = this.getCollections();
    const slug =
      col.slug || (col.name || 'new-collection').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const id = col.id || `cat-${slug}`;

    const newCol: AdminCollectionItem = {
      id,
      name: col.name || 'New Collection',
      slug,
      tagline: col.tagline || 'Curated surprise collection',
      productCount: 0,
      featured: Boolean(col.featured),
      orderIndex: list.length + 1,
      image: col.image || '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
    };

    const updated = [...list, newCol];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to create collection override', err);
      }
    }

    return newCol;
  },

  async updateCollection(id: string, updates: Partial<AdminCollectionItem>): Promise<boolean> {
    const list = this.getCollections();
    const idx = list.findIndex((c) => c.id === id);
    if (idx === -1) return false;

    list[idx] = { ...list[idx], ...updates };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update collection', err);
      }
    }

    return true;
  },

  async deleteCollection(id: string): Promise<boolean> {
    const list = this.getCollections();
    const filtered = list.filter((c) => c.id !== id);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COLLECTIONS_OVERRIDE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to delete collection', err);
      }
    }

    return true;
  },

  async toggleCollectionFeatured(id: string): Promise<boolean> {
    const list = this.getCollections();
    const item = list.find((c) => c.id === id);
    if (!item) return false;
    return this.updateCollection(id, { featured: !item.featured });
  },

  async getCommerceOrders(): Promise<AdminOrderItem[]> {

    // Check local storage orders
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ilovesurprises_orders_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((o: any) => ({
              id: o.id,
              orderNumber: o.id.startsWith('ILS-') ? o.id : `ILS-${o.id.slice(0, 6).toUpperCase()}`,
              customerName: o.shippingAddress?.fullName || 'Valued Customer',
              customerEmail: o.shippingAddress?.email || 'customer@order.com',
              total: Number(o.total) || 0,
              status: (o.status as any) || 'processing',
              paymentStatus: (o.paymentSummary?.method ? 'paid' : 'pending') as any,
              itemCount: o.items?.length || 1,
              itemsSummary: o.items?.map((i: any) => `${i.product?.name || 'Item'} (x${i.quantity})`).join(', ') || '1 item revealed',
              createdAt: o.createdAt ? o.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            }));
          }
        }
      }
    } catch {
      // fallback
    }

    return [];
  },

  getCustomers(): AdminCustomerItem[] {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('ils_admin_customers_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        // Also check if any orders exist to extract customer info
        const storedOrders = localStorage.getItem('ilovesurprises_orders_v1');
        if (storedOrders) {
          const orders = JSON.parse(storedOrders);
          if (Array.isArray(orders)) {
            const customerMap = new Map<string, AdminCustomerItem>();
            orders.forEach((o: any) => {
              const email = o.shippingAddress?.email?.toLowerCase().trim();
              if (email) {
                if (!customerMap.has(email)) {
                  customerMap.set(email, {
                    id: `cust-${email}`,
                    name: o.shippingAddress?.fullName || 'Customer',
                    email,
                    phone: o.shippingAddress?.phone || 'N/A',
                    ordersCount: 1,
                    totalSpent: Number(o.total) || 0,
                    lastOrderDate: o.createdAt ? o.createdAt.split('T')[0] : 'N/A',
                    repReferredBy: o.attributedRep?.repUsername,
                    status: 'active',
                  });
                } else {
                  const existing = customerMap.get(email)!;
                  existing.ordersCount += 1;
                  existing.totalSpent += Number(o.total) || 0;
                }
              }
            });
            return Array.from(customerMap.values());
          }
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  async fetchCustomers(): Promise<AdminCustomerItem[]> {
    return this.getCustomers();
  },

  getRefunds(): AdminRefundRecord[] {
    if (typeof window === 'undefined') return INITIAL_REFUNDS;
    try {
      const stored = localStorage.getItem(ADMIN_REFUNDS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(INITIAL_REFUNDS));
      return INITIAL_REFUNDS;
    } catch {
      return INITIAL_REFUNDS;
    }
  },

  processRefund(record: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>): AdminRefundRecord {
    const refunds = this.getRefunds();
    const newRecord: AdminRefundRecord = {
      ...record,
      id: `ref-${Date.now().toString().slice(-4)}`,
      requestedAt: new Date().toISOString().split('T')[0],
      status: 'completed',
    };
    const updated = [newRecord, ...refunds];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_REFUNDS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save refund', err);
      }
    }
    return newRecord;
  },

  getDiscounts(): AdminDiscountCode[] {
    if (typeof window === 'undefined') return INITIAL_DISCOUNTS;
    try {
      const stored = localStorage.getItem(ADMIN_DISCOUNTS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(INITIAL_DISCOUNTS));
      return INITIAL_DISCOUNTS;
    } catch {
      return INITIAL_DISCOUNTS;
    }
  },

  createDiscount(discount: Omit<AdminDiscountCode, 'id' | 'usageCount'>): AdminDiscountCode {
    const list = this.getDiscounts();
    const newDisc: AdminDiscountCode = {
      ...discount,
      id: `disc-${Date.now().toString().slice(-4)}`,
      usageCount: 0,
    };
    const updated = [newDisc, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_DISCOUNTS_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to create discount', err);
      }
    }
    return newDisc;
  },

  getCommissionLedger(): AdminCommissionRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ADMIN_COMMISSIONS_KEY);
      if (stored) return JSON.parse(stored);
      return [];
    } catch {
      return [];
    }
  },

  async fetchCommissions(): Promise<AdminCommissionRecord[]> {
    return this.getCommissionLedger();
  },

  updateCommissionStatus(id: string, status: CommissionLedgerStatus): boolean {
    const list = this.getCommissionLedger();
    const target = list.find((c) => c.id === id);
    if (!target) return false;
    target.status = status;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COMMISSIONS_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update commission status', err);
      }
    }
    return true;
  },

  batchApproveCommissions(): number {
    const list = this.getCommissionLedger();
    let count = 0;
    for (const item of list) {
      if (item.status === 'pending') {
        item.status = 'approved';
        count++;
      }
    }
    if (count > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_COMMISSIONS_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to batch approve', err);
      }
    }
    return count;
  },

  getReportsData(timeframe: '7d' | '30d' | '90d' | 'ytd' = '30d'): AdminReportData {
    let grossSales = 0;
    let ordersCount = 0;
    try {
      if (typeof window !== 'undefined') {
        const storedOrders = localStorage.getItem('ilovesurprises_orders_v1');
        if (storedOrders) {
          const parsed = JSON.parse(storedOrders);
          if (Array.isArray(parsed)) {
            ordersCount = parsed.length;
            grossSales = parsed.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0);
          }
        }
      }
    } catch {
      // fallback
    }

    const netSales = grossSales;
    const aov = ordersCount > 0 ? Number((grossSales / ordersCount).toFixed(2)) : 0;
    const reps = this.getRepresentatives();
    const activeReps = reps.filter((r) => r.status === 'active').length;
    const commissions = this.getCommissionLedger();
    const pendingLiability = commissions
      .filter((c) => c.status === 'pending' || c.status === 'approved')
      .reduce((sum, c) => sum + c.commissionAmount, 0);
    const totalPaid = commissions
      .filter((c) => c.status === 'paid')
      .reduce((sum, c) => sum + c.commissionAmount, 0);

    return {
      timeframe,
      grossSales: Number(grossSales.toFixed(2)),
      netSales: Number(netSales.toFixed(2)),
      ordersCount,
      averageOrderValue: aov,
      visitors: 0,
      conversionRate: 0,
      activeRepresentatives: activeReps,
      membershipMRR: 0,
      commissionLiability: Number(pendingLiability.toFixed(2)),
      totalPayoutsDisbursed: Number(totalPaid.toFixed(2)),
      salesByDay: [],
      trafficByDay: [],
      tierDistribution: [],
      membershipBreakdown: [],
    };
  },

  getSettings(): AdminSettingsData {
    if (typeof window === 'undefined') return INITIAL_SETTINGS;
    try {
      const stored = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  },

  saveSettings(settings: AdminSettingsData): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(settings));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save settings', err);
      }
    }
  },

  // Homepage Content Management
  getHomepageContent(): HomepageContentConfig {
    const DEFAULT_CONTENT: HomepageContentConfig = {
      announcementText: '⚡ FREE SHIPPING ON SURPRISE CANDLE ORDERS OVER $50 + REAL CASH PRIZES IN EVERY CANDLE!',
      announcementActive: true,
      announcementLink: '/shop',
      promoBannerText: 'Use code SURPRISE15 at checkout for 15% OFF your first surprise candle reveal!',
      promoBannerCode: 'SURPRISE15',
      promoBannerActive: true,
      featuredCards: [
        {
          id: 'halloween',
          title: 'Halloween',
          categoryKey: 'Halloween',
          badge: 'Holiday Priority',
          tagline: 'Limited-edition Halloween reveal candles & bath treats with cash and jewelry inside',
          ctaText: 'Shop Halloween Collection',
          image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/4_Mockup_Jewelry_JewelryCandles_37b9e8df-fc51-4b27-9db3-6236ee9d84b6.jpg?v=1602742369',
          itemCount: 83,
          accentBorder: 'hover:border-orange-500',
          active: true,
        },
        {
          id: 'christmas-candles-1',
          title: 'Christmas',
          categoryKey: 'Christmas Candles',
          badge: 'Holiday Priority',
          tagline: 'Magical Christmas reveal candles and seasonal celebration scents with hidden treasures',
          ctaText: 'Shop Christmas Collection',
          image: 'https://cdn.shopify.com/s/files/1/0172/4672/products/1_Mockup_Jewelry_Jewelry_Candles_9c1f97ea-399f-403a-ae64-3f3afc816a87.jpg?v=1573149158',
          itemCount: 98,
          accentBorder: 'hover:border-red-500',
          active: true,
        },
        {
          id: 'cash-candles',
          title: 'Cash Candles',
          categoryKey: 'Cash Candles',
          badge: 'Win Up To $2,500',
          tagline: 'Real cash prizes ($2 – $2,500) hidden inside every single candle',
          ctaText: 'Shop Cash Candles',
          image: '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
          itemCount: 495,
          accentBorder: 'hover:border-emerald-400',
          active: true,
        },
        {
          id: 'zodiac-cash-money-candles',
          title: 'Zodiac Cash Candles',
          categoryKey: 'ZODIAC CASH MONEY CANDLES',
          badge: 'Real Cash Inside',
          tagline: 'Astrology horoscope cash candles with real money prizes up to $2,500',
          ctaText: 'Shop Zodiac Cash Candles',
          image: '/assets/ilovesurprises/categories/AQUARIUSZODIACCANDLE.webp',
          itemCount: 12,
          accentBorder: 'hover:border-purple-500',
          active: true,
        },
      ],
    };

    if (typeof window === 'undefined') return DEFAULT_CONTENT;
    try {
      const stored = localStorage.getItem(ADMIN_HOMEPAGE_CONTENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hasHalloween = parsed.featuredCards?.some((c: any) => c.id === 'halloween');
        const hasChristmas = parsed.featuredCards?.some((c: any) => c.id === 'christmas-candles-1');
        const hasCash = parsed.featuredCards?.some((c: any) => c.id === 'cash-candles');
        const hasZodiac = parsed.featuredCards?.some((c: any) => c.id === 'zodiac-cash-money-candles');
        const hasObsolete = parsed.featuredCards?.some((c: any) => c.id === 'trending-collection');
        if (hasHalloween && hasChristmas && hasCash && hasZodiac && !hasObsolete) {
          return parsed;
        }
      }
      localStorage.setItem(ADMIN_HOMEPAGE_CONTENT_KEY, JSON.stringify(DEFAULT_CONTENT));
      return DEFAULT_CONTENT;
    } catch {
      return DEFAULT_CONTENT;
    }
  },

  saveHomepageContent(content: HomepageContentConfig): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_HOMEPAGE_CONTENT_KEY, JSON.stringify(content));
        window.dispatchEvent(new CustomEvent('ils_homepage_content_updated'));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to save homepage content', err);
      }
    }
  },

  resetHomepageContent(): HomepageContentConfig {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ADMIN_HOMEPAGE_CONTENT_KEY);
      } catch {
        // ignore
      }
    }
    const def = this.getHomepageContent();
    window.dispatchEvent(new CustomEvent('ils_homepage_content_updated'));
    window.dispatchEvent(new CustomEvent('ils_admin_updated'));
    return def;
  },

  // Staff Administration (Super Admin / Manager RBAC)
  async getStaffAdmins(): Promise<AdminStaffUser[]> {
    const defaultStaff: AdminStaffUser[] = [
      {
        id: 'staff-primary-admin',
        email: 'ilovesurprises.admin@gmail.com',
        name: 'Harsha (Founder & Admin)',
        role: 'super_admin',
        avatarUrl: '/assets/ilovesurprises/avatars/founder.png',
        lastActive: 'Just now',
        createdAt: '2026-09-08T11:03:23Z',
      },
      {
        id: 'staff-store-mgr',
        email: 'manager@ilovesurprises-live.com',
        name: 'Store Operations Manager',
        role: 'store_manager',
        avatarUrl: '/assets/ilovesurprises/avatars/manager.png',
        lastActive: '2 hours ago',
        createdAt: '2026-09-09T14:00:00Z',
      },
      {
        id: 'staff-affiliate-dir',
        email: 'affiliates@ilovesurprises-live.com',
        name: 'Affiliate & Rep Director',
        role: 'affiliate_manager',
        avatarUrl: '/assets/ilovesurprises/avatars/affiliate-lead.png',
        lastActive: 'Yesterday',
        createdAt: '2026-09-10T09:30:00Z',
      },
      {
        id: 'staff-support-lead',
        email: 'support@ilovesurprises-live.com',
        name: 'Customer Support Lead',
        role: 'support_rep',
        avatarUrl: '/assets/ilovesurprises/avatars/support.png',
        lastActive: '3 hours ago',
        createdAt: '2026-09-10T12:00:00Z',
      },
    ];

    try {
      // Check stored role overrides
      let overrides: Record<string, AdminRole> = {};
      try {
        const storedOverrides = localStorage.getItem(ADMIN_STAFF_OVERRIDE_KEY);
        if (storedOverrides) overrides = JSON.parse(storedOverrides);
      } catch {
        // ignore
      }

      return defaultStaff.map((p) => {
        let assignedRole: AdminRole = p.role;
        if (overrides[p.id]) {
          assignedRole = overrides[p.id];
        }

        return {
          ...p,
          role: assignedRole,
        };
      });
    } catch {
      return defaultStaff;
    }
  },

  async updateStaffRole(staffId: string, newRole: AdminRole): Promise<void> {
    if (typeof window !== 'undefined') {
      try {
        let overrides: Record<string, AdminRole> = {};
        const stored = localStorage.getItem(ADMIN_STAFF_OVERRIDE_KEY);
        if (stored) overrides = JSON.parse(stored);
        overrides[staffId] = newRole;
        localStorage.setItem(ADMIN_STAFF_OVERRIDE_KEY, JSON.stringify(overrides));
        window.dispatchEvent(new CustomEvent('ils_admin_updated'));
      } catch (err) {
        console.error('Failed to update staff role', err);
      }
    }
  },
};
