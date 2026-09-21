export type JewelryType = 'Ring' | 'Necklace' | 'Earrings' | 'Bracelet' | 'Pendant';

export type AppraisalStatus = 'active' | 'archived';

export interface JewelryAppraisal {
  id: string;
  code: string;
  name: string;
  type: JewelryType;
  estimatedValue: number;
  image: string;
  material: string;
  stone?: string;
  cutSetting?: string;
  description: string;
  status: AppraisalStatus;
  serialNumber: string;
  inspectedDate: string;
  createdAt?: string;
  customerName?: string;
  customerEmail?: string;
  orderId?: string;
  productId?: string;
  productName?: string;
}

/**
 * Sanitized public customer-facing appraisal result
 * Strips internal cost, vendor, or administrative fields
 */
export interface PublicAppraisalResult {
  code: string;
  name: string;
  type: JewelryType;
  estimatedValue: number;
  image: string;
  material: string;
  stone?: string;
  cutSetting?: string;
  description: string;
  serialNumber: string;
  inspectedDate: string;
}

export interface AppraisalLookupResponse {
  success: boolean;
  data?: PublicAppraisalResult;
  error?: string;
}

export type AppraisalSubmissionStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface CustomerAppraisalSubmission {
  id: string;
  customerName: string;
  customerEmail: string;
  orderNumber?: string;
  productName: string;
  jewelryType: string;
  codeInfo?: string;
  photoPreviews?: string[];
  status: AppraisalSubmissionStatus;
  notes?: string;
  estimatedValue?: number;
  createdAt: string;
  updatedAt?: string;
}
