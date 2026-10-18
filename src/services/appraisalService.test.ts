import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  appraisalService,
  APPRAISALS_UPDATED_EVENT,
  APPRAISAL_SUBMISSIONS_UPDATED_EVENT,
} from './appraisalService';
import { apiClient } from './apiClient';

describe('appraisalService', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    localStorage.clear();
    apiClient.setAuthToken(null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function jsonResponse(data: any, status = 200): Response {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => data,
      text: async () => JSON.stringify(data),
    } as unknown as Response;
  }

  describe('lookupJewelryCode', () => {
    it('queries backend /api/appraisals/verify/:code for authentic certificates', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            code: 'ILS-TEST-123',
            name: 'Diamond Solitaire Ring',
            type: 'Ring',
            estimatedValue: 1200,
            image: '/test.jpg',
            material: '14k White Gold',
            stone: 'Diamond',
            serialNumber: 'CERT-123',
            inspectedDate: '2026-01-01',
          },
        })
      );

      const res = await appraisalService.lookupJewelryCode('ils-test-123');
      expect(fetchMock).toHaveBeenCalled();
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/appraisals/verify/ILS-TEST-123');
      expect(res.success).toBe(true);
      expect(res.data?.estimatedValue).toBe(1200);
      expect(res.data?.code).toBe('ILS-TEST-123');
    });

    it('validates empty code input without network request', async () => {
      const res = await appraisalService.lookupJewelryCode('');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('falls back to local catalog if backend endpoint returns not found', async () => {
      fetchMock.mockResolvedValueOnce(jsonResponse({ error: 'Not found' }, 404));

      // Add a local appraisal item
      await appraisalService.addAppraisal({
        code: 'LOCAL-CODE-1',
        name: 'Local Gem Ring',
        type: 'Ring',
        estimatedValue: 350,
        image: '/gem.jpg',
        material: 'Silver',
        description: 'Artisan test item',
        status: 'active',
        serialNumber: 'LOC-1',
        inspectedDate: '2026-02-01',
      });

      const res = await appraisalService.lookupJewelryCode('LOCAL-CODE-1');
      expect(res.success).toBe(true);
      expect(res.data?.code).toBe('LOCAL-CODE-1');
      expect(res.data?.estimatedValue).toBe(350);
    });
  });

  describe('admin appraisal operations', () => {
    it('fetches admin appraisals and submissions from /api/admin/appraisals', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            appraisals: [
              {
                id: 'srv-appr-1',
                code: 'ILS-GOLD-1',
                name: 'Gold Ring',
                type: 'Ring',
                estimatedValue: 500,
                image: '/gold.jpg',
                material: 'Gold',
                description: 'Certified',
                status: 'active',
                serialNumber: 'CERT-1',
                inspectedDate: '2026-01-01',
              },
            ],
            submissions: [
              {
                id: 'srv-sub-1',
                customerName: 'Alice',
                customerEmail: 'alice@example.com',
                productName: 'Surprise Candle',
                jewelryType: 'Ring',
                status: 'pending',
                createdAt: '2026-01-01T00:00:00.000Z',
              },
            ],
            stats: {
              submissions: {
                totalSubmissions: 1,
                pendingReview: 1,
                reviewedSubmissions: 0,
                approvedAppraisals: 0,
              },
              certificates: {
                registeredCodes: 1,
                totalAppraisedValuePool: 500,
                averageItemValue: 500,
                customerPortalRoute: '/appraise-your-jewelry',
                valueRange: '$35 to $7,500 Range',
              },
            },
          },
        })
      );

      const result = await appraisalService.fetchAdminAppraisals();
      expect(fetchMock).toHaveBeenCalled();
      expect(String(fetchMock.mock.calls[0][0])).toContain('/api/admin/appraisals');
      expect(result.appraisals.length).toBe(1);
      expect(result.appraisals[0].id).toBe('srv-appr-1');
      expect(result.submissions.length).toBe(1);
      expect(result.stats?.submissions.totalSubmissions).toBe(1);
    });

    it('fetches appraisal stats from /api/admin/appraisals/stats', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            submissions: { totalSubmissions: 10, pendingReview: 2, reviewedSubmissions: 3, approvedAppraisals: 5 },
            certificates: { registeredCodes: 20, totalAppraisedValuePool: 15000, averageItemValue: 750, customerPortalRoute: '/appraise-your-jewelry', valueRange: '$35 to $7,500' },
          },
        })
      );

      const stats = await appraisalService.getAppraisalStats();
      expect(stats?.submissions.totalSubmissions).toBe(10);
      expect(stats?.certificates.registeredCodes).toBe(20);
    });

    it('adds an appraisal and dispatches APPRAISALS_UPDATED_EVENT', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            id: 'appr-new-1',
            code: 'NEW-CODE-9',
            name: 'New Diamond',
            type: 'Ring',
            estimatedValue: 900,
            image: '/dia.jpg',
            material: 'Platinum',
            description: 'Rare',
            status: 'active',
            serialNumber: 'SR-9',
            inspectedDate: '2026-03-01',
          },
        })
      );

      let eventTriggered = false;
      const handler = () => {
        eventTriggered = true;
      };
      window.addEventListener(APPRAISALS_UPDATED_EVENT, handler);

      const created = await appraisalService.addAppraisal({
        code: 'NEW-CODE-9',
        name: 'New Diamond',
        type: 'Ring',
        estimatedValue: 900,
        image: '/dia.jpg',
        material: 'Platinum',
        description: 'Rare',
        status: 'active',
        serialNumber: 'SR-9',
        inspectedDate: '2026-03-01',
      });

      expect(created.code).toBe('NEW-CODE-9');
      expect(eventTriggered).toBe(true);
      window.removeEventListener(APPRAISALS_UPDATED_EVENT, handler);
    });

    it('updates and deletes an appraisal', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success' }));

      const item = await appraisalService.addAppraisal({
        code: 'UPDATE-ME',
        name: 'Initial Name',
        type: 'Ring',
        estimatedValue: 100,
        image: '/img.jpg',
        material: 'Silver',
        description: 'Desc',
        status: 'active',
        serialNumber: 'SN-1',
        inspectedDate: '2026-01-01',
      });

      const updated = await appraisalService.updateAppraisal(item.id, { name: 'Updated Name', estimatedValue: 200 });
      expect(updated).toBe(true);

      const deleted = await appraisalService.deleteAppraisal(item.id);
      expect(deleted).toBe(true);
    });

    it('submits a customer appraisal reveal to /api/appraisals/submit with aliases and referenceId', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            id: 'appr-sub-1792346688703-ydtc3',
            referenceId: '#appr-sub-1792346688703-ydtc3',
            customerName: 'Jane Doe',
            customerEmail: 'jane@example.com',
            customerPhone: '555-1234',
            orderNumber: 'ILS-9988',
            productName: 'Surprise Candle',
            jewelryType: 'Necklace',
            customerNotes: 'Found inside soy wax candle',
            status: 'pending',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        })
      );

      let subEventTriggered = false;
      const handler = () => {
        subEventTriggered = true;
      };
      window.addEventListener(APPRAISAL_SUBMISSIONS_UPDATED_EVENT, handler);

      const submission = await appraisalService.submitAppraisal({
        customerName: 'Jane Doe',
        name: 'Jane Doe',
        customerEmail: 'jane@example.com',
        email: 'jane@example.com',
        customerPhone: '555-1234',
        orderNumber: 'ILS-9988',
        productName: 'Surprise Candle',
        jewelryType: 'Necklace',
        customerNotes: 'Found inside soy wax candle',
      });

      expect(submission.customerName).toBe('Jane Doe');
      expect(submission.referenceId).toBe('#appr-sub-1792346688703-ydtc3');
      expect(submission.customerNotes).toBe('Found inside soy wax candle');
      expect(subEventTriggered).toBe(true);
      window.removeEventListener(APPRAISAL_SUBMISSIONS_UPDATED_EVENT, handler);
    });

    it('tracks customer submission via instant lookup by Reference ID', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: {
            id: 'appr-sub-1792346688703-ydtc3',
            referenceId: '#appr-sub-1792346688703-ydtc3',
            name: 'Gold Ring',
            jewelryType: 'Ring',
            status: 'pending',
            customerNotes: 'Found in lavender candle',
          },
        })
      );

      const res = await appraisalService.lookupJewelryCode('#appr-sub-1792346688703-ydtc3');
      expect(res.success).toBe(true);
      expect(res.data?.isSubmission).toBe(true);
      expect(res.data?.submissionStatus).toBe('pending');
      expect(res.data?.referenceId).toBe('#appr-sub-1792346688703-ydtc3');
      expect(res.data?.customerNotes).toBe('Found in lavender candle');
    });

    it('fetches admin customer submissions from /api/admin/appraisals/submissions', async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({
          status: 'success',
          data: [
            {
              id: 'srv-sub-101',
              referenceId: '#srv-sub-101',
              customerName: 'Sam Smith',
              customerEmail: 'sam@example.com',
              productName: 'Rose Candle',
              jewelryType: 'Earrings',
              status: 'pending',
              createdAt: '2026-01-02T00:00:00.000Z',
            },
          ],
        })
      );

      const subs = await appraisalService.fetchAdminSubmissions();
      expect(subs.length).toBeGreaterThanOrEqual(1);
      const found = subs.find((s) => s.id === 'srv-sub-101');
      expect(found).toBeDefined();
      expect(found?.customerName).toBe('Sam Smith');
    });

    it('preserves customerNotes when updating appraiserNotes and valuation', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ status: 'success' }));

      const sub = await appraisalService.submitAppraisal({
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        productName: 'Bath Bomb',
        jewelryType: 'Earrings',
        customerNotes: 'Revealed with hallmark 925 stamped inside band',
      });

      const updated = await appraisalService.updateSubmission(sub.id, {
        status: 'reviewed',
        estimatedValue: 450,
        appraiserNotes: 'Gemologist verified genuine sterling silver',
      });

      expect(updated).toBe(true);
      const stored = appraisalService.getSubmissionById(sub.id);
      expect(stored?.customerNotes).toBe('Revealed with hallmark 925 stamped inside band');
      expect(stored?.appraiserNotes).toBe('Gemologist verified genuine sterling silver');
      expect(stored?.status).toBe('reviewed');
      expect(stored?.estimatedValue).toBe(450);
    });
  });
});
