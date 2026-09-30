import React, { useState } from 'react';
import {
  Layers,
  Save,
  RotateCcw,
  Eye,
  Layout,
  Tag,
  Megaphone,
  HelpCircle,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import type {
  HomepageContentConfig,
  HomepageFeaturedCard,
  HeroBenefitTile,
  FaqContentItem,
} from '../../types/admin';
import { adminService } from '../../services/adminService';
import { StorefrontPreviewModal } from './StorefrontPreviewModal';

interface AdminContentProps {
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

type ContentTab = 'hero' | 'featured' | 'banners' | 'valueprop' | 'about' | 'faq' | 'footer';

export const AdminContent: React.FC<AdminContentProps> = ({ onShowToast }) => {
  const [content, setContent] = useState<HomepageContentConfig>(() =>
    adminService.getHomepageContent()
  );
  const [activeTab, setActiveTab] = useState<ContentTab>('hero');
  const [editingCardId, setEditingCardId] = useState<string>(() => content.featuredCards[0]?.id || 'halloween');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // New FAQ form state
  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [newFaqCategory, setNewFaqCategory] = useState('About Surprises');

  // Helper to ensure hero structure exists
  const currentHero = content.hero || {
    desktopBannerImage: '/assets/ilovesurprises/banners/Neww banner.jpeg',
    mobileBannerImage: '/assets/ilovesurprises/banners/mobile-banner.jpg',
    headline: 'ILoveSurprises.com — Discover jewelry, cash, and surprises inside every candle & bath bomb',
    subheadline: 'Every candle holds a real surprise inside!',
    benefitTiles: [
      { id: 'hidden-jewelry', title: 'Hidden Jewelry Reveals', subtitle: 'Real jewelry in every product', iconName: 'Gem', actionType: 'shop' },
      { id: 'viral-unboxing', title: 'Viral Unboxing Fun', subtitle: 'Share, surprise, repeat', iconName: 'Gift', actionType: 'shop' },
      { id: 'start-store', title: 'Start Your Store', subtitle: 'Your business. Your way.', iconName: 'Store', actionType: 'consultant' },
      { id: 'earn-5-levels', title: 'Earn From 5 Levels', subtitle: 'Build your team. Grow together.', iconName: 'Users', actionType: 'consultant' },
    ],
  };

  const handleUpdateHero = (updates: Partial<typeof currentHero>) => {
    setContent((prev) => ({
      ...prev,
      hero: {
        ...currentHero,
        ...updates,
      },
    }));
  };

  const handleUpdateBenefitTile = (index: number, updates: Partial<HeroBenefitTile>) => {
    const updatedTiles = [...currentHero.benefitTiles];
    updatedTiles[index] = { ...updatedTiles[index], ...updates };
    handleUpdateHero({ benefitTiles: updatedTiles });
  };

  const handleUpdateCard = (cardId: string, updates: Partial<HomepageFeaturedCard>) => {
    setContent((prev) => ({
      ...prev,
      featuredCards: prev.featuredCards.map((c) => (c.id === cardId ? { ...c, ...updates } : c)),
    }));
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) {
      onShowToast('Please enter both a question and an answer', { type: 'info' });
      return;
    }
    const newItem: FaqContentItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
      category: newFaqCategory.trim() || 'General',
    };
    setContent((prev) => ({
      ...prev,
      faqItems: [...(prev.faqItems || []), newItem],
    }));
    setNewFaqQuestion('');
    setNewFaqAnswer('');
    onShowToast('New FAQ question added', { type: 'success' });
  };

  const handleRemoveFaq = (faqId: string) => {
    setContent((prev) => ({
      ...prev,
      faqItems: (prev.faqItems || []).filter((f) => f.id !== faqId),
    }));
    onShowToast('FAQ question removed', { type: 'info' });
  };

  const handleUpdateFaq = (faqId: string, updates: Partial<FaqContentItem>) => {
    setContent((prev) => ({
      ...prev,
      faqItems: (prev.faqItems || []).map((f) => (f.id === faqId ? { ...f, ...updates } : f)),
    }));
  };

  const handleSaveAll = () => {
    adminService.saveHomepageContent(content);
    onShowToast('Storefront content updated live across all sections!', {
      title: 'Storefront Published',
      type: 'success',
    });
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all storefront content, hero, banners, FAQs, and collections to default settings?')) {
      const def = adminService.resetHomepageContent();
      setContent(def);
      onShowToast('Reset all storefront content to system defaults', { type: 'info' });
    }
  };

  const currentEditingCard = content.featuredCards.find((c) => c.id === editingCardId) || content.featuredCards[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Actions Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Storefront Content & Hero Management
            </h2>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Manage Hero banners, benefit tiles, curated collections, value propositions, About copy, FAQs, and footer settings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            onClick={() => setIsPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-[#D30915] bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#D30915] text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Eye className="w-4 h-4" />
            <span>Full Storefront Preview</span>
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

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#eedbe6] bg-white p-2 rounded-2xl scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('hero')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'hero' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Hero & Benefit Tiles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('featured')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'featured' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Priority Collections ({content.featuredCards.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banners')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'banners' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Announcements & Promo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('valueprop')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'valueprop' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Value Proposition</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('about')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'about' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>About Brand Story</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'faq' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>FAQ Content</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('footer')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'footer' ? 'bg-[#D30915] text-white shadow-2xs' : 'text-[#716d77] hover:bg-gray-50'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Footer & Legal</span>
        </button>
      </div>

      {/* TAB 1: HERO SECTION MANAGEMENT */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
            <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
              <ImageIcon className="w-4 h-4 text-[#D30915]" />
              <span>Hero Images & Headline Copy</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Desktop Hero Banner Image URI
                </label>
                <input
                  type="text"
                  value={currentHero.desktopBannerImage}
                  onChange={(e) => handleUpdateHero({ desktopBannerImage: e.target.value })}
                  placeholder="/assets/ilovesurprises/banners/Neww banner.jpeg"
                  className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono"
                />
                <span className="text-[10px] text-[#716d77] mt-0.5 block">
                  Recommended aspect ratio 3:1 or 1920x640px
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  Mobile Hero Banner Image URI
                </label>
                <input
                  type="text"
                  value={currentHero.mobileBannerImage}
                  onChange={(e) => handleUpdateHero({ mobileBannerImage: e.target.value })}
                  placeholder="/assets/ilovesurprises/banners/mobile-banner.jpg"
                  className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono"
                />
                <span className="text-[10px] text-[#716d77] mt-0.5 block">
                  Optimized for vertical mobile screens (e.g. 750x480px)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Hero Headline (Screen Readers & Alt Text)
              </label>
              <input
                type="text"
                value={currentHero.headline}
                onChange={(e) => handleUpdateHero({ headline: e.target.value })}
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#141219]"
              />
            </div>
          </div>

          {/* 4 Benefit Tiles Configuration */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
                <span>4 Hero Benefit Quick-Action Tiles</span>
              </h3>
              <span className="text-xs text-[#716d77] font-semibold">
                Shown immediately below the hero banner
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentHero.benefitTiles.map((tile, idx) => (
                <div
                  key={tile.id || idx}
                  className="p-4 rounded-xl border border-[#eedbe6] bg-[#faf7f9] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#D30915] uppercase">
                      Tile #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="text-[10px] font-bold text-[#716d77]">Icon:</label>
                      <select
                        value={tile.iconName || 'Gem'}
                        onChange={(e) => handleUpdateBenefitTile(idx, { iconName: e.target.value as any })}
                        className="h-7 px-2 text-xs rounded-lg border border-[#eedbe6] bg-white font-bold"
                      >
                        <option value="Gem">Gem (Jewelry)</option>
                        <option value="Gift">Gift (Unboxing)</option>
                        <option value="Store">Store (Consultant)</option>
                        <option value="Users">Users (Team)</option>
                        <option value="ShieldCheck">Shield (Guaranteed)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-[#141219] mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={tile.title}
                        onChange={(e) => handleUpdateBenefitTile(idx, { title: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-[#eedbe6] text-xs font-bold text-[#141219]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#141219] mb-1">
                        Subtitle
                      </label>
                      <input
                        type="text"
                        value={tile.subtitle}
                        onChange={(e) => handleUpdateBenefitTile(idx, { subtitle: e.target.value })}
                        className="w-full h-8 px-2.5 rounded-lg bg-white border border-[#eedbe6] text-xs text-[#716d77]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#141219] mb-1">
                      Click Action Target
                    </label>
                    <select
                      value={tile.actionType || 'shop'}
                      onChange={(e) => handleUpdateBenefitTile(idx, { actionType: e.target.value as any })}
                      className="w-full h-8 px-2.5 rounded-lg bg-white border border-[#eedbe6] text-xs"
                    >
                      <option value="shop">Scroll / Navigate to Shop Products</option>
                      <option value="consultant">Navigate to Become a Representative / Affiliate</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FEATURED CURATED COLLECTIONS */}
      {activeTab === 'featured' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
            <span className="text-xs font-extrabold uppercase text-[#716d77] tracking-wider">
              Select Showcase Card to Customize
            </span>

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

          {/* Quick Preview Card */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#716d77]">
              <Eye className="w-4 h-4 text-[#D30915]" />
              <span>Card Appearance Preview</span>
            </div>

            <div className="rounded-2xl border border-[#eedbe6] overflow-hidden bg-white shadow-md">
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
          </div>
        </div>
      )}

      {/* TAB 3: BANNERS & ANNOUNCEMENTS */}
      {activeTab === 'banners' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-5">
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

      {/* TAB 4: VALUE PROPOSITION */}
      {activeTab === 'valueprop' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
          <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
            <ShieldCheck className="w-4 h-4 text-[#D30915]" />
            <span>Storefront Value Proposition & Brand Guarantees</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Eyebrow Badge</label>
              <input
                type="text"
                value={content.valueProposition?.eyebrow || 'Why Choose I Love Surprises'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    valueProposition: {
                      ...prev.valueProposition!,
                      eyebrow: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Section Headline</label>
              <input
                type="text"
                value={content.valueProposition?.title || 'The Original Real Cash & Luxury Jewelry Reveal Experience'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    valueProposition: {
                      ...prev.valueProposition!,
                      title: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#141219]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141219] mb-1">Comprehensive Description</label>
            <textarea
              rows={2}
              value={content.valueProposition?.description || ''}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  valueProposition: {
                    ...prev.valueProposition!,
                    description: e.target.value,
                  },
                }))
              }
              className="w-full p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141219] mb-2">4 Key Value Points</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(content.valueProposition?.points || []).map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-xs font-black text-[#D30915]">#{idx + 1}</span>
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => {
                      const updated = [...(content.valueProposition?.points || [])];
                      updated[idx] = e.target.value;
                      setContent((prev) => ({
                        ...prev,
                        valueProposition: {
                          ...prev.valueProposition!,
                          points: updated,
                        },
                      }));
                    }}
                    className="flex-1 h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ABOUT CONTENT */}
      {activeTab === 'about' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
          <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
            <FileText className="w-4 h-4 text-[#D30915]" />
            <span>About Page & Brand Story Content</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Intro Badge</label>
              <input
                type="text"
                value={content.aboutContent?.badge || 'Our Brand Story & Craftsmanship'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    aboutContent: {
                      ...prev.aboutContent!,
                      badge: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#D30915]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Brand Headline</label>
              <input
                type="text"
                value={content.aboutContent?.headline || 'Where Luxury Fragrance Meets the Thrill of Real Surprises'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    aboutContent: {
                      ...prev.aboutContent!,
                      headline: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141219] mb-1">Story & Craftsmanship Paragraph</label>
            <textarea
              rows={3}
              value={content.aboutContent?.storyText || ''}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  aboutContent: {
                    ...prev.aboutContent!,
                    storyText: e.target.value,
                  },
                }))
              }
              className="w-full p-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#f4e2ed]">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Stat 1 (Natural Soy)</label>
              <input
                type="text"
                value={content.aboutContent?.naturalSoyStat || '100% Pure Natural Soy'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    aboutContent: {
                      ...prev.aboutContent!,
                      naturalSoyStat: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Stat 2 (Unboxings)</label>
              <input
                type="text"
                value={content.aboutContent?.unboxingsStat || '125,000+ Verified Unboxings'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    aboutContent: {
                      ...prev.aboutContent!,
                      unboxingsStat: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Stat 3 (Real Cash)</label>
              <input
                type="text"
                value={content.aboutContent?.realCashStat || '$2 to $2,500 Real Cash Inside'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    aboutContent: {
                      ...prev.aboutContent!,
                      realCashStat: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-emerald-700"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: FAQ CONTENT MANAGER */}
      {activeTab === 'faq' && (
        <div className="space-y-6">
          {/* Add New FAQ Form */}
          <form
            onSubmit={handleAddFaq}
            className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-3"
          >
            <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
              <Plus className="w-4 h-4 text-[#D30915]" />
              <span>Add New FAQ Question</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-[#141219] mb-1">Question *</label>
                <input
                  type="text"
                  required
                  value={newFaqQuestion}
                  onChange={(e) => setNewFaqQuestion(e.target.value)}
                  placeholder="e.g. How does the jewelry reveal work?"
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#141219]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#141219] mb-1">Category</label>
                <input
                  type="text"
                  value={newFaqCategory}
                  onChange={(e) => setNewFaqCategory(e.target.value)}
                  placeholder="About Surprises"
                  className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#141219] mb-1">Answer *</label>
              <textarea
                required
                rows={2}
                value={newFaqAnswer}
                onChange={(e) => setNewFaqAnswer(e.target.value)}
                placeholder="Enter customer-friendly explanation..."
                className="w-full p-2.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219]"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#D30915] text-white text-xs font-bold hover:bg-[#B60711] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add to FAQ Catalog</span>
            </button>
          </form>

          {/* Existing FAQ List */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-3">
            <span className="text-xs font-bold text-[#716d77] uppercase tracking-wider block">
              Configured FAQ Questions ({content.faqItems?.length || 0})
            </span>

            <div className="space-y-3">
              {(content.faqItems || []).map((faq) => (
                <div
                  key={faq.id}
                  className="p-3.5 rounded-xl border border-[#eedbe6] bg-[#faf7f9] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#D30915] border border-[#fecdd3]">
                      {faq.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFaq(faq.id)}
                      className="text-rose-600 hover:text-rose-800 p-1 cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => handleUpdateFaq(faq.id, { question: e.target.value })}
                    className="w-full h-8 px-2.5 rounded-lg bg-white border border-[#eedbe6] text-xs font-bold text-[#141219]"
                  />

                  <textarea
                    rows={2}
                    value={faq.answer}
                    onChange={(e) => handleUpdateFaq(faq.id, { answer: e.target.value })}
                    className="w-full p-2.5 rounded-lg bg-white border border-[#eedbe6] text-xs text-[#55505a]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FOOTER & LEGAL */}
      {activeTab === 'footer' && (
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs space-y-4">
          <h3 className="text-sm font-black text-[#141219] uppercase tracking-wider flex items-center gap-2 m-0">
            <Tag className="w-4 h-4 text-[#D30915]" />
            <span>Storewide Footer & Legal Copy</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Newsletter VIP Headline
              </label>
              <input
                type="text"
                value={content.footerContent?.newsletterTitle || ''}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footerContent: {
                      ...prev.footerContent!,
                      newsletterTitle: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Newsletter VIP Subtitle
              </label>
              <input
                type="text"
                value={content.footerContent?.newsletterSubtitle || ''}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footerContent: {
                      ...prev.footerContent!,
                      newsletterSubtitle: e.target.value,
                    },
                  }))
                }
                className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Support Email</label>
              <input
                type="email"
                value={content.footerContent?.supportEmail || 'support@ilovesurprises.com'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footerContent: {
                      ...prev.footerContent!,
                      supportEmail: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Support Phone</label>
              <input
                type="text"
                value={content.footerContent?.supportPhone || '1-800-SURPRISE'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footerContent: {
                      ...prev.footerContent!,
                      supportPhone: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">Guarantee Badge Text</label>
              <input
                type="text"
                value={content.footerContent?.guaranteeText || '256-Bit SSL Encrypted Bank-Grade Checkout'}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    footerContent: {
                      ...prev.footerContent!,
                      guaranteeText: e.target.value,
                    },
                  }))
                }
                className="w-full h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#141219] mb-1">Copyright Line</label>
            <input
              type="text"
              value={content.footerContent?.copyrightText || ''}
              onChange={(e) =>
                setContent((prev) => ({
                  ...prev,
                  footerContent: {
                    ...prev.footerContent!,
                    copyrightText: e.target.value,
                  },
                }))
              }
              className="w-full h-10 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#716d77]"
            />
          </div>
        </div>
      )}

      {/* FULL STOREFRONT PREVIEW MODAL */}
      <StorefrontPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        content={content}
        onPublish={handleSaveAll}
      />
    </div>
  );
};
