/**
 * Centralized Frontend API Client
 * Routes all frontend data requests to the Nithish backend (http://localhost:3000)
 * which communicates with Prisma and the authoritative Supabase PostgreSQL database.
 */

const REMOTE_PRODUCTION_API = 'https://api.ilovesurprises.com';

const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const RAW_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  (isLocalhost ? '' : REMOTE_PRODUCTION_API);

let activeBaseUrl = RAW_BASE_URL ? RAW_BASE_URL.replace(/\/+$/, '') : '';

export const API_BASE_URL = activeBaseUrl;

export function getApiBaseUrl(): string {
  return activeBaseUrl;
}

const AUTH_TOKEN_KEY = 'ilovesurprises_jwt_token';
const GUEST_CART_KEY = 'ilovesurprises_guest_cart_id';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

export class ApiError extends Error {
  statusCode: number;
  data?: any;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * Builds a query string safely from an object of params.
 * Drops null, undefined, or empty string values.
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, String(v)));
      } else {
        searchParams.append(key, String(value));
      }
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Token management functions
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Guest cart session ID management
 */
export function getOrCreateGuestCartId(): string {
  if (typeof window === 'undefined') return 'guest-cart-default';
  try {
    let cartId = localStorage.getItem(GUEST_CART_KEY);
    if (!cartId) {
      cartId = `guest_cart_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem(GUEST_CART_KEY, cartId);
    }
    return cartId;
  } catch {
    return 'guest-cart-fallback';
  }
}

/**
 * In-flight GET request deduplication cache to prevent redundant concurrent fetches.
 */
const inFlightGetRequests = new Map<string, Promise<any>>();

/**
 * Single-attempt fetch runner with headers, timeout, and response parsing.
 */
async function executeFetch<T>(
  baseUrl: string,
  cleanEndpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${baseUrl}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach JWT Bearer token if present
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Attach guest cart header
  const guestCartId = getOrCreateGuestCartId();
  if (guestCartId && !headers.has('x-cart-id')) {
    headers.set('x-cart-id', guestCartId);
  }

  const controller = new AbortController();
  const timeoutMs = 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      // Clear token if server returns 401 Unauthorized for an authenticated endpoint
      if (response.status === 401 && token && !cleanEndpoint.includes('/auth/login')) {
        setStoredAuthToken(null);
      }

      const errorMessage =
        (typeof data === 'object' && (data?.message || data?.error)) ||
        `Backend request failed with status ${response.status}`;
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(
      err?.message || 'Network connection to backend failed',
      0,
      err
    );
  }
}

/**
 * Internal fetch wrapper with standardized error handling, JSON parsing,
 * automatic Bearer token / x-cart-id header injection, and resilient live API failover.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();

  // Deduplicate in-flight GET requests
  if (method === 'GET') {
    const dedupKey = `${activeBaseUrl}${cleanEndpoint}`;
    if (inFlightGetRequests.has(dedupKey)) {
      return inFlightGetRequests.get(dedupKey) as Promise<T>;
    }

    const promise = (async () => {
      try {
        return await executeFetch<T>(activeBaseUrl, cleanEndpoint, options);
      } catch (err: any) {
        const isNetworkError =
          err instanceof ApiError && (err.statusCode === 0 || !err.statusCode);
        const isLocalhost =
          activeBaseUrl.includes('localhost') || activeBaseUrl.includes('127.0.0.1');

        if (isNetworkError && isLocalhost && activeBaseUrl !== REMOTE_PRODUCTION_API) {
          console.info(
            `[apiClient] Localhost unavailable, failing over to live API (${REMOTE_PRODUCTION_API})`
          );
          activeBaseUrl = REMOTE_PRODUCTION_API;
          return await executeFetch<T>(REMOTE_PRODUCTION_API, cleanEndpoint, options);
        }
        throw err;
      }
    })().finally(() => {
      inFlightGetRequests.delete(dedupKey);
    });

    inFlightGetRequests.set(dedupKey, promise);
    return promise;
  }

  // Non-GET requests (POST, PUT, DELETE, etc.)
  try {
    return await executeFetch<T>(activeBaseUrl, cleanEndpoint, options);
  } catch (err: any) {
    const isNetworkError =
      err instanceof ApiError && (err.statusCode === 0 || !err.statusCode);
    const isLocalhost =
      activeBaseUrl.includes('localhost') || activeBaseUrl.includes('127.0.0.1');

    if (isNetworkError && isLocalhost && activeBaseUrl !== REMOTE_PRODUCTION_API) {
      console.info(
        `[apiClient] Localhost unavailable, failing over to live API (${REMOTE_PRODUCTION_API})`
      );
      activeBaseUrl = REMOTE_PRODUCTION_API;
      return await executeFetch<T>(REMOTE_PRODUCTION_API, cleanEndpoint, options);
    }
    throw err;
  }
}

export const apiClient = {
  get baseUrl() {
    return activeBaseUrl;
  },

  /**
   * Token getters and setters
   */
  getAuthToken: getStoredAuthToken,
  setAuthToken: setStoredAuthToken,
  getGuestCartId: getOrCreateGuestCartId,

  /**
   * HTTP GET
   */
  async get<T>(endpoint: string, params?: Record<string, any>, options?: RequestInit): Promise<T> {
    const query = buildQueryString(params);
    return request<T>(`${endpoint}${query}`, {
      ...options,
      method: 'GET',
    });
  },

  /**
   * HTTP POST
   */
  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * HTTP PATCH
   */
  async patch<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * HTTP PUT
   */
  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  /**
   * HTTP DELETE
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  },

  /**
   * Health check to test backend connection
   */
  async checkHealth(): Promise<{ status: string; uptimeSeconds?: number; services?: any }> {
    return request('/health', { method: 'GET' });
  },
};
