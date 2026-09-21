import React, { useEffect } from 'react';
import {
  Package,
  Truck,
  Gift,
  Check,
  ShieldCheck,
  Clock,
  Printer,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import type { Order } from '../types';
import { orderService } from '../services/orderService';
import { OrderSuccessAnimation } from '../components/checkout/OrderSuccessAnimation';

interface OrderConfirmationProps {
  orderId?: string;
  latestOrder?: Order | null;
  onNavigateToShop: () => void;
  onNavigateToAccountOrders: (orderId?: string) => void;
}

export const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  orderId,
  latestOrder,
  onNavigateToShop,
  onNavigateToAccountOrders,
}) => {
  const order = React.useMemo<Order | null>(() => {
    if (latestOrder && (!orderId || latestOrder.id === orderId)) {
      return latestOrder;
    }
    if (orderId) {
      return orderService.getOrderById(orderId) || null;
    }
    const allOrders = orderService.getOrders();
    return allOrders.length > 0 ? allOrders[0] : null;
  }, [orderId, latestOrder]);

  const totalItemsPurchased = React.useMemo(() => {
    return order ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
  }, [order]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-black text-[#141219] mb-3">Order Not Found</h2>
        <p className="text-sm text-[#716d77] mb-6">
          We couldn&apos;t find an order matching this ID. Please check your account order history.
        </p>
        <button
          type="button"
          onClick={onNavigateToShop}
          className="h-[46px] px-6 rounded-[14px] bg-[#D30915] text-white font-black text-xs uppercase cursor-pointer"
        >
          Return to Store
        </button>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#fcf9fb] py-6 sm:py-12">
      <div className="max-w-[960px] mx-auto px-3.5 sm:px-6 space-y-8">

        {/* 1. DIGITAL PAYMENT-GRADE SUCCESS ANIMATION HERO */}
        <OrderSuccessAnimation
          order={order}
          onNavigateToShop={onNavigateToShop}
          onNavigateToAccountOrders={onNavigateToAccountOrders}
        />

        {/* 2. Order Progress Tracker Stepper */}
        <div id="order-details-section" className="bg-white rounded-[24px] p-5 sm:p-7 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)] mb-8 scroll-mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f5eaf1] mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Estimated Arrival</span>
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#141219] m-0">
                Arriving by {order.estimatedDeliveryDate}
              </h3>
            </div>
            {order.trackingNumber && (
              <div className="text-xs text-[#716d77] font-semibold bg-[#fffafc] px-3 py-1.5 rounded-[10px] border border-[#eee2eb]">
                USPS Tracking: <strong className="text-[#141219] font-mono">{order.trackingNumber}</strong>
              </div>
            )}
          </div>

          {/* Stepper Steps */}
          <div className="grid grid-cols-4 gap-2 sm:gap-4 text-center">

            {/* Step 1 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-xs mb-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#141219]">Placed</span>
              <span className="text-[10px] text-[#716d77] hidden sm:block">Confirmed</span>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#D30915] text-white flex items-center justify-center text-xs font-black shadow-xs mb-1.5 ring-4 ring-[#D30915]/20">
                <Package className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-black text-[#D30915]">Processing</span>
              <span className="text-[10px] text-[#D30915] font-bold hidden sm:block">Packing Candle</span>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#fff1f2] border border-[#eedbe6] text-[#8a858f] flex items-center justify-center text-xs font-black mb-1.5">
                <Truck className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#716d77]">Shipped</span>
              <span className="text-[10px] text-[#8a858f] hidden sm:block">In Transit</span>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center">
              <div className="w-9 h-9 rounded-full bg-[#fff1f2] border border-[#eedbe6] text-[#8a858f] flex items-center justify-center text-xs font-black mb-1.5">
                <Gift className="w-4 h-4" />
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-[#716d77]">Delivered</span>
              <span className="text-[10px] text-[#8a858f] hidden sm:block">Unbox Prize</span>
            </div>

          </div>
        </div>

        {/* 3. Two-Column Order Breakdown & Shipping Details */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">

          {/* Left Column: Purchased Items (7 cols) */}
          <div className="md:col-span-7 bg-white rounded-[24px] p-5 sm:p-6 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)]">
            <div className="flex items-center justify-between pb-3 border-b border-[#f5eaf1] mb-4">
              <h3 className="text-sm font-black text-[#141219] m-0 font-display flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D30915]" />
                <span>Purchased Items ({totalItemsPurchased} {totalItemsPurchased === 1 ? 'item' : 'items'})</span>
              </h3>
              <span className="text-[11px] text-[#716d77]">{formattedDate}</span>
            </div>

            {/* Items List */}
            <div className="space-y-3.5 divide-y divide-[#f7eff4] w-full max-w-full">
              {order.items.map((item, idx) => (
                <div key={idx} className="pt-3.5 first:pt-0 flex items-center justify-between gap-3.5 w-full max-w-full overflow-visible">
                  <div className="relative shrink-0 overflow-visible" style={{ overflow: 'visible' }}>
                    <div className="w-16 h-16 rounded-[14px] bg-[#faf5f8] border border-[#ecdbe6] flex items-center justify-center p-1.5 shadow-2xs overflow-hidden">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span
                      className="absolute rounded-full bg-[#141219] text-white font-bold flex items-center justify-center border-2 border-white shadow-xs z-20 leading-none select-none pointer-events-none"
                      style={{
                        top: '-8px',
                        right: '-8px',
                        width: '20px',
                        height: '20px',
                        fontSize: '12px',
                        lineHeight: '1',
                        backgroundColor: '#141219',
                        color: '#ffffff',
                        border: '2px solid #ffffff',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                      }}
                    >
                      {item.quantity}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <h4 className="text-xs sm:text-sm font-bold text-[#141219] m-0 truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-emerald-700 font-bold m-0 mt-0.5 flex items-center gap-1 truncate">
                      <Gift className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span className="truncate">{item.selectedSurpriseOption || (item.product.surpriseType === 'cash' ? 'Real Cash Inside' : 'Jewelry Inside')}</span>
                    </p>
                    <span className="text-[11px] text-[#716d77] block mt-0.5 truncate">
                      ${item.unitPrice.toFixed(2)} × {item.quantity}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs sm:text-sm font-black text-[#141219] shrink-0 whitespace-nowrap">
                      ${item.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="pt-4 mt-5 border-t border-[#f5eaf1] space-y-2 text-xs text-[#716d77]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#141219]">${order.subtotal.toFixed(2)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>Discount {order.promoCode ? `(${order.promoCode})` : ''}</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span>Shipping ({order.deliveryMethod.name.split(' ')[0]})</span>
                <span className={`font-bold ${order.shippingFee === 0 ? 'text-emerald-700 font-black' : 'text-[#141219]'}`}>
                  {order.shippingFee === 0 ? 'FREE' : `$${order.shippingFee.toFixed(2)}`}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#f5eaf1] text-base font-black text-[#141219]">
                <span>Total Paid</span>
                <span className="text-lg text-[#D30915]">${order.total.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Delivery & Payment Details (5 cols) */}
          <div className="md:col-span-5 space-y-5">

            {/* Delivery Destination Card */}
            <div className="bg-white rounded-[24px] p-5 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)]">
              <div className="flex items-center gap-2 pb-3 border-b border-[#f5eaf1] mb-3">
                <Truck className="w-4 h-4 text-[#D30915]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0">
                  Shipping Destination
                </h4>
              </div>

              <div className="text-xs text-[#55505a] space-y-1">
                <strong className="block text-sm font-black text-[#141219]">
                  {order.shippingAddress.fullName}
                </strong>
                <p className="m-0 leading-relaxed">
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
                <p className="text-[11px] text-[#716d77] pt-1 m-0">
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>

              <div className="mt-3.5 pt-3 border-t border-[#f5eaf1] text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#716d77] block">
                  Method:
                </span>
                <span className="font-bold text-[#141219]">
                  {order.deliveryMethod.name} ({order.deliveryMethod.subtitle})
                </span>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-[24px] p-5 border border-[#eedbe6] shadow-[0_10px_30px_rgba(50,31,63,0.04)]">
              <div className="flex items-center gap-2 pb-3 border-b border-[#f5eaf1] mb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#141219] m-0">
                  Payment Details
                </h4>
              </div>

              <div className="text-xs text-[#55505a] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#716d77]">Method:</span>
                  <span className="font-black text-[#141219] capitalize">
                    {order.paymentSummary.cardBrand || order.paymentSummary.method.replace('_', ' ')}
                  </span>
                </div>
                {order.paymentSummary.last4 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[#716d77]">Card ending in:</span>
                    <span className="font-mono font-bold text-[#141219]">•••• {order.paymentSummary.last4}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-[#716d77]">Status:</span>
                  {order.paymentSummary.method === 'cod' ? (
                    <span className="text-amber-800 font-black bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px]">
                      💵 Pay on Delivery (${order.total.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px]">
                      ✓ Paid (${order.total.toFixed(2)})
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-1 text-[10px] text-[#8a858f]">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{order.paymentSummary.transactionId.slice(0, 16)}...</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 4. Action Buttons Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-[22px] border border-[#eedbe6] shadow-xs">
          <button
            type="button"
            onClick={handlePrint}
            className="group w-full sm:w-auto h-[38px] sm:h-[40px] px-4 rounded-[13px] sm:rounded-full bg-white border border-[#e2d5df] hover:border-[#D30915]/50 hover:bg-[#fff1f2] text-xs font-bold text-[#1e1926] hover:text-[#D30915] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
            title="Print Official Order Receipt"
          >
            <Printer className="w-3.5 h-3.5 text-[#5e5866] group-hover:text-[#D30915] group-hover:scale-110 transition-all duration-200" />
            <span>Print Receipt</span>
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onNavigateToAccountOrders(order.id)}
              className="group w-full sm:w-auto h-[38px] sm:h-[40px] px-4.5 rounded-[13px] sm:rounded-full bg-white border border-[#D30915] text-[#D30915] hover:bg-[#fff1f2] font-bold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
            >
              <span>View in My Orders</span>
            </button>

            <button
              type="button"
              onClick={onNavigateToShop}
              className="group w-full sm:w-auto h-[38px] sm:h-[40px] px-5 rounded-[13px] sm:rounded-full bg-gradient-to-r from-[#D30915] via-[#e5286e] to-[#d81f62] hover:brightness-105 active:scale-95 text-white font-bold text-xs tracking-wide shadow-[0_4px_16px_rgba(211, 9, 21,0.35)] hover:shadow-[0_6px_22px_rgba(211, 9, 21,0.48)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ShoppingBag className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-200" />
              <span>Continue Shopping</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
