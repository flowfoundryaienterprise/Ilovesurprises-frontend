import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  RotateCcw,
  X,
} from 'lucide-react';
import type { AdminOrderItem, AdminRefundRecord } from '../../types/admin';

interface AdminOrdersProps {
  orders: AdminOrderItem[];
  onProcessRefund?: (refund: Omit<AdminRefundRecord, 'id' | 'requestedAt' | 'status'>) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({
  orders,
  onProcessRefund,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'refunded' | 'pending'>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null);

  // Status update simulation state
  const [orderOverrides, setOrderOverrides] = useState<Record<string, { status?: AdminOrderItem['status']; tracking?: string }>>({});

  // Refund Drawer State
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundReason, setRefundReason] = useState('Customer return requested');
  const [refundAmount, setRefundAmount] = useState('');

  // Shipping Tracking input
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('USPS');

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.map((o) => {
      const override = orderOverrides[o.id];
      return override ? { ...o, ...override } : o;
    }).filter((o) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        (o.itemsSummary && o.itemsSummary.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      const matchesPayment = paymentFilter === 'all' || o.paymentStatus === paymentFilter;

      return matchesSearch && matchesStatus && matchesPayment;
    });
  }, [orders, searchQuery, statusFilter, paymentFilter, orderOverrides]);

  const handleOpenOrder = (o: AdminOrderItem) => {
    setSelectedOrder(o);
    setRefundAmount(o.total.toFixed(2));
    setTrackingNumber(orderOverrides[o.id]?.tracking || '');
    setIsRefunding(false);
  };

  const handleMarkShipped = () => {
    if (!selectedOrder) return;
    const track = trackingNumber.trim() || `94001118992231${Math.floor(1000 + Math.random() * 9000)}`;
    setOrderOverrides((prev) => ({
      ...prev,
      [selectedOrder.id]: { ...prev[selectedOrder.id], status: 'shipped', tracking: `${carrier}: ${track}` },
    }));
    setSelectedOrder((prev) => (prev ? { ...prev, status: 'shipped' } : null));
    onShowToast(`Order #${selectedOrder.orderNumber} marked as Shipped (${carrier}: ${track})`, {
      type: 'success',
    });
  };

  const handleMarkDelivered = () => {
    if (!selectedOrder) return;
    setOrderOverrides((prev) => ({
      ...prev,
      [selectedOrder.id]: { ...prev[selectedOrder.id], status: 'delivered' },
    }));
    setSelectedOrder((prev) => (prev ? { ...prev, status: 'delivered' } : null));
    onShowToast(`Order #${selectedOrder.orderNumber} marked as Delivered`, {
      type: 'success',
    });
  };

  const handleExecuteRefund = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !onProcessRefund) return;

    onProcessRefund({
      orderId: selectedOrder.orderNumber,
      customerName: selectedOrder.customerName,
      customerEmail: selectedOrder.customerEmail,
      amount: parseFloat(refundAmount) || selectedOrder.total,
      reason: refundReason,
      restocked: true,
      approvedBy: 'Admin Operations',
    });

    setOrderOverrides((prev) => ({
      ...prev,
      [selectedOrder.id]: { ...prev[selectedOrder.id], paymentStatus: 'refunded' as any },
    }));

    onShowToast(`Refund of $${refundAmount} recorded for Order #${selectedOrder.orderNumber}`, {
      type: 'success',
    });
    setIsRefunding(false);
    setSelectedOrder(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Processing</span>
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <Truck className="w-3 h-3 text-blue-600" />
            <span>Shipped</span>
          </span>
        );
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivered</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 capitalize">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (payStatus: string) => {
    switch (payStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Paid</span>
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Pending</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header & Summary Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Orders & Fulfillment
            </h2>
            <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              {orders.length} Recorded Orders
            </span>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Track customer transactions, itemized surprise manifests, carrier tracking, and order refunds.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-[#716d77]">
          <span>Order Registry:</span>
          <span className="font-bold text-[#141219] bg-[#faf7f9] border border-[#eedbe6] px-2.5 py-1 rounded-xl">
            Store Orders Connected
          </span>
        </div>
      </div>

      {/* 2. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, customer name, email..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-medium text-[#141219]"
          >
            <option value="all">All Shipping Statuses</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value as any)}
            className="h-9 px-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-medium text-[#141219]"
          >
            <option value="all">All Payments</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* 3. Orders Table or Clean Empty State */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 sm:p-16 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#fff1f2] text-[#D30915] flex items-center justify-center mx-auto border border-[#fecdd3]">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-[#141219]">No Orders Found</h3>
              <p className="text-xs text-[#716d77] leading-relaxed">
                {searchQuery || statusFilter !== 'all' || paymentFilter !== 'all'
                  ? 'No orders match your active filter criteria. Try clearing search terms.'
                  : 'Customer orders from store checkouts will appear here with complete line-item breakdown, shipping addresses, and status controls.'}
              </p>
            </div>
            {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs font-bold text-[#D30915] hover:bg-red-50 transition-all cursor-pointer"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID & Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Purchased</th>
                  <th className="py-3 px-3">Total ($)</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3">Fulfillment Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5eaf1] font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#fffbfd] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-[#141219]">{o.orderNumber}</div>
                      <div className="text-[10px] text-[#716d77] mt-0.5">
                        {new Date(o.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-[#141219]">{o.customerName}</div>
                      <div className="text-[11px] text-[#716d77] truncate max-w-[180px]">
                        {o.customerEmail}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#141219]">
                        {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                      </div>
                      <div className="text-[10px] text-[#716d77] truncate max-w-[200px]">
                        {o.itemsSummary || 'Surprise Candles & Melts'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-black text-xs text-[#141219]">${o.total.toFixed(2)}</div>
                    </td>

                    <td className="py-3 px-3">{getPaymentBadge(o.paymentStatus)}</td>

                    <td className="py-3 px-3">{getStatusBadge(o.status)}</td>

                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenOrder(o)}
                        className="px-3 py-1 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-[#141219] hover:text-[#D30915] hover:border-[#D30915] text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Order Details Modal / Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-[#141219] m-0">
                    Order #{selectedOrder.orderNumber}
                  </h3>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <p className="text-[11px] text-[#716d77] m-0 mt-0.5">
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-xl text-[#716d77] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Customer Info Card */}
              <div className="p-3.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] space-y-2">
                <span className="text-[11px] font-extrabold uppercase text-[#716d77]">Customer & Shipping</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-bold text-[#141219]">{selectedOrder.customerName}</div>
                    <div className="text-[#716d77]">{selectedOrder.customerEmail}</div>
                  </div>
                  <div>
                    <div className="text-[#716d77]">Shipping Address:</div>
                    <div className="font-medium text-[#141219]">Standard Domestic Shipping (USA)</div>
                  </div>
                </div>
              </div>

              {/* Items Manifest */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#141219]">Items Manifest ({selectedOrder.itemCount})</span>
                <div className="p-3 rounded-xl border border-[#eedbe6] bg-white space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold pb-2 border-b border-gray-100">
                    <span>{selectedOrder.itemsSummary || 'Surprise Candle Item'}</span>
                    <span>${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#716d77]">
                    <span>Subtotal</span>
                    <span className="font-mono">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#716d77]">
                    <span>Shipping</span>
                    <span className="font-mono text-emerald-600 font-bold">FREE</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-black text-[#141219] pt-2 border-t border-gray-100">
                    <span>Total Paid</span>
                    <span className="text-[#D30915]">${selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update & Tracking Section */}
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
                <span className="text-xs font-bold text-[#141219]">Fulfillment & Tracking Controls</span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="h-9 px-2.5 rounded-lg bg-white border border-gray-300 text-xs"
                  >
                    <option value="USPS">USPS</option>
                    <option value="UPS">UPS</option>
                    <option value="FedEx">FedEx</option>
                    <option value="DHL">DHL</option>
                  </select>

                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Tracking number..."
                    className="sm:col-span-2 h-9 px-3 rounded-lg bg-white border border-gray-300 text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={handleMarkShipped}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Mark as Shipped</span>
                    </button>
                  )}

                  {selectedOrder.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={handleMarkDelivered}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark as Delivered</span>
                    </button>
                  )}

                  {selectedOrder.paymentStatus !== 'refunded' && (
                    <button
                      type="button"
                      onClick={() => setIsRefunding(!isRefunding)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Issue Refund</span>
                    </button>
                  )}
                </div>

                {/* Refund Form Drawer */}
                {isRefunding && (
                  <form onSubmit={handleExecuteRefund} className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2 animate-in fade-in">
                    <span className="text-xs font-bold text-rose-900">Process Order Refund</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Refund Amount ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-white border border-rose-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-700 mb-0.5">Reason</label>
                        <input
                          type="text"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          className="w-full h-8 px-2.5 rounded bg-white border border-rose-300 text-xs"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                    >
                      Confirm Refund
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
