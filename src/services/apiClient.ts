/**
 * Centralized Frontend API Client
 *
 * Talks to the iLoveSurprises Express backend, which owns Prisma and the
 * authoritative Supabase PostgreSQL database.
 *
 * Base URL resolution (strict, no implicit environment crossing):
 *   1. `VITE_API_BASE_URL`, when explicitly configured, is used verbatim.
 *   2. Otherwise the client uses same-origin relative paths (`''`), which in
 *      development are forwarded by the Vite dev proxy (see vite.config.ts)
 *      to the local backend, and in production are served by the deployed host.
 *
 * There is deliberately NO fallback from localhost or staging to the production
 * API. A failed local request must surface as a failure, never silently mutate
 * production data.
 *
 * Session contract (set by the backend, see backend/src/middlewares/auth.middleware.ts):
 *   Authentication is a Bearer JWT in the `Authorization` header. The backend
 *   does not issue or read a session cookie and exposes no refresh endpoint.
 *   Because the token must be attached by JavaScript, it is held in
 *   localStorage. That is the backend's required contract, NOT a secure
 *   storage mechanism: a token in localStorage remains readable by any script
 *   running on the origin and is exfiltratable via XSS. Token values are never
 *   logged.
 */

const isBrowser = typeof window !== 'undefined';

/** Explicitly configured base URL, if any. Trailing slashes are stripped. */
const CONFIGURED_BASE_URL = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  ''
)
  .trim()
  .replace(/\/+$/, '');

/**
 * Resolved API origin. An empty string means "same origin, relative paths",
 * which routes through the Vite dev proxy during development.
 */
const API_ORIGIN = CONFIGURED_BASE_URL;

export const API_BASE_URL = API_ORIGIN;

export function getApiBaseUrl(): string {
  return API_ORIGIN;
}

const AUTH_TOKEN_KEY = 'ilovesurprises_jwt_token';
const GUEST_CART_KEY = 'ilovesurprises_guest_cart_id';

/** Default per-request timeout. */
const DEFAULT_TIMEOUT_MS = 15000;

/** Retry policy for idempotent requests only. */
const MAX_IDEMPOTENT_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

/** Events other layers listen for. Kept stable for existing listeners. */
export const UNAUTHORIZED_EVENT = 'ilovesurprises_unauthorized';
export const FORBIDDEN_EVENT = 'ilovesurprises_forbidden';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

/** Field-level validation detail returned by the backend's Zod middleware. */
export interface ApiFieldError {
  field: string;
  message: string;
}

export type ApiErrorKind =
  | 'validation'    // 400 with errors[]
  | 'unauthorized'  // 401
  | 'forbidden'     // 403
  | 'not_found'     // 404
  | 'conflict'      // 409
  | 'server'        // 5xx
  | 'http'          // other non-2xx
  | 'timeout'       // client-side abort on timeout
  | 'aborted'       // caller-initiated abort
  | 'network'       // DNS / offline / CORS / connection refused
  | 'parse';        // malformed response body

/**
 * Typed API error. `statusCode` is the HTTP status, or 0 when the request never
 * produced an HTTP response (network, timeout, abort).
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly kind: ApiErrorKind;
  readonly data?: any;
  readonly fieldErrors?: ApiFieldError[];
  readonly endpoint?: string;
  readonly method?: string;

  constructor(
    message: string,
    statusCode: number,
    kind: ApiErrorKind,
    options: {
      data?: any;
      fieldErrors?: ApiFieldError[];
      endpoint?: string;
      method?: string;
    } = {}
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.kind = kind;
    this.data = options.data;
    this.fieldErrors = options.fieldErrors;
    this.endpoint = options.endpoint;
    this.method = options.method;
  }

  /** True when retrying the exact same request could plausibly succeed. */
  get isRetryable(): boolean {
    return (
      this.kind === 'network' ||
      this.kind === 'timeout' ||
      this.kind === 'server'
    );
  }

  get isUnauthorized(): boolean {
    return this.kind === 'unauthorized';
  }

  get isForbidden(): boolean {
    return this.kind === 'forbidden';
  }

  /** Message suitable for display, preferring the first field error. */
  get displayMessage(): string {
    if (this.fieldErrors?.length) {
      const first = this.fieldErrors[0];
      return first.field ? `${first.field}: ${first.message}` : first.message;
    }
    return this.message;
  }
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 409) return 'conflict';
  if (status >= 500) return 'server';
  return 'http';
}

/**
 * Builds a query string safely from an object of params.
 * Drops null, undefined, and empty-string values.
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
 * Normalizes an endpoint to a single leading slash and prevents the
 * `/api/api/...` duplication that arises when a configured base URL already
 * ends in `/api`.
 */
function resolveUrl(endpoint: string): string {
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  path = path.replace(/\/{2,}/g, '/');

  if (API_ORIGIN.endsWith('/api') && path.startsWith('/api/')) {
    path = path.slice(4);
  }

  return `${API_ORIGIN}${path}`;
}

/**
 * Token management. See the session-contract note at the top of this file:
 * localStorage is required by the backend's Bearer-header contract and is not
 * a secure store.
 */
export function getStoredAuthToken(): string | null {
  if (!isBrowser) return null;
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredAuthToken(token: string | null): void {
  if (!isBrowser) return;
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable (private mode / quota). Requests proceed unauthenticated.
  }
}

/**
 * Guest cart session ID. Harmless, non-authoritative browser state: it only
 * identifies an anonymous server-side cart row.
 */
export function getOrCreateGuestCartId(): string {
  if (!isBrowser) return 'guest-cart-default';
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

/** In-flight GET deduplication, keyed by resolved URL. */
const inFlightGetRequests = new Map<string, Promise<any>>();

function emit(eventName: string, detail: Record<string, any>): void {
  if (!isBrowser) return;
  try {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  } catch {
    // Event dispatch is best-effort.
  }
}

/** Endpoints where a 401 is an expected credential rejection, not session expiry. */
function isCredentialEndpoint(path: string): boolean {
  return (
    path.includes('/auth/login') ||
    path.includes('/auth/register') ||
    path.includes('/auth/google') ||
    path.includes('/auth/forgot-password') ||
    path.includes('/auth/reset-password')
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Single fetch attempt: header assembly, timeout, response parsing, and error
 * typing. Composes the caller's AbortSignal with the timeout signal so that
 * passing a signal never disables the timeout.
 */
async function executeFetch<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const url = resolveUrl(endpoint);
  const method = (options.method || 'GET').toUpperCase();

  const headers = new Headers(options.headers || {});
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const guestCartId = getOrCreateGuestCartId();
  if (guestCartId && !headers.has('x-cart-id')) {
    headers.set('x-cart-id', guestCartId);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutController = new AbortController();
  let didTimeout = false;
  const timeoutId = setTimeout(() => {
    didTimeout = true;
    timeoutController.abort();
  }, timeoutMs);

  const callerSignal = options.signal;
  const onCallerAbort = () => timeoutController.abort();
  if (callerSignal) {
    if (callerSignal.aborted) {
      timeoutController.abort();
    } else {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      /**
       * Credentials are included so the backend's HTTP-only attribution
       * cookie (`ils_affiliate_id`, set by GET /api/affiliates/resolve/:username
       * with a 30-day lifetime) is stored and returned on later requests.
       * That is what carries a referral through browsing, the cart,
       * authentication, and checkout per the backend contract. The backend
       * sets `cors({ credentials: true })` with an explicit origin allowlist.
       * A caller may still override this per request.
       */
      credentials: options.credentials ?? 'include',
      signal: timeoutController.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    let data: any;
    if (response.status === 204) {
      data = null;
    } else if (isJson) {
      try {
        data = await response.json();
      } catch (parseErr: any) {
        throw new ApiError(
          'The server returned a malformed response.',
          response.status,
          'parse',
          { data: parseErr, endpoint, method }
        );
      }
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const kind = kindForStatus(response.status);
      const fieldErrors: ApiFieldError[] | undefined =
        Array.isArray(data?.errors) && data.errors.length ? data.errors : undefined;

      const message =
        (typeof data === 'object' && data !== null && (data.message || data.error)) ||
        (typeof data === 'string' && data.trim() ? data.trim() : '') ||
        `Request failed with status ${response.status}.`;

      if (kind === 'unauthorized' && !isCredentialEndpoint(endpoint)) {
        // Session is no longer valid: discard the token and notify the app so
        // auth state can be reset and the user prompted to sign in again.
        setStoredAuthToken(null);
        emit(UNAUTHORIZED_EVENT, {
          message: 'Your session has expired. Please sign in again.',
          endpoint,
        });
      }

      if (kind === 'forbidden') {
        emit(FORBIDDEN_EVENT, {
          message: message || 'You do not have permission to perform this action.',
          endpoint,
        });
      }

      throw new ApiError(
        fieldErrors?.length && message === 'Validation failed'
          ? message
          : message,
        response.status,
        fieldErrors?.length ? 'validation' : kind,
        { data, fieldErrors, endpoint, method }
      );
    }

    return data as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;

    if (err?.name === 'AbortError') {
      if (didTimeout) {
        throw new ApiError(
          `The request to ${endpoint} timed out after ${Math.round(timeoutMs / 1000)}s. The server may be unavailable.`,
          0,
          'timeout',
          { endpoint, method }
        );
      }
      throw new ApiError('The request was cancelled.', 0, 'aborted', {
        endpoint,
        method,
      });
    }

    const target = API_ORIGIN || 'the application origin';
    throw new ApiError(
      `Could not reach the API at ${target} (${method} ${endpoint}). Check that the backend is running and reachable.`,
      0,
      'network',
      { data: err, endpoint, method }
    );
  } finally {
    clearTimeout(timeoutId);
    if (callerSignal) {
      callerSignal.removeEventListener('abort', onCallerAbort);
    }
  }
}

/**
 * Request wrapper. Idempotent methods (GET, HEAD) are deduplicated while
 * in flight and retried with backoff on transient failures. Non-idempotent
 * methods are never retried, so a mutation is attempted exactly once.
 */
async function request<T>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number; retry?: boolean } = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isIdempotent = method === 'GET' || method === 'HEAD';
  const allowRetry = options.retry ?? isIdempotent;

  const run = async (): Promise<T> => {
    const maxAttempts = allowRetry ? MAX_IDEMPOTENT_ATTEMPTS : 1;
    let lastError: ApiError | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await executeFetch<T>(endpoint, options);
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : new ApiError('Unexpected request failure.', 0, 'network', {
                data: err,
                endpoint,
                method,
              });

        lastError = apiErr;

        const canRetry =
          attempt < maxAttempts && apiErr.isRetryable && apiErr.kind !== 'aborted';
        if (!canRetry) throw apiErr;

        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }

    throw lastError;
  };

  if (!isIdempotent) {
    return run();
  }

  const dedupKey = `${method} ${resolveUrl(endpoint)}`;
  const existing = inFlightGetRequests.get(dedupKey);
  if (existing) {
    return existing as Promise<T>;
  }

  const promise = run().finally(() => {
    inFlightGetRequests.delete(dedupKey);
  });

  inFlightGetRequests.set(dedupKey, promise);
  return promise;
}

export interface ApiRequestOptions extends RequestInit {
  /** Override the default 15s timeout. */
  timeoutMs?: number;
  /** Force-enable or force-disable retries. Defaults to on for GET/HEAD only. */
  retry?: boolean;
}

export const apiClient = {
  get baseUrl() {
    return API_ORIGIN;
  },

  getAuthToken: getStoredAuthToken,
  setAuthToken: setStoredAuthToken,
  getGuestCartId: getOrCreateGuestCartId,

  /** True when an explicit API base URL is configured for this build. */
  get isExplicitlyConfigured() {
    return CONFIGURED_BASE_URL.length > 0;
  },

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<T> {
    const query = buildQueryString(params);
    return request<T>(`${endpoint}${query}`, { ...options, method: 'GET' });
  },

  async post<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async patch<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async put<T>(endpoint: string, body?: any, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
    });
  },

  async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    return request<T>(endpoint, { ...options, method: 'DELETE' });
  },

  /**
   * Unwraps the backend's `{ status, data }` envelope, throwing when the
   * payload is absent so callers never silently receive `undefined`.
   */
  async getData<T>(
    endpoint: string,
    params?: Record<string, any>,
    options?: ApiRequestOptions
  ): Promise<T> {
    const res = await this.get<ApiResponse<T>>(endpoint, params, options);
    return unwrap<T>(res, endpoint);
  },

  async checkHealth(): Promise<{
    status: string;
    uptimeSeconds?: number;
    environment?: string;
    services?: any;
  }> {
    return request('/health', { method: 'GET', timeoutMs: 5000 });
  },
};

/**
 * Unwraps a backend envelope. Accepts both `{status,data}` and a bare payload
 * (some endpoints return the object directly) and throws a typed error when
 * the server reported `status: 'error'` or sent no payload at all.
 */
export function unwrap<T>(response: ApiResponse<T> | T, endpoint = ''): T {
  const envelope = response as ApiResponse<T>;

  if (envelope && typeof envelope === 'object' && 'status' in envelope) {
    if (envelope.status === 'error') {
      throw new ApiError(
        envelope.message || envelope.error || 'The request was not successful.',
        0,
        'http',
        { data: envelope, endpoint }
      );
    }
    if (envelope.data !== undefined && envelope.data !== null) {
      return envelope.data;
    }
    throw new ApiError(
      `The server returned no data for ${endpoint || 'this request'}.`,
      0,
      'parse',
      { data: envelope, endpoint }
    );
  }

  return response as T;
}
