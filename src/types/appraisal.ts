export type JewelryType = 'Ring' | 'Necklace' | 'Earrings' | 'Bracelet' | 'Pendant';

export type AppraisalStatus = 'active' | 'archived';
export type AppraisalSubmissionStatus = 'pending' | 'reviewed' | 'approved' | 'rejected';

export interface JewelryAppraisal {
  id: string;
  code: string;
  appraisalCode?: string;
  name: string;
  jewelryName?: string;
  type: JewelryType;
  jewelryType?: string;
  estimatedValue: number;
  retailValue?: number;
  appraisedValue?: number;
  image: string;
  images?: string[];
  jewelryImagePreset?: string;
  material: string;
  metalType?: string;
  stone?: string;
  gemstoneType?: string;
  cutSetting?: string;
  specsAndMaterials?: string;
  description: string;
  artisanDescription?: string;
  status: AppraisalStatus;
  serialNumber: string;
  certificateNumber?: string;
  inspectedDate: string;
  appraisedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  productId?: string;
  sourceProduct?: string;
  productName?: string;
  notes?: string;
}

/**
 * Sanitized public customer-facing appraisal result
 * Strips internal cost, vendor, or administrative fields
 */
export interface PublicAppraisalResult {
  code: string;
  name: string;
  type: JewelryType | string;
  estimatedValue: number;
  retailValue?: number;
  image: string;
  images?: string[];
  material: string;
  metalType?: string;
  stone?: string;
  gemstoneType?: string;
  cutSetting?: string;
  specsAndMaterials?: string;
  description: string;
  serialNumber: string;
  certificateNumber?: string;
  inspectedDate: string;
  isSubmission?: boolean;
  submissionStatus?: AppraisalSubmissionStatus;
  referenceId?: string;
  customerNotes?: string;
  appraiserNotes?: string;
}

export interface AppraisalLookupResponse {
  success: boolean;
  data?: PublicAppraisalResult;
  error?: string;
}

export interface CustomerAppraisalSubmission {
  id: string;
  referenceId?: string;
  customerName: string;
  name?: string;
  customerEmail: string;
  email?: string;
  customerPhone?: string;
  phone?: string;
  orderNumber?: string;
  orderId?: string;
  productName: string;
  jewelryType: string;
  metalType?: string;
  gemstoneType?: string;
  codeInfo?: string;
  photoPreviews?: string[];
  images?: string[];
  photos?: string[];
  status: AppraisalSubmissionStatus;
  notes?: string;
  customerNotes?: string;
  appraiserNotes?: string;
  estimatedValue?: number;
  appraisedValue?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface AppraisalStatsResponse {
  submissions: {
    totalSubmissions: number;
    pendingReview: number;
    reviewedSubmissions: number;
    approvedAppraisals: number;
  };
  certificates: {
    registeredCodes: number;
    totalAppraisedValuePool: number;
    averageItemValue: number;
    customerPortalRoute: string;
    valueRange: string;
  };
}

export interface CreateAppraisalDTO {
  appraisalCode: string;
  code?: string;
  estimatedValue: number;
  appraisedValue?: number;
  jewelryName?: string;
  name?: string;
  jewelryType: string;
  type?: string;
  metalType?: string;
  material?: string;
  gemstoneType?: string;
  stone?: string;
  cutSetting?: string;
  jewelryImagePreset?: string;
  image?: string;
  images?: string[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderNumber?: string;
  orderId?: string;
  sourceProduct?: string;
  productName?: string;
  productId?: string;
  description?: string;
  artisanDescription?: string;
  status?: string;
  serialNumber?: string;
  certificateNumber?: string;
  inspectedDate?: string;
  notes?: string;
}

export interface UpdateAppraisalDTO {
  appraisalCode?: string;
  code?: string;
  estimatedValue?: number;
  appraisedValue?: number;
  jewelryName?: string;
  name?: string;
  jewelryType?: string;
  type?: string;
  metalType?: string;
  material?: string;
  gemstoneType?: string;
  stone?: string;
  cutSetting?: string;
  jewelryImagePreset?: string;
  image?: string;
  images?: string[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  orderNumber?: string;
  orderId?: string;
  sourceProduct?: string;
  productName?: string;
  productId?: string;
  description?: string;
  artisanDescription?: string;
  status?: string;
  serialNumber?: string;
  certificateNumber?: string;
  inspectedDate?: string;
  notes?: string;
}

export interface SubmitCustomerAppraisalDTO {
  customerName: string;
  name?: string;
  customerEmail: string;
  email?: string;
  customerPhone?: string;
  phone?: string;
  orderNumber?: string;
  orderId?: string;
  productName: string;
  jewelryType: string;
  metalType?: string;
  gemstoneType?: string;
  codeInfo?: string;
  photoPreviews?: string[];
  images?: string[];
  photos?: (File | string)[];
  notes?: string;
  customerNotes?: string;
  estimatedValue?: number;
}

export interface UpdateCustomerSubmissionDTO {
  status?: AppraisalSubmissionStatus;
  notes?: string;
  customerNotes?: string;
  appraiserNotes?: string;
  estimatedValue?: number;
  appraisedValue?: number;
}

