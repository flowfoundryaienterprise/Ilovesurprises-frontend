import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, LoginPayload, RegisterPayload } from '../types';
import {
  authService,
  type AuthResponse,
  type ForgotPasswordResponse,
} from '../services/auth';
import { accountService } from '../services/accountService';
import { apiClient } from '../services/apiClient';

export interface UseAuthReturn {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginPayload) => Promise<AuthResponse>;
  register: (payload: RegisterPayload) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<ForgotPasswordResponse>;
  resetPassword: (
    newPassword: string,
    token?: string
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
  refreshUser: () => Promise<UserProfile | null>;
  clearError: () => void;
}

/**
 * Custom React hook for managing authentication state and actions.
 * Connects frontend UI components to the API/service layer.
 */
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserProfile | null>(() =>
    accountService.getStoredUser()
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state with centralized auth update events
  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(accountService.getStoredUser());
    };

    const handleUnauthorized = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      setUser(null);
      setError(detail?.message || 'Session expired. Please sign in again.');
    };

    window.addEventListener('ilovesurprises_user_updated', handleUserUpdate);
    window.addEventListener('ilovesurprises_unauthorized', handleUnauthorized);

    return () => {
      window.removeEventListener('ilovesurprises_user_updated', handleUserUpdate);
      window.removeEventListener('ilovesurprises_unauthorized', handleUnauthorized);
    };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.login(payload);
        if (response.success && response.user) {
          setUser(response.user);
        } else if (response.error) {
          setError(response.error);
        }
        return response;
      } catch (err: any) {
        const message = err?.message || 'Login failed. Please try again.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const register = useCallback(
    async (payload: RegisterPayload): Promise<AuthResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await authService.register(payload);
        if (response.success && response.user) {
          setUser(response.user);
        } else if (response.error) {
          setError(response.error);
        }
        return response;
      } catch (err: any) {
        const message = err?.message || 'Registration failed. Please try again.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(
    async (email: string): Promise<ForgotPasswordResponse> => {
      setIsLoading(true);
      setError(null);
      try {
        return await authService.forgotPassword(email);
      } catch (err: any) {
        const message =
          err?.message || 'Failed to send password reset request.';
        setError(message);
        return { success: false, message: '', error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resetPassword = useCallback(
    async (
      newPassword: string,
      token?: string
    ): Promise<{ success: boolean; message?: string; error?: string }> => {
      setIsLoading(true);
      setError(null);
      try {
        return await authService.resetPassword(newPassword, token);
      } catch (err: any) {
        const message = err?.message || 'Failed to reset password.';
        setError(message);
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const refreshUser = useCallback(async (): Promise<UserProfile | null> => {
    try {
      const refreshed = await authService.getCurrentUser();
      setUser(refreshed);
      return refreshed;
    } catch {
      return null;
    }
  }, []);

  const isAuthenticated = !!user && !!apiClient.getAuthToken();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    clearError,
  };
}
