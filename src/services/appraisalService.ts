import type {
  JewelryAppraisal,
  PublicAppraisalResult,
  AppraisalLookupResponse,
  CustomerAppraisalSubmission,
} from '../types/appraisal';

const STORAGE_KEY = 'ils_jewelry_appraisals_v2';
export const APPRAISALS_UPDATED_EVENT = 'ils_appraisals_updated';

const SUBMISSIONS_STORAGE_KEY = 'ils_customer_appraisal_submissions_v1';
export const APPRAISAL_SUBMISSIONS_UPDATED_EVENT = 'ils_appraisal_submissions_updated';

const DEFAULT_APPRAISALS: JewelryAppraisal[] = [];

class AppraisalService {
  private appraisals: JewelryAppraisal[] = [];
  private submissions: CustomerAppraisalSubmission[] = [];

  constructor() {
    this.loadFromStorage();
    this.loadSubmissionsFromStorage();
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
   * Centralized service: Backend API call will replace this internal mock later.
   * Simulates network/verification delay for suspense.
   */
  public async lookupJewelryCode(rawCode: string): Promise<AppraisalLookupResponse> {
    const cleanCode = this.normalizeCode(rawCode);

    if (!cleanCode) {
      return {
        success: false,
        error: 'Please enter your jewelry code to check its appraised value.',
      };
    }

    // Realistic suspense delay for authentic appraisal feel
    await new Promise((resolve) => setTimeout(resolve, 650));

    // Case-insensitive exact lookup against active appraisals
    const matched = this.appraisals.find(
      (a) => this.normalizeCode(a.code) === cleanCode && a.status === 'active'
    );

    if (!matched) {
      return {
        success: false,
        error: "We couldn't find that jewelry code. Please check the code and try again.",
      };
    }

    // Public sanitized representation (does not leak supplier, cost, or internal notes)
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
   * Admin: Get all appraisals
   */
  public getAllAppraisals(): JewelryAppraisal[] {
    return [...this.appraisals];
  }

  /**
   * Admin: Add new appraisal code
   */
  public addAppraisal(
    item: Omit<JewelryAppraisal, 'id' | 'createdAt'>
  ): JewelryAppraisal {
    const newItem: JewelryAppraisal = {
      ...item,
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: this.normalizeCode(item.code),
      createdAt: new Date().toISOString(),
    };

    this.appraisals = [newItem, ...this.appraisals];
    this.saveToStorage();
    return newItem;
  }

  /**
   * Admin: Update appraisal item
   */
  public updateAppraisal(id: string, updates: Partial<JewelryAppraisal>): boolean {
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
    return true;
  }

  /**
   * Admin: Delete appraisal item
   */
  public deleteAppraisal(id: string): boolean {
    const before = this.appraisals.length;
    this.appraisals = this.appraisals.filter((a) => a.id !== id);
    if (this.appraisals.length !== before) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Admin: Reset to default factory items
   */
  public resetToDefaults(): void {
    this.appraisals = [...DEFAULT_APPRAISALS];
    this.saveToStorage();
  }

  // ==========================================
  // Customer Appraisal Submissions
  // ==========================================

  /**
   * Customer / Storefront: Submit jewelry item for appraisal
   */
  public submitAppraisal(
    data: Omit<CustomerAppraisalSubmission, 'id' | 'createdAt' | 'status'>
  ): CustomerAppraisalSubmission {
    const newSubmission: CustomerAppraisalSubmission = {
      ...data,
      id: `appr-sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.submissions = [newSubmission, ...this.submissions];
    this.saveSubmissionsToStorage();
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
   * Admin: Update submission status and notes/valuation
   */
  public updateSubmission(
    id: string,
    updates: Partial<Omit<CustomerAppraisalSubmission, 'id' | 'createdAt'>>
  ): boolean {
    const index = this.submissions.findIndex((s) => s.id === id);
    if (index === -1) return false;

    this.submissions[index] = {
      ...this.submissions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveSubmissionsToStorage();
    return true;
  }

  /**
   * Admin: Delete submission
   */
  public deleteSubmission(id: string): boolean {
    const before = this.submissions.length;
    this.submissions = this.submissions.filter((s) => s.id !== id);
    if (this.submissions.length !== before) {
      this.saveSubmissionsToStorage();
      return true;
    }
    return false;
  }
}

export const appraisalService = new AppraisalService();
