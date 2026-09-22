import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Eye,
  RotateCw,
  Copy,
  Check,
  Truck,
  Clock,
  Sparkles,
  CreditCard,
  Banknote,
  XCircle,
} from 'lucide-react';
import type { Order, OrderStatus, Product } from '../../types';

interface OrderHistorySectionProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onNavigateToShop: () => void;
}

export const OrderHistorySection: React.FC<OrderHistorySectionProps> = ({
  orders,
  onSelectOrder,
  onAddToCart,
  onNavigateToShop,
}) => {
  const [orderSearch, setOrderSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReorder = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    order.items.forEach((item) => {
      onAddToCart(item.product, item.quantity);
    });
  };

  const activeOrdersCount = useMemo(() => {
    return orders.filter(
      (o) => o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery'
    ).length;
  }, [orders]);

  const deliveredOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'delivered').length;
  }, [orders]);

  const cancelledOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'cancelled').length;
  }, [orders]);

  const totalRevealsCount = useMemo(() => {
    return orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearch.trim().toLowerCase();
      const matchesSearch =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((i) => i.product.name.toLowerCase().includes(q)) ||
        (o.paymentSummary.cardBrand || '').toLowerCase().includes(q) ||
        o.paymentSummary.method.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'active') {
        return o.status === 'processing' || o.status === 'shipped' || o.status === 'out_for_delivery';
      }
      if (statusFilter === 'delivered') {
        return o.status === 'delivered';
      }
      if (statusFilter === 'cancelled') {
        return o.status === 'cancelled';
      }
      return true;
    });
  }, [orders, orderSearch, statusFilter]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-emerald-800 bg-emerald-50 px-2.5 sm:px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Delivered & Reveal</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-blue-800 bg-blue-50 px-2.5 sm:px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
            <Truck className="w-3.5 h-3.5 text-blue-600 anim-delivery-truck" />
            <span>In Transit</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-purple-800 bg-purple-50 px-2.5 sm:px-3 py-1 rounded-full border border-purple-200 shadow-2xs">
            <Package className="w-3.5 h-3.5 text-purple-600 anim-delivery-package" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-red-800 bg-red-50 px-2.5 sm:px-3 py-1 rounded-full border border-red-200 shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black uppercase text-amber-800 bg-amber-50 px-2.5 sm:px-3 py-1 rounded-full border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Hand-Pouring & Sealing</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Quick Stats Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-[#fff1f2] text-[#D30915] flex items-center justify-center shrink-0 border border-[#fecdd3]">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
              Lifetime Orders
            </span>
            <strong className="text-lg font-black text-[#141219]">
              {orders.length} Placed
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
              Active Shipments
            </span>
            <strong className="text-lg font-black text-[#141219]">
              {activeOrdersCount} In Progress
            </strong>
          </div>
        </div>

        <div className="bg-white rounded-[20px] p-4.5 border border-[#eedbe6] shadow-[0_4px_16px_rgba(50,31,63,0.03)] flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-[14px] bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#716d77] block">
              Candles & Treats
            </span>
            <strong className="text-lg font-black text-[#141219]">
              {totalRevealsCount} Reveals
            </strong>
          </div>
        </div>
      </div>

      {/* 2. Main Order History Table / Card Container */}
      <div className="bg-white rounded-[24px] p-5 sm:p-7 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)] space-y-5">
        {/* Header & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f5eaf1]">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
              Your Order History
            </h2>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Track live courier progress, view item breakdowns, and download receipts
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-[#fbf7fc] p-1 rounded-[13px] border border-[#eedbe6] self-start sm:self-auto overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'all'
                  ? 'bg-[#D30915] text-white shadow-2xs'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
            >
              All ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'active'
                  ? 'bg-[#D30915] text-white shadow-2xs'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
            >
              Active ({activeOrdersCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('delivered')}
              className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'delivered'
                  ? 'bg-[#D30915] text-white shadow-2xs'
                  : 'text-[#55505a] hover:text-[#D30915]'
              }`}
            >
              Delivered ({deliveredOrdersCount})
            </button>
            {cancelledOrdersCount > 0 && (
              <button
                type="button"
                onClick={() => setStatusFilter('cancelled')}
                className={`px-3 py-1.5 rounded-[10px] text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === 'cancelled'
                    ? 'bg-[#D30915] text-white shadow-2xs'
                    : 'text-[#55505a] hover:text-[#D30915]'
                }`}
              >
                Cancelled ({cancelledOrdersCount})
              </button>
            )}
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            placeholder="Search by Order ID (e.g. ILS-749201) or Candle scent name..."
            className="w-full h-[42px] pl-10 pr-10 rounded-[13px] bg-[#fffafb] border border-[#e8dfe5] focus:border-[#D30915] text-xs text-[#141219] outline-none font-medium placeholder-[#8a858f] transition-all"
          />
          {orderSearch && (
            <button
              type="button"
              onClick={() => setOrderSearch('')}
              className="w-6 h-6 rounded-full hover:bg-stone-200 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-[20px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
            <Package className="w-12 h-12 text-[#d9cbd5] mx-auto mb-3" />
            <h4 className="text-base font-black text-[#141219] mb-1">
              {orderSearch ? 'No Matching Orders Found' : orders.length === 0 ? 'No orders yet' : 'No Orders in this Category'}
            </h4>
            <p className="text-xs text-[#716d77] max-w-sm mx-auto mb-5 leading-relaxed">
              {orderSearch
                ? `We couldn't find any orders matching "${orderSearch}". Try a different search term or clear filters.`
                : orders.length === 0
                ? 'When you purchase candles or bath treats, your tracked deliveries and prize receipts will appear right here.'
                : 'You have not placed any orders matching this filter yet.'}
            </p>
            {orderSearch ? (
              <button
                type="button"
                onClick={() => setOrderSearch('')}
                className="h-[38px] px-5 rounded-[11px] bg-[#fff1f2] border border-[#fecdd3] hover:bg-[#D30915] hover:text-white text-[#D30915] font-black text-xs transition-all cursor-pointer"
              >
                Clear Search Filter
              </button>
            ) : (
              <button
                type="button"
                onClick={onNavigateToShop}
                className="h-[40px] px-6 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Discover Candles</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });
              const isCopied = copiedId === order.id;
              const totalItems = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="rounded-[22px] bg-[#fffafc] border border-[#eedbe6] hover:border-[#D30915]/50 transition-all shadow-[0_2px_12px_rgba(50,31,63,0.03)] hover:shadow-[0_6px_20px_rgba(50,31,63,0.06)] overflow-hidden"
                >
                  {/* Top Bar Header */}
                  <div className="bg-[#fff5f9] px-4 sm:px-6 py-3 border-b border-[#f4edf2] flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-[#141219]">
                          {order.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(order.id, e)}
                          title="Copy Order ID"
                          className="p-1 rounded-md hover:bg-[#ffeef4] text-[#8a858f] hover:text-[#D30915] transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <span className="text-[#eedbe6] hidden sm:inline">•</span>
                      <span className="text-xs text-[#716d77] font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.status)}
                    </div>
                  </div>

                  {/* Body Products List */}
                  <div className="p-4 sm:p-5 divide-y divide-[#f7eff4]">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-13 h-13 rounded-[12px] bg-white border border-[#eee2eb] p-1 flex items-center justify-center shadow-2xs overflow-hidden">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            {item.quantity > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[19px] h-[19px] px-1 rounded-full bg-[#141219] text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs z-10">
                                x{item.quantity}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-black text-[#141219] m-0 truncate">
                              {item.product.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] font-black text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full border border-[#fecdd3]">
                                {item.selectedSurpriseOption ||
                                  (item.product.surpriseType === 'cash'
                                    ? '💵 Real Cash Prize Inside'
                                    : '💍 Guaranteed Fine Jewelry')}
                              </span>
                              <span className="text-[11px] text-[#716d77] font-semibold">
                                Qty: {item.quantity} • ${item.unitPrice.toFixed(2)} ea
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                          <span className="text-xs sm:text-sm font-black text-[#141219]">
                            ${item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="bg-[#fffdfd] px-4 sm:px-6 py-3 border-t border-[#f4edf2] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[10px] text-[#716d77] uppercase font-bold block">
                          Total ({totalItems} {totalItems === 1 ? 'item' : 'items'})
                        </span>
                        <span className="text-sm sm:text-base font-black text-[#141219]">
                          ${order.total.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-6 w-px bg-[#eee2eb]" />
                      <div className="text-[11px] text-[#716d77] font-medium flex items-center gap-1">
                        {order.paymentSummary.method === 'cod' ? (
                          <>
                            <Banknote className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cash on Delivery</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Paid Online</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleReorder(order, e)}
                        className="h-[34px] px-3.5 rounded-[10px] bg-white border border-[#e8dfe5] hover:border-[#D30915] hover:text-[#D30915] text-[#55505a] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        title="Add all items back to shopping bag"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Buy Again</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectOrder(order)}
                        className="h-[34px] px-4 rounded-[10px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(211, 9, 21,0.22)] cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
