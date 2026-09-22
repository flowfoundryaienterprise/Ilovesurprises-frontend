import type { SavedAddress, UserProfile, UserSettings } from '../types';

const ADDRESSES_STORAGE_KEY = 'ilovesurprises_addresses_v1';
const USER_STORAGE_KEY = 'ilovesurprises_user_v1';
const SETTINGS_STORAGE_KEY = 'ilovesurprises_settings_v1';

const MAX_SAVED_ADDRESSES = 3;

/**
 * Normalizes and checks if two addresses represent the exact same delivery location
 */
export function isSameAddress(
  a: { addressLine1: string; city: string; state: string; zipCode: string },
  b: { addressLine1: string; city: string; state: string; zipCode: string }
): boolean {
  const norm = (val?: string) =>
    (val || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,#-]/g, '');

  return (
    norm(a.addressLine1) === norm(b.addressLine1) &&
    norm(a.city) === norm(b.city) &&
    norm(a.state) === norm(b.state) &&
    norm(a.zipCode) === norm(b.zipCode)
  );
}

/**
 * Account Service layer - ready for backend REST API endpoints:
 * GET /api/account/addresses
 * POST /api/account/addresses
 * PUT /api/account/addresses/:id
 * DELETE /api/account/addresses/:id
 * PUT /api/account/profile
 */
export const accountService = {
  MAX_SAVED_ADDRESSES,

  /**
   * Loads saved addresses from storage (max 3) - filters out and removes default saved address
   */
  getSavedAddresses(): SavedAddress[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ADDRESSES_STORAGE_KEY);
      if (stored) {
        const parsed: SavedAddress[] = JSON.parse(stored);
        // Filter out default saved addresses and clear default flags
        const filtered = parsed.filter((a) => !a.isDefault);
        if (filtered.length !== parsed.length) {
          localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(filtered));
        }
        // Ensure deduplication & maximum 3 limit
        const uniqueList: SavedAddress[] = [];
        for (const addr of filtered) {
          const cleanAddr = { ...addr, isDefault: false };
          if (!uniqueList.some((u) => isSameAddress(u, cleanAddr))) {
            uniqueList.push(cleanAddr);
          }
          if (uniqueList.length >= MAX_SAVED_ADDRESSES) break;
        }
        return uniqueList;
      }
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Records / syncs a delivery address from an order.
   * - Deduplicates: If the same address already exists, updates recipient info without creating a duplicate.
   * - Enforces MAX 3 different addresses (keeps up to 3 distinct locations).
   */
  recordOrderShippingAddress(shipping: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }): SavedAddress {
    const list = this.getSavedAddresses();

    // 1. Check if the exact same physical delivery address already exists
    const existingIndex = list.findIndex((a) => isSameAddress(a, shipping));

    if (existingIndex >= 0) {
      // Address already exists -> Update name/phone, do not duplicate
      list[existingIndex] = {
        ...list[existingIndex],
        fullName: shipping.fullName.trim() || list[existingIndex].fullName,
        phone: shipping.phone.trim() || list[existingIndex].phone,
        addressLine2: shipping.addressLine2?.trim() || list[existingIndex].addressLine2 || '',
        country: shipping.country?.trim() || list[existingIndex].country || 'United States',
        isDefault: false,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
      }
      return list[existingIndex];
    }

    // 2. New distinct address: Create and add
    const newAddress: SavedAddress = {
      id: 'addr-' + Date.now(),
      label: `Delivery Address ${list.length + 1}`,
      fullName: shipping.fullName.trim(),
      phone: shipping.phone.trim(),
      addressLine1: shipping.addressLine1.trim(),
      addressLine2: shipping.addressLine2?.trim() || '',
      city: shipping.city.trim(),
      state: shipping.state.trim().toUpperCase(),
      zipCode: shipping.zipCode.trim(),
      country: shipping.country?.trim() || 'United States',
      isDefault: false,
    };

    // Add to top and cap at MAX 3 addresses
    list.unshift(newAddress);
    const capped = list.slice(0, MAX_SAVED_ADDRESSES);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(capped));
      window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
    }

    return newAddress;
  },

  /**
   * Adds or updates a saved address with deduplication and 3-address cap
   */
  saveAddress(data: Omit<SavedAddress, 'id' | 'isDefault'> & { id?: string; isDefault?: boolean }): SavedAddress {
    const list = this.getSavedAddresses();
    let saved: SavedAddress;

    if (data.id) {
      // Update existing address by ID
      const index = list.findIndex((a) => a.id === data.id);
      saved = {
        ...(list[index] || {}),
        isDefault: data.isDefault ?? list[index]?.isDefault ?? false,
        ...data,
        id: data.id,
      } as SavedAddress;

      if (data.isDefault) {
        list.forEach((a) => {
          if (a.id !== data.id) a.isDefault = false;
        });
      }
      if (index >= 0) {
        list[index] = saved;
      } else {
        list.push(saved);
      }
    } else {
      // Check if duplicate exists before creating
      const existingIndex = list.findIndex((a) => isSameAddress(a, data));
      if (existingIndex >= 0) {
        // Update existing instead of creating duplicate
        list[existingIndex] = {
          ...list[existingIndex],
          ...data,
          id: list[existingIndex].id,
          isDefault: data.isDefault ?? list[existingIndex].isDefault ?? false,
        };
        if (data.isDefault) {
          list.forEach((a) => {
            if (a.id !== list[existingIndex].id) a.isDefault = false;
          });
        }
        if (typeof window !== 'undefined') {
          localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(list));
          window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
        }
        return list[existingIndex];
      }

      // Create new address
      saved = {
        label: data.label || 'Saved Location',
        addressLine2: data.addressLine2 || '',
        ...data,
        id: 'addr-' + Date.now(),
        isDefault: data.isDefault ?? false,
      };

      if (saved.isDefault) {
        list.forEach((a) => (a.isDefault = false));
      }

      list.unshift(saved);
    }

    const cappedList = list.slice(0, MAX_SAVED_ADDRESSES);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(cappedList));
      window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
    }

    return saved;
  },

  /**
   * Deletes a saved address
   */
  deleteAddress(id: string): void {
    let list = this.getSavedAddresses();
    list = list.filter((a) => a.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
    }
  },

  /**
   * Removes any default address from saved addresses storage
   */
  removeDefaultAddress(): void {
    const list = this.getSavedAddresses().filter((a) => !a.isDefault);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
    }
  },

  /**
   * Sets an address as the default shipping address
   */
  setDefaultAddress(id: string): void {
    const list = this.getSavedAddresses();
    list.forEach((a) => {
      a.isDefault = a.id === id;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('ilovesurprises_addresses_updated'));
    }
  },

  /**
   * Gets stored user profile or null
   */
  getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) return null;
      const parsed: UserProfile = JSON.parse(stored);
      const isGoogleOrRemoteAvatar =
        parsed.avatar &&
        (parsed.avatar.includes('googleusercontent.com') ||
          (parsed.avatar.startsWith('https://') && !parsed.avatar.includes('unsplash.com')));

      if (
        !parsed.avatar ||
        parsed.avatar.includes('/reviews/') ||
        parsed.avatar.includes('unsplash.com') ||
        (!isGoogleOrRemoteAvatar && parsed.avatar.startsWith('http'))
      ) {
        parsed.avatar = '/assets/ilovesurprises/Profile/profile image.webp';
      }
      return parsed;
    } catch {
      return null;
    }
  },

  /**
   * Updates stored user profile
   */
  updateStoredUser(user: UserProfile | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
        localStorage.removeItem('ils_consultant_subscribed');
        localStorage.removeItem('ils_consultant_username');
        localStorage.removeItem('ils_consultant_name');
      }
    } catch (err) {
      console.error('Failed to update stored user', err);
    }
  },

  /**
   * Retrieves user settings
   */
  getUserSettings(): UserSettings {
    if (typeof window === 'undefined') {
      return this.getDefaultSettings();
    }
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
      return this.getDefaultSettings();
    } catch {
      return this.getDefaultSettings();
    }
  },

  getDefaultSettings(): UserSettings {
    return {
      emailNotifications: true,
      smsNotifications: true,
      orderStatusUpdates: true,
      surpriseDropAlerts: true,
      marketingEmails: false,
      twoFactorEnabled: false,
      currency: 'USD ($)',
      language: 'English (US)',
    };
  },

  /**
   * Updates user settings
   */
  updateUserSettings(settings: Partial<UserSettings>): UserSettings {
    const current = this.getUserSettings();
    const updated = { ...current, ...settings };
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('ilovesurprises_settings_updated'));
      } catch (err) {
        console.error('Failed to update user settings', err);
      }
    }
    return updated;
  },
};
