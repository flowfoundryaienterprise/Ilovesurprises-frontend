import { accountService } from './accountService';
import { representativeService } from './representativeService';
import { attributionService } from './attributionService';
import { sponsorService } from './sponsorService';
import { apiClient, ApiError } from './apiClient';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';

export interface CustomerAuthResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  isAlreadyRegistered?: boolean;
}

export interface BackendUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'CUSTOMER' | 'ADMIN' | 'REPRESENTATIVE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendAuthResponse {
  status: 'success';
  message?: string;
  data: {
    user: BackendUser;
    token: string;
  };
}

export interface BackendMeResponse {
  status: 'success';
  data: {
    user: BackendUser;
  };
}

/**
 * Maps the backend user representation to the frontend UserProfile format.
 */
export function mapBackendUserToUserProfile(
  backendUser: BackendUser,
  extra?: {
    role?: 'customer' | 'representative' | 'admin';
    repUsername?: string;
    sponsorUsername?: string;
    mobile?: string;
    avatar?: string;
  }
): UserProfile {
  const firstName = (backendUser.firstName || '').trim();
  const lastName = (backendUser.lastName || '').trim();
  const fullName =
    [firstName, lastName].filter(Boolean).join(' ') ||
    backendUser.email.split('@')[0];

  const backendRole =
    (backendUser.role?.toLowerCase() as 'customer' | 'representative' | 'admin') ||
    'customer';
  const role = extra?.role || backendRole;

  return {
    id: backendUser.id,
    name: fullName,
    email: backendUser.email,
    role,
    repUsername: extra?.repUsername,
    sponsorUsername: extra?.sponsorUsername,
    mobile: extra?.mobile,
    avatar: extra?.avatar || '/assets/ilovesurprises/Profile/profile image.webp',
    createdAt: backendUser.createdAt,
  };
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
   * Verifies existing token against backend /api/auth/me
   */
  initAuthStateListener(
    onUserChange?: (user: UserProfile | null) => void
  ): () => void {
    const token = apiClient.getAuthToken();
    const storedUser = accountService.getStoredUser();

    // Fast initial paint if cached session exists
    if (token && storedUser) {
      onUserChange?.(storedUser);
    }

    if (token) {
      // Validate session with Express backend API
      this.getCurrentUser()
        .then((verifiedUser) => {
          if (verifiedUser) {
            onUserChange?.(verifiedUser);
          }
        })
        .catch((err) => {
          if (err?.statusCode === 401) {
            onUserChange?.(null);
          }
        })
        .finally(() => {
          isAuthInitialized = true;
          if (authReadyResolve) {
            authReadyResolve();
          }
        });
    } else {
      isAuthInitialized = true;
      if (authReadyResolve) {
        authReadyResolve();
      }
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
   * Log in with Email & Password via backend API POST /api/auth/login
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
      const response = await apiClient.post<BackendAuthResponse>(
        '/api/auth/login',
        {
          email: cleanEmail,
          password: cleanPassword,
        },
        { skipAuth: true }
      );

      const { user: backendUser, token } = response.data;

      // Securely store the JWT token returned by the backend
      apiClient.setAuthToken(token);

      // Preserve any existing local attributes (avatar, rep handle)
      const existing = accountService.getStoredUser();
      const userProfile = mapBackendUserToUserProfile(backendUser, {
        avatar: existing?.avatar,
        repUsername: existing?.repUsername,
        sponsorUsername: existing?.sponsorUsername,
        mobile: existing?.mobile,
      });

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
        token,
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          return {
            success: false,
            error:
              'Invalid email or password. Please double-check your credentials and try again.',
          };
        }
        return {
          success: false,
          error: err.message || 'Unable to log in. Please try again.',
        };
      }
      return {
        success: false,
        error:
          err?.message ||
          'Unable to connect to the authentication server. Please try again.',
      };
    }
  },

  /**
   * Register with Email & Password via backend API POST /api/auth/register
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

    // Split name into firstName and lastName for backend API schema
    const nameParts = cleanName.split(/\s+/);
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || undefined;

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

    try {
      const response = await apiClient.post<BackendAuthResponse>(
        '/api/auth/register',
        {
          email: cleanEmail,
          password: payload.password,
          firstName,
          lastName,
        },
        { skipAuth: true }
      );

      const { user: backendUser, token } = response.data;

      // Securely store the JWT token returned by the backend
      apiClient.setAuthToken(token);

      const userProfile = mapBackendUserToUserProfile(backendUser, {
        role: payload.role || 'customer',
        repUsername: cleanRepUsername || undefined,
        sponsorUsername: sponsorUsername || undefined,
        mobile: payload.mobile?.trim(),
      });

      // If registered as representative, record sponsor relationship
      if (isRep && cleanRepUsername && sponsorUsername) {
        try {
          await sponsorService.registerSponsorRelationship(
            cleanRepUsername,
            sponsorUsername,
            uplineChain,
            userProfile.id
          );
        } catch {
          // ignore non-critical sponsor chain storage error
        }
      }

      accountService.updateStoredUser(userProfile);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: userProfile,
        token,
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (
          err.statusCode === 409 ||
          err.message?.toLowerCase().includes('already registered')
        ) {
          return {
            success: false,
            isAlreadyRegistered: true,
            error: 'This email is already registered. Please log in instead.',
          };
        }
        return {
          success: false,
          error: err.message || 'Registration failed. Please try again.',
        };
      }
      return {
        success: false,
        error:
          err?.message ||
          'Unable to connect to the authentication server. Please try again.',
      };
    }
  },

  /**
   * Fetches current authenticated user profile from backend GET /api/auth/me
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = apiClient.getAuthToken();
    if (!token) return null;

    try {
      const response = await apiClient.get<BackendMeResponse>('/api/auth/me');
      const backendUser = response.data.user;

      const existing = accountService.getStoredUser();
      const userProfile = mapBackendUserToUserProfile(backendUser, {
        avatar: existing?.avatar,
        repUsername: existing?.repUsername,
        sponsorUsername: existing?.sponsorUsername,
        mobile: existing?.mobile,
      });

      accountService.updateStoredUser(userProfile);
      return userProfile;
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        return null;
      }
      // If backend temporarily unreachable, return cached user
      return accountService.getStoredUser();
    }
  },

  /**
   * Request password reset via backend POST /api/auth/forgot-password
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
      const response = await apiClient.post<{
        status: string;
        message: string;
        resetToken?: string;
      }>('/api/auth/forgot-password', { email: cleanEmail });

      return {
        success: true,
        message:
          response.message ||
          `Password reset instructions have been sent to ${cleanEmail}. Please follow the link to reset your password.`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error:
          err?.message || 'Failed to dispatch password reset. Please try again.',
      };
    }
  },

  /**
   * Reset password with token via backend POST /api/auth/reset-password
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
      const response = await apiClient.post<{ status: string; message: string }>(
        '/api/auth/reset-password',
        { token, newPassword }
      );

      return {
        success: true,
        message:
          response.message ||
          'Password has been reset successfully. You can now log in with your new password.',
      };
    } catch (err: any) {
      return {
        success: false,
        error:
          err?.message ||
          'Invalid or expired reset token. Please request a new link.',
      };
    }
  },

  /**
   * Signs current user out via backend POST /api/auth/logout and clears credentials
   */
  async logout(): Promise<void> {
    const token = apiClient.getAuthToken();
    if (token) {
      try {
        await apiClient.post('/api/auth/logout', {});
      } catch {
        // Discard client token even if network fails
      }
    }
    apiClient.clearAuthToken();
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
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
