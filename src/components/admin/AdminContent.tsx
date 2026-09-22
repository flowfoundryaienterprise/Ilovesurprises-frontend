import React, { useState } from 'react';
import {
  Sparkles,
  Save,
  RotateCcw,
  Eye,
  Layout,
  Tag,
  Megaphone,
} from 'lucide-react';
import type { HomepageContentConfig, HomepageFeaturedCard } from '../../types/admin';
import { adminService } from '../../services/adminService';

interface AdminContentProps {
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminContent: React.FC<AdminContentProps> = ({ onShowToast }) => {
  const [content, setContent] = useState<HomepageContentConfig>(() =>
    adminService.getHomepageContent()
  );
  const [activeTab, setActiveTab] = useState<'featured' | 'banners'>('featured');
  const [editingCardId, setEditingCardId] = useState<string>(() => content.featuredCards[0]?.id || 'halloween');

  const handleUpdateCard = (cardId: string, updates: Partial<HomepageFeaturedCard>) => {
    setContent((prev) => ({
      ...prev,
      featuredCards: prev.featuredCards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
    }));
  };

  const handleSaveAll = () => {
    adminService.saveHomepageContent(content);
    onShowToast('Homepage content & featured collections updated live!', {
      title: 'Storefront Updated',
      type: 'success',
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all homepage featured collections and banners to default settings?')) {
      const def = adminService.resetHomepageContent();
      setContent(def);
      onShowToast('Reset homepage content to system defaults', { type: 'info' });
    }
  };

  const currentEditingCard = content.featuredCards.find((c) => c.id === editingCardId) || content.featuredCards[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Save Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Homepage Content & Showcase Management
            </h2>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Configure Halloween, Christmas, Cash Candles, Zodiac Cash Candles showcase, announcement banner, and promo alerts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2.5 rounded-xl border border-[#eedbe6] text-xs font-bold text-[#716d77] hover:text-[#141219] hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="px-4 py-2.5 rounded-xl bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Publish to Storefront</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-tab switcher */}
      <div className="flex items-center gap-2 border-b border-[#eedbe6] bg-white p-2 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('featured')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'featured'
              ? 'bg-[#D30915] text-white shadow-2xs'
              : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Featured Priority Collections ({content.featuredCards.length} Cards)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'banners'
              ? 'bg-[#D30915] text-white shadow-2xs'
              : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Storewide Banners & Announcements</span>
        </button>
      </div>

      {/* 3. Featured Collections Editor */}
      {activeTab === 'featured' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Card Selector & Form (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
            <span className="text-xs font-extrabold uppercase text-[#716d77] tracking-wider">
              Select Showcase Card to Customize
            </span>

            {/* Priority Collection Card Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {content.featuredCards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setEditingCardId(c.id)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    editingCardId === c.id
                      ? 'border-[#D30915] bg-[#fff1f2] ring-2 ring-[#D30915]/20'
                      : 'border-[#eedbe6] hover:bg-gray-50'
                  }`}
                >
                  <div className="text-xs font-bold text-[#141219] truncate">{c.title}</div>
                  <div className="text-[10px] text-[#716d77] truncate">{c.badge}</div>
                  <div className="flex items-center justify-between pt-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        c.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {c.active ? 'Active' : 'Hidden'}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            {/* Card Edit Fields */}
            {currentEditingCard && (
              <div className="pt-4 border-t border-[#f4e2ed] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-[#141219]">Editing: {currentEditingCard.title}</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`cardActive-${currentEditingCard.id}`}
                      checked={currentEditingCard.active}
                      onChange={(e) => handleUpdateCard(currentEditingCard.id, { active: e.target.checked })}
                      className="w-4 h-4 accent-[#D30915] cursor-pointer"
                    />
                    <label htmlFor={`cardActive-${currentEditingCard.id}`} className="text-xs font-bold cursor-pointer">
                      Display on Homepage
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#141219] mb-1">Display Title *</label>
                    <input
                      type="text"
                      value={currentEditingCard.title}
                      onChange={(e) => handleUpdateCard(currentEditingCard.id, { title: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#141219] mb-1">Highlight Badge *</label>
                    <input
                      type="text"
                      value={currentEditingCard.badge}
                      onChange={(e) => handleUpdateCard(currentEditingCard.id, { badge: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#D30915]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#141219] mb-1">Tagline / Subtitle</label>
                  <input
                    type="text"
                    value={currentEditingCard.tagline}
                    onChange={(e) => handleUpdateCard(currentEditingCard.id, { tagline: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#141219] mb-1">CTA Button Text</label>
                    <input
                      type="text"
                      value={currentEditingCard.ctaText}
                      onChange={(e) => handleUpdateCard(currentEditingCard.id, { ctaText: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#141219] mb-1">Target Category Key</label>
                    <input
                      type="text"
                      value={currentEditingCard.categoryKey}
                      onChange={(e) => handleUpdateCard(currentEditingCard.id, { categoryKey: e.target.value })}
                      className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#141219] mb-1">Showcase Image URI</label>
                  <input
                    type="text"
                    value={currentEditingCard.image}
                    onChange={(e) => handleUpdateCard(currentEditingCard.id, { image: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Card (5 Cols) */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#716d77]">
              <Eye className="w-4 h-4 text-[#D30915]" />
              <span>Live Storefront Preview</span>
            </div>

            {/* Simulated Homepage Card */}
            <div className="rounded-2xl border border-[#eedbe6] overflow-hidden bg-white shadow-md transition-all">
              <div className="relative h-48 bg-gray-100 overflow-hidden">
                <img
                  src={currentEditingCard.image}
                  alt={currentEditingCard.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/assets/ilovesurprises/categories/Coke_CSH_Sodapop-CND_JC.jpg';
                  }}
                />
                <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white/95 backdrop-blur-xs text-[11px] font-black text-[#D30915] shadow-xs">
                  {currentEditingCard.badge}
                </div>
              </div>

              <div className="p-4 space-y-2">
                <h4 className="text-base font-black text-[#141219] m-0 tracking-tight">
                  {currentEditingCard.title}
                </h4>
                <p className="text-xs text-[#716d77] m-0 leading-relaxed">
                  {currentEditingCard.tagline}
                </p>
                <div className="pt-2">
                  <div className="w-full py-2 rounded-xl bg-[#D30915] text-white text-xs font-bold text-center">
                    {currentEditingCard.ctaText}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#716d77] italic text-center">
              Changes take effect immediately across all storefront visitors upon publishing.
            </p>
          </div>
        </div>
      )}

      {/* 4. Storewide Banners Editor */}
      {activeTab === 'banners' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-5">
          {/* Announcement Bar */}
          <div className="p-4 rounded-xl bg-[#faf7f9] border border-[#eedbe6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#D30915]" />
                <h3 className="text-sm font-bold text-[#141219] m-0">Top Sticky Announcement Bar</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementActive"
                  checked={content.announcementActive}
                  onChange={(e) => setContent((prev) => ({ ...prev, announcementActive: e.target.checked }))}
                  className="w-4 h-4 accent-[#D30915] cursor-pointer"
                />
                <label htmlFor="announcementActive" className="text-xs font-bold cursor-pointer">
                  Active
                </label>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#716d77] mb-1">Announcement Copy</label>
              <input
                type="text"
                value={content.announcementText}
                onChange={(e) => setContent((prev) => ({ ...prev, announcementText: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl bg-white border border-[#eedbe6] text-xs font-bold text-[#D30915]"
              />
            </div>
          </div>

          {/* Promo Discount Banner */}
          <div className="p-4 rounded-xl bg-[#faf7f9] border border-[#eedbe6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-700" />
                <h3 className="text-sm font-bold text-[#141219] m-0">Promotional Discount Alert Bar</h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="promoBannerActive"
                  checked={content.promoBannerActive}
                  onChange={(e) => setContent((prev) => ({ ...prev, promoBannerActive: e.target.checked }))}
                  className="w-4 h-4 accent-[#D30915] cursor-pointer"
                />
                <label htmlFor="promoBannerActive" className="text-xs font-bold cursor-pointer">
                  Active
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#716d77] mb-1">Promo Copy</label>
                <input
                  type="text"
                  value={content.promoBannerText}
                  onChange={(e) => setContent((prev) => ({ ...prev, promoBannerText: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#eedbe6] text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#716d77] mb-1">Promo Code</label>
                <input
                  type="text"
                  value={content.promoBannerCode || 'SURPRISE15'}
                  onChange={(e) => setContent((prev) => ({ ...prev, promoBannerCode: e.target.value }))}
                  className="w-full h-10 px-3 rounded-xl bg-white border border-[#eedbe6] text-xs font-mono font-bold uppercase"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
