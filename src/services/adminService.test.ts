import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  adminService,
  ADMIN_FEATURE_AVAILABILITY,
  mapBackendProductToAdmin,
  mapBackendUserToCustomer,
  mapBackendLedgerEntry,
  mergeStorefrontIntoHomepageContent,
  purgeRetiredLocalAdminData,
  type BackendProduct,
} from './adminService';
import { cmsService } from './cmsService';
import { setStoredAuthToken } from './apiClient';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function backendProduct(overrides: Partial<BackendProduct> = {}): BackendProduct {
  return {
    id: 'prod_1',
    name: 'Zodiac Cash Candle',
    slug: 'zodiac-cash-candle',
    shortDescription: 'A candle',
    description: 'Full description',
    price: 39.99,
    compareAtPrice: 59.99,
    imageUrl: 'https://cdn.example.com/a.jpg',
    images: ['https://cdn.example.com/a.jpg'],
    categoryId: null,
    categoryName: 'Cash Candles',
    badge: null,
    rating: 4.8,
    reviewCount: 120,
    stock: 42,
    inStock: true,
    lowStockThreshold: 5,
    sku: 'ILS-ZC-1',
    isBestSeller: true,
    isNew: false,
    status: 'ACTIVE',
    ...overrides,
  };
}

describe('adminService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setStoredAuthToken('admin-tok');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('feature availability', () => {
    it('marks endpoint-backed features as connected', () => {
      expect(ADMIN_FEATURE_AVAILABILITY.products).toBe(true);
      expect(ADMIN_FEATURE_AVAILABILITY.users).toBe(true);
      expect(ADMIN_FEATURE_AVAILABILITY.analytics).toBe(true);
      expect(ADMIN_FEATURE_AVAILABILITY.commissionLedger).toBe(true);
      expect(ADMIN_FEATURE_AVAILABILITY.storefrontContent).toBe(true);
    });

    it('marks features with no backend endpoint as unavailable', () => {
      expect(ADMIN_FEATURE_AVAILABILITY.orders).toBe(false);
      expect(ADMIN_FEATURE_AVAILABILITY.collectionsCrud).toBe(false);
      expect(ADMIN_FEATURE_AVAILABILITY.inventoryLog).toBe(false);
      expect(ADMIN_FEATURE_AVAILABILITY.storeSettings).toBe(false);
      expect(ADMIN_FEATURE_AVAILABILITY.memberships).toBe(false);
    });
  });

  describe('single source of truth', () => {
    it('returns nothing synchronously for server-owned collections', () => {
      expect(adminService.getCommerceProducts()).toEqual([]);
      expect(adminService.getCustomers()).toEqual([]);
      expect(adminService.getRepresentatives()).toEqual([]);
      expect(adminService.getCommissionLedger()).toEqual([]);
      expect(adminService.getRecentActivity()).toEqual([]);
    });

    it('reports zeroed placeholder KPIs, not figures from storage', () => {
      // A previous build computed revenue from localStorage orders.
      localStorage.setItem(
        'ilovesurprises_orders_v1',
        JSON.stringify([{ id: 'x', total: 999 }])
      );

      const kpis = adminService.getKPIs();
      expect(kpis.grossRevenue).toBe(0);
      expect(kpis.totalOrders).toBe(0);
      expect(adminService.getReportsData().grossSales).toBe(0);
    });

    it('purges retired local override keys', () => {
      localStorage.setItem('ils_admin_products_override_v1', '[{"id":"stale"}]');
      localStorage.setItem('ils_admin_commissions_v1', '[{"id":"stale"}]');

      purgeRetiredLocalAdminData();
      expect(localStorage.getItem('ils_admin_products_override_v1')).toBeNull();
      expect(localStorage.getItem('ils_admin_commissions_v1')).toBeNull();
    });
  });

  describe('product mapping', () => {
    it('maps a backend product to the admin row', () => {
      const item = mapBackendProductToAdmin(backendProduct());

      expect(item.id).toBe('prod_1');
      expect(item.price).toBe(39.99);
      expect(item.originalPrice).toBe(59.99);
      expect(item.stock).toBe(42);
      expect(item.status).toBe('active');
      expect(item.category).toBe('Cash Candles');
      expect(item.isBestSeller).toBe(true);
    });

    it('maps DRAFT and ARCHIVED statuses', () => {
      expect(mapBackendProductToAdmin(backendProduct({ status: 'DRAFT' })).status).toBe('draft');
      expect(
        mapBackendProductToAdmin(backendProduct({ status: 'ARCHIVED' })).status
      ).toBe('archived');
    });
  });

  describe('product CRUD', () => {
    it('creates a product through the admin endpoint and returns the saved record', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: { product: backendProduct({ name: 'Saved Name' }) },
        })
      );

      const created = await adminService.createProduct({
        name: 'Typed Name',
        price: 39.99,
      });

      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/admin/products');
      expect(fetchMock.mock.calls[0][1].method).toBe('POST');
      // The returned record reflects the server, not the submitted form.
      expect(created.name).toBe('Saved Name');
    });

    it('throws on a rejected create instead of reporting success', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse(
          {
            status: 'error',
            message: 'Validation failed',
            errors: [{ field: 'body.price', message: 'Price must be positive' }],
          },
          400
        )
      );

      await expect(
        adminService.createProduct({ name: 'Thing', price: 10 })
      ).rejects.toMatchObject({ kind: 'validation' });
    });

    it('rejects a create with an invalid price before calling the API', async () => {
      await expect(
        adminService.createProduct({ name: 'Thing', price: 0 })
      ).rejects.toThrow(/greater than zero/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects a create with too short a name before calling the API', async () => {
      await expect(
        adminService.createProduct({ name: 'A', price: 10 })
      ).rejects.toThrow(/at least 2 characters/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('throws on a 403 update rather than writing locally', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse(
          { status: 'error', message: 'Forbidden: Insufficient permissions' },
          403
        )
      );

      await expect(
        adminService.updateProduct('prod_1', { price: 49.99 })
      ).rejects.toMatchObject({ kind: 'forbidden' });

      expect(localStorage.getItem('ils_admin_products_override_v1')).toBeNull();
    });

    it('rejects a relative image path with an actionable message', async () => {
      // The backend validates imageUrl with z.string().url().
      await expect(
        adminService.updateProduct('prod_1', { image: 'assets/local.png' })
      ).rejects.toThrow(/absolute URLs/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('walks pagination when loading the catalogue', async () => {
      fetchMock.mockImplementation((url: string) => {
        const page = Number(new URL(url, 'http://x').searchParams.get('page'));
        return jsonResponse({
          status: 'success',
          data: {
            products: [backendProduct({ id: `p${page}` })],
            pagination: { total: 2, page, limit: 100, totalPages: 2 },
          },
        });
      });

      const products = await adminService.fetchCommerceProducts();
      expect(products.map((p) => p.id)).toEqual(['p1', 'p2']);
    });
  });

  describe('users and roles', () => {
    it('maps a backend user without inventing order history', () => {
      const customer = mapBackendUserToCustomer({
        id: 'usr_1',
        email: 'person@example.com',
        firstName: 'Alex',
        lastName: 'Doe',
        role: 'CUSTOMER',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });

      expect(customer.name).toBe('Alex Doe');
      expect(customer.status).toBe('active');
      // No orders endpoint exists, so these are reported as unavailable.
      expect(customer.ordersCount).toBe(0);
      expect(customer.totalSpent).toBe(0);
      expect(customer.lastOrderDate).toBe('');
    });

    it('changes a role through the real endpoint', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: {
            user: {
              id: 'usr_1',
              email: 'person@example.com',
              firstName: 'Alex',
              lastName: 'Doe',
              role: 'AFFILIATE',
              isActive: true,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:00.000Z',
            },
          },
        })
      );

      const user = await adminService.updateUserRole('usr_1', 'AFFILIATE');

      expect(String(fetchMock.mock.calls[0][0])).toContain(
        '/api/admin/users/usr_1/role'
      );
      expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
      expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
        role: 'AFFILIATE',
      });
      expect(user.role).toBe('AFFILIATE');
    });

    it('does not write role overrides to localStorage', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'error', message: 'Forbidden' }, 403)
      );

      await adminService.updateUserRole('usr_1', 'ADMIN').catch(() => {});
      expect(localStorage.getItem('ils_admin_staff_override_v1')).toBeNull();
    });
  });

  describe('commission ledger', () => {
    it('reads the ledger from the admin endpoint', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: {
            items: [
              {
                id: 'led_1',
                representative: {
                  id: 'aff_1',
                  username: 'jamie',
                  fullName: 'Jamie Lee',
                  email: 'jamie@example.com',
                  status: 'active',
                },
                orderAndCustomer: {
                  orderId: 'ord_1',
                  orderNumber: 'ILS-1001',
                  customerName: 'Alex Doe',
                  customerEmail: 'alex@example.com',
                  orderDate: '2026-10-01T00:00:00.000Z',
                },
                tierLevel: { level: 1, name: 'Tier 1 Sponsor', ratePercent: 5 },
                orderVolume: 100,
                commissionEarned: {
                  rate: 0.05,
                  amountUsd: 5,
                  formattedAmount: '$5.00',
                },
                status: 'PENDING',
                availableAt: '2026-11-01T00:00:00.000Z',
                ruleVersion: 'v1',
                parentLedgerId: null,
                note: null,
                createdAt: '2026-10-01T00:00:00.000Z',
              },
            ],
            pagination: { total: 1, page: 1, limit: 100, totalPages: 1 },
          },
        })
      );

      const records = await adminService.fetchCommissions();

      expect(String(fetchMock.mock.calls[0][0])).toContain(
        '/api/admin/commission/ledger'
      );
      expect(records).toHaveLength(1);
      expect(records[0].commissionAmount).toBe(5);
      expect(records[0].repName).toBe('Jamie Lee');
      expect(records[0].status).toBe('pending');
    });

    it('maps the selling representative tier from level 0', () => {
      const record = mapBackendLedgerEntry({
        id: 'led_2',
        representative: {
          id: 'aff_1',
          username: 'jamie',
          fullName: 'Jamie Lee',
          email: 'j@example.com',
          status: 'active',
        },
        orderAndCustomer: {
          orderId: 'o',
          orderNumber: 'ILS-2',
          customerName: 'C',
          customerEmail: 'c@example.com',
          orderDate: '2026-10-01T00:00:00.000Z',
        },
        tierLevel: { level: 0, name: 'Direct Sale', ratePercent: 20 },
        orderVolume: 50,
        commissionEarned: { rate: 0.2, amountUsd: 10, formattedAmount: '$10.00' },
        status: 'PAID',
        availableAt: '2026-10-01T00:00:00.000Z',
        ruleVersion: 'v1',
        parentLedgerId: null,
        note: null,
        createdAt: '2026-10-01T00:00:00.000Z',
      });

      expect(record.tier).toBe('selling_rep');
      expect(record.status).toBe('paid');
    });

    it('refuses to fake a ledger status change', async () => {
      await expect(
        adminService.updateCommissionStatus('led_1', 'approved')
      ).rejects.toThrow(/no endpoint/i);
      expect(localStorage.getItem('ils_admin_commissions_v1')).toBeNull();
    });

    it('refuses to fake a bulk approval', async () => {
      await expect(adminService.batchApproveCommissions()).rejects.toThrow(
        /no endpoint/i
      );
    });
  });

  describe('orders', () => {
    it('returns no orders rather than mock sales', async () => {
      await expect(adminService.getCommerceOrders()).resolves.toEqual([]);
    });
  });
});

describe('cmsService (storefront content)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    setStoredAuthToken('admin-tok');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const storefront = {
    showcaseCards: [
      {
        id: 'showcase-halloween',
        cardKey: 'halloween',
        displayTitle: 'Halloween Spooktacular',
        highlightBadge: 'Exclusive',
        tagline: 'Spooky candles',
        ctaButtonText: 'Shop Halloween',
        targetCategoryKey: 'Halloween',
        showcaseImageUri: 'https://cdn.example.com/h.png',
        displayOnHomepage: true,
        isActive: true,
        sortOrder: 2,
      },
      {
        id: 'showcase-xmas',
        cardKey: 'christmas-x',
        displayTitle: 'Christmas X',
        highlightBadge: 'Holiday',
        tagline: 'Festive',
        ctaButtonText: 'Shop Christmas',
        targetCategoryKey: 'Christmas',
        showcaseImageUri: 'https://cdn.example.com/x.png',
        displayOnHomepage: true,
        isActive: true,
        sortOrder: 1,
      },
    ],
    banners: {
      topStickyAnnouncementBar: {
        isActive: true,
        announcementCopy: 'Free shipping over $50',
      },
      promotionalDiscountAlertBar: {
        isActive: true,
        promoCopy: 'Save 15%',
        promoCode: 'SURPRISE15',
      },
    },
  };

  it('returns the API configuration sorted by sortOrder', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse({ status: 'success', data: storefront })
    );

    const config = await cmsService.getStorefront();
    expect(config.showcaseCards.map((c) => c.cardKey)).toEqual([
      'christmas-x',
      'halloween',
    ]);
  });

  it('does not fall back to mock content when the API fails', async () => {
    fetchMock.mockImplementation(() => {
      throw new TypeError('Failed to fetch');
    });

    await expect(cmsService.getStorefront()).rejects.toMatchObject({
      kind: 'network',
    });
  });

  it('writes no storefront mirror to localStorage', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse({ status: 'success', data: storefront })
    );

    await cmsService.getStorefront();
    expect(localStorage.getItem('ils_cms_storefront_v1')).toBeNull();
  });

  it('throws instead of reporting a successful banner save', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse(
        { status: 'error', message: 'Forbidden: Insufficient permissions' },
        403
      )
    );

    await expect(
      cmsService.updateBanners({
        topStickyAnnouncementBar: { announcementCopy: 'New copy' },
      })
    ).rejects.toMatchObject({ kind: 'forbidden' });

    expect(localStorage.getItem('ils_cms_storefront_v1')).toBeNull();
  });

  it('throws instead of reporting a successful showcase card save', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse({ status: 'error', message: 'Validation failed' }, 400)
    );

    await expect(
      cmsService.updateShowcaseCard('halloween', { displayTitle: 'X' })
    ).rejects.toBeTruthy();
  });

  it('rejects a data-URL showcase image the backend cannot store', async () => {
    await expect(
      cmsService.updateShowcaseCard('halloween', {
        showcaseImageUri: 'data:image/png;base64,AAAA',
      })
    ).rejects.toThrow(/absolute URL/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('patches a showcase card through the admin endpoint on success', async () => {
    fetchMock.mockImplementation(() =>
      jsonResponse({
        status: 'success',
        data: { showcaseCard: storefront.showcaseCards[0] },
      })
    );

    await cmsService.updateShowcaseCard('halloween', {
      displayTitle: 'Updated Title',
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain(
      '/api/admin/storefront/showcase/halloween'
    );
    expect(fetchMock.mock.calls[0][1].method).toBe('PATCH');
  });
});

describe('mergeStorefrontIntoHomepageContent', () => {
  const local = {
    announcementText: 'LOCAL ANNOUNCEMENT',
    announcementActive: false,
    promoBannerText: 'LOCAL PROMO',
    promoBannerCode: 'LOCAL',
    promoBannerActive: false,
    featuredCards: [
      {
        id: 'halloween',
        title: 'Local Halloween',
        categoryKey: 'Halloween',
        badge: 'Local',
        tagline: 'Local tagline',
        ctaText: 'Local CTA',
        image: '/local.png',
        itemCount: 83,
        accentBorder: 'hover:border-orange-500',
        active: true,
      },
    ],
    hero: { headline: 'Local hero' },
  } as never;

  const storefront = {
    showcaseCards: [
      {
        id: 'showcase-halloween',
        cardKey: 'halloween',
        displayTitle: 'Server Halloween',
        highlightBadge: 'Server Badge',
        tagline: 'Server tagline',
        ctaButtonText: 'Server CTA',
        targetCategoryKey: 'Halloween',
        showcaseImageUri: 'https://cdn.example.com/server.png',
        displayOnHomepage: true,
        isActive: true,
        sortOrder: 1,
      },
    ],
    banners: {
      topStickyAnnouncementBar: {
        isActive: true,
        announcementCopy: 'SERVER ANNOUNCEMENT',
      },
      promotionalDiscountAlertBar: {
        isActive: true,
        promoCopy: 'SERVER PROMO',
        promoCode: 'SERVER15',
      },
    },
  };

  it('lets the database win for backend-owned content', () => {
    const merged = mergeStorefrontIntoHomepageContent(local, storefront);

    expect(merged.announcementText).toBe('SERVER ANNOUNCEMENT');
    expect(merged.announcementActive).toBe(true);
    expect(merged.promoBannerText).toBe('SERVER PROMO');
    expect(merged.promoBannerCode).toBe('SERVER15');
    expect(merged.featuredCards[0].title).toBe('Server Halloween');
    expect(merged.featuredCards[0].image).toBe('https://cdn.example.com/server.png');
  });

  it('keeps presentation-only fields the backend does not model', () => {
    const merged = mergeStorefrontIntoHomepageContent(local, storefront);
    expect(merged.featuredCards[0].itemCount).toBe(83);
    expect(merged.featuredCards[0].accentBorder).toBe('hover:border-orange-500');
  });

  it('keeps sections the backend cannot store', () => {
    const merged = mergeStorefrontIntoHomepageContent(local, storefront);
    expect(merged.hero).toEqual({ headline: 'Local hero' });
  });

  it('respects a card hidden from the homepage', () => {
    const hidden = {
      ...storefront,
      showcaseCards: [
        { ...storefront.showcaseCards[0], displayOnHomepage: false },
      ],
    };
    expect(
      mergeStorefrontIntoHomepageContent(local, hidden).featuredCards[0].active
    ).toBe(false);
  });
});
