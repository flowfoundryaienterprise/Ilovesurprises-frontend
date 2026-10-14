import { accountService } from './accountService';
import { sponsorService } from './sponsorService';
import { apiClient, ApiError, unwrap, type ApiResponse } from './apiClient';
import { cartService } from './cartService';
import { clearPersistedQueryCache } from '../lib/queryClient';
import { googleIdentityService, GoogleAuthError } from './googleIdentityService';
import {
  mapBackendUser,
  type BackendUser,
  type BackendAuthPayload,
} from './userMapping';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';

export type { BackendUser, BackendAuthPayload };

export interface CustomerAuthResult {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  isAlreadyRegistered?: boolean;
}

/**
 * Persists a verified backend session: stores the token, caches the profile,
 * and notifies listeners. Returns null when the payload is unusable so callers
 * never report a successful sign-in without a real session.
 */
export function applyBackendSession(
  payload: BackendAuthPayload | null | undefined,
  overrides: Partial<UserProfile> = {}
): UserProfile | null {
  const backendUser = payload?.user;
  const token = payload?.token;

  if (!backendUser?.id || !token) return null;

  apiClient.setAuthToken(token);

  const profile: UserProfile = {
    ...mapBackendUser(backendUser, accountService.getStoredUser()),
    ...overrides,
  };

  accountService.updateStoredUser(profile);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  }

  return profile;
}

/**
 * Clears all client-side session state.
 *
 * The query cache is dropped too, so nothing the previous session fetched is
 * carried into the next one on a shared browser.
 */
export function clearSession(): void {
  apiClient.setAuthToken(null);
  accountService.updateStoredUser(null);
  clearPersistedQueryCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
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
   * Retrieves active profile from local storage and syncs with backend if token exists
   */
  initAuthStateListener(
    onUserChange?: (user: UserProfile | null) => void
  ): () => void {
    const hasToken = !!apiClient.getAuthToken();
    const storedUser = accountService.getStoredUser();

    if (hasToken) {
      // Show the cached profile immediately to avoid an auth flicker, then
      // confirm it against the backend.
      if (storedUser) {
        onUserChange?.(storedUser);
      }

      this.getCurrentUser()
        .then((refreshed) => {
          onUserChange?.(refreshed);
        })
        .catch(() => {});
    } else {
      // No token means no session. A cached profile without a token is not
      // evidence of authentication, so discard it rather than trusting it.
      if (storedUser) {
        accountService.updateStoredUser(null);
      }
      onUserChange?.(null);
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
      const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
        '/api/auth/login',
        { email: cleanEmail, password: cleanPassword }
      );

      const data = unwrap<BackendAuthPayload>(response, '/api/auth/login');
      const userProfile = applyBackendSession(data);

      if (!userProfile) {
        return {
          success: false,
          error: 'Sign-in did not return a valid session. Please try again.',
        };
      }

      // Sync guest cart to the authenticated user's server-side cart.
      cartService
        .syncLocalCartToServer()
        .catch((e) => console.warn('Cart sync notice on login:', e));

      return { success: true, user: userProfile, token: data.token };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          return {
            success: false,
            error:
              'Invalid email or password. Please verify your credentials and try again.',
          };
        }
        if (err.kind === 'validation') {
          return { success: false, error: err.displayMessage };
        }
        if (err.kind === 'network' || err.kind === 'timeout') {
          return {
            success: false,
            error:
              'Could not reach the authentication server. Please check your connection and try again.',
          };
        }
        return { success: false, error: err.displayMessage };
      }
      return {
        success: false,
        error: err?.message || 'Sign-in failed. Please try again.',
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
      const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
        '/api/auth/register',
        {
          email: cleanEmail,
          password: payload.password,
          firstName,
          lastName,
        }
      );

      const data = unwrap<BackendAuthPayload>(response, '/api/auth/register');

      // The role comes from the backend response only. A client-supplied
      // `role` never grants privileges; representative status is established
      // by the affiliate registration call below and reflected on the next
      // profile refresh.
      const userProfile = applyBackendSession(data, {
        name:
          [data.user.firstName, data.user.lastName].filter(Boolean).join(' ').trim() ||
          cleanName,
        mobile: payload.mobile?.trim(),
        repUsername: cleanRepUsername || undefined,
        sponsorUsername: sponsorUsername || undefined,
      });

      if (!userProfile) {
        return {
          success: false,
          error: 'Registration did not return a valid session. Please sign in.',
        };
      }

      let affiliateRegistrationError: string | undefined;

      if (isRep && cleanRepUsername) {
        // Register the affiliate account server-side so the sponsor link,
        // referral code, and genealogy node are created in PostgreSQL.
        try {
          await apiClient.post('/api/affiliates/register', {
            username: cleanRepUsername,
            ...(sponsorUsername ? { sponsorCodeOrId: sponsorUsername } : {}),
          });

          // Pick up the AFFILIATE role the backend assigned.
          const refreshed = await this.getCurrentUser();
          if (refreshed) {
            accountService.updateStoredUser({
              ...refreshed,
              repUsername: cleanRepUsername,
              sponsorUsername: sponsorUsername || undefined,
              mobile: payload.mobile?.trim() || refreshed.mobile,
            });
            window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
          }
        } catch (affErr: any) {
          affiliateRegistrationError =
            affErr instanceof ApiError
              ? affErr.displayMessage
              : 'Your account was created, but representative enrollment did not complete.';
          console.warn('Affiliate registration failed:', affiliateRegistrationError);
        }

        // Mirror the sponsor relationship locally for the referral UI only.
        // This is presentation state; the backend remains authoritative.
        if (sponsorUsername) {
          try {
            await sponsorService.registerSponsorRelationship(
              cleanRepUsername,
              sponsorUsername,
              uplineChain,
              userProfile.id
            );
          } catch {
            // Non-critical local cache.
          }
        }
      }

      cartService
        .syncLocalCartToServer()
        .catch((e) => console.warn('Cart sync notice on register:', e));

      return {
        success: true,
        user: accountService.getStoredUser() || userProfile,
        token: data.token,
        ...(affiliateRegistrationError
          ? { error: affiliateRegistrationError }
          : {}),
      };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          return {
            success: false,
            error: 'This email is already registered. Please sign in instead.',
            isAlreadyRegistered: true,
          };
        }
        if (err.kind === 'validation') {
          return { success: false, error: err.displayMessage };
        }
        if (err.kind === 'network' || err.kind === 'timeout') {
          return {
            success: false,
            error:
              'Could not reach the registration server. Please check your connection and try again.',
          };
        }
        return { success: false, error: err.displayMessage };
      }
      return {
        success: false,
        error:
          err?.message || 'Registration failed. Please check your details and try again.',
      };
    }
  },

  /**
   * Resolves the authenticated user from `GET /api/auth/me`.
   *
   * A session exists only when a token exists. Without one this returns null
   * and clears any stale cached profile — a profile object in storage is never
   * treated as proof of authentication.
   *
   * On 401 the session is cleared. On a transient network failure the cached
   * profile is returned so an offline blip does not log the user out, but the
   * role in that cache originated from a previous verified backend response.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    const token = apiClient.getAuthToken();

    if (!token) {
      if (accountService.getStoredUser()) {
        accountService.updateStoredUser(null);
      }
      return null;
    }

    const stored = accountService.getStoredUser();

    try {
      const response = await apiClient.get<ApiResponse<{ user: BackendUser }>>(
        '/api/auth/me'
      );
      const backendUser = unwrap<{ user: BackendUser }>(
        response,
        '/api/auth/me'
      ).user;

      if (!backendUser?.id) {
        clearSession();
        return null;
      }

      const refreshed = mapBackendUser(backendUser, stored);
      accountService.updateStoredUser(refreshed);
      return refreshed;
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isUnauthorized) {
          // apiClient already discarded the token and emitted the event.
          accountService.updateStoredUser(null);
          return null;
        }
        if (err.kind === 'network' || err.kind === 'timeout') {
          return stored;
        }
      }
      return stored;
    }
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
        // Best-effort server notification. The backend's logout is stateless,
        // so discarding the token client-side is what actually ends the
        // session; a failed call must not block sign-out.
        await apiClient.post('/api/auth/logout').catch(() => {});
      }
    } finally {
      clearSession();
    }
  },

  /**
   * Sign in with Google.
   *
   * Obtains a real credential from Google Identity Services in the browser,
   * then sends it to `POST /api/auth/google` for server-side verification.
   * The resulting account, role, and session all come from the backend
   * response — no user is ever constructed locally from a claimed email.
   */
  async signInWithGoogle(): Promise<CustomerAuthResult> {
    if (!googleIdentityService.isConfigured()) {
      return {
        success: false,
        error:
          'Google sign-in is not configured for this environment. Please use email and password, or contact support.',
      };
    }

    let accessToken: string;
    try {
      accessToken = await googleIdentityService.requestAccessToken();
    } catch (err: any) {
      if (err instanceof GoogleAuthError && err.code === 'popup_closed') {
        return { success: false, error: 'Google sign-in was cancelled.' };
      }
      return {
        success: false,
        error: err?.message || 'Google sign-in could not be completed.',
      };
    }

    try {
      // The backend verifies this token with Google before issuing a session.
      const response = await apiClient.post<ApiResponse<BackendAuthPayload>>(
        '/api/auth/google',
        { accessToken }
      );

      const data = unwrap<BackendAuthPayload>(response, '/api/auth/google');
      const profile = applyBackendSession(data);

      if (!profile) {
        return {
          success: false,
          error: 'Google sign-in did not return a valid session. Please try again.',
        };
      }

      cartService
        .syncLocalCartToServer()
        .catch((e) => console.warn('Cart sync notice on Google login:', e));

      return { success: true, user: profile, token: data.token };
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 401) {
          return {
            success: false,
            error: 'This account is inactive. Please contact support.',
          };
        }
        return { success: false, error: err.displayMessage };
      }
      return {
        success: false,
        error: err?.message || 'Google sign-in failed. Please try again.',
      };
    }
  },
};
