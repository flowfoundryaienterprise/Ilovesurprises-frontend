import { accountService } from './accountService';
import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { sponsorService } from './sponsorService';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';

export interface CustomerAuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  isAlreadyRegistered?: boolean;
}

const REGISTERED_CUSTOMERS_KEY = 'ils_registered_customers_v1';

/**
 * Retrieves registered customers from local storage
 */
function getRegisteredCustomers(): Array<UserProfile & { password?: string }> {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTERED_CUSTOMERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persists registered customer list to local storage
 */
function saveRegisteredCustomers(customers: Array<UserProfile & { password?: string }>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(REGISTERED_CUSTOMERS_KEY, JSON.stringify(customers));
  } catch (err) {
    console.warn('Failed to save registered customers to localStorage:', err);
  }
}

let isAuthInitialized = false;
let authReadyResolve: () => void;
const authReadyPromise = new Promise<void>((resolve) => {
  authReadyResolve = resolve;
});

export const customerAuthService = {
  /**
   * Indicates if customer auth is ready/initialized
   */
  isAuthReady(): boolean {
    return isAuthInitialized;
  },

  /**
   * Promise that resolves once auth state is checked
   */
  waitForAuthReady(): Promise<void> {
    if (isAuthInitialized) return Promise.resolve();
    return authReadyPromise;
  },

  /**
   * Initializes persistent customer auth state listener
   */
  initAuthStateListener(onUserChange?: (user: UserProfile | null) => void): () => void {
    const storedUser = accountService.getStoredUser();
    if (storedUser) {
      onUserChange?.(storedUser);
    }

    isAuthInitialized = true;
    if (authReadyResolve) {
      authReadyResolve();
    }

    const handleStorageChange = () => {
      const current = accountService.getStoredUser();
      onUserChange?.(current);
    };

    window.addEventListener('ilovesurprises_user_updated', handleStorageChange);
    return () => {
      window.removeEventListener('ilovesurprises_user_updated', handleStorageChange);
    };
  },

  /**
   * Sign In with Google (Frontend-only demonstration login flow)
   */
  async signInWithGoogle(): Promise<CustomerAuthResult> {
    // Simulating quick instant client authentication
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Resolve representative attribution if available
    let assignedRep: string | undefined = undefined;
    try {
      const sessionRep = representativeService.getAttributedRepresentative()?.repUsername;
      const attribution = await attributionService.resolveAttributionForCheckout({
        customerEmail: 'demo.google@ilovesurprises.com',
        currentSessionRep: sessionRep,
      });
      if (attribution.repUsername) {
        assignedRep = attribution.repUsername;
      }
    } catch {
      // ignore
    }

    const demoGoogleUser: UserProfile = {
      id: 'demo-google-user',
      name: 'Sarah Jenkins',
      email: 'demo.google@ilovesurprises.com',
      role: 'customer',
      avatar: '/assets/ilovesurprises/Profile/profile image.webp',
      repUsername: assignedRep,
      createdAt: new Date().toISOString(),
    };

    accountService.updateStoredUser(demoGoogleUser);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

    return {
      success: true,
      user: demoGoogleUser,
    };
  },

  /**
   * Register with Email & Password locally
   */
  async registerWithEmailPassword(payload: RegisterPayload): Promise<CustomerAuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = payload.email.trim().toLowerCase();
    const cleanName = payload.name.trim();

    if (!cleanName || cleanName.length < 2) {
      return {
        success: false,
        error: 'Full name must be at least 2 characters.',
      };
    }

    if (!payload.password || payload.password.length < 6) {
      return {
        success: false,
        error: 'Password must be at least 6 characters.',
      };
    }

    const customers = getRegisteredCustomers();
    const existing = customers.find((c) => c.email.toLowerCase() === cleanEmail);

    if (existing) {
      return {
        success: false,
        isAlreadyRegistered: true,
        error: 'This email is already registered. Please log in instead.',
      };
    }

    const isRep = payload.role === 'representative';
    let cleanRepUsername: string | null = null;
    let sponsorUsername: string | null = null;
    let uplineChain: string[] = [];

    if (isRep) {
      if (!payload.repUsername?.trim()) {
        return {
          success: false,
          error: 'Please choose a representative handle.',
        };
      }
      cleanRepUsername = sponsorService.normalizeUsername(payload.repUsername);
      const validation = sponsorService.validateUsername(cleanRepUsername);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || 'Invalid representative handle format.',
        };
      }
      const available = await sponsorService.isUsernameAvailable(cleanRepUsername);
      if (!available) {
        return {
          success: false,
          error: `The representative handle "${cleanRepUsername}" is already taken. Please choose another vanity handle.`,
        };
      }

      if (payload.sponsorUsername?.trim()) {
        const resolvedSponsor = await sponsorService.resolveSponsor(payload.sponsorUsername);
        if (resolvedSponsor) {
          sponsorUsername = resolvedSponsor.username;
          try {
            uplineChain = await sponsorService.buildUpline(resolvedSponsor.username, cleanRepUsername);
          } catch (cycleErr: any) {
            return {
              success: false,
              error: cycleErr.message || 'Invalid sponsor hierarchy.',
            };
          }
        }
      }
    }

    const newUserId = `cust_${Date.now()}`;
    const userProfile: UserProfile = {
      id: newUserId,
      name: cleanName,
      email: cleanEmail,
      role: payload.role || 'customer',
      repUsername: cleanRepUsername || undefined,
      sponsorUsername: sponsorUsername || undefined,
      mobile: payload.mobile?.trim(),
      avatar: '/assets/ilovesurprises/Profile/profile image.webp',
      createdAt: new Date().toISOString(),
    };

    // Save to local registered list
    customers.push({
      ...userProfile,
      password: payload.password,
    });
    saveRegisteredCustomers(customers);

    // If registered as representative, record sponsor hierarchy
    if (isRep && cleanRepUsername && sponsorUsername) {
      try {
        await sponsorService.registerSponsorRelationship(
          cleanRepUsername,
          sponsorUsername,
          uplineChain,
          userProfile.id
        );
      } catch {
        // ignore
      }
    }

    accountService.updateStoredUser(userProfile);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

    return {
      success: true,
      user: userProfile,
    };
  },

  /**
   * Log in with Email & Password locally
   */
  async loginWithEmailPassword(payload: LoginPayload): Promise<CustomerAuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    const cleanEmail = payload.identifier.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      return {
        success: false,
        error: 'Please enter both your email address and password.',
      };
    }

    const customers = getRegisteredCustomers();
    const found = customers.find((c) => c.email.toLowerCase() === cleanEmail);

    if (found) {
      if (found.password && found.password !== payload.password) {
        return {
          success: false,
          error: 'Invalid email or password. Please double-check your credentials and try again.',
        };
      }

      const { password: _, ...userProfile } = found;
      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
      };
    }

    // Default demo customer login if not yet registered
    const demoUser: UserProfile = {
      id: `cust_${Date.now()}`,
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'customer',
      avatar: '/assets/ilovesurprises/Profile/profile image.webp',
      createdAt: new Date().toISOString(),
    };

    customers.push({
      ...demoUser,
      password: payload.password,
    });
    saveRegisteredCustomers(customers);

    accountService.updateStoredUser(demoUser);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

    return {
      success: true,
      user: demoUser,
    };
  },

  /**
   * Send Password Reset locally
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid email address.',
      };
    }

    return {
      success: true,
      message: `Password reset instructions have been sent to ${cleanEmail}. Please follow the link to reset your password.`,
    };
  },

  /**
   * Signs the customer out
   */
  async logout(): Promise<void> {
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  },
};
