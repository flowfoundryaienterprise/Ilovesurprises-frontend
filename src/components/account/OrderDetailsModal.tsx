import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Truck,
  Package,
  Clock,
  Check,
  Gift,
  Copy,
  Printer,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { Order, OrderStatus } from '../../types';

interface OrderDetailsModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  onClose,
}) => {
  const [copiedTracking, setCopiedTracking] = useState(false);

  if (!order || typeof document === 'undefined') return null;

  const handleCopyTracking = () => {
    if (order.trackingNumber && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order.trackingNumber);
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
  };

  const getProgressPercentage = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return 100;
      case 'out_for_delivery':
        return 85;
      case 'shipped':
        return 65;
      case 'processing':
        return 35;
      case 'cancelled':
        return 0;
      default:
        return 15;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Delivered & Reveal</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600 anim-delivery-truck" />
            <span>In Transit</span>
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-purple-800 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            <Package className="w-3.5 h-3.5 text-purple-600 anim-delivery-package" />
            <span>Out for Delivery</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-red-800 bg-red-50 px-3 py-1 rounded-full border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Cancelled</span>
          </span>
        );
      case 'processing':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Hand-Pouring & Sealing Prize</span>
          </span>
        );
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-[26px] p-5 sm:p-7 border border-[#eedbe6] shadow-2xl flex flex-col overflow-hidden animate-modal-pop my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-[#f4edf2]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] block">
                Order Receipt & Courier Status
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              {order.id}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Order Details Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Live Delivery Pipeline Animation */}
          <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#fff6fa] via-[#fffafc] to-[#ffffff] border border-[#fecdd3] shadow-[0_8px_30px_rgba(211, 9, 21,0.08)] relative overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#D30915] inline-block animate-ping opacity-75 absolute" />
                  <span className="w-3 h-3 rounded-full bg-[#D30915] inline-block relative shadow-[0_0_10px_#D30915]" />
                </div>
                <div>
                  <span className="text-[10px] text-[#D30915] font-black uppercase tracking-wider block">
                    Live Courier Pipeline
                  </span>
                  <strong className="text-sm font-black text-[#141219]">
                    {order.status === 'delivered'
                      ? 'Package Delivered & Ready for Unboxing!'
                      : order.status === 'shipped' || order.status === 'out_for_delivery'
                      ? 'In Transit with USPS Priority Mail'
                      : order.status === 'cancelled'
                      ? 'Order Cancelled'
                      : 'Hand-Pouring Soy Candle & Sealing Cash Prize'}
                  </strong>
                </div>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Moving Vehicle Progress Bar */}
            {order.status !== 'cancelled' && (
              <div className="relative pt-6 pb-4 px-2">
                <div className="h-2.5 w-full bg-[#f2e6ee] rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-[#D30915] via-[#ff4785] to-[#D30915] rounded-full transition-all duration-1000 ease-out relative"
                    style={{ width: `${getProgressPercentage(order.status)}%` }}
                  >
                    <div className="absolute inset-0 anim-delivery-road opacity-40" />
                  </div>
                </div>

                {/* Moving Courier Icon */}
                <div
                  className="absolute top-0 -translate-x-1/2 transition-all duration-1000 ease-out pointer-events-none"
                  style={{ left: `${getProgressPercentage(order.status)}%` }}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-[#D30915] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(211, 9, 21,0.45)] anim-delivery-truck">
                      {order.status === 'delivered' ? (
                        <Gift className="w-4 h-4" />
                      ) : order.status === 'shipped' || order.status === 'out_for_delivery' ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Package className="w-4 h-4 anim-delivery-package" />
                      )}
                    </div>
                    <div className="w-2 h-2 rounded-full bg-[#D30915] mt-1 shadow-xs animate-bounce" />
                  </div>
                </div>

                {/* 4 Checkpoint Milestones */}
                <div className="grid grid-cols-4 gap-1 pt-6 text-center">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs mb-1.5 ring-4 ring-emerald-100">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <span className="text-[11px] font-black text-[#141219] block">1. Verified</span>
                    <span className="text-[9px] text-[#716d77]">Order Placed</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                        order.status === 'processing'
                          ? 'bg-[#D30915] text-white ring-4 ring-[#ffe4ee] anim-delivery-glow'
                          : order.status === 'shipped' || order.status === 'delivered' || order.status === 'out_for_delivery'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {order.status === 'shipped' || order.status === 'delivered' || order.status === 'out_for_delivery' ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Package className="w-4 h-4 anim-delivery-package" />
                      )}
                    </div>
                    <span className="text-[11px] font-black text-[#141219] block">2. Packing</span>
                    <span className="text-[9px] text-[#716d77]">Candle & Prize</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                        order.status === 'shipped' || order.status === 'out_for_delivery'
                          ? 'bg-[#D30915] text-white ring-4 ring-[#ffe4ee] anim-delivery-glow'
                          : order.status === 'delivered'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {order.status === 'delivered' ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Truck className="w-4 h-4 anim-delivery-truck" />
                      )}
                    </div>
                    <span className="text-[11px] font-black text-[#141219] block">3. In Transit</span>
                    <span className="text-[9px] text-[#716d77]">USPS Dispatch</span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-xs mb-1.5 transition-all ${
                        order.status === 'delivered'
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 anim-delivery-glow'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {order.status === 'delivered' ? (
                        <Check className="w-4 h-4 stroke-[3]" />
                      ) : (
                        <Gift className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-[11px] font-black text-[#141219] block">4. Reveal</span>
                    <span className="text-[9px] text-[#716d77]">Doorstep Unbox</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Number and ETA */}
            <div className="mt-3 pt-3 border-t border-[#fecdd3]/60 bg-white/80 rounded-[14px] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-[#141219] flex-wrap gap-2">
                <span className="flex items-center gap-1.5 text-[#D30915]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Estimated Arrival: <strong>{order.estimatedDeliveryDate}</strong>
                  </span>
                </span>
                {order.trackingNumber && (
                  <button
                    type="button"
                    onClick={handleCopyTracking}
                    className="text-[11px] font-black text-[#D30915] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>
                      USPS: {order.trackingNumber} ({copiedTracking ? 'Copied! ✓' : 'Copy'})
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Items List */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[#716d77] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D30915]" />
              <span>Items In Package ({order.items.length})</span>
            </h4>
            <div className="space-y-2 divide-y divide-[#f7eff4]">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-12 h-12 rounded-[10px] object-contain border border-[#eee2eb] p-0.5 bg-white"
                    />
                    <div>
                      <p className="font-bold text-[#141219] m-0">{item.product.name}</p>
                      <p className="text-[10px] text-[#716d77] m-0">
                        Qty {item.quantity} • ${item.unitPrice.toFixed(2)} ea •{' '}
                        {item.selectedSurpriseOption || (item.product.surpriseType === 'cash' ? '💵 Real Cash' : '💍 Jewelry')}
                      </p>
                      {(item.selectedRingSize || item.selectedJewelryType || item.selectedSize) && (
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          {item.selectedJewelryType && (
                            <span className="text-[9px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                              {item.selectedJewelryType}
                            </span>
                          )}
                          {item.selectedRingSize && (
                            <span className="text-[9px] font-bold text-[#D30915] bg-[#fff1f2] px-1.5 py-0.2 rounded border border-[#fecdd3]">
                              Ring Size: {item.selectedRingSize}
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="text-[9px] font-medium text-[#716d77] bg-gray-50 px-1.5 py-0.2 rounded border border-gray-200">
                              {item.selectedSize}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-[#141219]">${item.totalPrice.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping & Payment Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#f4edf2]">
            <div className="p-3.5 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-1">
                Shipping Destination
              </span>
              <p className="font-bold text-[#141219] m-0">{order.shippingAddress.fullName}</p>
              <p className="text-[#716d77] m-0 leading-relaxed text-[11px] mt-0.5">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                <br />
                {order.shippingAddress.country}
              </p>
              <p className="text-[10px] text-[#8a858f] m-0 mt-1">Phone: {order.shippingAddress.phone}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#fffafc] border border-[#eedbe6]">
              <span className="text-[10px] font-black uppercase text-[#716d77] block mb-1">
                Payment & Invoice
              </span>
              <p className="font-bold text-[#141219] m-0 capitalize">
                {order.paymentSummary.cardBrand || order.paymentSummary.method.replace('_', ' ')}
              </p>
              <p className="text-[#716d77] m-0 text-[11px] mt-0.5">
                Status:{' '}
                {order.paymentSummary.method === 'cod' ? (
                  <strong className="text-amber-800">💵 Pay on Delivery</strong>
                ) : (
                  <strong className="text-emerald-700">✓ Paid Online</strong>
                )}
              </p>
              <p className="text-[10px] text-[#8a858f] m-0 mt-1">
                Placed: {new Date(order.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="p-3.5 rounded-[16px] bg-stone-50 border border-stone-200 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-bold">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>VIP Promo Code Discount</span>
                <span>-${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Shipping Fee</span>
              <span>{order.shippingFee === 0 ? 'FREE EXPRESS' : `$${order.shippingFee.toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between pt-1.5 border-t border-stone-200 font-black text-sm text-[#141219]">
              <span>Total Paid</span>
              <span className="text-[#D30915]">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-3.5 mt-3.5 border-t border-[#f4edf2] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="h-[38px] px-4 rounded-[11px] bg-white border border-[#e8dfe5] hover:border-[#D30915] text-[#55505a] hover:text-[#D30915] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-[38px] px-5 rounded-[11px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Close Receipt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
