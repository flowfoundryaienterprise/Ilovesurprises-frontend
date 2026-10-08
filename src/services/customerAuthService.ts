import { accountService } from './accountService';
import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { sponsorService } from './sponsorService';
import { apiClient } from './apiClient';
import { cartService } from './cartService';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';

export interface CustomerAuthResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  isAlreadyRegistered?: boolean;
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
   * Retrieves active profile from local storage and syncs with backend if token exists
   */
  initAuthStateListener(
    onUserChange?: (user: UserProfile | null) => void
  ): () => void {
    const storedUser = accountService.getStoredUser();

    // Initial state notification
    if (storedUser) {
      onUserChange?.(storedUser);
    }

    // Background validation of token if present
    if (apiClient.getAuthToken()) {
      this.getCurrentUser().then((refreshed) => {
        if (refreshed) {
          onUserChange?.(refreshed);
        }
      }).catch(() => {});
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
      window.removeEventListener(
        'ilovesurprises_user_updated',
        handleStorageChange
      );
    };
  },

  /**
   * Log in with Email & Password via Nithish backend (POST /api/auth/login)
   */
  async loginWithEmailPassword(payload: LoginPayload): Promise<CustomerAuthResult> {
    const cleanEmail = payload.identifier.trim().toLowerCase();
    const cleanPassword = payload.password;

    if (!cleanEmail || !cleanPassword) {
      return {
        success: false,
        error: 'Please enter both your email address and password.',
      };
    }

    try {
      const response = await apiClient.post<any>('/api/auth/login', {
        email: cleanEmail,
        password: cleanPassword,
      });

      const data = response?.data;
      const backendUser = data?.user;
      const token = data?.token;

      if (token) {
        apiClient.setAuthToken(token);
      }

      const fullName = [backendUser?.firstName, backendUser?.lastName].filter(Boolean).join(' ').trim();
      const derivedName = cleanEmail.split('@')[0]
        .replace(/[._-]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());

      const userProfile: UserProfile = {
        id: backendUser?.id || `usr_${Date.now()}`,
        name: fullName || derivedName || 'Valued Customer',
        email: backendUser?.email || cleanEmail,
        role: (backendUser?.role || 'customer').toLowerCase() as any,
        avatar: '/assets/ilovesurprises/Profile/profile image.webp',
        createdAt: backendUser?.createdAt ? new Date(backendUser.createdAt).toISOString() : new Date().toISOString(),
      };

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      // Sync guest cart to authenticated user cart in backend
      cartService.syncLocalCartToServer().catch((e) => console.warn('Cart sync notice on login:', e));

      return {
        success: true,
        user: userProfile,
        token: token || 'authenticated-token',
      };
    } catch (err: any) {
      console.warn('Backend login notice:', err.message);
      if (err.statusCode === 401 || (err.message && err.message.toLowerCase().includes('invalid'))) {
        return {
          success: false,
          error: 'Invalid email or password. Please verify your credentials and try again.',
        };
      }
      return {
        success: false,
        error: err.message || 'Unable to connect to authentication server. Please try again.',
      };
    }
  },

  /**
   * Register with Email & Password via Nithish backend (POST /api/auth/register)
   */
  async registerWithEmailPassword(
    payload: RegisterPayload
  ): Promise<CustomerAuthResult> {
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

      if (payload.sponsorUsername?.trim()) {
        const resolvedSponsor = await sponsorService.resolveSponsor(
          payload.sponsorUsername
        );
        if (resolvedSponsor) {
          sponsorUsername = resolvedSponsor.username;
          try {
            uplineChain = await sponsorService.buildUpline(
              resolvedSponsor.username,
              cleanRepUsername
            );
          } catch (cycleErr: any) {
            return {
              success: false,
              error: cycleErr.message || 'Invalid sponsor hierarchy.',
            };
          }
        }
      }
    }

    const nameParts = cleanName.split(' ');
    const firstName = nameParts[0] || cleanName;
    const lastName = nameParts.slice(1).join(' ') || undefined;

    try {
      const response = await apiClient.post<any>('/api/auth/register', {
        email: cleanEmail,
        password: payload.password,
        firstName,
        lastName,
      });

      const data = response?.data;
      const backendUser = data?.user;
      const token = data?.token;

      if (token) {
        apiClient.setAuthToken(token);
      }

      const fullName = [backendUser?.firstName, backendUser?.lastName].filter(Boolean).join(' ').trim();

      const userProfile: UserProfile = {
        id: backendUser?.id || `usr_${Date.now()}`,
        name: fullName || cleanName,
        email: backendUser?.email || cleanEmail,
        role: payload.role || (backendUser?.role || 'customer').toLowerCase() as any,
        repUsername: cleanRepUsername || undefined,
        sponsorUsername: sponsorUsername || undefined,
        mobile: payload.mobile?.trim(),
        avatar: '/assets/ilovesurprises/Profile/profile image.webp',
        createdAt: backendUser?.createdAt ? new Date(backendUser.createdAt).toISOString() : new Date().toISOString(),
      };

      if (isRep && cleanRepUsername && sponsorUsername) {
        try {
          await sponsorService.registerSponsorRelationship(
            cleanRepUsername,
            sponsorUsername,
            uplineChain,
            userProfile.id
          );
        } catch {
          // ignore non-critical local sponsor storage
        }
      }

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      // Sync guest cart to registered user cart
      cartService.syncLocalCartToServer().catch((e) => console.warn('Cart sync notice on register:', e));

      return {
        success: true,
        user: userProfile,
        token: token || 'authenticated-token',
      };
    } catch (err: any) {
      console.warn('Backend register notice:', err.message);
      if (err.statusCode === 409 || (err.message && err.message.toLowerCase().includes('already registered'))) {
        return {
          success: false,
          error: 'This email is already registered. Please sign in instead.',
          isAlreadyRegistered: true,
        };
      }
      return {
        success: false,
        error: err.message || 'Registration failed. Please check your details and try again.',
      };
    }
  },

  /**
   * Fetches current authenticated user profile from backend (GET /api/auth/me) or local cache
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = apiClient.getAuthToken();
    const stored = accountService.getStoredUser();

    if (token) {
      try {
        const response = await apiClient.get<any>('/api/auth/me');
        const backendUser = response?.data?.user;
        if (backendUser) {
          const fullName = [backendUser.firstName, backendUser.lastName].filter(Boolean).join(' ').trim();
          const refreshed: UserProfile = {
            id: backendUser.id,
            name: fullName || stored?.name || backendUser.email.split('@')[0],
            email: backendUser.email,
            role: (backendUser.role || 'customer').toLowerCase() as any,
            avatar: stored?.avatar || '/assets/ilovesurprises/Profile/profile image.webp',
            createdAt: backendUser.createdAt ? new Date(backendUser.createdAt).toISOString() : stored?.createdAt || new Date().toISOString(),
            mobile: stored?.mobile,
            repUsername: stored?.repUsername,
            sponsorUsername: stored?.sponsorUsername,
          };
          accountService.updateStoredUser(refreshed);
          return refreshed;
        }
      } catch (err: any) {
        if (err.statusCode === 401) {
          apiClient.setAuthToken(null);
          accountService.updateStoredUser(null);
          return null;
        }
      }
    }

    return stored;
  },

  /**
   * Request password reset via backend (POST /api/auth/forgot-password)
   */
  async forgotPassword(
    email: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid email address.',
      };
    }

    try {
      const res = await apiClient.post<any>('/api/auth/forgot-password', { email: cleanEmail });
      return {
        success: true,
        message: res?.message || `Password reset instructions have been sent to ${cleanEmail}.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: err.message || 'Unable to process password reset request. Please try again.',
      };
    }
  },

  /**
   * Reset password with token via backend (POST /api/auth/reset-password)
   */
  async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters.',
      };
    }

    try {
      const res = await apiClient.post<any>('/api/auth/reset-password', {
        token,
        newPassword,
      });
      return {
        success: true,
        message: res?.message || 'Password has been reset successfully. You can now log in with your new password.',
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to reset password. Token may be invalid or expired.',
      };
    }
  },

  /**
   * Signs current user out and clears credentials
   */
  async logout(): Promise<void> {
    try {
      if (apiClient.getAuthToken()) {
        await apiClient.post('/api/auth/logout').catch(() => {});
      }
    } finally {
      apiClient.setAuthToken(null);
      accountService.updateStoredUser(null);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
    }
  },

  /**
   * Sign In with Google (Frontend demonstration login flow)
   */
  async signInWithGoogle(): Promise<CustomerAuthResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));

    let assignedRep: string | undefined = undefined;
    try {
      const sessionRep =
        representativeService.getAttributedRepresentative()?.repUsername;
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
};
