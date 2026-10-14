import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  apiClient,
  ApiError,
  unwrap,
  getApiBaseUrl,
  setStoredAuthToken,
  getStoredAuthToken,
  UNAUTHORIZED_EVENT,
  FORBIDDEN_EVENT,
} from './apiClient';

const PRODUCTION_ORIGIN = 'api.ilovesurprises.com';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('apiClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('base URL resolution', () => {
    it('uses same-origin relative paths when no base URL is configured (dev proxy)', () => {
      // No VITE_API_BASE_URL is set under test, so the client must stay relative.
      expect(getApiBaseUrl()).toBe('');
    });

    it('issues requests against a relative path so the Vite proxy handles them', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await apiClient.get('/api/products');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('/api/products');
    });
  });

  describe('no production failover (regression guard)', () => {
    it('does NOT retarget production when a GET fails with a network error', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiClient.get('/api/products')).rejects.toBeInstanceOf(ApiError);

      // Every attempt must stay on the configured origin.
      for (const call of fetchMock.mock.calls) {
        expect(String(call[0])).not.toContain(PRODUCTION_ORIGIN);
      }
      expect(getApiBaseUrl()).toBe('');
    });

    it('does NOT retry or retarget a failed POST — a mutation is attempted exactly once', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(
        apiClient.post('/api/admin/products', { name: 'Test' })
      ).rejects.toBeInstanceOf(ApiError);

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0][0])).not.toContain(PRODUCTION_ORIGIN);
    });

    it('does not retarget production after a 500 response', async () => {
      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Internal Server Error' }, 500)
      );

      await expect(apiClient.get('/api/products')).rejects.toBeInstanceOf(ApiError);
      for (const call of fetchMock.mock.calls) {
        expect(String(call[0])).not.toContain(PRODUCTION_ORIGIN);
      }
    });
  });

  describe('typed errors', () => {
    it('types a 401 as unauthorized', async () => {
      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Invalid or expired token' }, 401)
      );

      const err = (await apiClient.get('/api/auth/me').catch((e) => e)) as ApiError;
      expect(err).toBeInstanceOf(ApiError);
      expect(err.kind).toBe('unauthorized');
      expect(err.statusCode).toBe(401);
      expect(err.isUnauthorized).toBe(true);
      expect(err.isRetryable).toBe(false);
    });

    it('types a 403 as forbidden', async () => {
      fetchMock.mockImplementation(() => 
        jsonResponse(
          { status: 'error', message: 'Forbidden: Insufficient permissions' },
          403
        )
      );

      const err = (await apiClient.get('/api/admin/users').catch((e) => e)) as ApiError;
      expect(err.kind).toBe('forbidden');
      expect(err.isForbidden).toBe(true);
      expect(err.message).toContain('Insufficient permissions');
    });

    it('types a 400 with errors[] as a validation error and exposes field errors', async () => {
      fetchMock.mockImplementation(() => 
        jsonResponse(
          {
            status: 'error',
            message: 'Validation failed',
            errors: [{ field: 'body.price', message: 'Price must be positive' }],
          },
          400
        )
      );

      const err = (await apiClient
        .post('/api/admin/products', { price: -1 })
        .catch((e) => e)) as ApiError;
      expect(err.kind).toBe('validation');
      expect(err.fieldErrors).toHaveLength(1);
      expect(err.displayMessage).toBe('body.price: Price must be positive');
    });

    it('types a 500 as a retryable server error', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'error' }, 500));
      const err = (await apiClient.get('/api/products').catch((e) => e)) as ApiError;
      expect(err.kind).toBe('server');
      expect(err.isRetryable).toBe(true);
    });

    it('types a connection failure as a network error with an actionable message', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const err = (await apiClient.post('/api/cart/items', {}).catch((e) => e)) as ApiError;
      expect(err.kind).toBe('network');
      expect(err.statusCode).toBe(0);
      expect(err.message).toMatch(/Could not reach the API/);
      expect(err.message).toContain('/api/cart/items');
    });

    it('distinguishes a caller-initiated abort from a timeout', async () => {
      const controller = new AbortController();
      fetchMock.mockImplementation(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              const e = new Error('aborted');
              e.name = 'AbortError';
              reject(e);
            });
          })
      );

      const promise = apiClient.get('/api/products', undefined, {
        signal: controller.signal,
      });
      controller.abort();

      const err = (await promise.catch((e) => e)) as ApiError;
      expect(err.kind).toBe('aborted');
    });
  });

  describe('401 / 403 handling', () => {
    it('clears the stored token and emits the unauthorized event on a 401', async () => {
      setStoredAuthToken('a-test-token');
      const listener = vi.fn();
      window.addEventListener(UNAUTHORIZED_EVENT, listener);

      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Invalid or expired token' }, 401)
      );

      await apiClient.get('/api/auth/me').catch(() => {});

      expect(getStoredAuthToken()).toBeNull();
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    });

    it('does NOT clear the token or emit session-expiry on a login 401', async () => {
      setStoredAuthToken('a-test-token');
      const listener = vi.fn();
      window.addEventListener(UNAUTHORIZED_EVENT, listener);

      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Invalid email or password' }, 401)
      );

      await apiClient
        .post('/api/auth/login', { email: 'a@b.com', password: 'x' })
        .catch(() => {});

      expect(getStoredAuthToken()).toBe('a-test-token');
      expect(listener).not.toHaveBeenCalled();
      window.removeEventListener(UNAUTHORIZED_EVENT, listener);
    });

    it('emits the forbidden event on a 403', async () => {
      const listener = vi.fn();
      window.addEventListener(FORBIDDEN_EVENT, listener);

      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Forbidden' }, 403)
      );

      await apiClient.get('/api/admin/users').catch(() => {});
      expect(listener).toHaveBeenCalledTimes(1);
      window.removeEventListener(FORBIDDEN_EVENT, listener);
    });
  });

  describe('auth header', () => {
    it('attaches the Bearer token when present', async () => {
      setStoredAuthToken('tok-123');
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));

      await apiClient.get('/api/auth/me');

      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer tok-123');
    });

    it('omits the Authorization header when unauthenticated', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await apiClient.get('/api/products');
      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('always sends the guest cart header for anonymous cart continuity', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await apiClient.get('/api/cart');
      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('x-cart-id')).toMatch(/^guest_cart_/);
    });
  });

  describe('retries', () => {
    it('retries an idempotent GET on a transient network failure and then succeeds', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce(jsonResponse({ status: 'success', data: { ok: true } }));

      const res = await apiClient.get<{ status: string; data: { ok: boolean } }>(
        '/api/products'
      );
      expect(res.data.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('does not retry a GET that returned a 4xx', async () => {
      fetchMock.mockImplementation(() => 
        jsonResponse({ status: 'error', message: 'Not Found' }, 404)
      );
      await apiClient.get('/api/products/missing').catch(() => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('never retries a DELETE', async () => {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      await apiClient.delete('/api/admin/products/p1').catch(() => {});
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('GET deduplication', () => {
    it('collapses concurrent identical GETs into one network request', async () => {
      let resolveFetch: (r: Response) => void = () => {};
      fetchMock.mockImplementation(
        () => new Promise<Response>((resolve) => { resolveFetch = resolve; })
      );

      const a = apiClient.get('/api/storefront');
      const b = apiClient.get('/api/storefront');
      resolveFetch(jsonResponse({ status: 'success', data: { n: 1 } }));

      await Promise.all([a, b]);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not deduplicate POSTs', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await Promise.all([
        apiClient.post('/api/cart/items', { productId: 'p1' }),
        apiClient.post('/api/cart/items', { productId: 'p1' }),
      ]);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('path handling', () => {
    it('collapses duplicate slashes', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await apiClient.get('/api//products');
      expect(fetchMock.mock.calls[0][0]).toBe('/api/products');
    });

    it('drops null, undefined, and empty query params', async () => {
      fetchMock.mockImplementation(() => jsonResponse({ status: 'success', data: {} }));
      await apiClient.get('/api/products', {
        page: 1,
        search: '',
        category: undefined,
        status: null,
        featured: true,
      });
      expect(fetchMock.mock.calls[0][0]).toBe('/api/products?page=1&featured=true');
    });
  });

  describe('unwrap', () => {
    it('returns the data payload from a success envelope', () => {
      expect(unwrap({ status: 'success', data: { id: 'x' } })).toEqual({ id: 'x' });
    });

    it('throws on an error envelope', () => {
      expect(() => unwrap({ status: 'error', message: 'nope' })).toThrow(ApiError);
    });

    it('throws rather than returning undefined when data is missing', () => {
      expect(() => unwrap({ status: 'success' }, '/api/thing')).toThrow(
        /returned no data/
      );
    });

    it('passes through a bare payload that has no envelope', () => {
      expect(unwrap({ id: 'bare' })).toEqual({ id: 'bare' });
    });
  });
});
