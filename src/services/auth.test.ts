import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { authService } from './auth';
import { customerAuthService } from './customerAuthService';
import { accountService } from './accountService';
import { setStoredAuthToken, getStoredAuthToken } from './apiClient';

// Cart synchronization is a side effect of signing in and is covered by its own
// tests; stub it so these assertions stay focused on the auth contract.
vi.mock('./cartService', () => ({
  cartService: {
    syncLocalCartToServer: vi.fn().mockResolvedValue(undefined),
  },
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function backendUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'usr_1',
    email: 'person@example.com',
    firstName: 'Alex',
    lastName: 'Doe',
    role: 'CUSTOMER',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('authentication', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('admin login (no client-side admin fabrication)', () => {
    it('rejects a non-admin account and leaves no session behind', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (String(url).includes('/api/auth/login')) {
          return jsonResponse({
            status: 'success',
            data: { user: backendUser({ role: 'CUSTOMER' }), token: 'tok-customer' },
          });
        }
        if (String(url).includes('/api/auth/logout')) {
          return jsonResponse({ status: 'success' });
        }
        return jsonResponse({ status: 'error' }, 404);
      });

      const res = await authService.adminLogin({
        identifier: 'person@example.com',
        password: 'correct-password',
      });

      expect(res.success).toBe(false);
      expect(res.isAdmin).toBe(false);
      expect(res.error).toMatch(/does not have administrator privileges/i);
      // The session created by the attempt must be discarded.
      expect(getStoredAuthToken()).toBeNull();
      expect(accountService.getStoredUser()).toBeNull();
    });

    it('rejects bad credentials without inventing an admin user', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'error', message: 'Invalid email or password' }, 401)
      );

      const res = await authService.adminLogin({
        identifier: 'attacker@example.com',
        password: 'anything',
      });

      expect(res.success).toBe(false);
      expect(res.user).toBeUndefined();
      expect(accountService.getStoredUser()).toBeNull();
    });

    it('grants admin only when the backend reports the ADMIN role', async () => {
      fetchMock.mockImplementation((url: string) => {
        if (String(url).includes('/api/auth/login')) {
          return jsonResponse({
            status: 'success',
            data: {
              user: backendUser({ role: 'ADMIN', email: 'boss@example.com' }),
              token: 'tok-admin',
            },
          });
        }
        return jsonResponse({ status: 'error' }, 404);
      });

      const res = await authService.adminLogin({
        identifier: 'boss@example.com',
        password: 'correct-password',
      });

      expect(res.success).toBe(true);
      expect(res.isAdmin).toBe(true);
      expect(res.user?.role).toBe('admin');
      expect(getStoredAuthToken()).toBe('tok-admin');
    });

    it('never issues a demo/offline admin token', async () => {
      fetchMock.mockImplementation(() => {
        throw new TypeError('Failed to fetch');
      });

      const res = await authService.adminLogin({
        identifier: 'boss@example.com',
        password: 'correct-password',
      });

      expect(res.success).toBe(false);
      expect(res.token).not.toBe('demo-admin-token');
      expect(getStoredAuthToken()).toBeNull();
    });
  });

  describe('verifyAdminSession', () => {
    it('denies admin when there is no token, even with an admin profile cached', async () => {
      // Simulate a tampered cache claiming admin.
      accountService.updateStoredUser({
        id: 'spoof',
        name: 'Spoofed Admin',
        email: 'spoof@example.com',
        role: 'admin',
        avatar: '',
        createdAt: new Date().toISOString(),
      } as never);

      const res = await authService.verifyAdminSession();

      expect(res.isAdmin).toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('denies admin when a cached admin profile is contradicted by the backend', async () => {
      setStoredAuthToken('tok-customer');
      accountService.updateStoredUser({
        id: 'usr_1',
        name: 'Spoofed Admin',
        email: 'person@example.com',
        role: 'admin',
        avatar: '',
        createdAt: new Date().toISOString(),
      } as never);

      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: { user: backendUser({ role: 'CUSTOMER' }) },
        })
      );

      const res = await authService.verifyAdminSession();

      expect(res.isAdmin).toBe(false);
      expect(res.user?.role).toBe('customer');
    });

    it('confirms admin from the backend role', async () => {
      setStoredAuthToken('tok-admin');
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: { user: backendUser({ role: 'ADMIN' }) },
        })
      );

      const res = await authService.verifyAdminSession();
      expect(res.isAdmin).toBe(true);
    });
  });

  describe('Google sign-in', () => {
    it('reports a configuration error instead of creating a demo user', async () => {
      // VITE_GOOGLE_CLIENT_ID is unset under test.
      const res = await customerAuthService.signInWithGoogle();

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/not configured/i);
      expect(res.user).toBeUndefined();
      expect(accountService.getStoredUser()).toBeNull();
      // Critically: no fabricated identity, and no call to the auth endpoint.
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('never produces the previously hardcoded demo identity', async () => {
      const res = await customerAuthService.signInWithGoogle();
      expect(res.user?.email).not.toBe('demo.google@ilovesurprises.com');
      expect(res.user?.name).not.toBe('Sarah Jenkins');
    });
  });

  describe('session restoration', () => {
    it('discards a cached profile when no token is present', async () => {
      accountService.updateStoredUser({
        id: 'stale',
        name: 'Stale User',
        email: 'stale@example.com',
        role: 'customer',
        avatar: '',
        createdAt: new Date().toISOString(),
      } as never);

      const user = await customerAuthService.getCurrentUser();

      expect(user).toBeNull();
      expect(accountService.getStoredUser()).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('clears the session on a 401 from /api/auth/me', async () => {
      setStoredAuthToken('expired-token');
      accountService.updateStoredUser({
        id: 'usr_1',
        name: 'Alex Doe',
        email: 'person@example.com',
        role: 'customer',
        avatar: '',
        createdAt: new Date().toISOString(),
      } as never);

      fetchMock.mockImplementation(() =>
        jsonResponse({ status: 'error', message: 'Invalid or expired token' }, 401)
      );

      const user = await customerAuthService.getCurrentUser();

      expect(user).toBeNull();
      expect(getStoredAuthToken()).toBeNull();
      expect(accountService.getStoredUser()).toBeNull();
    });

    it('takes the role from the backend, not from the cached profile', async () => {
      setStoredAuthToken('tok');
      accountService.updateStoredUser({
        id: 'usr_1',
        name: 'Alex Doe',
        email: 'person@example.com',
        role: 'admin',
        avatar: '',
        createdAt: new Date().toISOString(),
      } as never);

      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: { user: backendUser({ role: 'AFFILIATE' }) },
        })
      );

      const user = await customerAuthService.getCurrentUser();
      expect(user?.role).toBe('representative');
    });
  });

  describe('login role handling', () => {
    it('uses the backend role and ignores any client-side intent', async () => {
      fetchMock.mockImplementation(() =>
        jsonResponse({
          status: 'success',
          data: { user: backendUser({ role: 'STAFF' }), token: 'tok-staff' },
        })
      );

      const res = await customerAuthService.loginWithEmailPassword({
        identifier: 'person@example.com',
        password: 'pw',
      });

      expect(res.success).toBe(true);
      expect(res.user?.role).toBe('staff');
    });

    it('surfaces a network failure instead of signing the user in', async () => {
      fetchMock.mockImplementation(() => {
        throw new TypeError('Failed to fetch');
      });

      const res = await customerAuthService.loginWithEmailPassword({
        identifier: 'person@example.com',
        password: 'pw',
      });

      expect(res.success).toBe(false);
      expect(res.error).toMatch(/could not reach/i);
      expect(accountService.getStoredUser()).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('refuses to report success without a reset token', async () => {
      const res = await authService.resetPassword('newpassword123');
      expect(res.success).toBe(false);
      expect(res.error).toMatch(/reset link is missing/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('does not claim an email was sent when no endpoint exists', async () => {
      const res = await authService.resendVerification('person@example.com');
      expect(res.success).toBe(false);
      expect(res.message).toBeUndefined();
    });
  });
});
