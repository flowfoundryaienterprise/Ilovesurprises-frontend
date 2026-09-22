import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Package,
  X,
  MinusCircle,
} from 'lucide-react';
import type {
  AdminCollectionItem,
  AdminProductItem,
} from '../../types/admin';

interface AdminCollectionsProps {
  collections: AdminCollectionItem[];
  products: AdminProductItem[];
  canEdit?: boolean;
  onCreateCollection?: (collection: Partial<AdminCollectionItem>) => Promise<any> | void;
  onEditCollection?: (id: string, updates: Partial<AdminCollectionItem>) => Promise<any> | void;
  onDeleteCollection?: (id: string) => Promise<any> | void;
  onToggleCollectionFeatured?: (id: string) => Promise<any> | void;
  onReorderCollections?: (id: string, direction: 'up' | 'down') => void;
  onAssignProductToCollection?: (productId: string, collectionId: string) => Promise<any> | void;
  onRemoveProductFromCollection?: (productId: string) => Promise<any> | void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminCollections: React.FC<AdminCollectionsProps> = ({
  collections,
  products,
  canEdit = true,
  onCreateCollection,
  onEditCollection,
  onDeleteCollection,
  onToggleCollectionFeatured,
  onReorderCollections,
  onAssignProductToCollection,
  onRemoveProductFromCollection,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'standard'>('all');

  // Modal State for Collection Create/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg');
  const [formFeatured, setFormFeatured] = useState(false);
  const [formSeoTitle, setFormSeoTitle] = useState('');
  const [formSeoDescription, setFormSeoDescription] = useState('');

  // Delete Confirmation Modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  // Manage Assigned Products Modal
  const [managingCollection, setManagingCollection] = useState<AdminCollectionItem | null>(null);
  const [selectedProductIdToAssign, setSelectedProductIdToAssign] = useState('');

  // Filtered Collections
  const filteredCollections = useMemo(() => {
    return collections.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.tagline && c.tagline.toLowerCase().includes(q));

      const matchesFeatured =
        featuredFilter === 'all' ||
        (featuredFilter === 'featured' && c.featured) ||
        (featuredFilter === 'standard' && !c.featured);

      return matchesSearch && matchesFeatured;
    });
  }, [collections, searchQuery, featuredFilter]);

  // Products assigned to managing collection
  const assignedProducts = useMemo(() => {
    if (!managingCollection) return [];
    return products.filter((p) => p.category.toLowerCase() === managingCollection.name.toLowerCase());
  }, [products, managingCollection]);

  // Unassigned products available for assignment
  const unassignedProducts = useMemo(() => {
    if (!managingCollection) return [];
    return products.filter((p) => p.category.toLowerCase() !== managingCollection.name.toLowerCase());
  }, [products, managingCollection]);

  // Handlers for Add/Edit
  const handleOpenAdd = () => {
    setEditingCollectionId(null);
    setFormName('');
    setFormSlug('');
    setFormTagline('');
    setFormDescription('');
    setFormImage('/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg');
    setFormFeatured(false);
    setFormSeoTitle('');
    setFormSeoDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: AdminCollectionItem) => {
    setEditingCollectionId(c.id);
    setFormName(c.name);
    setFormSlug(c.slug);
    setFormTagline(c.tagline || '');
    setFormDescription(c.description || '');
    setFormImage(c.image);
    setFormFeatured(Boolean(c.featured));
    setFormSeoTitle(c.seoTitle || '');
    setFormSeoDescription(c.seoDescription || '');
    setIsModalOpen(true);
  };

  const handleSaveCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      onShowToast('Collection title is required', { type: 'info' });
      return;
    }

    const payload: Partial<AdminCollectionItem> = {
      name: formName.trim(),
      slug: formSlug.trim() || formName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tagline: formTagline.trim(),
      description: formDescription.trim() || undefined,
      image: formImage.trim() || '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg',
      featured: formFeatured,
      seoTitle: formSeoTitle.trim() || undefined,
      seoDescription: formSeoDescription.trim() || undefined,
    };

    if (editingCollectionId) {
      if (onEditCollection) await onEditCollection(editingCollectionId, payload);
    } else {
      if (onCreateCollection) await onCreateCollection(payload);
    }
    setIsModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (onDeleteCollection) await onDeleteCollection(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleAssignProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingCollection || !selectedProductIdToAssign) return;
    if (onAssignProductToCollection) {
      await onAssignProductToCollection(selectedProductIdToAssign, managingCollection.name);
      onShowToast(`Product assigned to "${managingCollection.name}"`, { type: 'success' });
      setSelectedProductIdToAssign('');
    }
  };

  const handleRemoveProduct = async (productId: string) => {
    if (onRemoveProductFromCollection) {
      await onRemoveProductFromCollection(productId);
      onShowToast('Product unlinked from collection', { type: 'info' });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Create Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Collection & Category Management
            </h2>
            <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              {collections.length} Collections
            </span>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Organize surprise catalogs, manage storefront showcase ordering, writeups, and product associations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              id="admin-create-collection-btn"
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Collection</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections by title, slug, or tagline..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'featured', 'standard'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFeaturedFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                featuredFilter === f
                  ? 'bg-[#D30915] text-white'
                  : 'bg-[#faf7f9] text-[#716d77] hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'All Collections' : f === 'featured' ? 'Featured Only' : 'Standard'}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Collections List Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        {filteredCollections.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D30915] flex items-center justify-center mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#141219]">No collections found</h3>
            <p className="text-xs text-[#716d77]">Try clearing your search query or creating a new collection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Collection Title</th>
                  <th className="py-3 px-3">Slug & Tagline</th>
                  <th className="py-3 px-3">Products Assigned</th>
                  <th className="py-3 px-3">Featured Showcase</th>
                  {canEdit && <th className="py-3 px-3 text-center">Reorder</th>}
                  {canEdit && <th className="py-3 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5eaf1] font-medium">
                {filteredCollections.map((c, idx) => {
                  const assignedCount = products.filter(
                    (p) => p.category.toLowerCase() === c.name.toLowerCase()
                  ).length;

                  return (
                    <tr key={c.id} className="hover:bg-[#fffbfd] transition-colors">
                      {/* Thumbnail & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-11 h-11 rounded-xl object-cover border border-[#eedbe6] shrink-0 bg-gray-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
                            }}
                          />
                          <div>
                            <div className="font-bold text-[#141219]">{c.name}</div>
                            {c.featured && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded mt-0.5">
                                <Sparkles className="w-2.5 h-2.5" />
                                <span>Featured</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug & Tagline */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-xs text-[#716d77]">/{c.slug}</div>
                        <div className="text-xs text-[#716d77] truncate max-w-[240px] mt-0.5">
                          {c.tagline || 'No tagline set'}
                        </div>
                      </td>

                      {/* Products Assigned */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => setManagingCollection(c)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-all cursor-pointer"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>{assignedCount} Products</span>
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="py-3 px-3">
                        {canEdit && onToggleCollectionFeatured ? (
                          <button
                            type="button"
                            onClick={() => onToggleCollectionFeatured(c.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                              c.featured
                                ? 'bg-[#D30915] text-white shadow-2xs'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {c.featured ? 'Featured Active' : 'Make Featured'}
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-gray-500">
                            {c.featured ? 'Featured' : 'Standard'}
                          </span>
                        )}
                      </td>

                      {/* Reorder Buttons */}
                      {canEdit && (
                        <td className="py-3 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-[#faf7f9] p-1 rounded-xl border border-[#eedbe6]">
                            <button
                              type="button"
                              disabled={idx === 0}
                              onClick={() => onReorderCollections && onReorderCollections(c.id, 'up')}
                              className="p-1 rounded text-[#716d77] hover:text-[#141219] hover:bg-white disabled:opacity-30 cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={idx === filteredCollections.length - 1}
                              onClick={() => onReorderCollections && onReorderCollections(c.id, 'down')}
                              className="p-1 rounded text-[#716d77] hover:text-[#141219] hover:bg-white disabled:opacity-30 cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Actions */}
                      {canEdit && (
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              title="Edit Collection"
                              className="p-1.5 rounded-lg border border-[#eedbe6] text-[#716d77] hover:text-[#D30915] hover:border-[#D30915] hover:bg-red-50 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ id: c.id, name: c.name })}
                              title="Delete Collection"
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
      </div>

      {/* 4. Collection Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-[#D30915] flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#141219] m-0">
                    {editingCollectionId ? 'Edit Collection Details' : 'Create New Collection'}
                  </h3>
                  <p className="text-[11px] text-[#716d77] m-0">
                    Set title, slug, showcase writeup, and storefront imagery.
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

            <form onSubmit={handleSaveCollection} className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">Collection Title *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (!editingCollectionId) {
                      setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  placeholder="e.g. Cash Money Candles"
                  className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1">URL Handle / Slug *</label>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. cash-candles"
                    className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono text-[#141219] focus:outline-none focus:border-[#D30915]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141219] mb-1">Short Tagline</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. Real cash hidden in every jar"
                    className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">Collection Story / Content</label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Write a compelling collection overview for shoppers..."
                  className="w-full p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">Header Image URL</label>
                <input
                  type="text"
                  value={formImage}
                  onChange={(e) => setFormImage(e.target.value)}
                  placeholder="/assets/ilovesurprises/categories/..."
                  className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#f4e2ed]">
                <input
                  type="checkbox"
                  id="collectionFeaturedCheck"
                  checked={formFeatured}
                  onChange={(e) => setFormFeatured(e.target.checked)}
                  className="w-4 h-4 accent-[#D30915] rounded cursor-pointer"
                />
                <label htmlFor="collectionFeaturedCheck" className="text-xs font-bold text-[#141219] cursor-pointer">
                  Feature this collection prominently on the Homepage Showcase
                </label>
              </div>

              <div className="pt-4 border-t border-[#eedbe6] flex items-center justify-end gap-2">
                <button
                  id="admin-cancel-collection-btn"
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
                  {editingCollectionId ? 'Save Changes' : 'Create Collection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Manage Products in Collection Modal */}
      {managingCollection && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-[#141219] m-0">
                  Products in "{managingCollection.name}"
                </h3>
                <p className="text-[11px] text-[#716d77] m-0">
                  Assign catalog items or remove products from this collection.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setManagingCollection(null)}
                className="p-2 rounded-xl text-[#716d77] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Add Product to this Collection */}
              <form onSubmit={handleAssignProduct} className="p-3.5 bg-[#faf7f9] rounded-xl border border-[#eedbe6] space-y-2">
                <span className="text-xs font-bold text-[#141219]">Assign Product to "{managingCollection.name}"</span>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedProductIdToAssign}
                    onChange={(e) => setSelectedProductIdToAssign(e.target.value)}
                    className="flex-1 h-10 px-3 rounded-xl bg-white border border-[#eedbe6] text-xs"
                  >
                    <option value="">Select a product to assign...</option>
                    {unassignedProducts.slice(0, 50).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price.toFixed(2)}) — Current: {p.category}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!selectedProductIdToAssign}
                    className="px-4 py-2 rounded-xl bg-[#D30915] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                  >
                    Assign
                  </button>
                </div>
              </form>

              {/* Assigned Products List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#141219]">
                  Currently Assigned Products ({assignedProducts.length})
                </div>

                {assignedProducts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#716d77] bg-gray-50 rounded-xl">
                    No products currently assigned to this collection.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
                    {assignedProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-[#eedbe6] bg-white flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-9 h-9 rounded-lg object-cover border shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[#141219] truncate">{p.name}</div>
                            <div className="font-mono text-[11px] text-[#716d77]">${p.price.toFixed(2)}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(p.id)}
                          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>Unlink</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
              <h3 className="text-base font-black text-[#141219]">Delete Collection?</h3>
              <p className="text-xs text-[#716d77]">
                Are you sure you want to delete <strong className="text-[#141219]">"{deleteConfirm.name}"</strong>?
                Products assigned to this collection will not be deleted, but they will be unlinked.
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
                Yes, Delete Collection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
