import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  Copy,
  Check,
  Tag,
  Trash2,
  Edit2,
  ExternalLink,
  Award,
  Filter,
  RefreshCw,
  X,
  Eye,
  FileText,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import type {
  JewelryAppraisal,
  JewelryType,
  AppraisalStatus,
  CustomerAppraisalSubmission,
  AppraisalSubmissionStatus,
} from '../../types/appraisal';
import {
  appraisalService,
  APPRAISALS_UPDATED_EVENT,
  APPRAISAL_SUBMISSIONS_UPDATED_EVENT,
} from '../../services/appraisalService';

interface AdminAppraisalsProps {
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

const PRESET_IMAGES = [
  { label: 'Diamond Solitaire Ring', url: '/assets/ilovesurprises/appraisals/diamond-solitaire-ring.jpg' },
  { label: 'Gold CZ Stud Earrings', url: '/assets/ilovesurprises/appraisals/gold-cz-stud-earrings.jpg' },
  { label: 'Sterling Silver Halo Ring', url: '/assets/ilovesurprises/appraisals/sterling-silver-halo-ring.jpg' },
  { label: 'Sapphire & Diamond Pendant', url: '/assets/ilovesurprises/appraisals/sapphire-halo-pendant.jpg' },
  { label: '14K Gold Tennis Bracelet', url: '/assets/ilovesurprises/appraisals/gold-tennis-bracelet.jpg' },
];

export const AdminAppraisals: React.FC<AdminAppraisalsProps> = ({ onShowToast }) => {
  // Navigation Section: Customer Submissions vs Certificate Lookup Codes
  const [activeSection, setActiveSection] = useState<'submissions' | 'certificates'>('submissions');

  // Customer Submissions State
  const [submissions, setSubmissions] = useState<CustomerAppraisalSubmission[]>(() =>
    appraisalService.getAllSubmissions()
  );
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<'all' | AppraisalSubmissionStatus>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<CustomerAppraisalSubmission | null>(null);
  const [reviewStatus, setReviewStatus] = useState<AppraisalSubmissionStatus>('pending');
  const [reviewValuation, setReviewValuation] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState<string>('');

  // Certificate Codes State
  const [appraisals, setAppraisals] = useState<JewelryAppraisal[]>(() =>
    appraisalService.getAllAppraisals()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewingCertificate, setViewingCertificate] = useState<JewelryAppraisal | null>(null);

  // Modal State for Add / Edit Certificate
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryAppraisal | null>(null);

  // Form State for Certificate
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'Ring' as JewelryType,
    estimatedValue: 0,
    image: PRESET_IMAGES[0].url,
    material: '',
    stone: '',
    cutSetting: '',
    description: '',
    status: 'active' as AppraisalStatus,
    serialNumber: '',
    inspectedDate: '',
    customerName: '',
    customerEmail: '',
    orderId: '',
    productName: '',
  });

  // Subscribe to service updates
  useEffect(() => {
    const handleUpdate = () => {
      setAppraisals(appraisalService.getAllAppraisals());
    };
    const handleSubmissionsUpdate = () => {
      setSubmissions(appraisalService.getAllSubmissions());
    };

    window.addEventListener(APPRAISALS_UPDATED_EVENT, handleUpdate);
    window.addEventListener(APPRAISAL_SUBMISSIONS_UPDATED_EVENT, handleSubmissionsUpdate);
    return () => {
      window.removeEventListener(APPRAISALS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener(APPRAISAL_SUBMISSIONS_UPDATED_EVENT, handleSubmissionsUpdate);
    };
  }, []);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const q = submissionSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        sub.customerName.toLowerCase().includes(q) ||
        sub.customerEmail.toLowerCase().includes(q) ||
        sub.productName.toLowerCase().includes(q) ||
        sub.jewelryType.toLowerCase().includes(q) ||
        (sub.orderNumber && sub.orderNumber.toLowerCase().includes(q)) ||
        (sub.codeInfo && sub.codeInfo.toLowerCase().includes(q));

      const matchesStatus =
        submissionStatusFilter === 'all' || sub.status === submissionStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [submissions, submissionSearch, submissionStatusFilter]);

  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'pending').length;
  const approvedSubmissionsCount = submissions.filter((s) => s.status === 'approved').length;
  const reviewedSubmissionsCount = submissions.filter((s) => s.status === 'reviewed').length;

  // Filtered appraisals
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.code.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.material.toLowerCase().includes(q) ||
        (item.stone && item.stone.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [appraisals, searchQuery, selectedType, selectedStatus]);

  // KPIs
  const totalCodes = appraisals.length;
  const activeCodes = appraisals.filter((a) => a.status === 'active').length;
  const totalValuePool = appraisals.reduce((acc, a) => acc + (a.status === 'active' ? a.estimatedValue : 0), 0);
  const avgValue = activeCodes > 0 ? totalValuePool / activeCodes : 0;

  const handleCopyCode = (codeToCopy: string, id: string) => {
    navigator.clipboard.writeText(codeToCopy);
    setCopiedId(id);
    onShowToast(`Copied code "${codeToCopy}" to clipboard`, {
      title: 'Code Copied',
      type: 'success',
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    const randSerial = `ILS-VAL-${Math.floor(100000 + Math.random() * 900000)}`;
    setFormData({
      code: '',
      name: '',
      type: 'Ring',
      estimatedValue: 250,
      image: PRESET_IMAGES[0].url,
      material: 'Solid .925 Sterling Silver',
      stone: 'AAA Cubic Zirconia',
      cutSetting: 'Four-Prong Solitaire',
      description: 'Handcrafted genuine fine jewelry surprise reveal.',
      status: 'active',
      serialNumber: randSerial,
      inspectedDate: 'March 2026',
      customerName: '',
      customerEmail: '',
      orderId: '',
      productName: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: JewelryAppraisal) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      type: item.type,
      estimatedValue: item.estimatedValue,
      image: item.image,
      material: item.material,
      stone: item.stone || '',
      cutSetting: item.cutSetting || '',
      description: item.description,
      status: item.status,
      serialNumber: item.serialNumber,
      inspectedDate: item.inspectedDate,
      customerName: item.customerName || '',
      customerEmail: item.customerEmail || '',
      orderId: item.orderId || '',
      productName: item.productName || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveAppraisal = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      alert('Please enter a jewelry code');
      return;
    }

    if (editingItem) {
      appraisalService.updateAppraisal(editingItem.id, {
        code: formData.code,
        name: formData.name,
        type: formData.type,
        estimatedValue: Number(formData.estimatedValue),
        image: formData.image,
        material: formData.material,
        stone: formData.stone,
        cutSetting: formData.cutSetting,
        description: formData.description,
        status: formData.status,
        serialNumber: formData.serialNumber,
        inspectedDate: formData.inspectedDate,
        customerName: formData.customerName.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        orderId: formData.orderId.trim() || undefined,
        productName: formData.productName.trim() || undefined,
      });

      onShowToast(`Appraisal code "${formData.code}" updated successfully.`, {
        title: 'Appraisal Updated',
        type: 'success',
      });
    } else {
      appraisalService.addAppraisal({
        code: formData.code,
        name: formData.name,
        type: formData.type,
        estimatedValue: Number(formData.estimatedValue),
        image: formData.image,
        material: formData.material,
        stone: formData.stone,
        cutSetting: formData.cutSetting,
        description: formData.description,
        status: formData.status,
        serialNumber: formData.serialNumber,
        inspectedDate: formData.inspectedDate,
        customerName: formData.customerName.trim() || undefined,
        customerEmail: formData.customerEmail.trim() || undefined,
        orderId: formData.orderId.trim() || undefined,
        productName: formData.productName.trim() || undefined,
      });

      onShowToast(`New appraisal code "${formData.code}" registered!`, {
        title: 'Appraisal Added',
        type: 'success',
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to delete appraisal code "${code}"?`)) {
      appraisalService.deleteAppraisal(id);
      onShowToast(`Appraisal code "${code}" removed.`, {
        title: 'Code Deleted',
        type: 'info',
      });
    }
  };

  const handleToggleStatus = (item: JewelryAppraisal) => {
    const newStatus = item.status === 'active' ? 'archived' : 'active';
    appraisalService.updateAppraisal(item.id, { status: newStatus });
    onShowToast(`Appraisal "${item.code}" status changed to ${newStatus}.`, {
      type: 'info',
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Clear all local appraisal records?')) {
      appraisalService.resetToDefaults();
      onShowToast('Appraisals catalog cleared.', {
        title: 'Records Cleared',
        type: 'info',
      });
    }
  };

  const handleOpenReviewSubmission = (sub: CustomerAppraisalSubmission) => {
    setSelectedSubmission(sub);
    setReviewStatus(sub.status);
    setReviewValuation(sub.estimatedValue || 0);
    setReviewNotes(sub.notes || '');
  };

  const handleSaveSubmissionReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    appraisalService.updateSubmission(selectedSubmission.id, {
      status: reviewStatus,
      estimatedValue: reviewValuation > 0 ? Number(reviewValuation) : undefined,
      notes: reviewNotes.trim() || undefined,
    });

    onShowToast(`Appraisal submission for ${selectedSubmission.customerName} updated (${reviewStatus}).`, {
      title: 'Submission Updated',
      type: 'success',
    });

    setSelectedSubmission(null);
  };

  const handleDeleteSubmission = (id: string, name: string) => {
    if (window.confirm(`Delete appraisal submission from ${name}?`)) {
      appraisalService.deleteSubmission(id);
      if (selectedSubmission?.id === id) setSelectedSubmission(null);
      onShowToast('Appraisal submission removed.', {
        title: 'Submission Deleted',
        type: 'info',
      });
    }
  };

  const handleConvertSubmissionToCertificate = (sub: CustomerAppraisalSubmission) => {
    setSelectedSubmission(null);
    const suggestedCode = sub.codeInfo
      ? appraisalService.normalizeCode(sub.codeInfo)
      : `ILS-${sub.jewelryType.toUpperCase().slice(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;

    setEditingItem(null);
    setFormData({
      code: suggestedCode,
      name: `${sub.jewelryType} - ${sub.productName}`,
      type: (['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Pendant'].includes(sub.jewelryType)
        ? sub.jewelryType
        : 'Ring') as JewelryType,
      estimatedValue: sub.estimatedValue || 250,
      image: PRESET_IMAGES[0].url,
      material: 'Solid .925 Sterling Silver',
      stone: 'AAA Cubic Zirconia',
      cutSetting: 'Custom Reveal Setting',
      description: `Official certified appraisal for surprise revealed fine jewelry from ${sub.productName}.`,
      status: 'active',
      serialNumber: `ILS-VAL-${Math.floor(100000 + Math.random() * 900000)}`,
      inspectedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      customerName: sub.customerName,
      customerEmail: sub.customerEmail,
      orderId: sub.orderNumber || '',
      productName: sub.productName,
    });
    setIsModalOpen(true);
    setActiveSection('certificates');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fff0f3] text-[#D30915] text-[10px] font-black uppercase tracking-wider mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Candle Surprise Valuation Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#141219] tracking-tight">
            Jewelry Appraisal Management
          </h1>
          <p className="text-xs sm:text-sm text-[#716d77]">
            Review customer appraisal submissions, assign valuations, and manage authentic jewelry certificate codes.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="h-[40px] px-3.5 rounded-[12px] bg-white border border-[#eedbe6] hover:bg-stone-50 text-[#55505a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Clear all local appraisal records"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Records</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="h-[40px] px-4 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Appraisal Code</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tab switcher: Customer Submissions vs Certificate Lookup Codes */}
      <div className="flex items-center gap-2 border-b border-[#eedbe6] bg-white p-2 rounded-2xl shadow-xs">
        <button
          type="button"
          onClick={() => setActiveSection('submissions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'submissions'
              ? 'bg-[#D30915] text-white shadow-2xs'
              : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Customer Submissions</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeSection === 'submissions' ? 'bg-white/20 text-white' : 'bg-[#fff0f3] text-[#D30915]'
            }`}
          >
            {submissions.length}
          </span>
          {pendingSubmissionsCount > 0 && (
            <span
              className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"
              title={`${pendingSubmissionsCount} pending review`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('certificates')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeSection === 'certificates'
              ? 'bg-[#D30915] text-white shadow-2xs'
              : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificate Verification Codes</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
              activeSection === 'certificates' ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#716d77]'
            }`}
          >
            {appraisals.length}
          </span>
        </button>
      </div>

      {/* 3. Customer Submissions View */}
      {activeSection === 'submissions' && (
        <div className="space-y-4">
          {/* Submissions KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
                Total Submissions
              </span>
              <div className="text-2xl font-black text-[#141219]">{submissions.length}</div>
              <span className="text-[11px] text-[#716d77] font-medium mt-1 block">
                From /appraise-your-jewelry
              </span>
            </div>

            <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
                Pending Review
              </span>
              <div className="text-2xl font-black text-amber-600">{pendingSubmissionsCount}</div>
              <span className="text-[11px] text-amber-700 font-bold mt-1 block">
                Awaiting Gemologist Review
              </span>
            </div>

            <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
                Reviewed Submissions
              </span>
              <div className="text-2xl font-black text-blue-600">{reviewedSubmissionsCount}</div>
              <span className="text-[11px] text-blue-700 font-bold mt-1 block">
                Preliminary Valuation Logged
              </span>
            </div>

            <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
                Approved Appraisals
              </span>
              <div className="text-2xl font-black text-emerald-600">{approvedSubmissionsCount}</div>
              <span className="text-[11px] text-emerald-700 font-bold mt-1 block">
                Official Valuations Issued
              </span>
            </div>
          </div>

          {/* Submissions Search & Filter */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#eedbe6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={submissionSearch}
                onChange={(e) => setSubmissionSearch(e.target.value)}
                placeholder="Search by customer name, email, product, order #..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
              />
              <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={submissionStatusFilter}
                onChange={(e) => setSubmissionStatusFilter(e.target.value as any)}
                className="h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#141219] focus:outline-none focus:border-[#D30915] cursor-pointer"
              >
                <option value="all">All Submission Statuses</option>
                <option value="pending">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
            {filteredSubmissions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <FileText className="w-10 h-10 text-gray-300 mx-auto" />
                <h3 className="text-base font-bold text-[#141219] m-0">No appraisal submissions found</h3>
                <p className="text-xs text-[#716d77] max-w-md mx-auto m-0">
                  {submissionSearch || submissionStatusFilter !== 'all'
                    ? 'No submissions match your active filter criteria.'
                    : 'Customer appraisal requests submitted through /appraise-your-jewelry will appear here for gemologist valuation.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Ref ID & Date</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-3">Item / Product</th>
                      <th className="py-3.5 px-3">Code / Tag</th>
                      <th className="py-3.5 px-3">Photos</th>
                      <th className="py-3.5 px-3">Status</th>
                      <th className="py-3.5 px-3">Valuation</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5eaf1] font-medium">
                    {filteredSubmissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#fffbfd] transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#141219] text-[11px]">{sub.id}</div>
                          <div className="text-[10px] text-[#716d77] mt-0.5">
                            {new Date(sub.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-bold text-[#141219]">{sub.customerName}</div>
                          <div className="text-[11px] text-[#716d77] truncate max-w-[180px]">
                            {sub.customerEmail}
                          </div>
                          {sub.orderNumber && (
                            <div className="text-[10px] text-purple-700 font-medium">
                              Order #{sub.orderNumber}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-[#141219] truncate max-w-[200px]">
                            {sub.productName}
                          </div>
                          <span className="inline-block mt-0.5 px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#fff0f3] text-[#D30915]">
                            {sub.jewelryType}
                          </span>
                        </td>

                        <td className="py-3 px-3 font-mono text-[11px] text-[#55505a]">
                          {sub.codeInfo ? (
                            <span className="font-bold text-[#141219]">{sub.codeInfo}</span>
                          ) : (
                            <span className="text-[#8a858f] italic">None</span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          {sub.photoPreviews && sub.photoPreviews.length > 0 ? (
                            <div className="flex items-center gap-1">
                              <img
                                src={sub.photoPreviews[0]}
                                alt="Jewelry preview"
                                className="w-8 h-8 rounded-lg object-cover border border-[#eedbe6]"
                              />
                              {sub.photoPreviews.length > 1 && (
                                <span className="text-[10px] font-bold text-[#716d77]">
                                  +{sub.photoPreviews.length - 1}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-[#8a858f]">No photos</span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {sub.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              <Clock className="w-3 h-3" />
                              <span>Pending</span>
                            </span>
                          )}
                          {sub.status === 'reviewed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                              <Check className="w-3 h-3" />
                              <span>Reviewed</span>
                            </span>
                          )}
                          {sub.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approved</span>
                            </span>
                          )}
                          {sub.status === 'rejected' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold">
                              <X className="w-3 h-3" />
                              <span>Rejected</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {sub.estimatedValue ? (
                            <span className="font-black text-[#D30915] text-xs">
                              ${sub.estimatedValue.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-[#8a858f] text-[11px] italic">Pending</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenReviewSubmission(sub)}
                              className="px-2.5 py-1 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-[#141219] hover:text-[#D30915] hover:border-[#D30915] text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Review</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubmission(sub.id, sub.customerName)}
                              className="p-1 rounded-lg text-[#716d77] hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete submission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Submission Review & Valuation Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D30915]" />
                <div>
                  <h3 className="text-base font-black text-[#141219] m-0">
                    Review Appraisal Submission
                  </h3>
                  <p className="text-[11px] text-[#716d77] m-0 mt-0.5">
                    Reference #{selectedSubmission.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="p-2 rounded-xl text-[#716d77] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer Details Summary */}
              <div className="p-3.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#716d77]">Customer Name:</span>
                  <span className="font-bold text-[#141219]">{selectedSubmission.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#716d77]">Customer Email:</span>
                  <span className="font-bold text-[#141219]">{selectedSubmission.customerEmail}</span>
                </div>
                {selectedSubmission.orderNumber && (
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Associated Order #:</span>
                    <span className="font-bold text-purple-700">{selectedSubmission.orderNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#716d77]">Product Revealed From:</span>
                  <span className="font-bold text-[#141219]">{selectedSubmission.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#716d77]">Jewelry Type:</span>
                  <span className="font-bold text-[#D30915]">{selectedSubmission.jewelryType}</span>
                </div>
                {selectedSubmission.codeInfo && (
                  <div className="flex justify-between">
                    <span className="text-[#716d77]">Customer Tag / Code:</span>
                    <span className="font-mono font-bold text-[#141219]">{selectedSubmission.codeInfo}</span>
                  </div>
                )}
              </div>

              {/* Photo Gallery Previews */}
              {selectedSubmission.photoPreviews && selectedSubmission.photoPreviews.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#141219]">Customer Uploaded Photos:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSubmission.photoPreviews.map((photo, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden border border-[#eedbe6] bg-gray-50 h-36">
                        <img
                          src={photo}
                          alt={`Customer photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gemologist Review Form */}
              <form onSubmit={handleSaveSubmissionReview} className="space-y-3 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-[11px] font-bold text-[#141219] mb-1">
                    Appraisal Status *
                  </label>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
                  >
                    <option value="pending">Pending Review</option>
                    <option value="reviewed">Reviewed (In Progress)</option>
                    <option value="approved">Approved (Certified)</option>
                    <option value="rejected">Rejected (Ineligible)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#141219] mb-1">
                    Appraised Value ($ MSRP)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={reviewValuation || ''}
                    onChange={(e) => setReviewValuation(Number(e.target.value))}
                    placeholder="e.g. 250"
                    className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#D30915]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#141219] mb-1">
                    Gemologist / Internal Review Notes
                  </label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Notes on metal purity, stones, appraisal rationale..."
                    className="w-full p-2.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-medium resize-none"
                  />
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => handleConvertSubmissionToCertificate(selectedSubmission)}
                    className="px-3.5 py-2 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    title="Generate a verifiable public lookup certificate code from this submission"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>Issue Certificate Code</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedSubmission(null)}
                      className="px-3 py-2 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                    >
                      Save Review
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 5. Certificate Codes View */}
      {activeSection === 'certificates' && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Registered Codes
          </span>
          <div className="text-2xl font-black text-[#141219]">{totalCodes}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            {activeCodes} Active for Lookup
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Total Appraised Value Pool
          </span>
          <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#D30915] to-[#B60711]">
            ${totalValuePool.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-[#716d77] font-medium mt-1 block">
            Active items in circulation
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Average Item Value
          </span>
          <div className="text-2xl font-black text-[#141219]">
            ${avgValue.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-purple-600 font-bold mt-1 block">
            $35 to $7,500 Range
          </span>
        </div>

        <div className="p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block mb-1">
            Customer Portal Route
          </span>
          <a
            href="/appraise-your-jewelry"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-black text-[#D30915] hover:underline flex items-center gap-1 mt-1 truncate"
          >
            <span>/appraise-your-jewelry</span>
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          </a>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
            ● Public Lookup Live
          </span>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="p-3 sm:p-4 rounded-[18px] bg-white border border-[#eedbe6] shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a858f]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search code, name, metal, gem..."
            className="w-full h-[40px] pl-10 pr-3.5 rounded-[12px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-medium text-[#141219] outline-none transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Type Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#8a858f]" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-[38px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none cursor-pointer"
            >
              <option value="all">All Jewelry Types</option>
              <option value="Ring">Rings</option>
              <option value="Necklace">Necklaces</option>
              <option value="Earrings">Earrings</option>
              <option value="Bracelet">Bracelets</option>
              <option value="Pendant">Pendants</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-[38px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </select>
        </div>
      </div>

      {/* 4. Appraisals Data Table */}
      <div className="rounded-[20px] bg-white border border-[#eedbe6] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto w-full max-w-full min-w-0 scrollbar-thin">
          <table className="w-full text-left text-xs text-[#141219] border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#f0e2ec] bg-[#fffafc] text-[10px] font-black uppercase tracking-wider text-[#716d77]">
                <th className="py-3 px-4">Jewelry Item</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Specs &amp; Materials</th>
                <th className="py-3 px-4">Retail Value</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f4edf2]">
              {filteredAppraisals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#716d77]">
                    <Tag className="w-8 h-8 text-[#d3cad1] mx-auto mb-2" />
                    <p className="font-bold">{appraisals.length === 0 ? 'No appraisal records yet' : 'No appraisal records found'}</p>
                    <p className="text-[11px]">{appraisals.length === 0 ? 'Register authentic jewelry appraisal codes printed inside surprise candles for customer certificate verification.' : 'Try adjusting your search query or filter.'}</p>
                  </td>
                </tr>
              ) : (
                filteredAppraisals.map((item) => (
                  <tr key={item.id} className="hover:bg-[#fff9fb] transition-colors">
                    {/* Item Thumbnail & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-11 h-11 rounded-[10px] object-cover bg-stone-100 border border-[#eedfe8] shrink-0"
                        />
                        <div className="min-w-0 max-w-[220px]">
                          <span className="font-bold text-[#141219] block truncate text-xs" title={item.name}>
                            {item.name}
                          </span>
                          <span className="text-[10px] text-[#8a858f] block truncate">
                            #{item.serialNumber} • {item.inspectedDate}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Code (Copyable) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#faf5f8] border border-[#f0dfec]">
                        <span className="font-mono font-black text-[#D30915] text-[11px]">{item.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(item.code, item.id)}
                          className="text-[#8a858f] hover:text-[#D30915] transition-colors cursor-pointer"
                          title="Copy Code"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-bold">
                        <Award className="w-3 h-3 text-[#D30915]" />
                        <span>{item.type}</span>
                      </span>
                    </td>

                    {/* Specs & Material */}
                    <td className="py-3 px-4 max-w-[200px]">
                      <div className="text-[11px] font-medium text-[#332e38] truncate" title={item.material}>
                        {item.material}
                      </div>
                      {item.stone && (
                        <div className="text-[10px] text-[#8a858f] truncate" title={item.stone}>
                          {item.stone}
                        </div>
                      )}
                    </td>

                    {/* Value */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-sm font-black text-[#D30915]">
                        ${item.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-600' : 'bg-stone-500'}`} />
                        <span>{item.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingCertificate(item)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-[#D30915] hover:bg-[#fff0f3] transition-colors cursor-pointer"
                          title="View Official Certificate Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-[#D30915] hover:bg-[#fff0f3] transition-colors cursor-pointer"
                          title="Edit Appraisal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.code)}
                          className="p-1.5 rounded-lg text-[#55505a] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    )}

      {/* 5. Add / Edit Appraisal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-[24px] bg-white border border-[#eedbe6] shadow-2xl p-5 sm:p-7 relative animate-in fade-in zoom-in-95 duration-200 my-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] block mb-1">
                {editingItem ? 'Edit Existing Record' : 'Register New Item'}
              </span>
              <h2 className="text-xl font-black text-[#141219]">
                {editingItem ? 'Edit Jewelry Appraisal' : 'New Jewelry Appraisal Code'}
              </h2>
            </div>

            <form onSubmit={handleSaveAppraisal} className="space-y-4 text-xs font-bold text-[#141219]">
              {/* Code & Value Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ILS-RUBY-500"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-mono font-black text-[#D30915] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Estimated Value ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step={1}
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-black text-[#141219] outline-none"
                  />
                </div>
              </div>

              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. 14K Gold CZ Halo Ring"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] focus:bg-white text-xs font-medium text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Jewelry Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as JewelryType })}
                    className="w-full h-[40px] px-2.5 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] text-xs font-bold text-[#141219] outline-none"
                  >
                    <option value="Ring">Ring</option>
                    <option value="Necklace">Necklace</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Bracelet">Bracelet</option>
                    <option value="Pendant">Pendant</option>
                  </select>
                </div>
              </div>

              {/* Material & Stone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Precious Metal / Material
                  </label>
                  <input
                    type="text"
                    value={formData.material}
                    onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                    placeholder="e.g. Solid .925 Sterling Silver"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                    Stone / Gemstone Details
                  </label>
                  <input
                    type="text"
                    value={formData.stone}
                    onChange={(e) => setFormData({ ...formData, stone: e.target.value })}
                    placeholder="e.g. AAA Cubic Zirconia"
                    className="w-full h-[40px] px-3 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none"
                  />
                </div>
              </div>

              {/* Image Preset Select */}
              <div>
                <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                  Jewelry Image Preset
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setFormData({ ...formData, image: preset.url })}
                      className={`relative aspect-square rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${
                        formData.image === preset.url
                          ? 'border-[#D30915] ring-2 ring-[#D30915]/30'
                          : 'border-[#eedbe6] opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Linked Customer, Order, and Product Traceability */}
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-stone-500 block">
                  Customer & Order Traceability (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Customer Name</label>
                    <input
                      type="text"
                      placeholder="Your name"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Customer Email</label>
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Order Number / ID</label>
                    <input
                      type="text"
                      placeholder="e.g. ILS-89104-US"
                      value={formData.orderId}
                      onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-[#716d77] mb-1">Source Candle / Product</label>
                    <input
                      type="text"
                      placeholder="e.g. Midnight Amber Cash Candle"
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      className="w-full h-[36px] px-3 rounded-[10px] bg-white border border-[#e5dfe5] text-xs font-medium outline-none focus:border-[#D30915]"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] uppercase text-[#716d77] mb-1">
                  Artisan Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the surprise piece revealed inside the candle..."
                  className="w-full p-2.5 rounded-[10px] bg-[#fffafc] border border-[#e5dfe5] focus:border-[#D30915] text-xs font-medium text-[#141219] outline-none resize-none"
                />
              </div>

              {/* Status */}
              <div className="flex items-center gap-4 pt-1">
                <span className="text-[10px] uppercase text-[#716d77]">Status:</span>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="accent-[#D30915]"
                  />
                  <span>Active (Visible in Lookup)</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'archived'}
                    onChange={() => setFormData({ ...formData, status: 'archived' })}
                    className="accent-[#D30915]"
                  />
                  <span>Archived</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4edf2]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-[40px] px-4 rounded-[12px] border border-[#eedbe6] bg-white text-xs font-bold text-[#55505a] hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-[40px] px-5 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  {editingItem ? 'Save Changes' : 'Create Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. View Certificate Details Modal */}
      {viewingCertificate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[28px] bg-white border-2 border-[#eedbe6] shadow-2xl p-6 sm:p-8 relative my-auto space-y-5">
            <button
              type="button"
              onClick={() => setViewingCertificate(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-500 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Certificate Header Banner */}
            <div className="text-center pb-4 border-b border-stone-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mb-2">
                <Award className="w-6 h-6 text-[#D30915]" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#D30915] block">
                Official Certification of Authenticity & Valuation
              </span>
              <h3 className="text-xl font-black text-[#141219] mt-0.5">
                {viewingCertificate.name}
              </h3>
              <div className="flex items-center justify-center gap-2 text-xs font-mono text-stone-500 mt-1">
                <span>Cert #{viewingCertificate.serialNumber}</span>
                <span>•</span>
                <span className="font-bold text-[#D30915]">Code: {viewingCertificate.code}</span>
              </div>
            </div>

            {/* Certificate Card Content */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-2xl border border-stone-200">
                <img
                  src={viewingCertificate.image}
                  alt={viewingCertificate.name}
                  className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] uppercase font-bold text-stone-500 block">
                    Certified Estimated Replacement Value
                  </span>
                  <span className="text-2xl font-black text-[#D30915]">
                    ${viewingCertificate.estimatedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">
                    Inspected: {viewingCertificate.inspectedDate}
                  </span>
                </div>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-[#fffbfd] p-3 rounded-2xl border border-[#eedbe6]">
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block">Material & Metal</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.material}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-stone-500 block">Stone & Clarity</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.stone || 'Natural Accents'}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-[#f7eff4]">
                  <span className="text-[10px] font-bold text-stone-500 block">Setting & Cut</span>
                  <span className="font-bold text-[#141219]">{viewingCertificate.cutSetting || 'Artisan Prong Setting'}</span>
                </div>
              </div>

              {/* Customer / Order / Product Traceability */}
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600 block">
                  Traceability & Record Connection
                </span>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Linked Customer:</span>
                  <span className="font-bold text-[#141219]">
                    {viewingCertificate.customerName
                      ? `${viewingCertificate.customerName} (${viewingCertificate.customerEmail || ''})`
                      : 'Inventory Pool / Unclaimed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Linked Order ID:</span>
                  <span className="font-mono font-bold text-[#D30915]">
                    {viewingCertificate.orderId || 'Stock Item'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Source Candle / Product:</span>
                  <span className="font-bold text-[#141219]">
                    {viewingCertificate.productName || 'Fine Jewelry Cash Candle'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-stone-100">
              <a
                href={`/appraise-your-jewelry?code=${encodeURIComponent(viewingCertificate.code)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 h-[42px] px-4 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
              >
                <span>Open Public Certificate Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setViewingCertificate(null)}
                className="h-[42px] px-4 rounded-xl border border-stone-200 bg-white text-xs font-bold text-stone-700 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
