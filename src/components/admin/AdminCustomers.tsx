import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  X,
  Copy,
} from 'lucide-react';
import type { AdminCustomerItem, AdminOrderItem } from '../../types/admin';

interface AdminCustomersProps {
  customers: AdminCustomerItem[];
  orders?: AdminOrderItem[];
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AdminCustomers: React.FC<AdminCustomersProps> = ({
  customers,
  orders = [],
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerItem | null>(null);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.repReferredBy && c.repReferredBy.toLowerCase().includes(q));

      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, searchQuery, statusFilter]);

  // Customer orders
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(
      (o) =>
        o.customerEmail.toLowerCase() === selectedCustomer.email.toLowerCase() ||
        o.customerName.toLowerCase() === selectedCustomer.name.toLowerCase()
    );
  }, [orders, selectedCustomer]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Header Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D30915]" />
            <h2 className="text-xl font-black text-[#141219] hero-title-font m-0">
              Customer Registry
            </h2>
            <span className="text-xs font-bold text-[#D30915] bg-[#fff1f2] px-2 py-0.5 rounded-full">
              {customers.length} Profiles
            </span>
          </div>
          <p className="text-xs text-[#716d77] m-0 mt-0.5">
            Registered shopper profiles, order history, lifetime spend, and affiliate referrer attribution.
          </p>
        </div>

        <div className="text-xs font-medium text-[#716d77] flex items-center gap-1.5">
          <span>Customer Directory Active</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
      </div>

      {/* 2. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#eedbe6] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, email, phone, or referrer..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-xs text-[#141219] focus:outline-none focus:border-[#D30915]"
          />
          <Search className="w-4 h-4 text-[#8a858f] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'active', 'inactive'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#D30915] text-white'
                  : 'bg-[#faf7f9] text-[#716d77] hover:bg-gray-100'
              }`}
            >
              {st === 'all' ? 'All Customers' : st}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Customers Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#eedbe6] shadow-xs overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D30915] flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#141219]">No customer accounts found</h3>
            <p className="text-xs text-[#716d77]">Try adjusting your search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#fdf9fb] border-b border-[#eedbe6] text-[10px] font-extrabold uppercase text-[#716d77] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">Contact Email & Phone</th>
                  <th className="py-3 px-3">Orders Placed</th>
                  <th className="py-3 px-3">Lifetime Value</th>
                  <th className="py-3 px-3">Attributed Referrer</th>
                  <th className="py-3 px-3">Account Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5eaf1] font-medium">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#fffbfd] transition-colors">
                    {/* Name & Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-[#fff1f2] border border-[#eedbe6] text-[#D30915] flex items-center justify-center font-bold text-xs shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-[#141219]">{c.name}</div>
                          <div className="text-[10px] text-[#716d77]">ID: {c.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Email & Phone */}
                    <td className="py-3 px-3">
                      <div className="text-xs text-[#141219]">{c.email}</div>
                      <div className="text-[10px] text-[#716d77]">{c.phone || 'No phone recorded'}</div>
                    </td>

                    {/* Orders Count */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-xs text-[#141219]">
                        {c.ordersCount} {c.ordersCount === 1 ? 'order' : 'orders'}
                      </div>
                      <div className="text-[10px] text-[#716d77]">Last: {c.lastOrderDate}</div>
                    </td>

                    {/* Lifetime Value */}
                    <td className="py-3 px-3">
                      <div className="font-black text-xs text-[#141219]">
                        ${c.totalSpent.toFixed(2)}
                      </div>
                    </td>

                    {/* Referrer Attribution */}
                    <td className="py-3 px-3">
                      {c.repReferredBy ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                          <span>@{c.repReferredBy}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#716d77] font-medium">Direct / Organic</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          c.status === 'active'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    {/* View Drawer */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1 rounded-xl bg-[#faf7f9] border border-[#eedbe6] text-[#141219] hover:text-[#D30915] hover:border-[#D30915] text-xs font-bold transition-all cursor-pointer"
                      >
                        Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Customer Profile Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-[#eedbe6] overflow-hidden my-6 animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-[#eedbe6] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#fff1f2] border border-[#eedbe6] text-[#D30915] flex items-center justify-center font-black text-sm">
                  {selectedCustomer.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-[#141219] m-0">{selectedCustomer.name}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.clipboard) {
                        navigator.clipboard.writeText(selectedCustomer.email);
                        onShowToast(`Copied ${selectedCustomer.email} to clipboard`, { type: 'info' });
                      }
                    }}
                    className="text-xs text-[#716d77] hover:text-[#D30915] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>{selectedCustomer.email}</span>
                    <Copy className="w-3 h-3 text-[#716d77]" />
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-[#716d77] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Stat Summary Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-[10px] font-bold uppercase text-[#716d77]">Total Orders</span>
                  <div className="text-xl font-black text-[#141219] mt-0.5">
                    {selectedCustomer.ordersCount}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-[10px] font-bold uppercase text-emerald-800">Total Spent</span>
                  <div className="text-xl font-black text-emerald-700 mt-0.5">
                    ${selectedCustomer.totalSpent.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Attribution Details */}
              <div className="p-3.5 rounded-xl bg-[#faf7f9] border border-[#eedbe6] space-y-2 text-xs">
                <span className="font-extrabold text-[11px] uppercase text-[#716d77]">Attribution & Affiliate</span>
                <div className="flex items-center justify-between">
                  <span className="text-[#716d77]">Referred by:</span>
                  <span className="font-bold text-[#141219]">
                    {selectedCustomer.repReferredBy ? `@${selectedCustomer.repReferredBy}` : 'Direct Shopper (Organic)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#716d77]">Last Order Date:</span>
                  <span className="font-medium text-[#141219]">{selectedCustomer.lastOrderDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#716d77]">Customer ID:</span>
                  <span className="font-mono text-[11px] text-[#716d77]">{selectedCustomer.id}</span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#141219]">Recent Order History</span>
                {customerOrders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#716d77] bg-gray-50 rounded-xl">
                    No order transactions recorded for this profile yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-3 rounded-xl border border-[#eedbe6] bg-white flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#141219]">#{ord.orderNumber}</span>
                          <div className="text-[10px] text-[#716d77]">{ord.createdAt}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-[#141219]">${ord.total.toFixed(2)}</span>
                          <div className="text-[10px] capitalize text-emerald-700 font-bold">{ord.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
