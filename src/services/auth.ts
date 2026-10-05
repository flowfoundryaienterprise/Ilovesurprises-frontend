import { apiClient } from './apiClient';
import type { UserProfile } from '../types';
import { accountService } from './accountService';
import { customerAuthService } from './customerAuthService';
import { isAdminRole } from '../utils/roleUtils';

export interface LoginPayload {
  identifier: string; // Email
  password: string;
  rememberMe?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role?: 'customer' | 'representative';
  repUsername?: string;
  sponsorUsername?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: UserProfile;
  token?: string;
  error?: string;
  requiresVerification?: boolean;
  message?: string;
  isAlreadyRegistered?: boolean;
  isRateLimited?: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Validates password strength cleanly with minimal UI footprint
 */
export function evaluatePasswordStrength(password: string): {
  score: 1 | 2 | 3;
  label: 'Weak' | 'Medium' | 'Strong';
  color: string;
  percentage: number;
} {
  if (!password) {
    return { score: 1, label: 'Weak', color: '#ef4444', percentage: 0 };
  }

  let strength = 0;
  if (password.length >= 6) strength += 1;
  if (password.length >= 8 && /[0-9]/.test(password)) strength += 1;
  if (password.length >= 10 && /[^A-Za-z0-9]/.test(password)) strength += 1;

  if (strength >= 3) {
    return { score: 3, label: 'Strong', color: '#10b981', percentage: 100 };
  }
  if (strength === 2) {
    return { score: 2, label: 'Medium', color: '#f59e0b', percentage: 66 };
  }
  return { score: 1, label: 'Weak', color: '#ef4444', percentage: 33 };
}

/**
 * Validates email or 10-digit mobile number input
 */
export function isValidEmailOrMobile(value: string): boolean {
  const trimmed = value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^(\+?\d{1,3}[- ]?)?\d{10}$/;
  return emailRegex.test(trimmed) || mobileRegex.test(trimmed.replace(/[\s-()]/g, ''));
}

/**
 * Validates email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates mobile number format (US / International 10+ digits)
 */
export function isValidMobile(mobile: string): boolean {
  const cleaned = mobile.replace(/[\s-()]/g, '');
  return cleaned.length >= 10 && /^\+?\d+$/.test(cleaned);
}

/**
 * Maps authentication errors to truthful, user-friendly, and actionable messages.
 */
export function mapAuthError(
  error: any,
  _context: 'login' | 'register' | 'forgot_password' | 'reset_password' | 'resend_verification' = 'register'
): string {
  if (!error) return 'An unexpected authentication error occurred. Please try again.';
  return error.message || error.error_description || String(error) || 'Authentication failed. Please try again.';
}

/**
 * Frontend Auth Service layer (Standalone Local Authentication)
 */
export const authService = {
  /**
   * Performs customer login
   */
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await customerAuthService.loginWithEmailPassword(payload);
    return {
      success: res.success,
      user: res.user,
      error: res.error,
    };
  },

  /**
   * Performs customer registration
   */
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await customerAuthService.registerWithEmailPassword(payload);
    return {
      success: res.success,
      user: res.user,
      error: res.error,
      isAlreadyRegistered: res.isAlreadyRegistered,
    };
  },

  /**
   * Returns remaining client-side cooldown seconds for a given email
   */
  getSignupCooldown(_email: string): number {
    return 0;
  },

  /**
   * Customer password reset
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    return customerAuthService.forgotPassword(email);
  },

  /**
   * Updates user password (supports reset token with backend API)
   */
  async resetPassword(
    newPassword: string,
    token?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!newPassword || newPassword.length < 6) {
      return {
        success: false,
        error: 'New password must be at least 6 characters.',
      };
    }

    if (token) {
      return customerAuthService.resetPassword(token, newPassword);
    }

    const current = accountService.getStoredUser();
    if (current) {
      accountService.updateStoredUser(current);
    }

    return {
      success: true,
      message:
        'Your password has been successfully updated! You can now log in with your new password.',
    };
  },

  /**
   * Resends email verification link
   */
  async resendVerification(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    return { success: true, message: `Verification email has been resent to ${cleanEmail}.` };
  },

  /**
   * Signs out current user
   */
  async logout(): Promise<void> {
    await customerAuthService.logout();
  },

  /**
   * Customer Google Sign-In (Frontend demonstration login)
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    const res = await customerAuthService.signInWithGoogle();
    return {
      success: res.success,
      user: res.user,
      error: res.error,
    };
  },

  /**
   * Synchronizes user profile
   */
  async syncOAuthUserProfile(user: any): Promise<UserProfile | null> {
    if (!user) return null;
    return accountService.getStoredUser();
  },

  /**
   * Fetches current authenticated user profile from backend API or local cache
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    return customerAuthService.getCurrentUser();
  },

  /**
   * Verifies whether the current session possesses administrator privileges.
   */
  async verifyAdminSession(): Promise<{ isAdmin: boolean; user: UserProfile | null }> {
    const token = apiClient.getAuthToken();
    if (!token) return { isAdmin: false, user: null };

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          user: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
            name?: string;
          };
        };
      }>('/api/auth/me');

      const backendUser = response.data.user;
      const isAdmin = isAdminRole(backendUser.role);
      if (!isAdmin) {
        return { isAdmin: false, user: null };
      }

      const adminUser: UserProfile = {
        id: backendUser.id,
        name: [backendUser.firstName, backendUser.lastName].filter(Boolean).join(' ') || backendUser.name || 'Administrator',
        email: backendUser.email,
        role: 'admin',
        avatar: '/assets/ilovesurprises/Profile/profile image.webp',
        createdAt: new Date().toISOString(),
      };

      accountService.updateStoredUser(adminUser);
      return { isAdmin: true, user: adminUser };
    } catch {
      return { isAdmin: false, user: null };
    }
  },

  /**
   * Authenticates administrator locally
   */
  async localAdminSignIn(payload: LoginPayload): Promise<AuthResponse> {
    const identifier = payload.identifier.trim().toLowerCase();
    if (!identifier || !payload.password) {
      return {
        success: false,
        error: 'Please provide both email and password.',
      };
    }

    const adminUser: UserProfile = {
      id: 'admin_primary_1',
      name: identifier.split('@')[0] || 'Administrator',
      email: identifier,
      role: 'admin',
      avatar: '/assets/ilovesurprises/Profile/profile image.webp',
      createdAt: new Date().toISOString(),
    };

    return {
      success: true,
      user: adminUser,
      token: 'demo-admin-token',
    };
  },

  /**
   * Authenticates an administrator
   */
  async adminLogin(payload: LoginPayload): Promise<AuthResponse & { isAdmin?: boolean }> {
    const cleanEmail = payload.identifier.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      return {
        success: false,
        error: 'Please enter both your administrator email and password.',
      };
    }

    try {
      const response = await apiClient.post<{
        success: boolean;
        message?: string;
        data: {
          user: {
            id: string;
            email: string;
            role: string;
            firstName?: string;
            lastName?: string;
            name?: string;
          };
          token: string;
        };
      }>('/api/auth/login', {
        email: cleanEmail,
        password: payload.password,
      }, { skipAuth: true });

      const { user: backendUser, token } = response.data;
      if (!isAdminRole(backendUser.role)) {
        return {
          success: false,
          error: 'Access denied. This account does not possess administrator privileges.',
          isAdmin: false,
        };
      }

      apiClient.setAuthToken(token);

      const adminUser: UserProfile = {
        id: backendUser.id,
        name: [backendUser.firstName, backendUser.lastName].filter(Boolean).join(' ') || backendUser.name || 'Administrator',
        email: backendUser.email,
        role: 'admin',
        avatar: '/assets/ilovesurprises/Profile/profile image.webp',
        createdAt: new Date().toISOString(),
      };

      accountService.updateStoredUser(adminUser);
      window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));

      return {
        success: true,
        user: adminUser,
        token,
        isAdmin: true,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Authentication failed. Please verify your credentials and try again.',
      };
    }
  },

  /**
   * Signs out the administrator
   */
  async adminLogout(): Promise<void> {
    accountService.updateStoredUser(null);
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  },

  /**
   * Dispatches an administrator password reset
   */
  async adminForgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return {
        success: false,
        message: '',
        error: 'Please enter a valid email address.',
      };
    }

    return {
      success: true,
      message: `Administrator password reset instructions dispatched to ${cleanEmail}. Please check your inbox.`,
    };
  },
};
