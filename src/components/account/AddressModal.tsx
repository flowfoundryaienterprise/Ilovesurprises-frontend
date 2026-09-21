import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Globe,
  Compass,
  Building2,
} from 'lucide-react';
import type { SavedAddress } from '../../types';
import { isValidMobile } from '../../services/auth';
import { CustomSearchableSelect, type SelectOption } from '../ui/CustomSearchableSelect';
import { MapLocationPickerModal, type MapAddressResult } from '../checkout/MapLocationPickerModal';
import { COUNTRIES_DATA, getStatesByCountryName, getDistrictsByState } from '../../data/geoData';

interface AddressModalProps {
  isOpen: boolean;
  editingAddress: SavedAddress | null;
  onClose: () => void;
  onSaveAddress: (address: Omit<SavedAddress, 'id'> & { id?: string }) => void;
}

export const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  editingAddress,
  onClose,
  onSaveAddress,
}) => {
  const [form, setForm] = useState<Omit<SavedAddress, 'id'>>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'NY',
    zipCode: '',
    country: 'United States',
    label: 'Home',
    isDefault: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingAddress) {
        setForm({
          fullName: editingAddress.fullName,
          phone: editingAddress.phone,
          addressLine1: editingAddress.addressLine1,
          addressLine2: editingAddress.addressLine2 || '',
          city: editingAddress.city,
          state: editingAddress.state,
          zipCode: editingAddress.zipCode,
          country: editingAddress.country || 'United States',
          label: editingAddress.label || 'Home',
          isDefault: editingAddress.isDefault,
        });
      } else {
        setForm({
          fullName: '',
          phone: '',
          addressLine1: '',
          addressLine2: '',
          city: '',
          state: 'NY',
          zipCode: '',
          country: 'United States',
          label: 'Home',
          isDefault: false,
        });
      }
      setErrors({});
    }, 0);
    return () => clearTimeout(timer);
  }, [editingAddress, isOpen]);

  // Geographical cascading datasets
  const availableStates = useMemo(() => {
    return getStatesByCountryName(form.country || 'United States');
  }, [form.country]);

  const availableDistricts = useMemo(() => {
    return getDistrictsByState(
      form.country || 'United States',
      form.state || availableStates[0]?.code || availableStates[0]?.name || ''
    );
  }, [form.country, form.state, availableStates]);

  const countryOptions: SelectOption[] = useMemo(() => {
    return COUNTRIES_DATA.map((c) => ({
      value: c.name,
      label: c.name,
      badge: c.code,
    }));
  }, []);

  const stateOptions: SelectOption[] = useMemo(() => {
    return availableStates.map((s) => ({
      value: s.code,
      label: s.name,
      badge: s.code,
      subLabel: `${s.districts.length} districts`,
    }));
  }, [availableStates]);

  const districtOptions: SelectOption[] = useMemo(() => {
    return availableDistricts.map((d) => ({
      value: d.name,
      label: d.name,
      subLabel: d.majorCities?.slice(0, 2).join(', '),
      badge: d.defaultZip ? `ZIP ${d.defaultZip}` : undefined,
    }));
  }, [availableDistricts]);

  const cityOptions: SelectOption[] = useMemo(() => {
    const currentDist = availableDistricts.find((d) => d.name === selectedDistrict) || availableDistricts[0];
    const cities = currentDist?.majorCities || [];
    return cities.map((c) => ({
      value: c,
      label: c,
    }));
  }, [availableDistricts, selectedDistrict]);

  const handleCountryChange = (newCountry: string) => {
    const states = getStatesByCountryName(newCountry);
    const firstState = states[0];
    const firstDistrict = firstState?.districts[0];
    setForm((prev) => ({
      ...prev,
      country: newCountry,
      state: firstState?.code || firstState?.name || '',
      city: firstDistrict?.majorCities?.[0] || prev.city,
      zipCode: firstDistrict?.defaultZip || prev.zipCode,
    }));
    setSelectedDistrict(firstDistrict?.name || '');
  };

  const handleStateChange = (newState: string) => {
    const districts = getDistrictsByState(form.country, newState);
    const firstDistrict = districts[0];
    setForm((prev) => ({
      ...prev,
      state: newState,
      city: firstDistrict?.majorCities?.[0] || prev.city,
      zipCode: firstDistrict?.defaultZip || prev.zipCode,
    }));
    setSelectedDistrict(firstDistrict?.name || '');
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const district = availableDistricts.find((d) => d.name === distName);
    if (district) {
      setForm((prev) => ({
        ...prev,
        city: district.majorCities?.[0] || prev.city,
        zipCode: district.defaultZip || prev.zipCode,
      }));
    }
  };

  const handleMapSelect = (result: MapAddressResult) => {
    setForm((prev) => ({
      ...prev,
      addressLine1: result.addressLine1,
      city: result.city,
      state: result.state,
      zipCode: result.zipCode,
      country: result.country || 'United States',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!form.fullName.trim()) newErrors.fullName = 'Full Name is required';
    if (!form.phone.trim() || !isValidMobile(form.phone)) newErrors.phone = 'Valid 10-digit mobile is required';
    if (!form.addressLine1.trim()) newErrors.addressLine1 = 'Street address is required';
    if (!form.city.trim()) newErrors.city = 'City is required';
    if (!form.state.trim()) newErrors.state = 'State is required';
    if (!form.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSaveAddress({
      ...(editingAddress ? { id: editingAddress.id } : {}),
      ...form,
    });
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[88vh] bg-white rounded-[26px] p-5 sm:p-7 border border-[#eedbe6] shadow-2xl animate-modal-pop my-auto overflow-y-auto">
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#f4edf2]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#D30915] block">
              Shipping Destination
            </span>
            <h3 className="text-base sm:text-lg font-black text-[#141219] m-0 font-display">
              {editingAddress ? 'Edit Saved Address' : 'Add New Shipping Address'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-[#fff1f2] text-[#716d77] hover:text-[#D30915] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Map Pinpoint Helper */}
          <div className="flex items-center justify-between p-2.5 rounded-[14px] bg-[#fffafc] border border-[#fecdd3]">
            <span className="text-[11px] font-bold text-[#716d77]">
              Want to auto-fill your delivery coordinates?
            </span>
            <button
              type="button"
              onClick={() => setIsMapOpen(true)}
              className="h-[30px] px-2.5 rounded-[8px] bg-white hover:bg-[#fff1f2] text-[#D30915] border border-[#fecdd3] text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="w-3 h-3" />
              <span>Choose on Map</span>
            </button>
          </div>

          {/* Label & Full Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Address Tag / Label
              </label>
              <input
                type="text"
                value={form.label || ''}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="Home, Office, etc."
                className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Recipient Full Name <span className="text-[#D30915]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => {
                  setForm({ ...form, fullName: e.target.value });
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                }}
                className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-medium"
              />
              {errors.fullName && <p className="text-[10px] text-red-600 mt-0.5">{errors.fullName}</p>}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold text-[#141219] mb-1">
              Recipient Mobile Phone <span className="text-[#D30915]">*</span>
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => {
                setForm({ ...form, phone: e.target.value });
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
              placeholder="(555) 000-0000"
              className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-medium"
            />
            {errors.phone && <p className="text-[10px] text-red-600 mt-0.5">{errors.phone}</p>}
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-xs font-bold text-[#141219] mb-1">
              Street Address <span className="text-[#D30915]">*</span>
            </label>
            <input
              type="text"
              required
              value={form.addressLine1}
              onChange={(e) => {
                setForm({ ...form, addressLine1: e.target.value });
                if (errors.addressLine1) setErrors((prev) => ({ ...prev, addressLine1: '' }));
              }}
              placeholder="123 Main Street"
              className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-medium"
            />
            {errors.addressLine1 && <p className="text-[10px] text-red-600 mt-0.5">{errors.addressLine1}</p>}
          </div>

          {/* Country & State */}
          <div className="grid grid-cols-2 gap-3">
            <CustomSearchableSelect
              label="Country"
              required
              icon={<Globe className="w-3.5 h-3.5" />}
              options={countryOptions}
              value={form.country}
              onChange={handleCountryChange}
              placeholder="Select Country..."
              searchPlaceholder="Search country..."
            />

            <CustomSearchableSelect
              label="State / Province"
              required
              icon={<MapPin className="w-3.5 h-3.5" />}
              options={stateOptions}
              value={form.state}
              onChange={handleStateChange}
              placeholder="Select State..."
              searchPlaceholder="Search state..."
              error={errors.state}
            />
          </div>

          {/* District & City */}
          <div className="grid grid-cols-2 gap-3">
            <CustomSearchableSelect
              label="District / County"
              icon={<Compass className="w-3.5 h-3.5" />}
              options={districtOptions}
              value={selectedDistrict}
              onChange={handleDistrictChange}
              placeholder="District..."
              searchPlaceholder="Search district..."
            />

            {cityOptions.length > 0 ? (
              <CustomSearchableSelect
                label="City / Town"
                required
                icon={<Building2 className="w-3.5 h-3.5" />}
                options={cityOptions}
                value={form.city}
                onChange={(c) => {
                  setForm({ ...form, city: c });
                  if (errors.city) setErrors((prev) => ({ ...prev, city: '' }));
                }}
                placeholder="City..."
                searchPlaceholder="Search city..."
                error={errors.city}
              />
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#141219] mb-1">
                  City / Town <span className="text-[#D30915]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none"
                />
              </div>
            )}
          </div>

          {/* ZIP & Apt */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                ZIP / Postal Code <span className="text-[#D30915]">*</span>
              </label>
              <input
                type="text"
                required
                value={form.zipCode}
                onChange={(e) => {
                  setForm({ ...form, zipCode: e.target.value });
                  if (errors.zipCode) setErrors((prev) => ({ ...prev, zipCode: '' }));
                }}
                className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-medium"
              />
              {errors.zipCode && <p className="text-[10px] text-red-600 mt-0.5">{errors.zipCode}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#141219] mb-1">
                Apt / Suite / Unit <span className="text-[#8a858f] font-normal">(Opt)</span>
              </label>
              <input
                type="text"
                value={form.addressLine2 || ''}
                onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                placeholder="Apt 4B"
                className="w-full h-[40px] px-3 rounded-[11px] bg-[#fffafb] border border-[#e8dfe5] text-xs text-[#141219] outline-none font-medium"
              />
            </div>
          </div>

          {/* Default Address Checkbox */}
          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="w-4 h-4 rounded text-[#D30915] accent-[#D30915]"
            />
            <span className="text-xs text-[#55505a] font-bold">
              Set as primary / default shipping address
            </span>
          </label>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3.5 border-t border-[#f4edf2]">
            <button
              type="button"
              onClick={onClose}
              className="h-[38px] px-4 rounded-[11px] border border-[#e8dfe5] text-xs font-bold text-[#716d77] hover:text-[#141219] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-[38px] px-6 rounded-[11px] bg-[#D30915] hover:bg-[#B60711] text-white font-black text-xs uppercase shadow-xs cursor-pointer"
            >
              Save Address
            </button>
          </div>
        </form>
      </div>

      {/* Map Location Modal */}
      <MapLocationPickerModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelectAddress={handleMapSelect}
        initialAddress={form}
      />
    </div>,
    document.body
  );
};
