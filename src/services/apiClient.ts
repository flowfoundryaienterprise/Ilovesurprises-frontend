import { accountService } from './accountService';

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

export const TOKEN_STORAGE_KEY = 'ilovesurprises_jwt_token_v1';

export class ApiError extends Error {
  statusCode: number;
  data?: any;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, statusCode: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
    if (data?.errors && Array.isArray(data.errors)) {
      this.errors = data.errors;
    }
  }
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Retrieves the currently stored JWT bearer token.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Stores the JWT bearer token securely in localStorage.
 */
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn('Failed to persist auth token:', err);
  }
}

/**
 * Removes the stored JWT token.
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear auth token:', err);
  }
}

/**
 * Centralized handling for 401 Unauthorized responses.
 * Clears invalid credentials and notifies UI listeners.
 */
export function handleUnauthorized(errorMessage?: string): void {
  clearAuthToken();
  accountService.updateStoredUser(null);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ilovesurprises_unauthorized', {
        detail: {
          message:
            errorMessage || 'Your session has expired. Please sign in again.',
        },
      })
    );
    window.dispatchEvent(new CustomEvent('ilovesurprises_user_updated'));
  }
}

/**
 * Centralized API request client
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach Bearer token if available
  const token = getAuthToken();
  if (token && !options.skipAuth && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection and ensure the backend is running.',
      0,
      networkError
    );
  }

  let responseData: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      const text = await response.text();
      responseData = { message: text };
    } catch {
      responseData = null;
    }
  }

  // Centralized 401 Unauthorized handling
  if (response.status === 401) {
    const errorMsg =
      responseData?.message ||
      responseData?.error ||
      'Session expired or invalid credentials.';
    handleUnauthorized(errorMsg);
    throw new ApiError(errorMsg, 401, responseData);
  }

  if (!response.ok) {
    let message = 'An error occurred while processing your request.';

    if (responseData?.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      message = responseData.errors.map((e: any) => e.message).join('. ');
    } else if (responseData?.message) {
      message = responseData.message;
    } else if (responseData?.error) {
      message = typeof responseData.error === 'string' ? responseData.error : 'Request failed';
    } else if (response.statusText) {
      message = response.statusText;
    }

    throw new ApiError(message, response.status, responseData);
  }

  return responseData as T;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),

  getAuthToken,
  setAuthToken,
  clearAuthToken,
  handleUnauthorized,
};
