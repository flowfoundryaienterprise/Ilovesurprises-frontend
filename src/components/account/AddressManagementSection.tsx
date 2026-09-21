import React, { useState } from 'react';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import type { SavedAddress } from '../../types';
import { accountService } from '../../services/accountService';
import { AddressModal } from './AddressModal';

interface AddressManagementSectionProps {
  addresses: SavedAddress[];
  onUpdateAddresses: (addresses: SavedAddress[]) => void;
  onShowToast: (message: string, options?: { title?: string; type?: 'success' | 'info' }) => void;
}

export const AddressManagementSection: React.FC<AddressManagementSectionProps> = ({
  addresses,
  onUpdateAddresses,
  onShowToast,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<SavedAddress | null>(null);

  const handleOpenNew = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: SavedAddress) => {
    setEditingAddress(addr);
    setIsModalOpen(true);
  };

  const handleSaveAddress = (data: Omit<SavedAddress, 'id'> & { id?: string }) => {
    accountService.saveAddress(data);
    const updated = accountService.getSavedAddresses();
    onUpdateAddresses(updated);
    setIsModalOpen(false);
    onShowToast(data.id ? 'Address changes updated' : 'New address successfully added', {
      title: 'Address Saved',
      type: 'success',
    });
  };

  const handleDelete = (id: string) => {
    if (typeof window !== 'undefined' && window.confirm('Are you sure you want to remove this saved shipping address?')) {
      accountService.deleteAddress(id);
      const updated = accountService.getSavedAddresses();
      onUpdateAddresses(updated);
      onShowToast('Saved address removed', {
        title: 'Address Deleted',
        type: 'info',
      });
    }
  };

  const handleSetDefault = (id: string) => {
    accountService.setDefaultAddress(id);
    const updated = accountService.getSavedAddresses();
    onUpdateAddresses(updated);
    onShowToast('Primary delivery address updated', {
      title: 'Default Address Set',
      type: 'success',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] p-6 sm:p-8 border border-[#eedbe6] shadow-[0_8px_24px_rgba(50,31,63,0.04)]">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f5eaf1] mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-black text-[#141219] m-0 font-display">
                Saved Shipping Destinations
              </h2>
              <span className="text-[11px] font-black uppercase text-[#D30915] bg-[#fff1f2] px-2.5 py-0.5 rounded-full border border-[#fecdd3]">
                {addresses.length}/3 Maximum
              </span>
            </div>
            <p className="text-xs text-[#716d77] m-0 mt-0.5">
              Manage your delivery locations for fast 1-click surprise checkout
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="h-[38px] px-4 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{addresses.length >= 3 ? 'Replace / Add Address' : 'Add New Address'}</span>
          </button>
        </div>

        {/* Empty State */}
        {addresses.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-[20px] bg-[#fffafc] border border-dashed border-[#eedbe6]">
            <div className="w-16 h-16 rounded-full bg-[#fff1f2] text-[#D30915] border-2 border-[#fecdd3] flex items-center justify-center mx-auto mb-3 shadow-xs">
              <MapPin className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-[#141219] mb-1 font-display">
              No Addresses Saved Yet
            </h3>
            <p className="text-xs text-[#716d77] max-w-sm mx-auto mb-5 leading-relaxed">
              Add your primary residence or work address to unlock lightning-fast delivery on future surprise orders.
            </p>
            <button
              type="button"
              onClick={handleOpenNew}
              className="h-[42px] px-6 rounded-[12px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Your First Address</span>
            </button>
          </div>
        ) : (
          /* Addresses Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-[20px] border-2 transition-all flex flex-col justify-between ${
                  addr.isDefault
                    ? 'bg-[#fffafc] border-[#D30915] shadow-xs'
                    : 'bg-white border-[#eedbe6] hover:border-[#fecdd3]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-[#141219] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#D30915]" />
                      <span>{addr.label || 'Saved Location'}</span>
                    </span>
                    {addr.isDefault && (
                      <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Primary Default</span>
                      </span>
                    )}
                  </div>

                  <strong className="block text-sm font-bold text-[#141219]">
                    {addr.fullName}
                  </strong>
                  <p className="text-xs text-[#716d77] m-0 mt-1 leading-relaxed">
                    {addr.addressLine1}
                    {addr.addressLine2 && `, ${addr.addressLine2}`}
                    <br />
                    {addr.city}, {addr.state} {addr.zipCode}
                    <br />
                    {addr.country}
                  </p>
                  <p className="text-[11px] text-[#8a858f] mt-2 m-0 font-medium">
                    Phone: {addr.phone}
                  </p>
                </div>

                <div className="pt-3.5 mt-4 border-t border-[#f4edf2] flex items-center justify-between text-xs">
                  {!addr.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[11px] font-black text-[#D30915] hover:underline cursor-pointer"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-bold">
                      Default Checkout Address
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(addr)}
                      className="p-1.5 rounded-lg text-[#716d77] hover:text-[#D30915] hover:bg-[#fff1f2] transition-colors cursor-pointer"
                      title="Edit Address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 rounded-lg text-[#a39ea8] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Address Add / Edit Modal */}
      <AddressModal
        isOpen={isModalOpen}
        editingAddress={editingAddress}
        onClose={() => setIsModalOpen(false)}
        onSaveAddress={handleSaveAddress}
      />
    </div>
  );
};
