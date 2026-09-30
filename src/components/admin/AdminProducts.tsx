import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Package,
  AlertTriangle,
  CheckCircle2,
  X,
  UploadCloud,
  Tag,
  ArrowUpDown,
  Gift,
} from 'lucide-react';
import { AdminCustomSelect, type AdminSelectOption } from './AdminCustomSelect';
import type {
  AdminProductItem,
  AdminCollectionItem,
  AdminProductOption,
  AdminProductVariant,
} from '../../types/admin';

interface AdminProductsProps {
  products: AdminProductItem[];
  collections: AdminCollectionItem[];
  canEdit?: boolean;
  onAddProduct?: (product: Partial<AdminProductItem>) => Promise<any> | void;
  onEditProduct?: (id: string, updates: Partial<AdminProductItem>) => Promise<any> | void;
  onDeleteProduct?: (id: string) => Promise<any> | void;
  onToggleProductStatus?: (id: string) => Promise<any> | void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  collections,
  canEdit = true,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onToggleProductStatus,
  onShowToast,
}) => {
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc'>('name_asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'pricing' | 'variants' | 'images'>('general');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState(collections[0]?.name || 'Cash Candles');
  const [formPrice, setFormPrice] = useState('29.99');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formStock, setFormStock] = useState('50');
  const [formLowStockThreshold, setFormLowStockThreshold] = useState('10');
  const [formSurpriseType, setFormSurpriseType] = useState('cash');
  const [formSurpriseValue, setFormSurpriseValue] = useState('$100 Cash Prize');
  const [formIsBestSeller, setFormIsBestSeller] = useState(false);
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');

  // Images state in modal
  const [formImages, setFormImages] = useState<string[]>([
    '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
  ]);
  const [newImageUrl, setNewImageUrl] = useState('');

  // Options & Variants state in modal
  const [formOptions, setFormOptions] = useState<AdminProductOption[]>([]);
  const [formVariants, setFormVariants] = useState<AdminProductVariant[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState('');

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Reset pagination when filters change
  const handleFilterChange = (setter: (val: any) => void, val: any) => {
    setter(val);
    setCurrentPage(1);
  };

  // Memoized Select Options for Dropdowns
  const categoryOptions: AdminSelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      ...collections.map((c) => ({
        value: c.name,
        label: c.name,
        badge: c.featured ? 'Featured' : undefined,
      })),
    ],
    [collections]
  );

  const stockOptions: AdminSelectOption[] = useMemo(
    () => [
      { value: 'all', label: 'All Stock Statuses' },
      {
        value: 'in_stock',
        label: 'In Stock (>10)',
        badge: 'Optimal',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      },
      {
        value: 'low_stock',
        label: 'Low Stock (1–10)',
        badge: 'Low Alert',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      },
      {
        value: 'out_of_stock',
        label: 'Out of Stock (0)',
        badge: 'Sold Out',
        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      },
    ],
    []
  );

  const sortOptions: AdminSelectOption[] = useMemo(
    () => [
      { value: 'name_asc', label: 'Title (A to Z)' },
      { value: 'price_asc', label: 'Price (Low to High)' },
      { value: 'price_desc', label: 'Price (High to Low)' },
      { value: 'stock_asc', label: 'Stock (Low to High)' },
      { value: 'stock_desc', label: 'Stock (High to Low)' },
    ],
    []
  );

  const pageSizeOptions: AdminSelectOption[] = useMemo(
    () => [
      { value: '10', label: '10' },
      { value: '25', label: '25' },
      { value: '50', label: '50' },
    ],
    []
  );

  const formCategoryOptions: AdminSelectOption[] = useMemo(
    () =>
      collections.map((c) => ({
        value: c.name,
        label: c.name,
        badge: c.featured ? 'Featured' : undefined,
      })),
    [collections]
  );

  const formStatusOptions: AdminSelectOption[] = useMemo(
    () => [
      {
        value: 'active',
        label: 'Active (Published)',
        badge: 'Live',
        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        description: 'Visible to storefront shoppers',
      },
      {
        value: 'draft',
        label: 'Draft (Hidden)',
        badge: 'Draft',
        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Hidden from public storefront catalog',
      },
      {
        value: 'archived',
        label: 'Archived',
        badge: 'Archived',
        badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
        description: 'Decommissioned product record',
      },
    ],
    []
  );

  const formSurpriseOptions: AdminSelectOption[] = useMemo(
    () => [
      { value: 'cash', label: 'Real Cash ($2 to $2,500)', badge: 'Cash Inside' },
      { value: 'ring', label: 'Genuine Ring Reveal', badge: 'Up to $5,000' },
      { value: 'necklace', label: 'Luxury Necklace Reveal', badge: 'Fine Jewels' },
      { value: 'earrings', label: 'Diamond Earrings Reveal', badge: 'Certified' },
      { value: 'bracelet', label: 'Tennis Bracelet Reveal', badge: 'Prestige' },
    ],
    []
  );

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);

      const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;

      let matchesStock = true;
      if (stockFilter === 'in_stock') matchesStock = p.stock > 10;
      else if (stockFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
      else if (stockFilter === 'out_of_stock') matchesStock = p.stock === 0;

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'stock_asc') return a.stock - b.stock;
      if (sortBy === 'stock_desc') return b.stock - a.stock;
      return 0;
    });
  }, [products, searchQuery, categoryFilter, stockFilter, statusFilter, sortBy]);

  // Paginated Products
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Handlers for Add/Edit Modal
  const handleOpenAdd = () => {
    setEditingProductId(null);
    setFormName('');
    setFormDescription('');
    setFormCategory(collections[0]?.name || 'Cash Candles');
    setFormPrice('29.99');
    setFormOriginalPrice('');
    setFormSku(`ILS-${Math.floor(1000 + Math.random() * 9000)}`);
    setFormStock('50');
    setFormLowStockThreshold('10');
    setFormSurpriseType('cash');
    setFormSurpriseValue('$100 Cash Prize');
    setFormIsBestSeller(false);
    setFormStatus('active');
    setFormImages(['/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg']);
    setFormOptions([]);
    setFormVariants([]);
    setModalTab('general');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: AdminProductItem) => {
    setEditingProductId(p.id);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setFormSku(p.sku);
    setFormStock(p.stock.toString());
    setFormLowStockThreshold((p.lowStockThreshold || 10).toString());
    setFormSurpriseType(p.surpriseType || 'cash');
    setFormSurpriseValue(p.surpriseValue || '');
    setFormIsBestSeller(Boolean(p.isBestSeller));
    setFormStatus(p.status || 'active');
    setFormImages(p.images && p.images.length > 0 ? p.images : [p.image]);
    setFormOptions(p.options || []);
    setFormVariants(p.variants || []);
    setModalTab('general');
    setIsModalOpen(true);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  const handleFilesSelected = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (fileArray.length === 0) {
      onShowToast('Please select valid image files (JPG, PNG, WEBP)', { type: 'info' });
      return;
    }

    let loadedCount = 0;
    const newPreviews: string[] = [];

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === 'string') {
          newPreviews.push(e.target.result);
        }
        loadedCount += 1;
        if (loadedCount === fileArray.length) {
          setFormImages((prev) => [...prev, ...newPreviews]);
          onShowToast(`Added ${newPreviews.length} image${newPreviews.length > 1 ? 's' : ''} to preview (ready for future storage upload)`, {
            type: 'success',
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMoveImage = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formImages.length) return;
    const updated = [...formImages];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFormImages(updated);
  };

  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = newImageUrl.trim();
    if (!cleanUrl) return;
    if (formImages.includes(cleanUrl)) {
      onShowToast('Image URL already added', { type: 'info' });
      return;
    }
    setFormImages([...formImages, cleanUrl]);
    setNewImageUrl('');
  };

  const handleRemoveImage = (indexToRemove: number) => {
    if (formImages.length <= 1) {
      onShowToast('Product must have at least one image', { type: 'info' });
      return;
    }
    setFormImages(formImages.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSetPrimaryImage = (indexToPrimary: number) => {
    const selected = formImages[indexToPrimary];
    const rest = formImages.filter((_, idx) => idx !== indexToPrimary);
    setFormImages([selected, ...rest]);
    onShowToast('Primary display image updated', { type: 'success' });
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newOptionName.trim();
    const values = newOptionValues
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

    if (!name || values.length === 0) {
      onShowToast('Please provide an option name and comma-separated values', { type: 'info' });
      return;
    }

    const updatedOptions = [...formOptions, { name, values }];
    setFormOptions(updatedOptions);
    setNewOptionName('');
    setNewOptionValues('');

    // Generate variant combinations
    const newVariants: AdminProductVariant[] = [];
    if (updatedOptions.length === 1) {
      updatedOptions[0].values.forEach((val, idx) => {
        newVariants.push({
          id: `var-${Date.now()}-${idx}`,
          sku: `${formSku || 'ILS'}-${val.replace(/\s+/g, '').toUpperCase()}`,
          title: val,
          price: parseFloat(formPrice) || 29.99,
          compareAtPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
          stock: Math.floor(parseInt(formStock, 10) / updatedOptions[0].values.length) || 10,
          options: { [updatedOptions[0].name]: val },
        });
      });
    }
    if (newVariants.length > 0) setFormVariants(newVariants);
    onShowToast(`Option "${name}" added with ${values.length} values`, { type: 'success' });
  };

  const handleRemoveOption = (index: number) => {
    setFormOptions(formOptions.filter((_, idx) => idx !== index));
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Product title is required', { type: 'info' });
      return;
    }

    const payload: Partial<AdminProductItem> = {
      name: formName.trim(),
      category: formCategory,
      price: parseFloat(formPrice) || 29.99,
      originalPrice: formOriginalPrice ? parseFloat(formOriginalPrice) : undefined,
      description: formDescription.trim() || undefined,
      sku: formSku.trim() || `ILS-${Date.now().toString().slice(-4)}`,
      stock: parseInt(formStock, 10) || 0,
      lowStockThreshold: parseInt(formLowStockThreshold, 10) || 10,
      surpriseType: formSurpriseType,
      surpriseValue: formSurpriseValue.trim(),
      image: formImages[0] || '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
      images: formImages,
      options: formOptions,
      variants: formVariants,
      isBestSeller: formIsBestSeller,
      status: formStatus,
    };

    if (editingProductId) {
      if (onEditProduct) await onEditProduct(editingProductId, payload);
    } else {
      if (onAddProduct) await onAddProduct(payload);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (onDeleteProduct) await onDeleteProduct(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Top Action & KPI Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Product & Inventory Catalog
            </h2>
            <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Manage multi-variant surprise reveals, ring sizes, pricing, stock levels, and media galleries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              id="admin-add-product-btn"
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="lg:col-span-2 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleFilterChange(setSearchQuery, e.target.value)}
              placeholder="Search by title, SKU, or category..."
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
            />
            <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Filter */}
          <div>
            <AdminCustomSelect
              options={categoryOptions}
              value={categoryFilter}
              onChange={(val) => handleFilterChange(setCategoryFilter, val)}
              icon={<Tag className="w-3.5 h-3.5" />}
              placeholder="Category"
            />
          </div>

          {/* Stock Filter */}
          <div>
            <AdminCustomSelect
              options={stockOptions}
              value={stockFilter}
              onChange={(val) => handleFilterChange(setStockFilter, val)}
              icon={<Package className="w-3.5 h-3.5" />}
              placeholder="Stock Status"
            />
          </div>

          {/* Sort By */}
          <div>
            <AdminCustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={(val) => handleFilterChange(setSortBy, val as any)}
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              placeholder="Sort By"
            />
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-[#f4e2ed] text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[#716d77] font-semibold">Status:</span>
            {(['all', 'active', 'draft', 'archived'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleFilterChange(setStatusFilter, st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${statusFilter === st
                    ? 'bg-[#D30915] text-white'
                    : 'bg-[#faf7f9] text-[#716d77] hover:bg-gray-100'
                  }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="text-[#716d77] text-xs">
            Showing <strong className="text-[#141219]">{paginatedProducts.length}</strong> of{' '}
            <strong className="text-[#141219]">{filteredProducts.length}</strong> matching products
          </div>
        </div>
      </div>

      {/* 3. Products Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        {paginatedProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D30915] flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#141219]">No products match your criteria</h3>
            <p className="text-xs text-[#716d77] max-w-sm mx-auto">
              Try adjusting your search query, category filter, or stock threshold.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStockFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#D30915] hover:bg-red-50 transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Item & Details</th>
                  <th className="py-3 px-3">SKU / Category</th>
                  <th className="py-3 px-3">Price</th>
                  <th className="py-3 px-3">Reveal Value</th>
                  <th className="py-3 px-3">Stock Level</th>
                  <th className="py-3 px-3">Status</th>
                  {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5eaf1] font-medium">
                {paginatedProducts.map((p) => {
                  const isLowStock = p.stock > 0 && p.stock <= (p.lowStockThreshold || 10);
                  const isOutStock = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#fffbfd] transition-colors">
                      {/* Item Thumbnail & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-11 h-11 rounded-xl object-cover border border-[#eedbe6] shrink-0 bg-gray-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
                            }}
                          />
                          <div className="min-w-0 max-w-[280px]">
                            <div className="font-bold text-[#141219] truncate">{p.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {p.isBestSeller && (
                                <span className="text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded">
                                  Best Seller
                                </span>
                              )}
                              {p.variants && p.variants.length > 0 && (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                  {p.variants.length} Variants
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Category */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-[#716d77]">{p.sku}</div>
                        <div className="text-xs font-bold text-[#54217f] mt-0.5">{p.category}</div>
                      </td>

                      {/* Price */}
                      <td className="py-3 px-3">
                        <div className="font-black text-xs text-[#141219]">${p.price.toFixed(2)}</div>
                        {p.originalPrice && (
                          <div className="text-[10px] text-[#8a858f] line-through">
                            ${p.originalPrice.toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Surprise Reveal */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize bg-purple-50 text-purple-700 border border-purple-200">
                          {p.surpriseType || 'Cash'}
                        </span>
                        {p.surpriseValue && (
                          <div className="text-[10px] text-[#716d77] font-semibold mt-0.5">
                            {p.surpriseValue}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="py-3 px-3">
                        {isOutStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Out of Stock</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low: {p.stock} left</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{p.stock} in stock</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${p.status === 'active'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                          {p.status || 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onToggleProductStatus && (
                              <button
                                type="button"
                                onClick={() => onToggleProductStatus(p.id)}
                                title={p.status === 'active' ? 'Unpublish to Draft' : 'Publish to Store'}
                                className="p-1.5 rounded-lg border border-[#eedbe6] text-[#716d77] hover:text-[#141219] hover:bg-gray-50 transition-all cursor-pointer"
                              >
                                {p.status === 'active' ? (
                                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              title="Edit Product"
                              className="p-1.5 rounded-lg border border-[#eedbe6] text-[#716d77] hover:text-[#D30915] hover:border-[#D30915] hover:bg-red-50 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}
                              title="Delete Product"
                              className="p-1.5 rounded-lg border border-[#eedbe6] text-[#716d77] hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Pagination Controls */}
        {filteredProducts.length > 0 && (
          <div className="p-4 border-t border-[#eedbe6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#716d77]">
            <div className="flex items-center gap-2">
              <AdminCustomSelect
                options={pageSizeOptions}
                value={String(pageSize)}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                size="sm"
                className="w-16"
              />
              <span>per page</span>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="font-medium">
                Page <strong className="text-[#141219]">{currentPage}</strong> of{' '}
                <strong className="text-[#141219]">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-lg border border-[#eedbe6] disabled:opacity-30 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 rounded-lg border border-[#eedbe6] disabled:opacity-30 hover:bg-gray-50 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Product Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D30915] flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#141219] m-0">
                    {editingProductId ? 'Edit Product Details' : 'Add New Catalog Product'}
                  </h3>
                  <p className="text-[11px] text-[#716d77] m-0">
                    Configure titles, prices, surprise values, multi-variants, and photo galleries.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-[#716d77] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Sub-Tabs */}
            <div className="flex items-center gap-1 px-4 pt-3 border-b border-[#eedbe6] bg-[#fdf9fb] text-xs font-bold">
              {[
                { id: 'general', label: 'General & Surprise' },
                { id: 'pricing', label: 'Pricing & Stock' },
                { id: 'variants', label: `Options (${formOptions.length})` },
                { id: 'images', label: `Images (${formImages.length})` },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setModalTab(t.id as any)}
                  className={`px-3 py-2 border-b-2 transition-all cursor-pointer ${modalTab === t.id
                      ? 'border-[#D30915] text-[#D30915]'
                      : 'border-transparent text-[#716d77] hover:text-[#141219]'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-4 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
              {modalTab === 'general' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Sweet Pea Diamond Carat Candle – 21 oz Luxury Candle"
                      className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Category</label>
                      <AdminCustomSelect
                        options={formCategoryOptions}
                        value={formCategory}
                        onChange={(val) => setFormCategory(val)}
                        placeholder="Select category"
                        icon={<Tag className="w-3.5 h-3.5" />}
                        variant="form"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Publication Status</label>
                      <AdminCustomSelect
                        options={formStatusOptions}
                        value={formStatus}
                        onChange={(val) => setFormStatus(val as any)}
                        placeholder="Select publication status"
                        variant="form"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141219] mb-1">Product Description</label>
                    <textarea
                      rows={3}
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="Enter aromatic notes, soy wax details, reveal prize descriptions..."
                      className="w-full p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f4e2ed]">
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Surprise Reveal Type</label>
                      <AdminCustomSelect
                        options={formSurpriseOptions}
                        value={formSurpriseType}
                        onChange={(val) => setFormSurpriseType(val)}
                        placeholder="Select surprise reveal type"
                        icon={<Gift className="w-3.5 h-3.5" />}
                        variant="form"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Surprise Reveal Value Description</label>
                      <input
                        type="text"
                        value={formSurpriseValue}
                        onChange={(e) => setFormSurpriseValue(e.target.value)}
                        placeholder="e.g. $10 to $5,000 Ring Prize Inside"
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isBestSellerCheck"
                      checked={formIsBestSeller}
                      onChange={(e) => setFormIsBestSeller(e.target.checked)}
                      className="w-4 h-4 accent-[#D30915] rounded cursor-pointer"
                    />
                    <label htmlFor="isBestSellerCheck" className="text-xs font-bold text-[#141219] cursor-pointer">
                      Mark as Best Seller Badge on Storefront
                    </label>
                  </div>
                </div>
              )}

              {modalTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Retail Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-bold focus:outline-none focus:border-[#D30915]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Compare-At Price ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formOriginalPrice}
                        onChange={(e) => setFormOriginalPrice(e.target.value)}
                        placeholder="e.g. 39.99 (shown struck through)"
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#f4e2ed]">
                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Stock Quantity</label>
                      <input
                        type="number"
                        required
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] font-bold focus:outline-none focus:border-[#D30915]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">Low Stock Threshold</label>
                      <input
                        type="number"
                        value={formLowStockThreshold}
                        onChange={(e) => setFormLowStockThreshold(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#141219] mb-1">SKU Code</label>
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono text-[#141219] focus:outline-none focus:border-[#D30915]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'variants' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                    Options create configurable choices for shoppers (e.g. Ring Size 5, 6, 7, 8, 9, 10 or Jar Scent).
                  </div>

                  {/* Add New Option */}
                  <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                    <span className="text-xs font-bold text-[#141219]">Add Product Option</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newOptionName}
                        onChange={(e) => setNewOptionName(e.target.value)}
                        placeholder="Option Name (e.g. Ring Size)"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-xs"
                      />
                      <input
                        type="text"
                        value={newOptionValues}
                        onChange={(e) => setNewOptionValues(e.target.value)}
                        placeholder="Values separated by commas (5, 6, 7, 8, 9)"
                        className="h-9 px-3 rounded-lg bg-white border border-gray-300 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="px-3 py-1.5 rounded-lg bg-[#D30915] text-white text-xs font-bold cursor-pointer"
                    >
                      Add Option & Generate Combinations
                    </button>
                  </div>

                  {/* Configured Options List */}
                  {formOptions.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#141219]">Configured Options</span>
                      {formOptions.map((opt, idx) => (
                        <div
                          key={opt.name}
                          className="p-2.5 rounded-xl border border-[#eedbe6] bg-white flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="text-[#141219]">{opt.name}:</strong>{' '}
                            <span className="text-[#716d77]">{opt.values.join(', ')}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'images' && (
                <div className="space-y-4">
                  {/* Native Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files) {
                        handleFilesSelected(e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="hidden"
                  />

                  {/* Drag & Drop File Picker Zone */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                      if (e.dataTransfer.files) {
                        handleFilesSelected(e.dataTransfer.files);
                      }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${isDraggingFiles
                        ? 'border-[#D30915] bg-[#fff1f2] scale-[1.01]'
                        : 'border-[#eedbe6] bg-[#faf7f9] hover:border-[#D30915]/50 hover:bg-[#fff9fa]'
                      }`}
                  >
                    <div className="w-12 h-12 rounded-full bg-white border border-[#eedbe6] text-[#D30915] flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-bold text-[#141219]">
                      <span className="text-[#D30915] hover:underline">Click to browse</span> or drag and drop product photos
                    </div>
                    <p className="text-[11px] text-[#716d77] m-0 mt-1">
                      Supports multiple image files (JPG, PNG, WEBP) • Stored in local preview state
                    </p>
                  </div>

                  {/* Add Image URL Alternative */}
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="Or paste image CDN / external URL..."
                      className="flex-1 h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                    />
                    <button
                      type="button"
                      onClick={handleAddImage}
                      className="px-4 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      Add URL
                    </button>
                  </div>

                  {/* Image Grid with Reorder & Remove Controls */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-[#716d77] font-semibold">
                      <span>Configured Images ({formImages.length}) — Reorder or remove</span>
                      <span className="text-[10px] text-[#D30915] font-bold">First image is storefront Primary</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {formImages.map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative rounded-xl border p-1 bg-white group overflow-hidden transition-all shadow-2xs ${idx === 0 ? 'border-[#D30915] ring-2 ring-[#D30915]/20' : 'border-[#eedbe6]'
                            }`}
                        >
                          <img
                            src={img}
                            alt={`Product media ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
                            }}
                          />

                          {idx === 0 && (
                            <div className="absolute top-2 left-2 bg-[#D30915] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-xs z-10">
                              Primary
                            </div>
                          )}

                          {/* Hover action overlay */}
                          <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                            <div className="flex items-center justify-between">
                              {idx !== 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleSetPrimaryImage(idx)}
                                  className="px-2 py-1 rounded bg-white text-[10px] font-bold text-[#141219] hover:text-[#D30915] cursor-pointer shadow-xs"
                                >
                                  Make Primary
                                </button>
                              ) : <div />}
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(idx)}
                                className="p-1 rounded bg-rose-600 hover:bg-rose-700 text-white cursor-pointer shadow-xs"
                                title="Remove image"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Reorder Arrows Bar */}
                            <div className="flex items-center justify-center gap-2 pt-1 bg-black/40 rounded-lg p-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveImage(idx, idx - 1)}
                                className="p-1 rounded bg-white/90 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#141219] text-xs font-bold cursor-pointer"
                                title="Move left/earlier"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <span className="text-[10px] text-white font-mono font-bold">
                                {idx + 1} / {formImages.length}
                              </span>
                              <button
                                type="button"
                                disabled={idx === formImages.length - 1}
                                onClick={() => handleMoveImage(idx, idx + 1)}
                                className="p-1 rounded bg-white/90 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed text-[#141219] text-xs font-bold cursor-pointer"
                                title="Move right/later"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#eedbe6] flex items-center justify-end gap-2">
                <button
                  id="admin-cancel-product-btn"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:bg-gray-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer"
                >
                  {editingProductId ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 border border-[#eedbe6] shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-[#141219]">Remove Product from Catalog?</h3>
              <p className="text-xs text-[#716d77]">
                Are you sure you want to delete <strong className="text-[#141219]">"{deleteConfirm.name}"</strong>?
                This item will no longer appear on the live storefront.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
