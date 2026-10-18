import type {
  JewelryAppraisal,
  PublicAppraisalResult,
  AppraisalLookupResponse,
  CustomerAppraisalSubmission,
  AppraisalStatsResponse,
} from '../types/appraisal';
import { MOCK_APPRAISALS } from '../data/mockData';
import { apiClient, unwrap, type ApiResponse } from './apiClient';

const STORAGE_KEY = 'ils_jewelry_appraisals_v2';
export const APPRAISALS_UPDATED_EVENT = 'ils_appraisals_updated';

const SUBMISSIONS_STORAGE_KEY = 'ils_customer_appraisal_submissions_v1';
export const APPRAISAL_SUBMISSIONS_UPDATED_EVENT = 'ils_appraisal_submissions_updated';

const DEFAULT_APPRAISALS: JewelryAppraisal[] = MOCK_APPRAISALS;

class AppraisalService {
  private appraisals: JewelryAppraisal[] = [];
  private submissions: CustomerAppraisalSubmission[] = [];

  constructor() {
    this.loadFromStorage();
    this.loadSubmissionsFromStorage();
    if (typeof window !== 'undefined') {
      // Background load from server
      this.fetchAdminAppraisals().catch(() => {});
    }
  }

  private loadSubmissionsFromStorage() {
    if (typeof window === 'undefined') {
      this.submissions = [];
      return;
    }
    try {
      const stored = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.submissions = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse customer appraisal submissions from localStorage', e);
    }
    this.submissions = [];
  }

  private saveSubmissionsToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(this.submissions));
      window.dispatchEvent(new CustomEvent(APPRAISAL_SUBMISSIONS_UPDATED_EVENT));
    } catch (e) {
      console.error('Failed to persist appraisal submissions to localStorage', e);
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') {
      this.appraisals = [...DEFAULT_APPRAISALS];
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.appraisals = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored appraisals from localStorage', e);
    }

    this.appraisals = [];
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.appraisals));
      window.dispatchEvent(new CustomEvent(APPRAISALS_UPDATED_EVENT));
    } catch (e) {
      console.error('Failed to persist appraisals to localStorage', e);
    }
  }

  /**
   * Normalizes a customer-entered code (trims whitespace, converts to uppercase)
   */
  public normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase();
  }

  /**
   * Customer-facing jewelry appraisal lookup.
   * Calls backend `GET /api/appraisals/verify/:code` with fallback to local store.
   */
  public async lookupJewelryCode(rawCode: string): Promise<AppraisalLookupResponse> {
    const cleanCode = this.normalizeCode(rawCode);

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter your jewelry code to check its appraised value.',
      };
    }

    try {
      const response = await apiClient.get<ApiResponse<PublicAppraisalResult> | PublicAppraisalResult>(
        `/api/appraisals/verify/${encodeURIComponent(cleanCode)}`
      );
      if (response) {
        const payload = (response as any).data || response;
        if (payload && (payload.code || payload.estimatedValue !== undefined)) {
          return {
            success: true,
            data: payload,
          };
        }
      }
    } catch {
      // Backend lookup returned 404 or network error; check local store below
    }

    const matched = this.appraisals.find(
      (a) => this.normalizeCode(a.code) === cleanCode && a.status === 'active'
    );

    if (!matched) {
      return {
        success: false,
        error: "We couldn't find that jewelry code. Please check the code and try again.",
      };
    }

    const publicResult: PublicAppraisalResult = {
      code: matched.code,
      name: matched.name,
      type: matched.type,
      estimatedValue: matched.estimatedValue,
      image: matched.image,
      material: matched.material,
      stone: matched.stone,
      cutSetting: matched.cutSetting,
      description: matched.description,
      serialNumber: matched.serialNumber,
      inspectedDate: matched.inspectedDate,
    };

    return {
      success: true,
      data: publicResult,
    };
  }

  /**
   * Fetches fresh appraisals, customer submissions, and stats from `GET /api/admin/appraisals`.
   */
  public async fetchAdminAppraisals(query?: {
    search?: string;
    type?: string;
    status?: string;
    tab?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    appraisals: JewelryAppraisal[];
    submissions: CustomerAppraisalSubmission[];
    stats?: AppraisalStatsResponse;
  }> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/appraisals', query);
      const payload = unwrap<any>(response, '/api/admin/appraisals');

      if (Array.isArray(payload?.appraisals)) {
        this.appraisals = payload.appraisals;
        this.saveToStorage();
      }
      if (Array.isArray(payload?.submissions)) {
        this.submissions = payload.submissions;
        this.saveSubmissionsToStorage();
      }

      return {
        appraisals: this.appraisals,
        submissions: this.submissions,
        stats: payload?.stats,
      };
    } catch (err) {
      console.warn('Failed to fetch admin appraisals from backend, using cached:', err);
      return {
        appraisals: this.appraisals,
        submissions: this.submissions,
      };
    }
  }

  /**
   * Fetches overview KPI statistics from `GET /api/admin/appraisals/stats`.
   */
  public async getAppraisalStats(): Promise<AppraisalStatsResponse | null> {
    try {
      const response = await apiClient.get<ApiResponse<AppraisalStatsResponse>>(
        '/api/admin/appraisals/stats'
      );
      return unwrap<AppraisalStatsResponse>(response, '/api/admin/appraisals/stats');
    } catch {
      return null;
    }
  }

  /**
   * Admin: Get all appraisals
   */
  public getAllAppraisals(): JewelryAppraisal[] {
    return [...this.appraisals];
  }

  /**
   * Admin: Add new appraisal code.
   * Calls `POST /api/admin/appraisals` with optimistic local caching.
   */
  public async addAppraisal(
    item: Omit<JewelryAppraisal, 'id' | 'createdAt'>
  ): Promise<JewelryAppraisal> {
    const newItem: JewelryAppraisal = {
      ...item,
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: this.normalizeCode(item.code),
      createdAt: new Date().toISOString(),
    };

    this.appraisals = [newItem, ...this.appraisals];
    this.saveToStorage();

    try {
      const response = await apiClient.post<ApiResponse<JewelryAppraisal>>(
        '/api/admin/appraisals',
        {
          ...item,
          appraisalCode: this.normalizeCode(item.code),
        }
      );
      const serverItem = unwrap<JewelryAppraisal>(response, '/api/admin/appraisals');
      if (serverItem?.id) {
        const idx = this.appraisals.findIndex((a) => a.id === newItem.id);
        if (idx !== -1) {
          this.appraisals[idx] = serverItem;
          this.saveToStorage();
        }
        return serverItem;
      }
    } catch (err) {
      console.warn('Backend add appraisal failed, kept local record:', err);
    }

    return newItem;
  }

  /**
   * Admin: Update appraisal item.
   * Calls `PATCH /api/admin/appraisals/:id` with optimistic local caching.
   */
  public async updateAppraisal(id: string, updates: Partial<JewelryAppraisal>): Promise<boolean> {
    const index = this.appraisals.findIndex((a) => a.id === id);
    if (index === -1) return false;

    if (updates.code) {
      updates.code = this.normalizeCode(updates.code);
    }

    this.appraisals[index] = {
      ...this.appraisals[index],
      ...updates,
    };
    this.saveToStorage();

    try {
      await apiClient.patch(`/api/admin/appraisals/${encodeURIComponent(id)}`, updates);
    } catch (err) {
      console.warn('Backend update appraisal failed, kept local update:', err);
    }

    return true;
  }

  /**
   * Admin: Delete appraisal item.
   * Calls `DELETE /api/admin/appraisals/:id`.
   */
  public async deleteAppraisal(id: string): Promise<boolean> {
    const before = this.appraisals.length;
    this.appraisals = this.appraisals.filter((a) => a.id !== id);
    if (this.appraisals.length !== before) {
      this.saveToStorage();
    }

    try {
      await apiClient.delete(`/api/admin/appraisals/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn('Backend delete appraisal failed:', err);
    }

    return true;
  }

  /**
   * Admin: Reset to default factory items via `POST /api/admin/appraisals/reset`.
   */
  public async resetToDefaults(): Promise<void> {
    try {
      await apiClient.post('/api/admin/appraisals/reset');
      await this.fetchAdminAppraisals();
      return;
    } catch (err) {
      console.warn('Backend reset appraisals failed, resetting local store:', err);
    }

    this.appraisals = [...DEFAULT_APPRAISALS];
    this.saveToStorage();
  }

  /**
   * Admin: Clear records via `POST /api/admin/appraisals/clear`.
   */
  public async clearAppraisals(scope: 'all' | 'certificates' | 'submissions' = 'all'): Promise<void> {
    try {
      await apiClient.post('/api/admin/appraisals/clear', { scope });
    } catch (err) {
      console.warn('Backend clear appraisals failed:', err);
    }

    if (scope === 'all' || scope === 'certificates') {
      this.appraisals = [];
      this.saveToStorage();
    }
    if (scope === 'all' || scope === 'submissions') {
      this.submissions = [];
      this.saveSubmissionsToStorage();
    }
  }

  // ==========================================
  // Customer Appraisal Submissions
  // ==========================================

  /**
   * Customer / Storefront: Submit jewelry item for appraisal.
   * Calls `POST /api/appraisals/submit` with optimistic local caching.
   */
  public async submitAppraisal(
    data: Omit<CustomerAppraisalSubmission, 'id' | 'createdAt' | 'status'>
  ): Promise<CustomerAppraisalSubmission> {
    const newSubmission: CustomerAppraisalSubmission = {
      ...data,
      id: `appr-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.submissions = [newSubmission, ...this.submissions];
    this.saveSubmissionsToStorage();

    try {
      const response = await apiClient.post<ApiResponse<CustomerAppraisalSubmission>>(
        '/api/appraisals/submit',
        data
      );
      const serverResult = unwrap<CustomerAppraisalSubmission>(
        response,
        '/api/appraisals/submit'
      );
      if (serverResult && serverResult.id) {
        const idx = this.submissions.findIndex((s) => s.id === newSubmission.id);
        if (idx !== -1) {
          this.submissions[idx] = serverResult;
          this.saveSubmissionsToStorage();
        }
        return serverResult;
      }
    } catch (err) {
      console.warn('Backend appraisal submission failed, saved locally:', err);
    }

    return newSubmission;
  }

  /**
   * Admin: Get all customer appraisal submissions
   */
  public getAllSubmissions(): CustomerAppraisalSubmission[] {
    return [...this.submissions];
  }

  /**
   * Admin: Get single submission by ID
   */
  public getSubmissionById(id: string): CustomerAppraisalSubmission | undefined {
    return this.submissions.find((s) => s.id === id);
  }

  /**
   * Admin: Update submission status and notes/valuation.
   * Calls `PATCH /api/admin/appraisals/submissions/:id`.
   */
  public async updateSubmission(
    id: string,
    updates: Partial<Omit<CustomerAppraisalSubmission, 'id' | 'createdAt'>>
  ): Promise<boolean> {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) return false;

    this.submissions[index] = {
      ...this.submissions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveSubmissionsToStorage();

    try {
      await apiClient.patch(
        `/api/admin/appraisals/submissions/${encodeURIComponent(id)}`,
        updates
      );
    } catch (err) {
      console.warn('Backend update submission failed, kept local update:', err);
    }

    return true;
  }

  /**
   * Admin: Delete submission.
   * Calls `DELETE /api/admin/appraisals/submissions/:id`.
   */
  public async deleteSubmission(id: string): Promise<boolean> {
    const before = this.submissions.length;
    this.submissions = this.submissions.filter((s) => s.id !== id);
    if (this.submissions.length !== before) {
      this.saveSubmissionsToStorage();
    }

    try {
      await apiClient.delete(`/api/admin/appraisals/submissions/${encodeURIComponent(id)}`);
    } catch (err) {
      console.warn('Backend delete submission failed:', err);
    }

    return true;
  }
}

export const appraisalService = new AppraisalService();
