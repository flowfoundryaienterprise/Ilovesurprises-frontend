import type {
  JewelryAppraisal,
  JewelryType,
  PublicAppraisalResult,
  AppraisalLookupResponse,
  CustomerAppraisalSubmission,
  AppraisalStatsResponse,
  SubmitCustomerAppraisalDTO,
  UpdateCustomerSubmissionDTO,
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
   * Customer-facing jewelry appraisal & submission lookup.
   * Checks both authentic certificates and customer appraisal submission tracking.
   * Supports both tag codes (ILS-GOLD-550) and customer submission Reference IDs (#appr-sub-...).
   */
  public async lookupJewelryCode(rawCode: string): Promise<AppraisalLookupResponse> {
    const cleanCode = this.normalizeCode(rawCode);

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter your jewelry code or reference ID to check its appraisal status.',
      };
    }

    const cleanWithoutHash = cleanCode.startsWith('#') ? cleanCode.slice(1) : cleanCode;
    const cleanWithHash = cleanCode.startsWith('#') ? cleanCode : `#${cleanCode}`;

    try {
      const response = await apiClient.get<ApiResponse<any> | any>(
        `/api/appraisals/verify/${encodeURIComponent(cleanCode)}`
      );
      if (response) {
        const payload = (response as any).data || response;
        if (payload && (payload.code || payload.estimatedValue !== undefined || payload.id || payload.referenceId || payload.status)) {
          const isSubmission = Boolean(
            payload.isSubmission ||
            payload.referenceId ||
            (payload.id && String(payload.id).toLowerCase().includes('sub')) ||
            (payload.status && ['pending', 'reviewed', 'approved', 'rejected'].includes(payload.status))
          );

          const publicResult: PublicAppraisalResult = {
            code: payload.code || payload.referenceId || payload.id || cleanCode,
            name: payload.name || payload.productName || 'Surprise Reveal Jewelry',
            type: (payload.type || payload.jewelryType || 'Ring') as JewelryType,
            estimatedValue: Number(payload.estimatedValue || payload.appraisedValue || 0),
            retailValue: payload.retailValue ? Number(payload.retailValue) : undefined,
            image: payload.image || payload.photoPreviews?.[0] || payload.images?.[0] || DEFAULT_APPRAISALS[0].image,
            images: payload.images || payload.photoPreviews,
            material: payload.material || payload.metalType || 'Solid .925 Sterling Silver / 14K Gold',
            stone: payload.stone || payload.gemstoneType || 'Genuine Gemstones',
            cutSetting: payload.cutSetting || 'Handcrafted Setting',
            description: payload.description || payload.customerNotes || payload.notes || 'Handcrafted genuine fine jewelry surprise reveal.',
            serialNumber: payload.serialNumber || payload.referenceId || payload.id || cleanCode,
            certificateNumber: payload.certificateNumber,
            inspectedDate: payload.inspectedDate || (payload.createdAt ? new Date(payload.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Verified Appraisal'),
            isSubmission,
            submissionStatus: isSubmission ? (payload.status || payload.submissionStatus || 'pending') : undefined,
            referenceId: payload.referenceId || (payload.id?.startsWith('#') ? payload.id : `#${payload.id || cleanWithoutHash}`),
            customerNotes: payload.customerNotes || payload.notes,
            appraiserNotes: payload.appraiserNotes,
          };

          return {
            success: true,
            data: publicResult,
          };
        }
      }
    } catch {
      // Backend lookup returned 404 or network error; check local store below
    }

    // Check local customer submissions store for matching Reference ID or Tag Code
    const matchedSub = this.submissions.find((s) => {
      const normId = this.normalizeCode(s.id);
      const normRef = s.referenceId ? this.normalizeCode(s.referenceId) : '';
      const normCode = s.codeInfo ? this.normalizeCode(s.codeInfo) : '';

      return (
        normId === cleanCode ||
        normId === cleanWithoutHash ||
        normRef === cleanCode ||
        normRef === cleanWithHash ||
        (normCode && normCode === cleanCode)
      );
    });

    if (matchedSub) {
      const publicResult: PublicAppraisalResult = {
        code: matchedSub.referenceId || (matchedSub.id.startsWith('#') ? matchedSub.id : `#${matchedSub.id}`),
        name: `${matchedSub.jewelryType} - ${matchedSub.productName}`,
        type: (['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Pendant'].includes(matchedSub.jewelryType)
          ? matchedSub.jewelryType
          : 'Ring') as JewelryType,
        estimatedValue: Number(matchedSub.appraisedValue || matchedSub.estimatedValue || 0),
        image: matchedSub.photoPreviews?.[0] || matchedSub.images?.[0] || DEFAULT_APPRAISALS[0].image,
        images: matchedSub.photoPreviews || matchedSub.images,
        material: matchedSub.metalType || 'Solid .925 Sterling Silver / 14K Gold',
        stone: matchedSub.gemstoneType || 'Authentic Surprise Reveal Gemstone',
        cutSetting: 'Artisan Reveal Setting',
        description: matchedSub.customerNotes || matchedSub.notes || `Appraisal submission for ${matchedSub.productName}`,
        serialNumber: matchedSub.referenceId || matchedSub.id,
        inspectedDate: matchedSub.updatedAt
          ? new Date(matchedSub.updatedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : new Date(matchedSub.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        isSubmission: true,
        submissionStatus: matchedSub.status,
        referenceId: matchedSub.referenceId || (matchedSub.id.startsWith('#') ? matchedSub.id : `#${matchedSub.id}`),
        customerNotes: matchedSub.customerNotes || matchedSub.notes,
        appraiserNotes: matchedSub.appraiserNotes,
      };

      return {
        success: true,
        data: publicResult,
      };
    }

    const matched = this.appraisals.find(
      (a) => this.normalizeCode(a.code) === cleanCode && a.status === 'active'
    );

    if (!matched) {
      return {
        success: false,
        error: "We couldn't find that jewelry code or reference ID. Please check the code and try again.",
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
   * Admin: Fetch customer appraisal submissions from backend.
   * Hits `GET /api/admin/appraisals/submissions` with fallback to `GET /api/admin/appraisals?tab=submissions`.
   * Merges server items with local submissions cache and preserves customer records.
   */
  public async fetchAdminSubmissions(query?: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<CustomerAppraisalSubmission[]> {
    try {
      let payload: any = null;
      try {
        const response = await apiClient.get<ApiResponse<any>>(
          '/api/admin/appraisals/submissions',
          query
        );
        payload = unwrap<any>(response, '/api/admin/appraisals/submissions');
      } catch {
        // Fallback to GET /api/admin/appraisals?tab=submissions
        const response = await apiClient.get<ApiResponse<any>>('/api/admin/appraisals', {
          ...query,
          tab: 'submissions',
        });
        payload = unwrap<any>(response, '/api/admin/appraisals?tab=submissions');
      }

      const rawList = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.submissions)
        ? payload.submissions
        : Array.isArray(payload?.items)
        ? payload.items
        : Array.isArray(payload?.data)
        ? payload.data
        : null;

      if (Array.isArray(rawList)) {
        const serverMap = new Map<string, any>();
        rawList.forEach((s: any) => {
          if (s.id) serverMap.set(s.id, s);
          if (s.referenceId) serverMap.set(s.referenceId, s);
        });

        const normalizedServerItems: CustomerAppraisalSubmission[] = rawList.map((s: any) => ({
          ...s,
          customerName: s.customerName || s.name || '',
          customerEmail: s.customerEmail || s.email || '',
          customerPhone: s.customerPhone || s.phone,
          orderNumber: s.orderNumber || s.orderId,
          customerNotes: s.customerNotes || s.notes,
          notes: s.customerNotes || s.notes,
          referenceId: s.referenceId || (s.id?.startsWith('#') ? s.id : `#${s.id}`),
          photoPreviews: s.photoPreviews?.length ? s.photoPreviews : (s.images?.length ? s.images : (s.photos || [])),
          images: s.images?.length ? s.images : (s.photoPreviews?.length ? s.photoPreviews : (s.photos || [])),
        }));

        const merged: CustomerAppraisalSubmission[] = [...normalizedServerItems];
        for (const localSub of this.submissions) {
          const exists = serverMap.has(localSub.id) || (localSub.referenceId && serverMap.has(localSub.referenceId));
          if (!exists) {
            merged.unshift(localSub);
          }
        }

        this.submissions = merged;
        this.saveSubmissionsToStorage();
        return this.submissions;
      }
    } catch (err) {
      console.warn('Failed to fetch admin submissions from backend, using local store:', err);
    }

    return this.submissions;
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
    if (query?.tab === 'submissions') {
      const subs = await this.fetchAdminSubmissions(query);
      return {
        appraisals: this.appraisals,
        submissions: subs,
      };
    }

    try {
      const response = await apiClient.get<ApiResponse<any>>('/api/admin/appraisals', query);
      const payload = unwrap<any>(response, '/api/admin/appraisals');

      if (Array.isArray(payload)) {
        this.appraisals = payload;
        this.saveToStorage();
      } else if (Array.isArray(payload?.appraisals)) {
        this.appraisals = payload.appraisals;
        this.saveToStorage();
      }

      if (Array.isArray(payload?.submissions)) {
        const serverMap = new Map<string, any>();
        payload.submissions.forEach((s: any) => {
          if (s.id) serverMap.set(s.id, s);
          if (s.referenceId) serverMap.set(s.referenceId, s);
        });

        const normalizedServerItems: CustomerAppraisalSubmission[] = payload.submissions.map((s: any) => ({
          ...s,
          customerName: s.customerName || s.name || '',
          customerEmail: s.customerEmail || s.email || '',
          customerPhone: s.customerPhone || s.phone,
          orderNumber: s.orderNumber || s.orderId,
          customerNotes: s.customerNotes || s.notes,
          notes: s.customerNotes || s.notes,
          referenceId: s.referenceId || (s.id?.startsWith('#') ? s.id : `#${s.id}`),
          photoPreviews: s.photoPreviews?.length ? s.photoPreviews : (s.images?.length ? s.images : (s.photos || [])),
          images: s.images?.length ? s.images : (s.photoPreviews?.length ? s.photoPreviews : (s.photos || [])),
        }));

        const merged: CustomerAppraisalSubmission[] = [...normalizedServerItems];
        for (const localSub of this.submissions) {
          if (!serverMap.has(localSub.id) && (!localSub.referenceId || !serverMap.has(localSub.referenceId))) {
            merged.unshift(localSub);
          }
        }
        this.submissions = merged;
        this.saveSubmissionsToStorage();
      } else {
        // Automatically fetch customer submissions so they are guaranteed to appear on admin panel
        this.fetchAdminSubmissions().catch(() => {});
      }

      return {
        appraisals: this.appraisals,
        submissions: this.submissions,
        stats: payload?.stats,
      };
    } catch (err) {
      console.warn('Failed to fetch admin appraisals from backend, using cached:', err);
      this.fetchAdminSubmissions().catch(() => {});
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
   * Calls `POST /api/appraisals/submit` supporting multipart/form-data with file attachments,
   * base64 previews, and standard field aliases.
   */
  public async submitAppraisal(
    data: SubmitCustomerAppraisalDTO
  ): Promise<CustomerAppraisalSubmission> {
    const rawId = `appr-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const referenceId = `#${rawId}`;

    const initialPreviews = data.photoPreviews || (Array.isArray(data.images) ? data.images : []);

    const newSubmission: CustomerAppraisalSubmission = {
      id: rawId,
      referenceId,
      customerName: data.customerName || data.name || '',
      name: data.customerName || data.name || '',
      customerEmail: data.customerEmail || data.email || '',
      email: data.customerEmail || data.email || '',
      customerPhone: data.customerPhone || data.phone,
      phone: data.customerPhone || data.phone,
      orderNumber: data.orderNumber || data.orderId,
      orderId: data.orderNumber || data.orderId,
      productName: data.productName,
      jewelryType: data.jewelryType,
      metalType: data.metalType,
      gemstoneType: data.gemstoneType,
      codeInfo: data.codeInfo,
      photoPreviews: initialPreviews,
      images: initialPreviews,
      customerNotes: data.customerNotes || data.notes,
      notes: data.customerNotes || data.notes,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Optimistically save locally
    this.submissions = [newSubmission, ...this.submissions];
    this.saveSubmissionsToStorage();

    try {
      const hasFiles =
        Array.isArray(data.photos) &&
        data.photos.some((p) => typeof File !== 'undefined' && p instanceof File);

      let response: any;
      if (hasFiles && typeof FormData !== 'undefined') {
        const formData = new FormData();
        const custName = data.customerName || data.name || '';
        const custEmail = data.customerEmail || data.email || '';
        const custPhone = data.customerPhone || data.phone;
        const ordNum = data.orderNumber || data.orderId;
        const custNotes = data.customerNotes || data.notes;

        formData.append('customerName', custName);
        formData.append('name', custName);
        formData.append('customerEmail', custEmail);
        formData.append('email', custEmail);
        if (custPhone) {
          formData.append('customerPhone', custPhone);
          formData.append('phone', custPhone);
        }
        if (ordNum) {
          formData.append('orderNumber', ordNum);
          formData.append('orderId', ordNum);
        }
        formData.append('productName', data.productName);
        formData.append('jewelryType', data.jewelryType);
        if (data.metalType) formData.append('metalType', data.metalType);
        if (data.gemstoneType) formData.append('gemstoneType', data.gemstoneType);
        if (data.codeInfo) formData.append('codeInfo', data.codeInfo);
        if (custNotes) {
          formData.append('customerNotes', custNotes);
          formData.append('notes', custNotes);
        }

        if (Array.isArray(data.photos)) {
          for (const item of data.photos) {
            if (typeof File !== 'undefined' && item instanceof File) {
              formData.append('photos', item);
              formData.append('images', item);
            }
          }
        }

        if (initialPreviews.length > 0) {
          formData.append('photoPreviews', JSON.stringify(initialPreviews));
        }

        response = await apiClient.post<ApiResponse<CustomerAppraisalSubmission>>(
          '/api/appraisals/submit',
          formData
        );
      } else {
        const payloadWithAliases = {
          ...data,
          customerName: data.customerName || data.name,
          name: data.customerName || data.name,
          customerEmail: data.customerEmail || data.email,
          email: data.customerEmail || data.email,
          customerPhone: data.customerPhone || data.phone,
          phone: data.customerPhone || data.phone,
          orderNumber: data.orderNumber || data.orderId,
          orderId: data.orderNumber || data.orderId,
          customerNotes: data.customerNotes || data.notes,
          notes: data.customerNotes || data.notes,
          photoPreviews: initialPreviews,
          images: initialPreviews,
        };

        response = await apiClient.post<ApiResponse<CustomerAppraisalSubmission>>(
          '/api/appraisals/submit',
          payloadWithAliases
        );
      }

      const serverResult = unwrap<CustomerAppraisalSubmission>(
        response,
        '/api/appraisals/submit'
      );

      if (serverResult && (serverResult.id || serverResult.referenceId)) {
        const resolvedId = serverResult.id || rawId;
        const resolvedRef =
          serverResult.referenceId || (resolvedId.startsWith('#') ? resolvedId : `#${resolvedId}`);

        const resolvedSubmission: CustomerAppraisalSubmission = {
          ...newSubmission,
          ...serverResult,
          id: resolvedId,
          referenceId: resolvedRef,
          customerName: serverResult.customerName || serverResult.name || newSubmission.customerName,
          customerEmail: serverResult.customerEmail || serverResult.email || newSubmission.customerEmail,
          customerPhone: serverResult.customerPhone || serverResult.phone || newSubmission.customerPhone,
          orderNumber: serverResult.orderNumber || serverResult.orderId || newSubmission.orderNumber,
          customerNotes: serverResult.customerNotes || serverResult.notes || newSubmission.customerNotes,
          notes: serverResult.customerNotes || serverResult.notes || newSubmission.notes,
          photoPreviews: serverResult.photoPreviews?.length
            ? serverResult.photoPreviews
            : serverResult.images?.length
            ? serverResult.images
            : newSubmission.photoPreviews,
          images: serverResult.images?.length
            ? serverResult.images
            : serverResult.photoPreviews?.length
            ? serverResult.photoPreviews
            : newSubmission.images,
        };

        const idx = this.submissions.findIndex((s) => s.id === newSubmission.id);
        if (idx !== -1) {
          this.submissions[idx] = resolvedSubmission;
        } else {
          this.submissions.unshift(resolvedSubmission);
        }
        this.saveSubmissionsToStorage();
        return resolvedSubmission;
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
   * Admin: Get single submission by ID (checks id, with/without #, referenceId)
   */
  public getSubmissionById(id: string): CustomerAppraisalSubmission | undefined {
    const clean = (id || '').trim();
    const withoutHash = clean.startsWith('#') ? clean.slice(1) : clean;
    const withHash = clean.startsWith('#') ? clean : `#${clean}`;

    return this.submissions.find(
      (s) =>
        s.id === clean ||
        s.id === withoutHash ||
        s.id === withHash ||
        s.referenceId === clean ||
        s.referenceId === withHash
    );
  }

  /**
   * Admin: Fetch single submission by ID from `GET /api/admin/appraisals/submissions/:id`
   */
  public async fetchSubmissionById(id: string): Promise<CustomerAppraisalSubmission | null> {
    const clean = (id || '').trim();
    if (!clean) return null;

    try {
      const response = await apiClient.get<ApiResponse<CustomerAppraisalSubmission>>(
        `/api/admin/appraisals/submissions/${encodeURIComponent(clean)}`
      );
      const payload = unwrap<CustomerAppraisalSubmission>(
        response,
        `/api/admin/appraisals/submissions/${clean}`
      );
      if (payload && (payload.id || payload.referenceId)) {
        const resolvedId = payload.id || clean;
        const normalized: CustomerAppraisalSubmission = {
          ...payload,
          id: resolvedId,
          referenceId: payload.referenceId || (resolvedId.startsWith('#') ? resolvedId : `#${resolvedId}`),
          customerName: payload.customerName || payload.name || '',
          customerEmail: payload.customerEmail || payload.email || '',
          customerPhone: payload.customerPhone || payload.phone,
          orderNumber: payload.orderNumber || payload.orderId,
          customerNotes: payload.customerNotes || payload.notes,
          notes: payload.customerNotes || payload.notes,
        };

        const idx = this.submissions.findIndex(
          (s) => s.id === normalized.id || s.referenceId === normalized.referenceId
        );
        if (idx !== -1) {
          this.submissions[idx] = normalized;
        } else {
          this.submissions.unshift(normalized);
        }
        this.saveSubmissionsToStorage();
        return normalized;
      }
    } catch (err) {
      console.warn(`Failed to fetch submission ${clean} from server:`, err);
    }

    return this.getSubmissionById(clean) || null;
  }

  /**
   * Admin: Update submission status and notes/valuation.
   * Calls `PATCH /api/admin/appraisals/submissions/:id`.
   * Preserves customerNotes from appraiserNotes.
   */
  public async updateSubmission(
    id: string,
    updates: UpdateCustomerSubmissionDTO
  ): Promise<boolean> {
    const clean = (id || '').trim();
    const withoutHash = clean.startsWith('#') ? clean.slice(1) : clean;
    const withHash = clean.startsWith('#') ? clean : `#${clean}`;

    const index = this.submissions.findIndex(
      (s) =>
        s.id === clean ||
        s.id === withoutHash ||
        s.id === withHash ||
        s.referenceId === clean ||
        s.referenceId === withHash
    );
    if (index === -1) return false;

    // Preserved customer notes: preserve customer discovery notes
    this.submissions[index] = {
      ...this.submissions[index],
      ...updates,
      customerNotes: this.submissions[index].customerNotes || this.submissions[index].notes,
      updatedAt: new Date().toISOString(),
    };
    this.saveSubmissionsToStorage();

    try {
      await apiClient.patch(
        `/api/admin/appraisals/submissions/${encodeURIComponent(withoutHash)}`,
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
    const clean = (id || '').trim();
    const withoutHash = clean.startsWith('#') ? clean.slice(1) : clean;
    const withHash = clean.startsWith('#') ? clean : `#${clean}`;

    const before = this.submissions.length;
    this.submissions = this.submissions.filter(
      (s) =>
        s.id !== clean &&
        s.id !== withoutHash &&
        s.id !== withHash &&
        s.referenceId !== clean &&
        s.referenceId !== withHash
    );
    if (this.submissions.length !== before) {
      this.saveSubmissionsToStorage();
    }

    try {
      await apiClient.delete(
        `/api/admin/appraisals/submissions/${encodeURIComponent(withoutHash)}`
      );
    } catch (err) {
      console.warn('Backend delete submission failed:', err);
    }

    return true;
  }
}

export const appraisalService = new AppraisalService();
