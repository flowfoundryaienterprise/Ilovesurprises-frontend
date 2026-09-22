import React, { useState, useEffect } from 'react';
import { User, Lock, Sparkles } from 'lucide-react';
import type { UserProfile, Order, SavedAddress, Product, AffiliateStats } from '../types';
import { orderService } from '../services/orderService';
import { accountService } from '../services/accountService';
import { affiliateService } from '../services/affiliateService';

import { AccountSidebar, type AccountTab } from '../components/account/AccountSidebar';
import { ProfileSection } from '../components/account/ProfileSection';
import { OrderHistorySection } from '../components/account/OrderHistorySection';
import { OrderDetailsModal } from '../components/account/OrderDetailsModal';
import { WishlistSection } from '../components/account/WishlistSection';
import { AddressManagementSection } from '../components/account/AddressManagementSection';
import { SettingsSection } from '../components/account/SettingsSection';
import { AffiliateOverview } from '../components/affiliate/AffiliateOverview';
import { ReferralLinkCard } from '../components/affiliate/ReferralLinkCard';
import { EarningsChart } from '../components/affiliate/EarningsChart';
import { GenealogyTree } from '../components/affiliate/GenealogyTree';
import { WithdrawModal } from '../components/affiliate/WithdrawModal';

export type { AccountTab };

interface AccountProps {
  user: UserProfile | null;
  activeTab?: AccountTab;
  highlightOrderId?: string | null;
  wishlistIds: string[];
  onOpenAuth: (mode?: 'login' | 'signup' | 'forgot') => void;
  onLogout: () => void;
  onNavigateToShop: () => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onWishlistToggle: (product: Product) => void;
  onTabChange?: (tab: AccountTab) => void;
  onNavigateToAffiliate?: () => void;
}

export const Account: React.FC<AccountProps> = ({
  user,
  activeTab: initialTab = 'profile',
  highlightOrderId,
  wishlistIds,
  onOpenAuth,
  onLogout,
  onNavigateToShop,
  onSelectProduct,
  onAddToCart,
  onWishlistToggle,
  onTabChange,
  onNavigateToAffiliate,
}) => {
  const [internalTab, setInternalTab] = useState<AccountTab | null>(null);
  const [internalUser, setInternalUser] = useState<UserProfile | null>(null);

  const activeTab = internalTab ?? initialTab;
  const currentUser = internalUser ?? user;

  // Orders State
  const [orders, setOrders] = useState<Order[]>(() => orderService.getOrders());
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(() => {
    if (highlightOrderId) {
      return orderService.getOrderById(highlightOrderId) || null;
    }
    return null;
  });

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>(() => accountService.getSavedAddresses());

  // Affiliate State
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>(() => affiliateService.getStats());
  const [affiliateTree] = useState(() => affiliateService.getGenealogyTree());
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ message: string; title?: string; type?: 'success' | 'info' } | null>(null);

  const showToast = (message: string, options?: { title?: string; type?: 'success' | 'info' }) => {
    setToastMessage({ message, title: options?.title, type: options?.type });
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Sync orders & addresses from storage & events
  useEffect(() => {
    const handleOrdersUpdate = () => {
      setOrders(orderService.getOrders());
    };
    const handleAddressesUpdate = () => {
      setAddresses(accountService.getSavedAddresses());
    };
    const handleAffiliateUpdate = () => {
      setAffiliateStats(affiliateService.getStats());
    };

    window.addEventListener('ilovesurprises_orders_updated', handleOrdersUpdate);
    window.addEventListener('ilovesurprises_addresses_updated', handleAddressesUpdate);
    window.addEventListener('ilovesurprises_affiliate_updated', handleAffiliateUpdate);

    return () => {
      window.removeEventListener('ilovesurprises_orders_updated', handleOrdersUpdate);
      window.removeEventListener('ilovesurprises_addresses_updated', handleAddressesUpdate);
      window.removeEventListener('ilovesurprises_affiliate_updated', handleAffiliateUpdate);
    };
  }, []);

  // Sync highlight order when prop changes
  useEffect(() => {
    if (highlightOrderId) {
      const found = orderService.getOrderById(highlightOrderId);
      if (found) {
        const timer = setTimeout(() => {
          setSelectedOrderDetails(found);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightOrderId]);

  const handleTabSwitch = (tab: AccountTab) => {
    setInternalTab(tab);
    onTabChange?.(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not logged in: Show VIP Access prompt
  if (!currentUser) {
    return (
      <div className="min-h-[75vh] bg-[#fcf9fb] py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-[28px] p-8 border border-[#eedbe6] shadow-[0_16px_40px_rgba(50,31,63,0.06)]">
            <div className="w-16 h-16 rounded-full bg-[#fff1f2] border-2 border-[#fecdd3] text-[#D30915] flex items-center justify-center mx-auto mb-4 shadow-xs">
              <User className="w-8 h-8" />
            </div>

            <span className="inline-block text-[11px] font-black uppercase tracking-wider text-[#D30915] bg-[#fff1f2] px-3 py-1 rounded-full border border-[#fecdd3] mb-2">
              VIP Customer Portal
            </span>

            <h1 className="text-2xl font-black text-[#141219] mb-2 font-display">
              Sign In to Your Account
            </h1>

            <p className="text-xs sm:text-sm text-[#716d77] mb-6 leading-relaxed">
              Access your surprise order tracker, prize reveal receipts, saved shipping addresses, and curated wishlist.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="w-full h-[46px] rounded-[14px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(211, 9, 21,0.28)] active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Sign In to Continue</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuth('signup')}
                className="w-full h-[44px] rounded-[14px] bg-white border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] font-black text-xs uppercase tracking-wider text-[#141219] transition-all cursor-pointer"
              >
                Create New VIP Account
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-8 sm:py-12">
      <div className="max-w-[1360px] mx-auto px-3.5 sm:px-6 space-y-7">
        {/* Toast Feedback Notification Pill */}
        {toastMessage && (
          <div className="p-3.5 rounded-[14px] bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-in fade-in flex items-center gap-2 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMessage.message}</span>
          </div>
        )}

        {/* 2-Column Responsive Account Layout (Sidebar + Main Content Area) */}
        <div className="flex flex-col lg:flex-row items-start gap-6 sm:gap-8">
          {/* Account Sidebar Navigation */}
          <AccountSidebar
            user={currentUser}
            activeTab={activeTab}
            ordersCount={orders.length}
            wishlistCount={wishlistIds.length}
            addressesCount={addresses.length}
            onSelectTab={handleTabSwitch}
            onLogout={onLogout}
            onNavigateToAffiliate={onNavigateToAffiliate}
          />

          {/* Main Selected Tab Content */}
          <div className="flex-1 w-full min-w-0">
            {/* TAB 1: Profile */}
            {activeTab === 'profile' && (
              <ProfileSection
                user={currentUser}
                onUpdateUser={setInternalUser}
                onShowToast={showToast}
              />
            )}

            {/* TAB 2: Orders & Live Tracking */}
            {activeTab === 'orders' && (
              <OrderHistorySection
                orders={orders}
                onSelectOrder={(order) => setSelectedOrderDetails(order)}
                onAddToCart={onAddToCart}
                onNavigateToShop={onNavigateToShop}
              />
            )}

            {/* TAB 3: Wishlist */}
            {activeTab === 'wishlist' && (
              <WishlistSection
                wishlistIds={wishlistIds}
                onWishlistToggle={onWishlistToggle}
                onAddToCart={onAddToCart}
                onSelectProduct={onSelectProduct}
                onNavigateToShop={onNavigateToShop}
              />
            )}

            {/* TAB 4: Saved Addresses */}
            {activeTab === 'addresses' && (
              <AddressManagementSection
                addresses={addresses}
                onUpdateAddresses={setAddresses}
                onShowToast={showToast}
              />
            )}

            {/* TAB 5: Settings */}
            {activeTab === 'settings' && (
              <SettingsSection
                user={currentUser}
                onShowToast={showToast}
                onLogout={onLogout}
              />
            )}

            {/* TAB 6: Affiliate / Rep Dashboard (Embedded inside Account) */}
            {activeTab === 'affiliate' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <ReferralLinkCard
                  stats={affiliateStats}
                  onUpdateStats={setAffiliateStats}
                  onShowToast={showToast}
                />

                <AffiliateOverview
                  stats={affiliateStats}
                  onOpenWithdraw={() => setIsWithdrawOpen(true)}
                  onNavigateTab={(tab) => {
                    if (tab === 'tree') {
                      const el = document.getElementById('account-tree-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />

                <EarningsChart />

                <div id="account-tree-section">
                  <GenealogyTree
                    treeData={affiliateTree}
                    onShowToast={showToast}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Details Modal Popup */}
        <OrderDetailsModal
          order={selectedOrderDetails}
          onClose={() => setSelectedOrderDetails(null)}
        />

        {/* Withdraw Modal Popup */}
        <WithdrawModal
          isOpen={isWithdrawOpen}
          stats={affiliateStats}
          payouts={affiliateService.getPayouts()}
          onClose={() => setIsWithdrawOpen(false)}
          onUpdateStats={setAffiliateStats}
          onUpdatePayouts={() => {}}
          onShowToast={showToast}
        />
      </div>
    </div>
  );
};
