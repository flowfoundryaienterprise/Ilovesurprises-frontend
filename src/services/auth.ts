import type { UserProfile } from '../types';
import { apiClient } from './apiClient';
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
   * Resets the account password using a reset token issued by
   * `POST /api/auth/forgot-password`.
   *
   * A reset token is required: without one there is no way to authorize a
   * password change, so this reports failure rather than claiming success.
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

    if (!token) {
      return {
        success: false,
        error:
          'This password reset link is missing or incomplete. Please request a new reset email.',
      };
    }

    return customerAuthService.resetPassword(token, newPassword);
  },

  /**
   * Email verification resend.
   *
   * The backend exposes no verification endpoint and does not gate sign-in on
   * email verification, so there is nothing to resend. This reports the real
   * state rather than fabricating a confirmation.
   */
  async resendVerification(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    return {
      success: false,
      error:
        'Email verification is not enabled for this store yet, so there is nothing to resend. You can sign in with your email and password.',
    };
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
   * Re-reads the authenticated profile from the backend after an OAuth sign-in.
   */
  async syncOAuthUserProfile(user: any): Promise<UserProfile | null> {
    if (!user) return null;
    return customerAuthService.getCurrentUser();
  },

  /**
   * Fetches current authenticated user profile from backend API or local cache
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    return customerAuthService.getCurrentUser();
  },

  /**
   * Verifies administrator privileges against the backend.
   *
   * The role is read from `GET /api/auth/me` on every check, so admin access
   * depends on a valid JWT whose database-backed user holds the ADMIN role.
   * Locally stored profile data is never sufficient to pass this check.
   */
  async verifyAdminSession(): Promise<{ isAdmin: boolean; user: UserProfile | null }> {
    if (!apiClient.getAuthToken()) {
      return { isAdmin: false, user: null };
    }

    const user = await customerAuthService.getCurrentUser();
    if (!user) {
      return { isAdmin: false, user: null };
    }

    if (!isAdminRole(user.role)) {
      return { isAdmin: false, user };
    }

    return { isAdmin: true, user };
  },

  /**
   * Authenticates an administrator against the backend.
   *
   * This is the same `POST /api/auth/login` used by customers; the ADMIN role
   * is then confirmed from the authenticated backend response. There is no
   * local or demo admin path — a session is only granted when the backend
   * authenticates the credentials AND reports the ADMIN role.
   */
  async adminLogin(payload: LoginPayload): Promise<AuthResponse & { isAdmin?: boolean }> {
    const cleanEmail = payload.identifier.trim().toLowerCase();
    if (!cleanEmail || !payload.password) {
      return {
        success: false,
        error: 'Please enter both your administrator email and password.',
      };
    }

    const res = await customerAuthService.loginWithEmailPassword({
      identifier: cleanEmail,
      password: payload.password,
      rememberMe: payload.rememberMe,
    });

    if (!res.success || !res.user) {
      return { success: false, error: res.error, isAdmin: false };
    }

    if (!isAdminRole(res.user.role)) {
      // Authenticated, but not an administrator. Drop the session created by
      // this attempt so a non-admin is not silently left signed in behind the
      // admin console.
      await customerAuthService.logout();
      return {
        success: false,
        error:
          'Access denied. This account does not have administrator privileges.',
        isAdmin: false,
      };
    }

    return {
      success: true,
      user: res.user,
      token: res.token,
      isAdmin: true,
    };
  },

  /**
   * Signs out the administrator, clearing the real session and token.
   */
  async adminLogout(): Promise<void> {
    await customerAuthService.logout();
  },

  /**
   * Dispatches an administrator password reset through the real backend
   * endpoint. The backend intentionally returns the same generic message
   * whether or not the address exists, so no account enumeration occurs.
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

    return customerAuthService.forgotPassword(cleanEmail);
  },
};
